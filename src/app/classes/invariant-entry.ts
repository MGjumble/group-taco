import { DiagramPlace } from "./diagram/diagram-place";

/**
 * Representing a string entry for a Petri net invariant.
 */
export class InvariantEntry {
    private _delimiters = /\s+|,|;|\*|, |; |\* /;

    constructor(
        public id: number,
        public text: string,
        public isClosed: boolean,
        public validity: InvariantValidity | undefined | null = null,
        public message: string | null = null,
        public placeWeights: Map<DiagramPlace, number> = new Map(),
    ) {}

    /**
     * Extracts the places with weights from the object's text attribute.
     * @return The array of place strings.
     */
    parseText(allPlaces: DiagramPlace[]): void {
        let currentSign = 1;
        let currentWeight = 1;
        let currentPlaceId = '';
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
                let placeId = '';
                while (i < this.text.length && /[a-zA-Z0-9]/.test(this.text[i])) {
                    placeId += this.text[i];
                    i++;
                }
                currentPlaceId = placeId;

                const place = allPlaces.find(p => p.displayLabel === currentPlaceId);
                if (!place) {
                    this.validity = InvariantValidity.INVALID;
                    this.message = `Unbekannter Platz: ${currentPlaceId}`;
                    return;
                }
                this.placeWeights.set(place, currentSign * currentWeight);

                currentSign = 1;
                currentWeight = 1;
                currentPlaceId = '';
                continue;
            }
        }
        console.log(`Parsed invariant ${this.id}:`, this.placeWeights);
    }


    /**
     * Sets the validity of the invariant object and optionally an associated message.
     * @param validity - The validity status of the proposed invariant.
     * @param message - A message for the user.
     */
    setValidity(validity: InvariantValidity | undefined, message: string | null) {
        this.validity = validity ?? undefined;
        this.message = message ?? null;
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
