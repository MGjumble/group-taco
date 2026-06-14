import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ToasterNotificationService } from './toaster-notification.service';
import { ModeService } from './mode.service';
import { Diagram } from '../classes/diagram/diagram';
import { InvariantEntry, InvariantValidity } from '../classes/invariant-entry';
import { Tab } from '../classes/tabs';
import { DiagramTransition } from '../classes/diagram/diagram-transition';

@Injectable({ providedIn: 'root' })
export class InvariantsValidationService {
    private _notificationService = inject(ToasterNotificationService);
    private _modeService = inject(ModeService);
    private _translate = inject(TranslateService);

    private _EPSILON = 1e-10;

    private _allPlaceLabels: string[] = []
    private _allTransitionLabels: string[] = []
    private _placeFlows: Map<string, Map<string, number>> = new Map();
    
    computedMinInvariants = signal<number[][]>([]);
    
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

    setPlaceFlows(transitions: DiagramTransition[]) {
        this._allPlaceLabels.forEach(label => { this._placeFlows.set(label, new Map()); });
        for (let transition of transitions) {
            for (const { place, weight } of transition.getInputFlow()) {
                this._placeFlows.get(place.displayLabel)?.set(transition.displayLabel, weight);
            }
            for (const { place, weight } of transition.getOutputFlow()) {
                this._placeFlows.get(place.displayLabel)?.set(transition.displayLabel, weight * -1);
            }
        }
        console.log(this._placeFlows);
    }

    initialize(diagram: Diagram): void {
        this._allPlaceLabels = diagram.getPlaceLabels();
        this._allTransitionLabels = diagram.getTransitionLabels();
        this.setPlaceFlows(diagram.transitions);
        this._computeMinimalInvariants(diagram);
    }
    
    /**
     * Finds valid firing sequences in a Petri net diagram beginning at its start marking.
     * @param diagram  - The Petri net diagram for which firing sequences are to be found.
     */
    findInvariants(diagram: Diagram): void {
        ;
    }

    resetComputedInvariants(): void {
        this.computedMinInvariants.set([]);
    }

    /**
     * Validates a firing entry input.
     * @param entry - The firing entry to be validated.
     * @returns A promise that resolves when the validation is complete.
     */
    async validateEntry(entry: InvariantEntry): Promise<void> {
        const hasOnlyValidPlaces: boolean = this.hasOnlyValidPlaces(entry);
        if (hasOnlyValidPlaces) {
            const isMinimal = this.computedMinInvariants().includes(entry.vector);
            if (isMinimal) {
                entry.setValidity(InvariantValidity.VALID_MINIMAL, null);
                return;
            }
            //TODO: Check if invariant is valid and not minimal
            const isValidNotMinimal = this.computedMinInvariants().includes(entry.vector);
            if (isValidNotMinimal) {
                entry.setValidity(InvariantValidity.VALID_NOT_MINIMAL, null);
                return;
            }
        }
    }

