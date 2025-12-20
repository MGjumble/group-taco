import { computed, ElementRef, Injectable, signal } from '@angular/core';
import { DisplayableGraph } from '../classes/displayable-graph.interface';

@Injectable()
export class PanningService {
    INITIAL_VIEWBOX = { minX: 200, minY: -50, width: 900, height: 450 };
    private _viewBoxValues = signal(this.INITIAL_VIEWBOX);
    private _isPanning = false;
    private _panStartPoint = { x: 0, y: 0 };

    public viewBoxAsString = computed(() => {
        const v = this._viewBoxValues();
        return `${v.minX} ${v.minY} ${v.width} ${v.height}`;
    });

    /**
     * Initiates the panning process.
     * @param event
     *          the mouse event that started the panning
     * @param diagram
     *         the current diagram being displayed
     * @param drawingArea
     *        reference to the SVG drawing area
     */
    public startPan(
        event: MouseEvent,
        diagram: DisplayableGraph | undefined,
        drawingArea: ElementRef<SVGGraphicsElement>,
    ): void {
        if (event.button !== 0 || !diagram) return;
        this._isPanning = true;
        this._panStartPoint = { x: event.clientX, y: event.clientY };
        drawingArea.nativeElement.style.cursor = 'grabbing';
    }

    /**
     * Handles the panning movement by updating the viewBox values,
     * based on mouse movement.
     * @param event
     *         the mouse event during panning
     * @param drawingArea
     *        reference to the SVG drawing area
     */
    public pan(event: MouseEvent, drawingArea: ElementRef<SVGGraphicsElement>): void {
        if (!this._isPanning) {
            return;
        }
        event.preventDefault();

        const svg = drawingArea.nativeElement;
        const clientRect = svg.getBoundingClientRect();
        const scaleX = this._viewBoxValues().width / clientRect.width;
        const scaleY = this._viewBoxValues().height / clientRect.height;

        const dx = (event.clientX - this._panStartPoint.x) * scaleX;
        const dy = (event.clientY - this._panStartPoint.y) * scaleY;

        this._viewBoxValues.update((v) => ({
            ...v,
            minX: v.minX - dx,
            minY: v.minY - dy,
        }));
        this._panStartPoint = { x: event.clientX, y: event.clientY };
    }

    /**
     * Ends the panning process.
     * @param drawingArea
     *       reference to the SVG drawing area
     */
    public endPan(drawingArea: ElementRef<SVGGraphicsElement>): void {
        this._isPanning = false;
        drawingArea.nativeElement.style.cursor = 'default';
    }
}
