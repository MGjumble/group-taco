import { DiagramNode } from './diagram-node';
import { DiagramArc } from './diagram-arc';
import { DiagramPlace } from './diagram-place';
import { DiagramTransition } from './diagram-transition';
import { DisplayableEdge, DisplayableGraph, DisplayableNode } from '../displayable-graph.interface';

export class Diagram implements DisplayableGraph {
    private readonly _places: DiagramPlace[];
    private readonly _transitions: DiagramTransition[];
    private readonly _arcs: DiagramArc[];

    constructor(places: DiagramPlace[] = [], transitions: DiagramTransition[] = [], arcs: DiagramArc[] = []) {
        this._places = places;
        this._transitions = transitions;
        this._arcs = arcs;
    }

    get places(): DiagramNode[] {
        return this._places;
    }

    get arcs(): DiagramArc[] {
        return this._arcs;
    }

    get transitions(): DiagramTransition[] {
        return this._transitions;
    }

    get allNodes(): (DiagramPlace | DiagramTransition)[] {
        return [...this._places, ...this._transitions];
    }

    get marking(): Record<string, number> {
        const marking: Record<string, number> = {};
        this._places.forEach((place) => {
            marking[place.id] = place.tokenCount;
        });
        return marking;
    }

    getNodes(): DisplayableNode[] {
        return this.allNodes;
    }

    getEdges(): DisplayableEdge[] {
        return this._arcs;
    }
}
