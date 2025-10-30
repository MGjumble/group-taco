import { Injectable } from '@angular/core';
import { Diagram } from '../classes/diagram/diagram';
import { DiagramNode } from '../classes/diagram/diagram-node';
import { DiagramArc } from '../classes/diagram/diagram-arc';
import { Coords, JsonPetriNet } from '../classes/json-petri-net';

@Injectable({
    providedIn: 'root',
})
export class ParserService {
    parse(text: string): Diagram | undefined {
        try {
            const rawData = JSON.parse(text) as JsonPetriNet;

            // Parse places and transitions as nodes
            const places = this.parseElements(rawData['places']);
            const transitions = this.parseElements(rawData['transitions']);
            const allNodes = [...places, ...transitions];

            this.setPosition(allNodes, rawData['layout']);

            // Parse arcs
            const arcs = this.parseArcs(rawData['arcs'], rawData['labels'], rawData['layout']);

            // Get marking and labels data
            const marking = rawData['marking'] || {};
            const labels = rawData['labels'] || {};

            return new Diagram(allNodes, arcs, marking, labels);
        } catch (e) {
            console.error('Error while parsing JSON', e, text);
            return undefined;
        }
    }

    private parseElements(elementIds: string[] | undefined): DiagramNode[] {
        if (elementIds === undefined || !Array.isArray(elementIds)) {
            return [];
        }

        return elementIds.map((id) => new DiagramNode(id));
    }

    private parseArcs(
        arcs: Record<string, number> | undefined,
        labels: Record<string, string> | undefined,
        layout: JsonPetriNet['layout'],
    ): DiagramArc[] {
        if (!arcs) {
            return [];
        }

        const result: DiagramArc[] = [];

        for (const [arcId, weight] of Object.entries(arcs)) {
            const [source, target] = arcId.split(',');
            if (source && target) {
                // Get label from transitions if this arc represents a transition
                const label = labels?.[source] || labels?.[target];

                // Get bend points from layout if available
                const bendPoints = this.getBendPoints(arcId, layout);

                result.push(new DiagramArc(arcId, source, target, weight, label, bendPoints));
            }
        }

        return result;
    }

    private getBendPoints(arcId: string, layout: JsonPetriNet['layout']): Coords[] {
        if (!layout || !layout[arcId]) {
            return [];
        }

        const layoutData = layout[arcId];
        if (Array.isArray(layoutData)) {
            return layoutData;
        }

        return [];
    }

    private setPosition(elements: DiagramNode[], layout: JsonPetriNet['layout']) {
        if (layout === undefined) {
            return;
        }

        for (const el of elements) {
            const pos = layout[el.id] as Coords | undefined;
            if (pos !== undefined) {
                el.x = pos.x;
                el.y = pos.y;
            }
        }
    }
}
