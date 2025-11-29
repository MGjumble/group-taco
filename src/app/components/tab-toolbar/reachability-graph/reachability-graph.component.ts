import { Component, effect, inject } from '@angular/core';
// import { DisplayComponent } from '../../display/display.component';
import { ReachabilityGraphDisplayComponent } from './reachability-graph-display/reachability-graph-display.component';
import { ReachabilityGraphDrawDisplayComponent } from './reachability-graph-draw-display/reachability-graph-draw-display.component';
import { ClearNetButtonComponent } from '../../clear-net-button/clear-net-button.component';
import { TabStateService } from '../../../services/tab-state.service';
import { Tab } from '../../../classes/tabs';
import { UploadComponent } from '../upload/upload.component';

@Component({
    selector: 'app-reachability-graph',
    standalone: true,
    imports: [ReachabilityGraphDisplayComponent, ReachabilityGraphDrawDisplayComponent, ClearNetButtonComponent, UploadComponent],
    templateUrl: './reachability-graph.component.html',
    styleUrl: './reachability-graph.component.css',
})
export class ReachabilityGraphComponent {
    private _tabStateService = inject(TabStateService);

    constructor() {
        this.initializeTabEffect();
    }

    private initializeTabEffect() {
        effect(() => {
            const currentTab = this._tabStateService.currentTab();
            if (currentTab === Tab.REACHABILITY_GRAPH) {
                //TODO: call some method that calculates the reachability graph automatically when switching to the tab
                // by using a reachabilityGraphService or something similar
                console.log('ReachabilityGraphComponent: Switched to Reachability Graph tab');
            }
        });
    }
}
