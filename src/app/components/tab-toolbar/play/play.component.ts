import { Component, effect, inject, output } from '@angular/core';
import { DisplayComponent } from '../../display/display.component';
import { DisplayService } from '../../../services/display.service';
import { PlayService } from '../../../services/play.service';
import { ClearNetButtonComponent } from '../../clear-net-button/clear-net-button.component';
import { FiringTableComponent } from './firing-table/firing-table.component';
import { Tab } from '../../../classes/tabs';
import { TabStateService } from '../../../services/tab-state.service';
import { SourcePetriNetService } from '../../../services/source-petri-net.service';
import { UploadComponent } from '../../upload/upload.component';
import { Diagram } from '../../../classes/diagram/diagram';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-play',
    standalone: true,
    imports: [DisplayComponent, ClearNetButtonComponent, FiringTableComponent, UploadComponent],
    templateUrl: './play.component.html',
    styleUrl: './play.component.css',
})
export class PlayComponent {
    readonly clearAll = output<void>();

    private _sub?: Subscription;
    private _markingSub?: Subscription;

    private _tabStateService = inject(TabStateService);
    private _sourceNetService = inject(SourcePetriNetService);
    private _displayService = inject(DisplayService);
    private _playService = inject(PlayService);

    firingEntries = this._playService.firingEntries;

    constructor() {
        this.initializeTabEffect();
    }

    ngOnInit(): void {
        this._sub = this._displayService.diagram$.subscribe((diagram) => {
            if (diagram && diagram instanceof Diagram) {
                this._playService.startMarking = diagram.startMarking;

                this._markingSub = diagram.currentMarking$.subscribe((marking) => {
                    this._playService.currentMarking = marking;
                });
            }
        });
    }

    ngOnDestroy(): void {
        this._sub?.unsubscribe();
        this._markingSub?.unsubscribe();
    }

    private initializeTabEffect() {
        effect(() => {
            const currentTab = this._tabStateService.currentTab();
            if (currentTab === Tab.PLAY) {
                console.log('PlayComponent: Switched to Play tab');
                const sourceNet = this._sourceNetService.getCurrentSourceNet();

                if (sourceNet) {
                    this._displayService.display(sourceNet);
                } else {
                    this._displayService.clear();
                }
            }
        });
    }

    public onNetCleared() {
        console.log('PlayComponent: Net cleared from button');
    }

    public onClearAll() {
        this.clearAll.emit();
        this._playService.resetFiringEntries();
        console.log('PlayComponent: Clear all event emitted');
    }
}
