import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
// import { DisplayComponent } from '../../display/display.component';
import { ReachabilityGraphDisplayComponent } from './reachability-graph-display/reachability-graph-display.component';
import { ReachabilityGraphDrawDisplayComponent } from './reachability-graph-draw-display/reachability-graph-draw-display.component';
import { TabStateService } from '../../../services/tab-state.service';
import { Tab } from '../../../classes/tabs';
import { ReachabilityGraphService } from 'src/app/reachability-graph.service';
import { PlayService } from 'src/app/services/play.service';
import { DisplayService } from 'src/app/services/display.service';

@Component({
    selector: 'app-reachability-graph',
    standalone: true,
    imports: [ReachabilityGraphDisplayComponent, ReachabilityGraphDrawDisplayComponent],

    templateUrl: './reachability-graph.component.html',
    styleUrl: './reachability-graph.component.css',
})
export class ReachabilityGraphComponent implements OnInit, OnDestroy {
    private _tabStateService = inject(TabStateService);
    private _reachabilityGraphService = inject(ReachabilityGraphService);
    private _displayService = inject(DisplayService);
    private _playService = inject(PlayService);

    constructor() {
        this.initializeTabEffect();
    }

    //anstatt OnInit?
    private initializeTabEffect() {
        effect(() => {
            const currentTab = this._tabStateService.currentTab();
            if (currentTab === Tab.REACHABILITY_GRAPH) {
                this._reachabilityGraphService.initializeReachabilityGraphFirstStateNode;
                // console.log('ReachabilityGraphComponent: Switched to Reachability Graph tab');
            }
        });
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {}
    //         this._sub = this._displayService.diagram$
    //             .pipe(
    //                 filter((diagram) => !!diagram && diagram instanceof Diagram),
    //                 tap((diagram: Diagram) => {
    //                     this._playService.resetFiringEntries();
    //                     this._playService.startMarking = diagram.startMarking;
    //                 }),
    //                 switchMap((diagram: Diagram) => diagram.currentMarking$),
    //             )
    //             .subscribe((marking) => {
    //                 this._playService.currentMarking = marking;
    //             });
    //     }

    //     ngOnDestroy(): void {
    //         this._sub?.unsubscribe();
    //     }
}
