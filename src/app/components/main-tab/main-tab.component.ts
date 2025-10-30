import { Component, inject, output } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { DrawingStateService } from '../../services/drawing.state.service';
import { DrawComponent } from '../tab-toolbar/draw/draw.component';
import { PlayComponent } from '../tab-toolbar/play/play.component';
import { ReachabilityGraphComponent } from '../tab-toolbar/reachability-graph/reachability-graph.component';
import { ProcessNetComponent } from '../tab-toolbar/process-net/process-net.component';
import { Tab } from '../../classes/tabs';

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
    ],
    templateUrl: './main-tab.component.html',
    styleUrl: './main-tab.component.css',
})
export class MainTabComponent {
    readonly clearAll = output<void>();
    readonly fileContent = output<string>();

    private drawingStateService: DrawingStateService = inject(DrawingStateService);

    selectedIndex = Tab.PROCESS_NET; // Start with Process Net tab selected

    onTabChange(event: MatTabChangeEvent) {
        this.drawingStateService.set(event.index === Tab.PROCESS_NET);
    }

    onClearAll() {
        this.clearAll.emit();
        console.log('MainTabComponent: Clear all event emitted');
    }

    onFileContent(content: string) {
        this.fileContent.emit(content);
        console.log('MainTabComponent: File content event emitted');
    }
}
