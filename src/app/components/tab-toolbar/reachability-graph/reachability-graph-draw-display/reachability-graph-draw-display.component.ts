import { Component,computed, ElementRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SvgNodeComponent } from '../../../display/svg-node/svg-node.component';
import { DiagramNode } from '../../../../classes/diagram/diagram-node';
import { DiagramPlace } from '../../../../classes/diagram/diagram-place';
import { DiagramTransition } from '../../../../classes/diagram/diagram-transition';
import { DisplayService } from '../../../../services/display.service';

@Component({
  selector: 'app-reachability-graph-draw-display',
  standalone: true,
  imports: [SvgNodeComponent],
  templateUrl: './reachability-graph-draw-display.component.html',
  styleUrl: './reachability-graph-draw-display.component.css'
})
export class ReachabilityGraphDrawDisplayComponent {

}
