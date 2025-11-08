import { Component, signal, OnInit, OnDestroy, ElementRef, inject, ChangeDetectorRef, computed } from '@angular/core';
import { SvgNodeComponent } from '../../../display/svg-node/svg-node.component';
import { DiagramNode } from '../../../../classes/diagram/diagram-node';
import { DiagramPlace } from '../../../../classes/diagram/diagram-place';
import { DiagramTransition } from '../../../../classes/diagram/diagram-transition';

interface DrawnElement {
    node: DiagramNode;
    id: string;
}

interface Connection {
    id: string;
    aId: string; // source element id (first clicked)
    bId: string; // target element id (second clicked)
    weight: number; // arc weight, >= 1
}

@Component({
    selector: 'app-process-net-draw-display',
    standalone: true,
    imports: [SvgNodeComponent],
    templateUrl: './process-net-draw-display.html',
    styleUrls: ['./process-net-draw-display.css'],
})
export class ProcessNetDrawDisplayComponent implements OnInit, OnDestroy {
    readonly drawnElements = signal<DrawnElement[]>([]);
    readonly isDragOver = signal<boolean>(false);
    // Connections between nodes (directed: from aId -> bId)
    readonly connections = signal<Connection[]>([]);
    // Derived lines with coordinates for rendering
    readonly connectionLines = computed(() => {
        return this.connections()
            .map((c) => {
                const a = this.getElementById(c.aId);
                const b = this.getElementById(c.bId);
                if (!a || !b) return null;

                // Compute trimmed endpoints so the line starts/ends at shape boundaries
                const { x1, y1, x2, y2 } = this.computeTrimmedLine(a, b);
                return { id: c.id, x1, y1, x2, y2, weight: c.weight };
            })
            .filter(
                (v): v is { id: string; x1: number; y1: number; x2: number; y2: number; weight: number } => v !== null,
            );
    });
    // Currently selected element for making a connection (highlighted)
    readonly selectedElementId = signal<string | null>(null);

    private elementIdCounter = 0;
    private connectionIdCounter = 0;
    private draggedElement: DrawnElement | null = null;
    private dragOffset = { x: 0, y: 0 };
    private svgElement: SVGSVGElement | null = null;
    private isDraggingElement = false;
    private elementRef = inject(ElementRef);
    private cdr = inject(ChangeDetectorRef);
    private customDropListener: ((event: Event) => void) | null = null;

    // Dimensions consistent with SvgNodeComponent
    private readonly PLACE_RADIUS = 25;
    private readonly TRANSITION_HALF_W = 25; // RECT_WIDTH/2
    private readonly TRANSITION_HALF_H = 15; // RECT_HEIGHT/2

    ngOnInit() {
        // Listen for custom drop events
        const canvas = this.elementRef.nativeElement.querySelector('.drawing-canvas');
        if (canvas) {
            this.customDropListener = (event: Event) => {
                this.handleCustomDrop(event as CustomEvent);
            };
            canvas.addEventListener('customDrop', this.customDropListener);

            // Add mousedown listener with capture phase to intercept before child elements
            canvas.addEventListener('mousedown', this.handleCanvasMouseDown, true);
        }
    }

    ngOnDestroy() {
        // Clean up event listener
        const canvas = this.elementRef.nativeElement.querySelector('.drawing-canvas');
        if (canvas && this.customDropListener) {
            canvas.removeEventListener('customDrop', this.customDropListener);
            canvas.removeEventListener('mousedown', this.handleCanvasMouseDown, true);
        }
    }

    private handleCanvasMouseDown = (event: MouseEvent) => {
        console.log('Drawing area: Canvas mousedown, target:', event.target);

        // Only handle left clicks for dragging/moving
        if (event.button !== 0) return;

        // Check if this is the drag overlay rect (which has its own handler)
        const target = event.target as Element;
        if (target.classList.contains('drag-overlay')) {
            console.log('Drawing area: Event handled by overlay rect, skipping');
            return;
        }

        // Find if we clicked on an element wrapper
        const wrapper = target.closest('.element-wrapper');

        console.log('Drawing area: Found wrapper:', wrapper);

        if (wrapper) {
            const elementId = wrapper.getAttribute('data-element-id');
            console.log('Drawing area: Element ID:', elementId);

            if (elementId) {
                const element = this.drawnElements().find((e) => e.id === elementId);
                console.log('Drawing area: Found element:', element);

                if (element) {
                    this.onElementMouseDown(event, element);
                }
            }
        }
    };

