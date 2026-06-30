import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

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
    private _translate = inject(TranslateService);
    private _computingService = inject(PlaceInvariantsService);

    private _EPSILON = 1e-10;

    private _allPlaceLabels: string[] = [];
    private _allTransitionLabels: string[] = [];
    private _placeFlows: Map<string, Map<string, number>> = new Map();
    private _incidenceMatrix: number[][] = [];

    foundMinInvariants = signal<number[][]>([]);
    computedMinInvariants = signal<number[][]>([]);

    foundCount = computed(() => this.foundMinInvariants().length);
    totalCount = computed(() => this.computedMinInvariants().length);

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
    async validateEntry(entry: InvariantEntry, rejectTrivial: boolean = false): Promise<void> {
        const vector = entry.vector;
        const isTrivial = vector.every((val) => val === 0);
        if (isTrivial) {
            console.log('trivial');
            if (rejectTrivial) {
                entry.setValidity(InvariantValidity.INVALID);
            } else entry.setValidity(undefined);
            return;
        }

        const computedInvariants = this.computedMinInvariants();
        const isExactMatch = computedInvariants.some((inv) => this._areVectorsEqual(vector, inv));

        if (isExactMatch) {
            console.log('minimal');
            entry.setValidity(InvariantValidity.VALID_MINIMAL);
            return;
        }

        const isIncompleteInvariant = computedInvariants.some((inv) => {
            return vector.every((val, i) => inv[i] - val >= 0);
        });

        if (isIncompleteInvariant) {
            console.log('incomplete');
            entry.setValidity(InvariantValidity.INCOMPLETE);
            return;
        }

        const isInvariant = this._isInvariant(vector);
        if (!isInvariant) {
            const nonZeroTransitions = entry.getNonZeroTransitions();
            console.log(nonZeroTransitions);
            entry.setValidity(InvariantValidity.INVALID);
            return;
        }

        console.log('not minimal');
        entry.setValidity(InvariantValidity.VALID_NOT_MINIMAL);
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

    /**
     * Generates a user-friendly error message for an invalid firing sequence.
     * @param entry - The firing entry containing the error details.
     * @returns A formatted error message string.
     */
    getErrorMessage(entry: InvariantEntry): string {
        //TODO: Update message
        return '';
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
