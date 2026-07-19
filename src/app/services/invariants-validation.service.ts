import { computed, inject, Injectable, signal } from '@angular/core';

import { ToasterNotificationService } from './toaster-notification.service';
import { ModeService } from './mode.service';
import { Diagram } from '../classes/diagram/diagram';
import { InvariantEntry, InvariantValidity } from '../classes/invariant-entry';
import { Tab } from '../classes/tabs';
import { DiagramTransition } from '../classes/diagram/diagram-transition';
import { PlaceInvariantsService } from './invariants-computing.service';

@Injectable({ providedIn: 'root' })
export class InvariantsValidationService {
    private _notificationService = inject(ToasterNotificationService);
    private _modeService = inject(ModeService);
    private _computingService = inject(PlaceInvariantsService);

    private _EPSILON = 1e-10;

    private _allPlaceLabels: string[] = [];
    private _allTransitionLabels: string[] = [];
    private _placeFlows = new Map<string, Map<string, number>>();
    private _incidenceMatrix: number[][] = [];

    inputEntries = signal<InvariantEntry[]>([]);

    computedMinInvariants = signal<number[][]>([]);

    foundMinInvariants = computed<number[][]>(() => {
        const inputs = Array.from(this.inputEntries().map((entry) => entry.vector));
        return this.computedMinInvariants().filter((comp) => inputs.some((input) => this.areVectorsEqual(input, comp)));
    });

    remainingMinInvariants = computed<number[][]>(() => {
        const found = this.foundMinInvariants();
        const remaining = this.computedMinInvariants().filter(
            (comp) => !found.some((found) => this.areVectorsEqual(found, comp)),
        );
        if (remaining.length === 0 && !this._modeService.isExamMode(Tab.INVARIANTS)) {
            this._notificationService.showSuccess('TOASTER.HEADER.SUCCESS', 'TOASTER.BODY.ALL_MIN_INVARIANTS_FOUND');
        }
        return remaining;
    });

    get allPlaceLabels(): string[] {
        return this._allPlaceLabels;
    }

    set allPlaceLabels(labels: string[]) {
        this._allPlaceLabels = labels;
    }

    get allTransitionLabels(): string[] {
        return this._allTransitionLabels;
    }

    set allTransitionLabels(labels: string[]) {
        this._allTransitionLabels = labels;
    }

    get placeFlows(): Map<string, Map<string, number>> {
        return this._placeFlows;
    }

    /**
     * Sets the incidence matrix for testing purposes.
     *
     * @param matrix - The incidence matrix to set.
     */
    set incidenceMatrix(matrix: number[][]) {
        this._incidenceMatrix = matrix;
    }

    /**
     * Initializes the service with the given Petri net diagram.
     * Sets up place/transition labels, place flows, and computes the minimal invariants.
     *
     * @param diagram - The Petri net diagram to initialize with.
     */
    initialize(diagram: Diagram): void {
        this._allPlaceLabels = diagram.getPlaceLabels();
        this._allTransitionLabels = diagram.getTransitionLabels();
        this.setPlaceFlows(diagram.transitions);
        this.computeMinimalInvariants(diagram);
    }

    /**
     * Validates an invariant entry and sets its validity status.
     * Checks for triviality, exact matches with computed invariants, incompleteness,
     * and whether the vector satisfies the invariant condition (yᵀ · C = 0).
     *
     * @param entry - The invariant entry to validate.
     * @param isFinalValidation - If true, sets status of empty inputs to invalid.
     */
    validateEntry(entry: InvariantEntry, isFinalValidation = false): void {
        const vector = entry.vector;
        const isTrivial = vector.every((val) => val === 0);
        if (isTrivial) {
            if (isFinalValidation) entry.setValidity(InvariantValidity.INVALID_TRIVIAL);
            else entry.setValidity(undefined);
            return;
        }

        const computedInvariants = this.computedMinInvariants();
        const isExactMatch = computedInvariants.some((inv) => this.areVectorsEqual(vector, inv));

        if (isExactMatch) {
            entry.setValidity(InvariantValidity.VALID_MINIMAL);
            return;
        }

        const matchedInvariant = computedInvariants.find((inv) => vector.every((val, i) => inv[i] - val >= 0));

        const incompleteMinimal = matchedInvariant !== undefined;

        if (incompleteMinimal) {
            const missingPerPlace = matchedInvariant.map((invVal, i) => invVal - vector[i]);
            const missingPlacesCount = missingPerPlace.filter((diff) => diff > 0).length;
            const missingWeightsTotal = missingPerPlace.reduce((sum, diff) => sum + diff, 0);

            entry.missingPlacesCount = missingPlacesCount;
            entry.missingWeightsCount = missingWeightsTotal;

            entry.setValidity(InvariantValidity.INCOMPLETE_MINIMAL);
            return;
        }

        const isInvariant = this.isInvariant(vector);
        if (isInvariant) {
            entry.setValidity(InvariantValidity.VALID_NOT_MINIMAL);
            return;
        }

        entry.invalidPlaces = this.getInvalidPlaces(vector);

        const incompleteNonMinimal = entry.invalidPlaces.length === 0 && !incompleteMinimal;

        if (incompleteNonMinimal) {
            entry.setValidity(InvariantValidity.INCOMPLETE_NOT_MINIMAL);
            return;
        }

        entry.setValidity(InvariantValidity.INVALID);
    }

