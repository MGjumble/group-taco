import { signal } from "@angular/core";
import { Diagram } from "./diagram/diagram";
import { DiagramPlace } from "./diagram/diagram-place";
import { DiagramTransition } from "./diagram/diagram-transition";
import { EntryError } from "./entry-error";

/**
 * Representing a string entry for a Petri net invariant.
 */
export class InvariantEntry {

    constructor(
        public id: number,
        public notation: string,
        public validity: InvariantValidity | undefined = undefined,
        public validityDescription: string,
        public allPlaces: string[],
        public allTransitions: string[],
        public placeFlows: Map<string, Map<string, number>>,
        public placeWeights = signal<Map<string, number>>(new Map()),
        public transitionWeights = signal<Map<string, number>>(new Map()),
        public error: EntryError | null = null,
    ) {
        this.placeWeights.set(new Map(this.allPlaces.map(label => [label, 0])));
        this.transitionWeights.set(new Map(this.allTransitions.map(label => [label, 0])));
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
    setValidity(validity: InvariantValidity | undefined, error: EntryError | null) {
        this.validity = validity;
        this.error = error;
    }

    selectPlace(placeLabel: string, weightDiff: number): void {
        this._updatePlaceWeight(placeLabel, weightDiff);
        this._updateTransitionWeights(placeLabel, weightDiff);
        this._updateNotation();
    }

    private _updatePlaceWeight(placeLabel: string, weightDiff: number): void {
        this.placeWeights.update(currentMap => {
            const newMap = new Map(currentMap);
            const currentWeight = newMap.get(placeLabel) || 0;
            const newWeight = currentWeight + weightDiff;
            newMap.set(placeLabel, newWeight);
            return newMap;
        });
    }

    private _updateTransitionWeights(placeLabel: string, weightDiff: number): void {
        const flow = this.placeFlows.get(placeLabel);
        if (!flow) return;
        
        this.transitionWeights.update(currentMap => {
            const newMap = new Map(currentMap);
            for (const [tranLabel, factor] of flow) {
                const currentWeight = newMap.get(tranLabel) || 0;
                newMap.set(tranLabel, currentWeight + factor * weightDiff);
            }
            return newMap;
        });
    }

    private _updateNotation() {
        const parts = [];
        for (let [place, weight] of this.placeWeights()) {
            if (weight === 0) continue;
            let sign = '- ';
            if (weight >= 0) sign = parts.length === 0 ? '' : '+ ';
            const factor = Math.abs(weight) === 1 ? '' : Math.abs(weight)
            parts.push(`${sign}${factor}${place}`);
        }
        this.notation = parts.join(" ");
    }
}

/**
 * Represents the validity status of a proposed invariant.
 */
export enum InvariantValidity {
    VALID_MINIMAL = "VALID_MINIMAL",
    VALID_NOT_MINIMAL = "VALID_NOT_MINIMAL",
    INVALID = "INVALID",
    INCOMPLETE = "INCOMPLETE",
}
