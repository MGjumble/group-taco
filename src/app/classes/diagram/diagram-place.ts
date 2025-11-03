import { DiagramNode, SHAPE } from './diagram-node';

export class DiagramPlace extends DiagramNode {
    private _tokens: number;

    constructor(id: string, initialTokens = 0) {
        super(id);
        this._tokens = initialTokens;
    }

    override get tokenCount(): number {
        return this._tokens;
    }

    set tokens(value: number) {
        this._tokens = value;
    }

    override get shape(): SHAPE {
        return SHAPE.CIRCLE;
    }
}
