import { signal } from '@angular/core';

/**
 * Represents a user-provided entry for a Petri net invariant.
 * This class manages the state of an invariant, including its notation, validity,
 * place weights, and transition balances.
 */
export class InvariantEntry {
    /**
     * Creates an instance of InvariantEntry.
     * @param id - Unique identifier for the invariant entry.
     * @param notation - String representation of the invariant (e.g., "p1 + 3p2 - p3").
     * @param validity - Current validity status of the invariant (default: undefined).
     * @param missingPlacesCount - Number of places missing from the invariant (default: undefined).
     * @param missingWeightsCount - Number of places with missing weights (default: undefined).
     * @param allPlaces - Array of all place labels in the Petri net.
     * @param allTransitions - Array of all transition labels in the Petri net.
     * @param placeFlows - Map of place labels to their flow maps (place → transition → weight).
     * @param placeWeights - Signal containing a map of place labels to their weights (default: empty map).
     * @param transitionBalances - Signal containing a map of transition labels to their balance values (default: empty map).
     */
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

    /**
     * Gets the labels of all places included in the invariant.
     * @returns An array of place labels.
     */
    get labels(): string[] {
        return Array.from(this.placeWeights().keys());
    }

    /**
     * Gets the weight vector of the invariant.
     * The vector represents the weights of each place in the order of `allPlaces`.
     * @returns An array of numbers representing the weights of each place.
     */
    get vector(): number[] {
        return Array.from(this.placeWeights().values());
    }

    /**
     * Sets the validity status of the invariant.
     * @param validity - The validity status to set (e.g., VALID_MINIMAL).
     */
    setValidity(validity: InvariantValidity | undefined) {
        this.validity = validity;
    }

    /**
     * Updates the weight of a place and recalculates transition balances and notation.
     * @param placeLabel - The label of the place to update.
     * @param weightDiff - The difference to add to the current weight of the place.
     */
    selectPlace(placeLabel: string, weightDiff: number): void {
        this._updatePlaceWeight(placeLabel, weightDiff);
        this._updateTransitionBalances(placeLabel, weightDiff);
        this._updateNotation();
    }

    /**
     * Converts a weight vector into a human-readable notation string.
     * Example: [1, -1, 2] with labels ["p1", "p2", "p3"] → "p1 - p2 + 2p3"
     * @param vector - The weight vector to convert.
     * @param placeLabels - The labels of the places corresponding to the vector indices.
     * @returns The string representation of the invariant.
     */
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

    /**
     * Updates the weight of a specific place in the invariant entry.
     * @param placeLabel - The label of the place to update.
     * @param weightDiff - The difference to add to the current weight.
     */
    private _updatePlaceWeight(placeLabel: string, weightDiff: number): void {
        this.placeWeights.update((currentMap) => {
            const newMap = new Map(currentMap);
            const currentWeight = newMap.get(placeLabel) || 0;
            const newWeight = currentWeight + weightDiff;
            newMap.set(placeLabel, newWeight);
            return newMap;
        });
    }

    /**
     * Updates the balance values of transitions based on the weight change of a place.
     * For each transition connected to the place, the balance is adjusted by `weightDiff * flowFactor`.
     * @param placeLabel - The label of the place whose weight changed.
     * @param weightDiff - The difference in the place's weight.
     */
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

    /**
     * Updates the notation string based on the current place weights.
     * Called automatically when a place weight changes.
     */
    private _updateNotation() {
        const labels = Array.from(this.placeWeights().keys());
        const vector = Array.from(this.placeWeights().values());
        this.notation = InvariantEntry.toNotation(vector, labels);
    }
}

/**
 * Enumeration representing the validity status of a proposed invariant.
 * Used to classify invariants based on their correctness and minimality.
 */
export enum InvariantValidity {
    VALID_MINIMAL = 'VALID_MINIMAL', // Matches a calculated minimal invariant
    VALID_NOT_MINIMAL = 'VALID_NOT_MINIMAL', // Is a linear combination of min. invariants
    INVALID_NOT_FINAL = 'INVALID_NOT_FINAL', // Invalid, not finally validated/ likely to be corrected
    INVALID_FINAL = 'INVALID_FINAL', // Invalid after final validation
    INVALID_TRIVIAL = 'INVALID_TRIVIAL', // Invalid zero vector
    INCOMPLETE = 'INCOMPLETE', // Invalid, but the weights are a subset of a computed invariant/ likely to be completed
}
