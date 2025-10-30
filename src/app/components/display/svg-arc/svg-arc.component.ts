import { Component, computed, input } from '@angular/core';
import { DiagramArc } from '../../../classes/diagram/diagram-arc';
import { DiagramNode } from '../../../classes/diagram/diagram-node';
import { Coords } from '../../../classes/json-petri-net';

@Component({
    selector: 'g[appSvgArc]',
    imports: [],
    templateUrl: './svg-arc.component.html',
    styleUrl: './svg-arc.component.css',
})
export class SvgArcComponent {
    readonly RADIUS = 25;
    readonly RECT_WIDTH = 50;
    readonly RECT_HEIGHT = 30;

    readonly diagramArc = input<DiagramArc>();
    readonly nodes = input<DiagramNode[]>([]);

    readonly sourceNode = computed(() => {
        const arc = this.diagramArc();
        const nodeList = this.nodes();
        if (!arc || !nodeList) return undefined;
        return nodeList.find((node) => node.id === arc.source);
    });

    readonly targetNode = computed(() => {
        const arc = this.diagramArc();
        const nodeList = this.nodes();
        if (!arc || !nodeList) return undefined;
        return nodeList.find((node) => node.id === arc.target);
    });

    readonly sourceConnectionPoint = computed(() => {
        const source = this.sourceNode();
        const target = this.targetNode();

        if (!source || !target) return { x: 0, y: 0 };

        return this.getConnectionPoint(source, target, true);
    });

    readonly targetConnectionPoint = computed(() => {
        const source = this.sourceNode();
        const target = this.targetNode();

        if (!source || !target) return { x: 0, y: 0 };

        return this.getConnectionPoint(target, source, false);
    });

    readonly pathData = computed(() => {
        const sourcePoint = this.sourceConnectionPoint();
        const targetPoint = this.targetConnectionPoint();
        const arc = this.diagramArc();

        if (!arc) return '';

        const bendPoints = arc.bendPoints;

        let path = `M ${sourcePoint.x} ${sourcePoint.y}`;

        // Add bend points if they exist
        if (bendPoints.length > 0) {
            for (const point of bendPoints) {
                path += ` L ${point.x} ${point.y}`;
            }
        }

        path += ` L ${targetPoint.x} ${targetPoint.y}`;

        return path;
    });

    readonly labelPosition = computed(() => {
        const source = this.sourceNode();
        const target = this.targetNode();
        const arc = this.diagramArc();

        if (!source || !target || !arc) return { x: 0, y: 0 };

        // If there are bend points, use the middle bend point
        const bendPoints = arc.bendPoints;
        if (bendPoints.length > 0) {
            const midIndex = Math.floor(bendPoints.length / 2);
            return {
                x: bendPoints[midIndex].x,
                y: bendPoints[midIndex].y - 10,
            };
        }

        // Otherwise, use the midpoint between source and target
        return {
            x: (source.x + target.x) / 2,
            y: (source.y + target.y) / 2 - 10,
        };
    });

    readonly hasLabel = computed(() => {
        const arc = this.diagramArc();
        return arc?.weight && arc.weight > 1;
    });

    readonly displayText = computed(() => {
        const arc = this.diagramArc();
        if (!arc) return '';

        // Only show weight if it's greater than 1
        return arc.weight && arc.weight > 1 ? arc.weight.toString() : '';
    });

    private getConnectionPoint(node: DiagramNode, otherNode: DiagramNode, isSource: boolean): Coords {
        const dx = otherNode.x - node.x;
        const dy = otherNode.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return { x: node.x, y: node.y };

        const normalizedX = dx / distance;
        const normalizedY = dy / distance;

        let radius: number;

        // Determine if this is a place (circle) or transition (rectangle)
        if (node.id.startsWith('p')) {
            // Place - circle
            radius = this.RADIUS;
            return {
                x: node.x + normalizedX * radius,
                y: node.y + normalizedY * radius,
            };
        } else {
            // Transition - rectangle
            // Calculate intersection with rectangle edge
            const halfWidth = this.RECT_WIDTH / 2;
            const halfHeight = this.RECT_HEIGHT / 2;

            // Check which edge the line intersects
            const xIntercept = Math.abs(normalizedX) > 0 ? halfWidth / Math.abs(normalizedX) : Infinity;
            const yIntercept = Math.abs(normalizedY) > 0 ? halfHeight / Math.abs(normalizedY) : Infinity;

            const intercept = Math.min(xIntercept, yIntercept);

            return {
                x: node.x + normalizedX * intercept,
                y: node.y + normalizedY * intercept,
            };
        }
    }
}
