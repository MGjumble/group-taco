import { Coords } from '../json-petri-net';

export class DiagramArc {
    private readonly _id: string;
    private readonly _source: string;
    private readonly _target: string;
    private readonly _weight: number;
    private readonly _label?: string;
    private readonly _bendPoints: Coords[];

    constructor(
        id: string,
        source: string,
        target: string,
        weight: number = 1,
        label?: string,
        bendPoints: Coords[] = [],
    ) {
        this._id = id;
        this._source = source;
        this._target = target;
        this._weight = weight;
        this._label = label;
        this._bendPoints = bendPoints;
    }

    get id(): string {
        return this._id;
    }

    get source(): string {
        return this._source;
    }

    get target(): string {
        return this._target;
    }

    get weight(): number {
        return this._weight;
    }

    get label(): string | undefined {
        return this._label;
    }

    get bendPoints(): Coords[] {
        return this._bendPoints;
    }
}
