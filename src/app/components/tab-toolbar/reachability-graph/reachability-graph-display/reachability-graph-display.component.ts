import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DisplayComponent } from '../../../display/display.component';
import { SvgNodeComponent } from '../../../display/svg-node/svg-node.component';
import { SvgArcComponent } from '../../../display/svg-arc/svg-arc.component';
import { SHAPE } from '../../../../classes/diagram/diagram-node';
import { DisplayableNode } from '../../../../classes/displayable-graph.interface';
import { PanningService } from 'src/app/services/panning.service';
import { ReachabilityGraphService } from 'src/app/reachability-graph.service';
import { DisplayService } from 'src/app/services/display.service';
import { Subscription } from 'rxjs';

//Inherited from process-net-display // display-component

@Component({
    selector: 'app-reachability-graph-display',
    standalone: true,
    imports: [SvgNodeComponent, SvgArcComponent],
    providers: [PanningService],
    templateUrl: './reachability-graph-display.component.html',
    styleUrl: './reachability-graph-display.component.css',
})
export class ReachabilityGraphDisplayComponent extends DisplayComponent {
}
