import { Component } from '@angular/core';
import { DisplayComponent } from '../../../display/display.component';
import { SvgNodeComponent } from '../../../display/svg-node/svg-node.component';

@Component({
    selector: 'app-process-net-display',
    standalone: true,
    imports: [SvgNodeComponent],
    templateUrl: './process-net-display.component.html',
    styleUrls: ['./process-net-display.component.css'],
})
export class ProcessNetDisplayComponent extends DisplayComponent {
    override processDropEvent(e: DragEvent) {
        console.log('ProcessNetDisplayComponent: Drop event received', e);
        super.processDropEvent(e);
    }

    override prevent(e: DragEvent) {
        console.log('ProcessNetDisplayComponent: Prevent event received', e);
        super.prevent(e);
    }

    // Add any additional functionality specific to process-net-display here
}
