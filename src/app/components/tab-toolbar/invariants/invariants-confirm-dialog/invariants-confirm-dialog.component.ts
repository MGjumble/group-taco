import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-invariants-confirm-dialog',
    imports: [MatDialogModule, MatButtonModule, TranslateModule],
    templateUrl: './invariants-confirm-dialog.component.html',
    styleUrl: './invariants-confirm-dialog.component.css',
})
export class InvariantsConfirmDialogComponent {
    constructor(private dialogRef: MatDialogRef<InvariantsConfirmDialogComponent>) {}

    protected confirm(): void {
        this.dialogRef.close(true);
    }

    protected cancel(): void {
        this.dialogRef.close(false);
    }
}
