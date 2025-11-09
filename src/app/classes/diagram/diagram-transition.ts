import { DiagramArc } from './diagram-arc';
import { DiagramNode, SHAPE } from './diagram-node';
import { DiagramPlace } from './diagram-place';

export class DiagramTransition extends DiagramNode {
    private readonly _label: string;
    private readonly _inputPlaces: DiagramPlace[];
    private readonly _outputPlaces: DiagramPlace[];
    private readonly _inputArcs: DiagramArc[];
    private readonly _outputArcs: DiagramArc[];

    constructor(
        id: string,
        label: string,
        inputPlaces: DiagramPlace[],
        outputPlaces: DiagramPlace[],
        inputArcs: DiagramArc[],
        outputArcs: DiagramArc[],
    ) {
        super(id);
        this._label = label || id;
        this._inputPlaces = inputPlaces;
        this._outputPlaces = outputPlaces;
        this._inputArcs = inputArcs;
        this._outputArcs = outputArcs;
    }

    get label(): string {
        return this._label;
    }

    override get shape(): SHAPE {
        return SHAPE.RECT;
    }

    override get displayLabel(): string {
        return this._label;
    }

    private isActivated(): boolean {
        return this._inputPlaces.every((place, index) => place.tokenCount >= this._inputArcs[index].weight);
    }

    private fire(): void {
        this._inputArcs.forEach((arc, i) => {
            const place = this._inputPlaces[i];
            place.tokens = place.tokenCount - arc.weight;
            console.log(
                `Transition ${this.label}: Removed ${arc.weight} tokens from Place ${place.id}, new token count: ${place.tokenCount}`,
            );
        });
        this._outputArcs.forEach((arc, i) => {
            const place = this._outputPlaces[i];
            place.tokens = place.tokenCount + arc.weight;
            console.log(
                `Transition ${this.label}: Added ${arc.weight} tokens to Place ${place.id}, new token count: ${place.tokenCount}`,
            );
        });
    }

    public processClick(): boolean {
        if (this.isActivated()) {
            this.fire();
            return true;
        }
        return false;
    }
}
