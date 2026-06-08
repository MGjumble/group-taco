import { DiagramPlace } from "./diagram/diagram-place";
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
        public allowedLabels: string[],
        public placeWeights: Map<string, number> = new Map(),
        public error: EntryError | null = null,
    ) {
        this.allowedLabels.forEach(label => { this.placeWeights.set(label, 0); });
    }

    get labels(): string[] {
        return Array.from(this.placeWeights.keys());
    }

    get vector(): number[] {
        return Array.from(this.placeWeights.values());
    }

    /**
     * Extracts the places with weights from the object's text attribute.
     * @return The array of place strings.
     */
    parseText(allPlaceLabels: string[]): void {
        let currentSign = 1;
        let currentWeight = 1;
        let currentLabel = '';
        let i = 0;
        while (i < this.text.length) {
            const char = this.text[i];
            if (char === '+' || char === '-') {
                currentSign = char === '+' ? 1 : -1;
                i++;
                continue;
            }
            if (this._delimiters.test(char)) {
                i++;
                continue;
            } else if (/\d/.test(char)) {
                let numStr = '';
            while (i < this.text.length && /\d/.test(this.text[i])) {
                numStr += this.text[i];
                i++;
                }
                currentWeight = parseInt(numStr);
                continue;
            }
            if (/[a-zA-Z]/.test(char)) {
                let foundLabel = '';
                while (i < this.text.length && /[a-zA-Z0-9]/.test(this.text[i])) {
                    foundLabel += this.text[i];
                    i++;
                }
                currentLabel = foundLabel;

                const label = allPlaceLabels.find(label => label === currentLabel);
                if (!label) {
                    this.validity = InvariantValidity.INVALID;
                    return;
                }
                this.placeWeights.set(label, currentSign * currentWeight);

                currentSign = 1;
                currentWeight = 1;
                currentLabel = '';
                continue;
            }
        }
        console.log(`Parsed invariant ${this.id}:`, this.placeWeights);
    }

    changePlaceWeight(label: string, weightDiff: number) {
        let weight = this.placeWeights.get(label);
        if (weight !== undefined) {
            this.placeWeights.set(label, weight + weightDiff);
        }
        this.updateText();
    }

    updateText() {
        const textParts = [];
        for (let [place, weight] of this.placeWeights) {
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
