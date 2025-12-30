import { Component } from '@angular/core';
import { DisplayComponent } from '../../../display/display.component';
import { SvgNodeComponent } from '../../../display/svg-node/svg-node.component';
import { SvgArcComponent } from '../../../display/svg-arc/svg-arc.component';

//Inherited from process-net-display // display-component

@Component({
    selector: 'app-reachability-graph-display',
    standalone: true,
    imports: [SvgNodeComponent, SvgArcComponent],
    templateUrl: './reachability-graph-display.component.html',
    styleUrl: './reachability-graph-display.component.css',
})
export class ReachabilityGraphDisplayComponent extends DisplayComponent {}