    /**
     * Validates all invariant entries in the input list.
     * Shows a success notification if all minimal invariants are found,
     * or an info notification if some are missing.
     */
    validateAllEntries(): void {
        for (const entry of this.inputEntries()) this.validateEntry(entry, true);

        if (this.remainingMinInvariants().length === 0)
            this._notificationService.showSuccess(
                'TOASTER.HEADER.VALIDATION_COMPLETED',
                'TOASTER.BODY.ALL_MIN_INVARIANTS_FOUND',
            );
        else {
            this._notificationService.showInfo(
                'TOASTER.HEADER.VALIDATION_COMPLETED',
                'TOASTER.BODY.MIN_INVARIANTS_MISSING',
            );
        }
    }

    /**
     * Creates the incidence matrix for the given Petri net diagram.
     * The matrix has dimensions |P| × |T|, where P is the set of places and T is the set of transitions.
     * Each entry C[p][t] represents the net change in place p when transition t fires:
     *   - Negative for input arcs (consumes tokens).
     *   - Positive for output arcs (produces tokens).
     *
     * @param diagram - The Petri net diagram to create the matrix for.
     * @returns The incidence matrix as a 2D array of numbers.
     */
    createIncidenceMatrix(diagram: Diagram): number[][] {
        const places = diagram.places;
        const transitions = diagram.transitions;
        const matrix: number[][] = Array.from({ length: places.length }, () => Array(transitions.length).fill(0));
        for (let i = 0; i < transitions.length; i++) {
            const inputFlows = transitions[i].getInputFlow();
            const outputFlows = transitions[i].getOutputFlow();
            inputFlows.forEach(({ place, weight }) => {
                const pIndex = places.findIndex((p) => p.id === place.id);
                matrix[pIndex][i] -= weight;
            });

            outputFlows.forEach(({ place, weight }) => {
                const pIndex = places.findIndex((p) => p.id === place.id);
                matrix[pIndex][i] += weight;
            });
        }
        return matrix;
    }

    /**
     * Sets up the place flow mappings for all transitions in the Petri net.
     * For each transition, calculates the net flow (output - input) for each connected place.
     * This is used to efficiently compute transition balances during invariant validation.
     *
     * @param transitions - Array of all transitions in the Petri net.
     */
    setPlaceFlows(transitions: DiagramTransition[]): void {
        this._allPlaceLabels.forEach((label) => {
            this._placeFlows.set(label, new Map());
        });
        for (const transition of transitions) {
            const transitionLabel = transition.displayLabel;

            for (const { place, weight } of transition.getInputFlow()) {
                const placeLabel = place.displayLabel;
                const currentBalance = this._placeFlows.get(placeLabel)?.get(transitionLabel) || 0;
                this._placeFlows.get(placeLabel)?.set(transitionLabel, currentBalance - weight);
            }

            for (const { place, weight } of transition.getOutputFlow()) {
                const placeLabel = place.displayLabel;
                const currentBalance = this._placeFlows.get(placeLabel)?.get(transitionLabel) || 0;
                this._placeFlows.get(placeLabel)?.set(transitionLabel, currentBalance + weight);
            }
        }
    }

    /**
     * Checks if two vectors are equal within a small epsilon tolerance.
     * Used to compare invariant vectors with floating-point precision in mind.
     *
     * @param a - First vector to compare.
     * @param b - Second vector to compare.
     * @returns true if all corresponding elements in a and b are equal (within epsilon), false otherwise.
     */
    areVectorsEqual(a: number[], b: number[]): boolean {
        if (a.length !== b.length) return false;
        return a.every((val, i) => Math.abs(val - b[i]) < this._EPSILON);
    }

    /**
     * Checks if a given vector is a valid invariant for the Petri net.
     * A vector is a valid invariant if it satisfies yᵀ · C = 0 for the incidence matrix C.
     *
     * @param vector - The vector to check (place weights).
     * @returns true if the vector is a valid invariant, false otherwise.
     *
     * @note
     * Uses `_EPSILON` to account for floating-point precision errors.
     */
    isInvariant(vector: number[]): boolean {
        for (let j = 0; j < this._incidenceMatrix[0].length; j++) {
            let sum = 0;
            for (let i = 0; i < vector.length; i++) {
                sum += vector[i] * this._incidenceMatrix[i][j];
            }
            if (Math.abs(sum) > this._EPSILON) return false;
        }
        return true;
    }

    /**
     * Computes the minimal place invariants for the given Petri net diagram.
     * Uses the incidence matrix to calculate invariants and then filters for minimality.
     *
     * @param diagram - The Petri net diagram to compute invariants for.
     */
    protected computeMinimalInvariants(diagram: Diagram): void {
        this._incidenceMatrix = this.createIncidenceMatrix(diagram);
        const allFoundInvariants = this._computingService.placeInvariants(this._incidenceMatrix);
        const minimalInvariants = this._computingService.calculateMinimalPIs(allFoundInvariants, this._incidenceMatrix);
        this.computedMinInvariants.set(minimalInvariants);
    }

    /**
     * Gets the list of places that are not part of any minimal invariant.
     * Used to identify invalid places in a proposed invariant entry.
     *
     * @param vector - The vector to check for invalid places.
     * @returns Array of place labels that are not in any minimal invariant.
     */
    protected getInvalidPlaces(vector: number[]): string[] {
        const invalidPlaces: string[] = [];
        vector.forEach((val, placeIndex) => {
            if (val !== 0) {
                const isPlaceInAnyInvariant = this.computedMinInvariants().some((inv) => inv[placeIndex] !== 0);
                if (!isPlaceInAnyInvariant) {
                    invalidPlaces.push(this._allPlaceLabels[placeIndex]);
                }
            }
        });
        return invalidPlaces;
    }
}
