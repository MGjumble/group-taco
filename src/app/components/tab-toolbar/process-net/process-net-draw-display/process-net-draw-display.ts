import { Component, signal, OnInit, OnDestroy, ElementRef, inject, ChangeDetectorRef } from '@angular/core';
import { SvgNodeComponent } from '../../../display/svg-node/svg-node.component';
import { DiagramNode } from '../../../../classes/diagram/diagram-node';
import { DiagramPlace } from '../../../../classes/diagram/diagram-place';
import { DiagramTransition } from '../../../../classes/diagram/diagram-transition';

interface DrawnElement {
    node: DiagramNode;
    id: string;
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

    private elementIdCounter = 0;
    private draggedElement: DrawnElement | null = null;
    private dragOffset = { x: 0, y: 0 };
    private svgElement: SVGSVGElement | null = null;
    private isDraggingElement = false;
    private elementRef = inject(ElementRef);
    private cdr = inject(ChangeDetectorRef);
    private customDropListener: ((event: Event) => void) | null = null;

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

    onDragLeave(event: DragEvent) {
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

    clearDrawing() {
        this.drawnElements.set([]);
        this.elementIdCounter = 0;
    }

    deleteElement(element: DrawnElement) {
        this.drawnElements.update((elements) => elements.filter((e) => e.id !== element.id));
    }
}
