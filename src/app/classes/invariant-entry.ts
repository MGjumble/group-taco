import { signal } from "@angular/core";
import { Diagram } from "./diagram/diagram";
import { DiagramPlace } from "./diagram/diagram-place";
import { DiagramTransition } from "./diagram/diagram-transition";
import { EntryError } from "./entry-error";

/**
 * Representing a string entry for a Petri net invariant.
 */
export class InvariantEntry {
    private _delimiters = /\s+|,|;|\*|, |; |\* /;

    constructor(
        public id: number,
        public text: string,
        public isClosed: boolean,
        public validity: InvariantValidity | undefined = undefined,
        public allPlaces: string[],
        public allTransitions: string[],
        public placeFlows: Map<string, Map<string, number>>,
        public placeWeights = signal<Map<string, number>>(new Map()),
        public transitionWeights: Map<string, number> = new Map(),
        public error: EntryError | null = null,
    ) {
        this.placeWeights.set(new Map(this.allPlaces.map(label => [label, 0])));
        this.allTransitions.forEach(label => { this.transitionWeights.set(label, 0); });
    }

    get labels(): string[] {
        return Array.from(this.placeWeights().keys());
    }

    get vector(): number[] {
        return Array.from(this.placeWeights().values());
    }

    changePlaceWeight(placeLabel: string, weightDiff: number) {
        this.placeWeights.update(currentMap => {
            const newMap = new Map(currentMap);
            const currentWeight = newMap.get(placeLabel) || 0;
            const newWeight = currentWeight + weightDiff;
            newMap.set(placeLabel, newWeight);
            return newMap;
        });
        this.updateTransitionWeights(placeLabel, weightDiff);
        this.updateText();
    }

    updateTransitionWeights(placeLabel: string, weightDiff: number) {
        const flow = this.placeFlows.get(placeLabel);
        if (!flow) return;
        for (let [tranLabel, factor] of flow) { 
            const weight = this.transitionWeights.get(tranLabel);
            if (weight !== undefined) {
                this.transitionWeights.set(tranLabel, weight + factor * weightDiff);
            }
        }
        console.log(this.transitionWeights);
    }

    updateText() {
        const textParts = [];
        for (let [place, weight] of this.placeWeights()) {
            if (weight === 0) continue;
            let sign = '- ';
            if (weight >= 0) sign = textParts.length === 0 ? '' : '+ ';
            const factor = Math.abs(weight) === 1 ? '' : Math.abs(weight)
            textParts.push(`${sign}${factor}${place}`);
        }
        this.text = textParts.join(" ");
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
