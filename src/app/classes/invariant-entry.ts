import { signal } from '@angular/core';
import { Diagram } from './diagram/diagram';
import { DiagramPlace } from './diagram/diagram-place';
import { DiagramTransition } from './diagram/diagram-transition';
import { EntryError } from './entry-error';

/**
 * Representing a string entry for a Petri net invariant.
 */
export class InvariantEntry {
    constructor(
        public id: number,
        public notation: string,
        public validity: InvariantValidity | undefined = undefined,
        public missingPlacesCount: number | undefined = undefined,
        public missingWeightsCount: number | undefined = undefined,
        public allPlaces: string[],
        public allTransitions: string[],
        public placeFlows: Map<string, Map<string, number>>,
        public placeWeights = signal<Map<string, number>>(new Map()),
        public transitionBalances = signal<Map<string, number>>(new Map()),
    ) {
        this.placeWeights.set(new Map(this.allPlaces.map((label) => [label, 0])));
        this.transitionBalances.set(new Map(this.allTransitions.map((label) => [label, 0])));
    }

    get labels(): string[] {
        return Array.from(this.placeWeights().keys());
    }

    get vector(): number[] {
        return Array.from(this.placeWeights().values());
    }

    /**
     * Sets the validity of the invariant object and optionally an associated message.
     * @param validity - The validity status of the proposed invariant.
     * @param error - An error object with error information.
     */
    setValidity(validity: InvariantValidity | undefined) {
        this.validity = validity;
    }

    selectPlace(placeLabel: string, weightDiff: number): void {
        this._updatePlaceWeight(placeLabel, weightDiff);
        this._updateTransitionBalances(placeLabel, weightDiff);
        this._updateNotation();
    }

    private _updatePlaceWeight(placeLabel: string, weightDiff: number): void {
        this.placeWeights.update((currentMap) => {
            const newMap = new Map(currentMap);
            const currentWeight = newMap.get(placeLabel) || 0;
            const newWeight = currentWeight + weightDiff;
            newMap.set(placeLabel, newWeight);
            return newMap;
        });
    }

    private _updateTransitionBalances(placeLabel: string, weightDiff: number): void {
        const flow = this.placeFlows.get(placeLabel);
        if (!flow) return;

        this.transitionBalances.update((currentMap) => {
            const newMap = new Map(currentMap);
            for (const [tranLabel, factor] of flow) {
                const currentBalance = newMap.get(tranLabel) || 0;
                newMap.set(tranLabel, currentBalance + factor * weightDiff);
            }
            return newMap;
        });
    }

    private _updateNotation() {
        const labels = Array.from(this.placeWeights().keys());
        const vector = Array.from(this.placeWeights().values());
        this.notation = InvariantEntry.toNotation(vector, labels)
    }

    static toNotation(vector: number[], placeLabels: string[]): string {
        const parts = [];
        for (let i = 0; i < vector.length; i++) {
            const weight = vector[i];
            const label = placeLabels[i];
            if (weight === 0) continue;
            let sign = '- ';
            if (weight >= 0) sign = parts.length === 0 ? '' : '+ ';
            const factor = Math.abs(weight) === 1 ? '' : Math.abs(weight);
            parts.push(`${sign}${factor}${label}`);
        }
        return parts.join(' ');
    }
}

/**
 * Represents the validity status of a proposed invariant.
 */
export enum InvariantValidity {
    VALID_MINIMAL = 'VALID_MINIMAL',
    VALID_NOT_MINIMAL = 'VALID_NOT_MINIMAL',
    INVALID_NOT_FINAL = 'INVALID_NOT_FINAL',
    INVALID_FINAL = 'INVALID_FINAL',
    INVALID_TRIVIAL = 'INVALID_TRIVIAL',
    INCOMPLETE = 'INCOMPLETE',
}
