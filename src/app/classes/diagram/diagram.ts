import { DiagramNode } from './diagram-node';
import { DiagramArc } from './diagram-arc';

export class Diagram {
    private readonly _nodes: DiagramNode[];
    private readonly _arcs: DiagramArc[];
    private readonly _marking: Record<string, number>;
    private readonly _labels: Record<string, string>;

    constructor(
        elements: DiagramNode[],
        arcs: DiagramArc[] = [],
        marking: Record<string, number> = {},
        labels: Record<string, string> = {},
    ) {
        this._nodes = elements;
        this._arcs = arcs;
        this._marking = marking;
        this._labels = labels;
    }

    get nodes(): DiagramNode[] {
        return this._nodes;
    }

    get arcs(): DiagramArc[] {
        return this._arcs;
    }

    get marking(): Record<string, number> {
        return this._marking;
    }

    get labels(): Record<string, string> {
        return this._labels;
    }
}
