import { DisplayableGraph, DisplayableNode, DisplayableEdge } from './displayable-graph.interface';
import { SHAPE } from './diagram/diagram-node';
import { Coords } from './json-petri-net';
import { Signal } from '@angular/core';


/**
 * A node representing a state in the reachability graph.
 */
class StateNode implements DisplayableNode {
    id: string;
    x = 0;
    y = 0;

    get shape(): SHAPE {
        return SHAPE.CIRCLE;
    }
    get displayLabel(): string {
        return `[${this.id}]`;
    }
    // eslint-disable-next-line @typescript-eslint/class-literal-property-style
    get tokenCount(): Signal<number> {
        return this.tokenCount;
    }
    

    constructor(id: string, x: number, y: number) {
        this.id = id;
        this.x = x;
        this.y = y;
    }
}

/**
 * An edge representing a transition firing in the reachability graph.
 */
class FiringEdge implements DisplayableEdge {
    id: string;
    source: string;
    target: string;
    displayLabel: string;
    bendPoints: Coords[] = [];

    constructor(id: string, source: string, target: string, transitionLabel: string) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.displayLabel = transitionLabel;
    }
}

/**
 * The reachability graph of a Petri net.
 */
export class ReachabilityGraph implements DisplayableGraph {
    nodes: StateNode[] = [];
    edges: FiringEdge[] = [];

    getNodes(): DisplayableNode[] {
        return this.nodes;
    }
    getEdges(): DisplayableEdge[] {
        return this.edges;
    }
}
