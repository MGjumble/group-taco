import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ToasterNotificationService } from './toaster-notification.service';
import { ModeService } from './mode.service';
import { Diagram } from '../classes/diagram/diagram';
import { InvariantEntry, InvariantValidity } from '../classes/invariant-entry';
import { Tab } from '../classes/tabs';

@Injectable({ providedIn: 'root' })
export class InvariantsValidationService {
    private _notificationService = inject(ToasterNotificationService);
    private _modeService = inject(ModeService);
    private _translate = inject(TranslateService);

    private _allowedLabels: string[] = []

    private _EPSILON = 1e-10;
    
    computedMinInvariants = signal<number[][]>([]);
    
    get allowedLabels(): string[] {
        return this._allowedLabels;
    }

    set allowedLabels(labels: string[]) {
        this._allowedLabels = labels;
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
            const exactMatch = this.allowedLabels.includes(label);
            const partialMatch = this.allowedLabels.some((place) => place.startsWith(label));
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

    computeMinimalInvariants(diagram: Diagram): void {
        const incidenceMatrix = this.createIncidenceMatrix(diagram);
        const extendedMatrix = this.extendIncidenceMatrix(incidenceMatrix);
        const allFoundInvariants = this._computeInvariants(extendedMatrix);
        const minimalInvariants = allFoundInvariants.filter(inv => this._isMinimal(inv, incidenceMatrix));
        console.log("All found invariants:", allFoundInvariants);
        console.log("Minimal invariants:", minimalInvariants);
        this.computedMinInvariants.set(minimalInvariants);
    }

    private _computeInvariants(extendedMatrix: number[][]): number[][] {
        const colCount = extendedMatrix.length;
        const rowCount = extendedMatrix[0].length - colCount;
        let M = extendedMatrix.map(row => [...row]);

        // Iterate over all cols (transitions)
        for (let col = 0; col < rowCount; col++) {
            const newRows: number[][] = [];

            // Search for pairs of rows with opposite signs in the current column
            for (let row1 = 0; row1 < M.length; row1++) {
                for (let row2 = row1 + 1; row2 < M.length; row2++) {
                    if (M[row1][col] * M[row2][col] < 0) {
                        // Combine the two rows
                        const abs1 = Math.abs(M[row1][col]);
                        const abs2 = Math.abs(M[row2][col]);
                        const newRow = M[row1].map((val, index) => abs2 * val - abs1 * M[row2][index]);
                        const gcd = this._gcdOfArray(newRow);
                        const normalizedRow = newRow.map(val => val / gcd);
                        newRows.push(normalizedRow);
                    }
                }
            }
            M = [...M, ...newRows];

            // Remove rows that have a non-zero entry in the current column
            // Use epsilon to handle floating-point precision issues
            M = M.filter(row => Math.abs(row[col]) < this._EPSILON);
        }
        // Extract the invariants (last p columns of C)
        const invariants = M.map(row => row.slice(rowCount));
        return invariants;
    }

    private _isMinimal(invariant: number[], incidenceMatrix: number[][]): boolean {
        const supportIndices = invariant.map((val, index) => val > this._EPSILON ? index : -1).filter(index => index !== -1);
        const suppCount = supportIndices.length;
        if (suppCount === 0) return false;

        // Extract the submatrix of the incidence matrix corresponding to the support of the invariant
        const subMatrix = supportIndices.map(index => incidenceMatrix[index]);
        
        // Check if the submatrix has full rank (i.e., rank equals the number of support indices)
        const rank = this._rank(subMatrix);
        return suppCount === rank + 1;
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

    private _rank(matrix: number[][]): number {
        if (matrix.length === 0) return 0;

        const rowCount = matrix.length;
        const colCount = matrix[0].length;
        let rank = 0;
        const M = matrix.map(row => [...row]);

        for (let col = 0; col < colCount && rank < rowCount; col++) {
            // Search for pivot row (first row with M[i][j] != 0)
            let pivot = rank;
            while (pivot < rowCount && Math.abs(M[pivot][col]) < this._EPSILON) pivot++;
            if (pivot === rowCount) continue; // No pivot found

            // Switch rows
            [M[rank], M[pivot]] = [M[pivot], M[rank]];

            // Eliminate other rows
            for (let row = 0; row < rowCount; row++) {
                if (row !== rank && Math.abs(M[row][col]) > this._EPSILON) {
                    const factor = M[row][col] / M[rank][col];
                    for (let i = col; i < colCount; i++) {
                        M[row][i] -= factor * M[rank][i];
                    }
                }
            }
            rank++;
        }
        return rank;
    }
}
