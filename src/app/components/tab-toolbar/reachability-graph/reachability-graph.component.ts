import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { ReachabilityGraphDisplayComponent } from './reachability-graph-display/reachability-graph-display.component';
import { ReachabilityGraphDrawDisplayComponent } from './reachability-graph-draw-display/reachability-graph-draw-display.component';
import { TabStateService } from '../../../services/tab-state.service';
import { Tab } from '../../../classes/tabs';
import { ReachabilityGraphService } from 'src/app/reachability-graph.service';

@Component({
    selector: 'app-reachability-graph',
    standalone: true,
    imports: [ReachabilityGraphDisplayComponent, ReachabilityGraphDrawDisplayComponent],

    templateUrl: './reachability-graph.component.html',
    styleUrl: './reachability-graph.component.css',
})
export class ReachabilityGraphComponent {
    private _tabStateService = inject(TabStateService);
    private _reachabilityGraphService = inject(ReachabilityGraphService);

    constructor() {
        this.initializeTabEffect();
    }

    //anstatt OnInit?
    private initializeTabEffect() {
        effect(() => {
            const currentTab = this._tabStateService.currentTab();
            if (currentTab === Tab.REACHABILITY_GRAPH) {
                this._reachabilityGraphService.initializeReachabilityGraphFirstStateNode();
            }
        });
    }

    ngOnInit(): void {
        const currentTab = this._tabStateService.currentTab();
        if (currentTab === Tab.REACHABILITY_GRAPH) {
            this._reachabilityGraphService.initializeReachabilityGraphFirstStateNode();
        }
    }
}