    private handleCustomDrop(event: CustomEvent) {
        const detail = event.detail;
        if (!detail) {
            return;
        }

        const svgPoint = this.getSvgCoordinatesFromClient(detail.clientX, detail.clientY);
        if (!svgPoint) {
            return;
        }

        let newNode: DiagramNode;
        // Always create a unique ID for the drawing area, based on the source element
        const uniqueId = `drawn-${detail.elementId}-${++this.elementIdCounter}`;
        const elementLabel = detail.elementLabel || detail.elementId;
        const elementTokens = detail.elementTokens ?? 0;

        if (detail.elementType === 'place') {
            // Pass original place id as label for display
            newNode = new DiagramPlace(uniqueId, elementTokens, detail.elementId);
        } else if (detail.elementType === 'transition') {
            newNode = new DiagramTransition(uniqueId, elementLabel);
        } else {
            return;
        }

        newNode.x = svgPoint.x;
        newNode.y = svgPoint.y;

        const newElement: DrawnElement = {
            node: newNode,
            id: uniqueId,
        };

        this.drawnElements.update((elements) => [...elements, newElement]);
        console.log('Drawing area: Element added', newElement);
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
        this.isDragOver.set(true);
    }

    onDragLeave(_event: DragEvent) {
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDragOver.set(false);

        // Check for drag data from the global window object (custom drag)
        const dragData = (window as any).__dragData;
        if (dragData) {
            const svgPoint = this.getSvgCoordinates(event);
            if (!svgPoint) {
                return;
            }

            let newNode: DiagramNode;
            // Always create a unique ID for the drawing area
            const uniqueId = `drawn-${dragData.elementId || 'element'}-${++this.elementIdCounter}`;
            const elementLabel = dragData.elementLabel || dragData.elementId;
            const elementTokens = dragData.elementTokens ?? 0;

            if (dragData.elementType === 'place') {
                newNode = new DiagramPlace(uniqueId, elementTokens, dragData.elementId);
            } else if (dragData.elementType === 'transition') {
                newNode = new DiagramTransition(uniqueId, elementLabel);
            } else {
                return;
            }

            newNode.x = svgPoint.x;
            newNode.y = svgPoint.y;

            const newElement: DrawnElement = {
                node: newNode,
                id: uniqueId,
            };

            this.drawnElements.update((elements) => [...elements, newElement]);

            // Clear the global drag data
            delete (window as any).__dragData;
            return;
        }

        // Fallback to standard drag and drop (for files, etc.)
        const elementType = event.dataTransfer?.getData('element-type');
        if (!elementType) {
            return;
        }

        const svgPoint = this.getSvgCoordinates(event);
        if (!svgPoint) {
            return;
        }

        let newNode: DiagramNode;
        const uniqueId = `drawn-element-${++this.elementIdCounter}`;

        if (elementType === 'place') {
            // Without original id in this path, label equals uniqueId's suffix is unknown; keep undefined
            newNode = new DiagramPlace(uniqueId, 0);
        } else if (elementType === 'transition') {
            newNode = new DiagramTransition(uniqueId, uniqueId);
        } else {
            return;
        }

        newNode.x = svgPoint.x;
        newNode.y = svgPoint.y;

        const newElement: DrawnElement = {
            node: newNode,
            id: uniqueId,
        };

        this.drawnElements.update((elements) => [...elements, newElement]);
    }

    onElementMouseDown(event: MouseEvent, element: DrawnElement) {
        console.log('Drawing area: Mouse down on element', element.id);

        // Middle click (button 1) deletes the element and its connections
        if (event.button === 1) {
            event.stopImmediatePropagation();
            event.preventDefault();
            this.deleteElement(element);
            return;
        }

        // Only start dragging for left mouse button
        if (event.button !== 0) {
            return;
        }

        // Stop the event from reaching svg-node component's handlers
        event.stopImmediatePropagation();
        event.preventDefault();

        this.isDraggingElement = true;
        this.draggedElement = element;

        const svgPoint = this.getSvgCoordinates(event);
        if (svgPoint) {
            this.dragOffset.x = svgPoint.x - element.node.x;
            this.dragOffset.y = svgPoint.y - element.node.y;
            console.log('Drawing area: Starting drag from', element.node.x, element.node.y, 'offset:', this.dragOffset);
        }

        document.addEventListener('mousemove', this.onDocumentMouseMove, true);
        document.addEventListener('mouseup', this.onDocumentMouseUp, true);
    }

