import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { PlayService } from '../../../../services/play.service';
import { FiringEntry } from '../../../../classes/firing-entry';
import { DisplayService } from '../../../../services/display.service';
import { filter, take } from 'rxjs';
import { Diagram } from '../../../../classes/diagram/diagram';

@Component({
    selector: 'app-firing-table',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconButton, MatIcon],
    templateUrl: './firing-table.component.html',
    styleUrl: './firing-table.component.css',
})
export class FiringTableComponent {
    private _playService = inject(PlayService);
    private _displayService = inject(DisplayService);

    @Input() firingEntries: FiringEntry[] = [];

    onDeleteEntry(id: number): void {
        this._playService.deleteFiringEntry(id);
    }

    onDeleteAllEntries(): void {
        this._playService.resetFiringEntries();
        this._displayService.diagram$
            .pipe(
                take(1),
                filter((diagram) => !!diagram && diagram instanceof Diagram),
            )
            .subscribe((diagram) => {
                diagram.resetMarking();
            });
    }
}
