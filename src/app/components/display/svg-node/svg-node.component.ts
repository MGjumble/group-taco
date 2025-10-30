import { Component, computed, input, signal } from '@angular/core';
import { DiagramNode } from '../../../classes/diagram/diagram-node';
import { Coords } from '../../../classes/json-petri-net';

@Component({
    selector: 'g[appSvgNode]',
    imports: [],
    templateUrl: './svg-node.component.html',
    styleUrl: './svg-node.component.css',
})
export class SvgNodeComponent {
    readonly RADIUS = 25;
    readonly RECT_WIDTH = 50;
    readonly RECT_HEIGHT = 30;
    readonly TOKEN_RADIUS = 4;

    readonly diagramNode = input<DiagramNode>();
    readonly marking = input<Record<string, number>>({});
    readonly labels = input<Record<string, string>>({});

    readonly fillColor = signal('white');

    readonly transitionFillColor = computed(() => {
        return this.fillColor() === 'lightgray' ? 'gray' : 'black';
    });

    readonly placeFillColor = computed(() => {
        return this.fillColor();
    });

    readonly isTransition = computed(() => {
        const node = this.diagramNode();
        return node ? node.id.startsWith('t') : false;
    });

    readonly isPlace = computed(() => {
        const node = this.diagramNode();
        return node ? node.id.startsWith('p') : false;
    });

    readonly displayLabel = computed(() => {
        const node = this.diagramNode();
        const labelsData = this.labels();

        if (!node) return '';

        // For transitions, use the label if available, otherwise use the id
        if (this.isTransition() && labelsData[node.id]) {
            return labelsData[node.id];
        }

        return node.id;
    });

    readonly tokenCount = computed(() => {
        const node = this.diagramNode();
        const markingData = this.marking();
        return node && markingData ? markingData[node.id] || 0 : 0;
    });

    readonly circleX = computed(() => {
        const node = this.diagramNode();
        return node ? node.x : 0;
    });

    readonly circleY = computed(() => {
        const node = this.diagramNode();
        return node ? node.y : 0;
    });

    readonly rectX = computed(() => {
        const node = this.diagramNode();
        return node ? node.x - this.RECT_WIDTH / 2 : 0;
    });

    readonly rectY = computed(() => {
        const node = this.diagramNode();
        return node ? node.y - this.RECT_HEIGHT / 2 : 0;
    });

    readonly textX = computed(() => {
        const node = this.diagramNode();
        return node ? node.x : 0;
    });

    readonly textY = computed(() => {
        const node = this.diagramNode();
        if (!node) return 0;

        // For transitions, center text inside the rectangle
        // For places, position text below the circle
        if (this.isTransition()) {
            return node.y;
        } else {
            return node.y + this.RADIUS + 15;
        }
    });

    readonly tokenPositions = computed(() => {
        const node = this.diagramNode();
        const tokens = this.tokenCount();

        if (!node || !this.isPlace() || tokens === 0) return [];

        const positions: Coords[] = [];

        if (tokens === 1) {
            // Single token in center
            positions.push({ x: node.x, y: node.y });
        } else if (tokens <= 6) {
            // Multiple tokens arranged in a circle
            const angleStep = (2 * Math.PI) / tokens;
            const tokenRadius = this.RADIUS * 0.6;

            for (let i = 0; i < tokens; i++) {
                const angle = i * angleStep;
                positions.push({
                    x: node.x + Math.cos(angle) * tokenRadius,
                    y: node.y + Math.sin(angle) * tokenRadius,
                });
            }
        } else {
            // For many tokens, just show the number
            return [];
        }

        return positions;
    });

    readonly showTokenNumber = computed(() => {
        return this.isPlace() && this.tokenCount() > 6;
    });

    public mouseDown(e: MouseEvent) {
        this.fillColor.set('lightgray');
    }

    public mouseUp(e: MouseEvent) {
        this.fillColor.set('white');
    }
}
