import { Component, inject, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { Invariant } from 'src/app/classes/invariant';
import { DisplayService } from 'src/app/services/display.service';
import { InvariantsService } from 'src/app/services/invariants.service';
import { ModeService } from 'src/app/services/mode.service';
import { ToasterNotificationService } from 'src/app/services/toaster-notification.service';

@Component({
  selector: 'app-invariants-table',
  imports: [],
  templateUrl: './invariants-table.component.html',
  styleUrl: './invariants-table.component.css',
})
export class InvariantsTableComponent {
    private _sub?: Subscription;

    modeService = inject(ModeService);
    private _notificationService = inject(ToasterNotificationService);
    private _displayService = inject(DisplayService);
    private _invariantsService = inject(InvariantsService);

    @Input() calculatedInvariants: Invariant[] = [];
}
