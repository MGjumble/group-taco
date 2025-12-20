import { Component, inject } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { DrawComponent } from '../tab-toolbar/draw/draw.component';
import { PlayComponent } from '../tab-toolbar/play/play.component';
import { ReachabilityGraphComponent } from '../tab-toolbar/reachability-graph/reachability-graph.component';
import { ProcessNetComponent } from '../tab-toolbar/process-net/process-net.component';
import { Tab } from '../../classes/tabs';
import { TabStateService } from '../../services/tab-state.service';
import { SaveComponent } from '../tab-toolbar/save/save.component';
import { UploadComponent } from '../tab-toolbar/upload/upload.component';
import { ClearNetButtonComponent } from '../clear-net-button/clear-net-button.component';
import { ModeToggleComponent } from '../tab-toolbar/mode-toggle/mode-toggle.component';
import { LayoutButtonComponent } from '../layout-button/layout-button.component';

@Component({
    selector: 'app-main-tab',
    standalone: true,
    imports: [
        MatTabsModule,
        MatIconModule,
        DrawComponent,
        PlayComponent,
        ReachabilityGraphComponent,
        ProcessNetComponent,
        SaveComponent,
        UploadComponent,
        ClearNetButtonComponent,
        ModeToggleComponent,
        LayoutButtonComponent,
    ],
    templateUrl: './main-tab.component.html',
    styleUrl: './main-tab.component.css',
})
export class MainTabComponent {
    private _tabStateService: TabStateService = inject(TabStateService);
    private readonly _tabs: Tab[] = [Tab.DRAW, Tab.PLAY, Tab.REACHABILITY_GRAPH, Tab.PROCESS_NET];

    selectedIndex = Tab.DRAW; // Select which tab to show by default

    onTabChange(event: MatTabChangeEvent) {
        this._tabStateService.switchTo(this._tabs[event.index]);
    }
}