    onElementRightClick(event: MouseEvent, element: DrawnElement) {
        // Right-click selection and connection logic
        event.preventDefault();
        event.stopImmediatePropagation();

        const currentSelectedId = this.selectedElementId();
        if (!currentSelectedId) {
            // Nothing selected yet -> select this one
            this.selectedElementId.set(element.id);
            return;
        }

        if (currentSelectedId === element.id) {
            // Toggle off selection if clicking the same element
            this.selectedElementId.set(null);
            return;
        }

        const first = this.drawnElements().find((e) => e.id === currentSelectedId);
        const second = element;
        if (!first) {
            // Safety: reset selection
            this.selectedElementId.set(null);
            return;
        }

        const firstIsPlace = first.node instanceof DiagramPlace;
        const firstIsTransition = first.node instanceof DiagramTransition;
        const secondIsPlace = second.node instanceof DiagramPlace;
        const secondIsTransition = second.node instanceof DiagramTransition;

        // Only connect if exactly one is place and one is transition
        if ((firstIsPlace && secondIsTransition) || (firstIsTransition && secondIsPlace)) {
            // Remove any existing connection between these two nodes (either direction)
            this.connections.update((cs) =>
                cs.filter(
                    (c) =>
                        !((c.aId === first.id && c.bId === second.id) || (c.aId === second.id && c.bId === first.id)),
                ),
            );
            // Add new directed connection first -> second
            const newConn: Connection = {
                id: `conn-${++this.connectionIdCounter}`,
                aId: first.id,
                bId: second.id,
                weight: 1,
            };
            this.connections.update((cs) => [...cs, newConn]);
            // Clear selection after connecting
            this.selectedElementId.set(null);
        } else {
            // If types don't match, replace selection with the newly clicked element
            this.selectedElementId.set(element.id);
        }
    }

    // Increment connection weight (used by left click)
    onConnectionMouseDown(event: MouseEvent, connectionId: string) {
        // Middle click deletes connection
        if (event.button === 1) {
            event.stopImmediatePropagation();
            event.preventDefault();
            this.deleteConnection(connectionId);
            return;
        }
        // Left click decrements weight
        if (event.button !== 0) return;
        event.stopImmediatePropagation();
        event.preventDefault();
        this.decrementConnectionWeight(connectionId);
    }

