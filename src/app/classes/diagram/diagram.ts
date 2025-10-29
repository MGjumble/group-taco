import { DiagramNode } from './diagram-node';

export class Diagram {
    private readonly _nodes: DiagramNode[];

    constructor(elements: DiagramNode[]) {
        this._nodes = elements;
    }

    get nodes(): DiagramNode[] {
        return this._nodes;
    }
}
