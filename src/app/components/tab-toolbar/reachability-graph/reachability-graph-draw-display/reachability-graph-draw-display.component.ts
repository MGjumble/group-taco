import { Component, inject, signal } from '@angular/core';
import { SvgNodeComponent } from '../../../display/svg-node/svg-node.component';
import { FiringEdge, StateNode } from 'src/app/classes/reachability-graph.model';
import { PanningService } from 'src/app/services/panning.service';
import { DisplayComponent } from 'src/app/components/display/display.component';
import { SvgArcComponent } from 'src/app/components/display/svg-arc/svg-arc.component';
import { ReachabilityGraphService } from 'src/app/reachability-graph.service';

@Component({
    selector: 'app-reachability-graph-draw-display',
    standalone: true,
    imports: [SvgNodeComponent, SvgArcComponent],
    providers: [PanningService],
    templateUrl: './reachability-graph-draw-display.component.html',
    styleUrl: './reachability-graph-draw-display.component.css',
})
export class ReachabilityGraphDrawDisplayComponent extends DisplayComponent {
    readonly reachabilityGraphDiagram = this._reachabilityGraphService.reachabilityGraphSignal;
    readonly rgNodes = signal<StateNode[]>([]);
    readonly rgEdges = signal<FiringEdge[]>([]);
}