    // Increment connection weight (used by right click / context menu)
    onConnectionRightClick(event: MouseEvent, connectionId: string) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.incrementConnectionWeight(connectionId);
    }

    private incrementConnectionWeight(connectionId: string) {
        this.connections.update((cs) => cs.map((c) => (c.id === connectionId ? { ...c, weight: c.weight + 1 } : c)));
    }

    private decrementConnectionWeight(connectionId: string) {
        this.connections.update((cs) =>
            cs.map((c) => {
                if (c.id !== connectionId) return c;
                const newWeight = c.weight > 1 ? c.weight - 1 : 1; // enforce minimum 1
                return { ...c, weight: newWeight };
            }),
        );
    }

    private onDocumentMouseMove = (event: MouseEvent) => {
        if (!this.draggedElement || !this.isDraggingElement) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        const svgPoint = this.getSvgCoordinates(event);
        if (svgPoint) {
            const newX = svgPoint.x - this.dragOffset.x;
            const newY = svgPoint.y - this.dragOffset.y;

            let updatedElement: DrawnElement | null = null;
            this.drawnElements.update((elements) =>
                elements.map((el) => {
                    if (el.id !== this.draggedElement?.id) return el;

                    // Recreate node instance to trigger SvgNodeComponent re-render
                    let newNode: DiagramNode;
                    if (el.node instanceof DiagramPlace) {
                        const tokens = (el.node as DiagramPlace).tokenCount ?? 0;
                        const originalLabel = (el.node as any)._label ?? el.node.displayLabel;
                        newNode = new DiagramPlace(el.node.id, tokens, originalLabel);
                    } else if (el.node instanceof DiagramTransition) {
                        const label = (el.node as DiagramTransition).displayLabel ?? el.node.id;
                        newNode = new DiagramTransition(el.node.id, label);
                    } else {
                        // Fallback: keep same reference (should not happen)
                        newNode = el.node;
                    }
                    newNode.x = newX;
                    newNode.y = newY;

                    const newEl: DrawnElement = { ...el, node: newNode };
                    updatedElement = newEl;
                    return newEl;
                }),
            );

            if (updatedElement) {
                this.draggedElement = updatedElement;
            }

            // Force Angular to detect the changes just in case
            this.cdr.detectChanges();

            console.log('Drawing area: Moving to', newX, newY);
        }
    };

    private onDocumentMouseUp = (event: MouseEvent) => {
        console.log('Drawing area: Mouse up, dragging was:', this.isDraggingElement);

        if (this.isDraggingElement) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }

        this.draggedElement = null;
        this.isDraggingElement = false;
        document.removeEventListener('mousemove', this.onDocumentMouseMove, true);
        document.removeEventListener('mouseup', this.onDocumentMouseUp, true);
    };

    private getSvgCoordinates(event: MouseEvent | DragEvent): { x: number; y: number } | null {
        return this.getSvgCoordinatesFromClient(event.clientX, event.clientY);
    }

    private getSvgCoordinatesFromClient(clientX: number, clientY: number): { x: number; y: number } | null {
        if (!this.svgElement) {
            this.svgElement = document.querySelector('.drawing-canvas');
        }

        if (!this.svgElement) {
            return null;
        }

        const point = this.svgElement.createSVGPoint();
        point.x = clientX;
        point.y = clientY;

        const ctm = this.svgElement.getScreenCTM();
        if (!ctm) {
            return null;
        }

        const svgPoint = point.matrixTransform(ctm.inverse());
        return { x: svgPoint.x, y: svgPoint.y };
    }

    // Compute trimmed line from center of a to center of b, shortened by shape radii/half-sizes
    private computeTrimmedLine(a: DrawnElement, b: DrawnElement): { x1: number; y1: number; x2: number; y2: number } {
        const ax = a.node.x;
        const ay = a.node.y;
        const bx = b.node.x;
        const by = b.node.y;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;

        const aOffset =
            a.node instanceof DiagramPlace
                ? this.PLACE_RADIUS
                : Math.min(this.TRANSITION_HALF_W, this.TRANSITION_HALF_H);
        const bOffset =
            b.node instanceof DiagramPlace
                ? this.PLACE_RADIUS
                : Math.min(this.TRANSITION_HALF_W, this.TRANSITION_HALF_H);

        const x1 = ax + ux * aOffset;
        const y1 = ay + uy * aOffset;
        const x2 = bx - ux * bOffset;
        const y2 = by - uy * bOffset;
        return { x1, y1, x2, y2 };
    }

    clearDrawing() {
        this.drawnElements.set([]);
        this.connections.set([]);
        this.selectedElementId.set(null);
        this.elementIdCounter = 0;
        this.connectionIdCounter = 0;
    }

    deleteElement(element: DrawnElement) {
        // Remove the element
        this.drawnElements.update((elements) => elements.filter((e) => e.id !== element.id));
        // Remove any connections referencing this element
        this.connections.update((cs) => cs.filter((c) => c.aId !== element.id && c.bId !== element.id));
        // Clear selection if it was this element
        if (this.selectedElementId() === element.id) {
            this.selectedElementId.set(null);
        }
    }

    private deleteConnection(connectionId: string) {
        this.connections.update((cs) => cs.filter((c) => c.id !== connectionId));
    }

    // Suppress browser context menu on the drawing canvas (right click still used for interactions)
    preventContext(event: MouseEvent) {
        event.preventDefault();
    }

    // Helpers for template
    getElementById(id: string): DrawnElement | undefined {
        return this.drawnElements().find((e) => e.id === id);
    }

    // Debug: log all elements and connections with weights
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used via template (click handler)
    logGraph() {
        const elements = this.drawnElements();
        const connections = this.connections();

        console.group('Process Net Debug Snapshot');
        if (elements.length === 0) {
            console.info('No elements drawn.');
        } else {
            console.groupCollapsed(`Elements (${elements.length})`);
            elements.forEach((el) => {
                const type =
                    el.node instanceof DiagramPlace
                        ? 'Place'
                        : el.node instanceof DiagramTransition
                          ? 'Transition'
                          : 'Unknown';
                const label = el.node.displayLabel;
                const tokens = el.node instanceof DiagramPlace ? el.node.tokenCount : undefined;
                console.log({
                    id: el.id,
                    type,
                    label,
                    tokens,
                    x: el.node.x,
                    y: el.node.y,
                });
            });
            console.groupEnd();
        }

        if (connections.length === 0) {
            console.info('No connections.');
        } else {
            console.groupCollapsed(`Connections (${connections.length})`);
            connections.forEach((c) => {
                const a = this.getElementById(c.aId);
                const b = this.getElementById(c.bId);
                console.log({
                    id: c.id,
                    from: c.aId,
                    fromLabel: a?.node.displayLabel,
                    to: c.bId,
                    toLabel: b?.node.displayLabel,
                    weight: c.weight,
                });
            });
            console.groupEnd();
        }

        // Directed adjacency representation
        const adjacency: Record<string, { to: string; weight: number }[]> = {};
        connections.forEach((c) => {
            if (!adjacency[c.aId]) adjacency[c.aId] = [];
            adjacency[c.aId].push({ to: c.bId, weight: c.weight });
        });
        console.groupCollapsed('Adjacency List (directed)');
        Object.entries(adjacency).forEach(([id, edges]) => {
            const el = this.getElementById(id);
            console.log(
                `${id} (${el?.node.displayLabel}) -> ${edges.map((e) => `${e.to} (w=${e.weight})`).join(', ')}`,
            );
        });
        console.groupEnd();
        console.groupEnd();
    }
}
