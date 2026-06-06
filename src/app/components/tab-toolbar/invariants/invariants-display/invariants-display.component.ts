import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { DisplayComponent } from 'src/app/components/display/display.component';
import { SvgArcComponent } from 'src/app/components/display/svg-arc/svg-arc.component';
import { SvgNodeComponent } from 'src/app/components/display/svg-node/svg-node.component';
import { ToasterNotificationService } from 'src/app/services/toaster-notification.service';

@Component({
  selector: 'app-invariants-display',
  imports: [SvgNodeComponent, SvgArcComponent],
  templateUrl: './invariants-display.component.html',
  styleUrl: './invariants-display.component.css',
})
export class InvariantsDisplayComponent extends DisplayComponent {
    private _toaster = inject(ToasterNotificationService);
}
