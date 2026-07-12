import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-invariants-modal',
    imports: [TranslateModule],
    templateUrl: './invariants-modal.component.html',
    styleUrl: './invariants-modal.component.css',
})
export class InvariantsModalComponent {
    protected data = inject(MAT_DIALOG_DATA);
}
