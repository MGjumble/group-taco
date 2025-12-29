import { Component, computed, ElementRef, inject, Input, OnDestroy, OnInit, Signal, signal } from '@angular/core';
import { SvgNodeComponent } from '../../../display/svg-node/svg-node.component';
import { ReachabilityGraph, StateNode, FiringEdge } from 'src/app/classes/reachability-graph.model';
import { PanningService } from 'src/app/services/panning.service';
import { DisplayComponent } from 'src/app/components/display/display.component';
import { SvgArcComponent } from 'src/app/components/display/svg-arc/svg-arc.component';
import { ReachabilityGraphService } from 'src/app/reachability-graph.service';
import { Subscription } from 'rxjs';
import { TabStateService } from 'src/app/services/tab-state.service';
import { Tab } from 'src/app/classes/tabs';

@Component({
    selector: 'app-reachability-graph-draw-display',
    standalone: true,
    imports: [SvgNodeComponent, SvgArcComponent],
    providers: [PanningService],
    templateUrl: './reachability-graph-draw-display.component.html',
    styleUrl: './reachability-graph-draw-display.component.css',
})
export class ReachabilityGraphDrawDisplayComponent extends DisplayComponent {
    private _reachabilityGraphService = inject(ReachabilityGraphService);
    readonly reachabilityGraphdiagram = this._reachabilityGraphService.reachabilityGraphSignal;
    readonly rgNodes = signal<StateNode[]>([]);
    readonly rgEdges = signal<FiringEdge[]>([]);
    // override readonly isReachabilityGraphEnabled = computed(() => this._rgTabStateService.currentTab() === Tab.REACHABILITY_GRAPH);
    // private _rgTabStateService = inject(TabStateService);
}
