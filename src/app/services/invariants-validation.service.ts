import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ToasterNotificationService } from './toaster-notification.service';
import { ModeService } from './mode.service';
import { Diagram } from '../classes/diagram/diagram';
import { InvariantEntry, InvariantValidity } from '../classes/invariant-entry';
import { Tab } from '../classes/tabs';
import { DiagramTransition } from '../classes/diagram/diagram-transition';
import { PlaceInvariantsService } from './invariants-computing.service';
import { ToastList } from '../classes/toast';

@Injectable({ providedIn: 'root' })
export class InvariantsValidationService {
    private _notificationService = inject(ToasterNotificationService);
    private _modeService = inject(ModeService);
    private _translate = inject(TranslateService);
    private _computingService = inject(PlaceInvariantsService);

    private _EPSILON = 1e-10;

    private _allPlaceLabels: string[] = [];
    private _allTransitionLabels: string[] = [];
    private _placeFlows: Map<string, Map<string, number>> = new Map();
    private _incidenceMatrix: number[][] = [];

    inputEntries = signal<InvariantEntry[]>([]);

    computedMinInvariants = signal<number[][]>([]);

    foundMinInvariants = computed<number[][]>(() => {
        const inputs = Array.from(this.inputEntries().map(entry => entry.vector));
        return this.computedMinInvariants().filter(
            comp => inputs.some(input => this._areVectorsEqual(input, comp))
        );
    });

    remainingMinInvariants = computed<number[][]>(() => {
        const found = this.foundMinInvariants();
        const remaining = this.computedMinInvariants().filter(
            comp => !found.some(found => this._areVectorsEqual(found, comp))
        );
        if (remaining.length === 0 && !this._modeService.isExamMode(Tab.INVARIANTS)) {
            this._notificationService.showSuccess(
                'TOASTER.HEADER.SUCCESS',
                'TOASTER.BODY.ALL_MIN_INVARIANTS_FOUND',
            );
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

    initialize(diagram: Diagram): void {
        this._allPlaceLabels = diagram.getPlaceLabels();
        this._allTransitionLabels = diagram.getTransitionLabels();
        this.setPlaceFlows(diagram.transitions);
        this._computeMinimalInvariants(diagram);
    }

    setPlaceFlows(transitions: DiagramTransition[]) {
        this._allPlaceLabels.forEach((label) => {
            this._placeFlows.set(label, new Map());
        });
        for (const transition of transitions) {
            const transitionLabel = transition.displayLabel;

            for (const { place, weight } of transition.getInputFlow()) {
                const placeLabel = place.displayLabel;
                const currentWeight = this._placeFlows.get(placeLabel)?.get(transitionLabel) || 0;
                this._placeFlows.get(placeLabel)?.set(transitionLabel, currentWeight + weight);
            }

            for (const { place, weight } of transition.getOutputFlow()) {
                const placeLabel = place.displayLabel;
                const currentWeight = this._placeFlows.get(placeLabel)?.get(transitionLabel) || 0;
                this._placeFlows.get(placeLabel)?.set(transitionLabel, currentWeight - weight);
            }
        }
    }

    /**
     * Validates a firing entry input.
     * @param entry - The firing entry to be validated.
     * @returns A promise that resolves when the validation is complete.
     */
    async validateEntry(entry: InvariantEntry, isFinalValidation: boolean = false): Promise<void> {
        const vector = entry.vector;
        const isTrivial = vector.every((val) => val === 0);
        if (isTrivial) {
            if (isFinalValidation) entry.setValidity(InvariantValidity.INVALID_TRIVIAL);
            else entry.setValidity(undefined);
            return;
        }

        const computedInvariants = this.computedMinInvariants();
        const isExactMatch = computedInvariants.some((inv) => this._areVectorsEqual(vector, inv));

        if (isExactMatch) {
            entry.setValidity(InvariantValidity.VALID_MINIMAL);
            return;
        }

        let computed = this.remainingMinInvariants();
        if (computed.length === 0) computed = this.computedMinInvariants();

        const matchedInvariant = computed.find((inv) =>
            vector.every((val, i) => inv[i] - val >= 0)
        );

        const isIncompleteInvariant = matchedInvariant !== undefined;

        if (isIncompleteInvariant) {
            const missingPerPlace = matchedInvariant.map((invVal, i) => invVal - vector[i]);
            const missingPlacesCount = missingPerPlace.filter(diff => diff > 0).length;
            const missingWeightsTotal = missingPerPlace.reduce((sum, diff) => sum + diff, 0);

            entry.missingPlacesCount = missingPlacesCount;
            entry.missingWeightsCount = missingWeightsTotal;
        }

        if (isIncompleteInvariant && !isFinalValidation) {
            entry.setValidity(InvariantValidity.INCOMPLETE);
            return;
        }

        const isInvariant = this._isInvariant(vector);
        if (!isInvariant) {
            if (isFinalValidation) entry.setValidity(InvariantValidity.INVALID_FINAL);
            else entry.setValidity(InvariantValidity.INVALID_NOT_FINAL);
            return;
        }

        entry.setValidity(InvariantValidity.VALID_NOT_MINIMAL);
    }

    async validateAllEntries(): Promise<void> {
        const invalidEntries: ToastList[] = [];
            for (const entry of this.inputEntries()) {
                await this.validateEntry(entry, true);
                if (entry.validity !== InvariantValidity.VALID_MINIMAL) invalidEntries.push({ message: entry.notation });
            }
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

    private _areVectorsEqual(a: number[], b: number[]): boolean {
        if (a.length !== b.length) return false;
        return a.every((val, i) => Math.abs(val - b[i]) < this._EPSILON);
    }

    /**
     * Checks if all labels correspond to existing transitions in the diagram.
     * @param entry - The firing entry to be validated.
     * @returns true if all labels correnspond to existing transitions, false otherwise.
     */
    private _isInvariant(vector: number[]): boolean {
        for (let j = 0; j < this._incidenceMatrix[0].length; j++) {
            let sum = 0;
            for (let i = 0; i < vector.length; i++) {
                sum += vector[i] * this._incidenceMatrix[i][j];
            }
            if (Math.abs(sum) > this._EPSILON) return false;
        }
        return true;
    }

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

    private _computeMinimalInvariants(diagram: Diagram): void {
        this._incidenceMatrix = this.createIncidenceMatrix(diagram);
        const allFoundInvariants = this._computingService.placeInvariants(this._incidenceMatrix);
        const minimalInvariants = this._computingService.calculateMinimalPIs(allFoundInvariants, this._incidenceMatrix);
        this._printInvariantsAsTable(minimalInvariants, this._allPlaceLabels);
        this.computedMinInvariants.set(minimalInvariants);
    }

    private _printInvariantsAsTable(invariants: number[][], placeLabels: string[]): void {
        if (invariants.length === 0) {
            console.log('Keine Invarianten gefunden.');
            return;
        }

        // Header-Zeile
        let header = '#\t';
        placeLabels.forEach((label) => {
            header += `${label}\t`;
        });
        console.log(header.trim());

        // Datenzeilen
        invariants.forEach((invariant, index) => {
            let row = `${index + 1}\t`;
            invariant.forEach((coeff) => {
                row += `${coeff}\t`;
            });
            console.log(row.trim());
        });
    }
}