    /**
     * Checks if all labels correspond to existing transitions in the diagram.
     * @param entry - The firing entry to be validated.
     * @returns true if all labels correnspond to existing transitions, false otherwise.
     */
    private hasOnlyValidPlaces(entry: InvariantEntry): boolean {
        entry.setValidity(InvariantValidity.VALID_MINIMAL, null);
        if (entry.labels.length === 0) return true;

        const visitedLabels: string[] = [];
        for (const label of entry.labels) {
            visitedLabels.push(label);
            const exactMatch = this._allPlaceLabels.includes(label);
            const partialMatch = this._allPlaceLabels.some((place) => place.startsWith(label));
            if (exactMatch) {
                continue;
            } else {
                if (!this._modeService.isExamMode(Tab.INVARIANTS) && !partialMatch)
                    this._notificationService.showWarning(
                        'TOASTER.HEADER.PLACE_NOT_PRESENT',
                        'TOASTER.BODY.PLACE_NOT_PRESENT',
                        { messageParams: { label: label } },
                    );
                entry.setValidity(InvariantValidity.INVALID, {
                    type: 'INVARIANTS.NOT_PRESENT',
                    invalidLabel: label,
                    visitedLabels: visitedLabels,
                });
                break;
            }
        }
        return entry.validity !== InvariantValidity.INVALID;
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
                const pIndex = places.findIndex(p => p.id === place.id);
                matrix[pIndex][i] -= weight;
            });

            outputFlows.forEach(({ place, weight }) => {
                const pIndex = places.findIndex(p => p.id === place.id);
                matrix[pIndex][i] += weight;
            });
        }
        return matrix;
    }

    extendIncidenceMatrix(matrix: number[][]): number[][] {
        const extendedMatrix: number[][] = matrix.map((row, i) => {
            const extendedRow = [...row];
            for (let j = 0; j < matrix.length; j++) {
                extendedRow.push(i === j ? 1 : 0);
            }
            return extendedRow;
        });
        return extendedMatrix;
    }

    private _computeMinimalInvariants(diagram: Diagram): void {
        const incidenceMatrix = this.createIncidenceMatrix(diagram);
        const extendedMatrix = this.extendIncidenceMatrix(incidenceMatrix);
        const allFoundInvariants = this._computeInvariants(extendedMatrix);
        const minimalInvariants = allFoundInvariants.filter(inv => this._isMinimal(inv, incidenceMatrix));
        console.log("All found invariants:", allFoundInvariants);
        console.log("Minimal invariants:", minimalInvariants);
        this.computedMinInvariants.set(minimalInvariants);
    }

    private _computeInvariants(extendedMatrix: number[][]): number[][] {
        const rows = extendedMatrix.length;
        const cols = extendedMatrix[0].length;
        const transitionCount = cols - rows;

        let M = this._gaussianEliminationZ(extendedMatrix);

        const invariants: number[][] = [];
        for (let row = 0; row < rows; row++) {
            let isInvariant = true;
            for (let col = 0; col < transitionCount; col++) {
                if (M[row][col] !== 0) {
                    isInvariant = false;
                    break;
                }
            }
            if (isInvariant) {
                const invariant = M[row].slice(transitionCount, cols);
                const gcd = this._gcdOfArray(invariant);
                invariants.push(invariant.map(val => val / gcd));
            }
        }
        return invariants;
    }

    private _isMinimal(invariant: number[], incidenceMatrix: number[][]): boolean {
        if (invariant.every(val => val === 0)) return false;

        for (const otherInv of incidenceMatrix) {
            if (invariant === otherInv) continue;

            const isMultiple = invariant.every((val, i) => {
                if (otherInv[i] === 0) return val === 0;
                if (val === 0) return false;
                return val % otherInv[i] === 0 && val / otherInv[i] === invariant[0] / otherInv[0];
            });

            if (isMultiple) {
                return false;
            }
        }
        return true;
    }

    private _gaussianEliminationZ(matrix: number[][]): number[][] {
        const rows = matrix.length;
        const cols = matrix[0].length;
        let M = matrix.map(row => [...row]);

        for (let col = 0, row = 0; col < cols && row < rows; col++) {
            let pivot = row;
            while (pivot < rows && M[pivot][col] === 0) pivot++;
            if (pivot === rows) continue;

            [M[row], M[pivot]] = [M[pivot], M[row]];

            for (let i = 0; i < rows; i++) {
                if (i !== row && M[i][col] !== 0) {
                    const gcd = this._gcdOfTwoNumbers(Math.abs(M[row][col]), Math.abs(M[i][col]));
                    const lcm = (Math.abs(M[row][col]) * Math.abs(M[i][col])) / gcd;
                    const factor1 = lcm / Math.abs(M[row][col]);
                    const factor2 = lcm / Math.abs(M[i][col]);

                    for (let j = col; j < cols; j++) {
                        M[row][j] *= factor1;
                        M[i][j] *= factor2;
                    }

                    const intFactor = M[i][col] / M[row][col];
                    for (let j = col; j < cols; j++) {
                        M[i][j] -= intFactor * M[row][j];
                    }
                }
            }
            row++;
        }
        return M;
    }

    private _gcdOfArray(arr: number[]): number {
        const absArr = arr.map(Math.abs).filter(val => val !== 0);
        if (absArr.length === 0) return 1;
        let gcd = absArr[0];
        for (let i = 1; i < absArr.length; i++) {
            gcd = this._gcdOfTwoNumbers(gcd, absArr[i]);
        }
        return gcd;
    }
    
    private _gcdOfTwoNumbers(a: number, b: number): number {
        return b === 0 ? a : this._gcdOfTwoNumbers(b, a % b);
    }
}
