import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-invariants-modal',
    imports: [],
    templateUrl: './invariants-modal.component.html',
    styleUrl: './invariants-modal.component.css',
})
export class InvariantsModalComponent {
    data = inject(MAT_DIALOG_DATA);
}
