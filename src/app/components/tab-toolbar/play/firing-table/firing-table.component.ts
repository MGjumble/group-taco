import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { filter, Subscription, take } from 'rxjs';

import { DisplayService } from '../../../../services/display.service';
import { PlayService } from '../../../../services/play.service';
import { PlayValidationService } from '../../../../services/play-validation.service';
import { Diagram } from '../../../../classes/diagram/diagram';
import { FiringEntry } from '../../../../classes/firing-entry';

@Component({
    selector: 'app-firing-table',
    standalone: true,
    imports: [CommonModule, FormsModule, MatIconButton, MatIcon],
    templateUrl: './firing-table.component.html',
    styleUrl: './firing-table.component.css',
})
export class FiringTableComponent implements OnInit, OnDestroy {
    private _sub?: Subscription;

    private _displayService = inject(DisplayService);
    private _playService = inject(PlayService);
    private _playValidationService = inject(PlayValidationService);

    private readonly TRANSITION_TIME_CONSTANT: number = 1000;
    private _lastFiringSequence: string = '';
    private _diagram: Diagram | undefined;
    @Input() firingEntries: FiringEntry[] = [];


    ngOnInit(): void {
        this._sub = this._displayService.diagram$.subscribe((diagram) => {
            this._diagram = diagram instanceof Diagram ? diagram : undefined;
        });
    }

    ngOnDestroy(): void {
        this._sub?.unsubscribe();
    }

    onKeyUp(entry: FiringEntry, event: KeyboardEvent): void {
        if (entry.firingSequence.trim() === this._lastFiringSequence.trim()) return;
        this._lastFiringSequence = entry.firingSequence;
        if (event.key === 'Enter') this.onNewEntry();
        // TODO: Make validation dependent on current mode (e.g., exam mode)
        else this._playValidationService.validateInput(this._diagram, entry, event);
    }

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

    onNewEntry(): void {
        if (this._diagram) this._playService.startNewFiringSequence(this._diagram);
    }

    onPlaySequence(entry: FiringEntry): void {
        if (this._diagram) this._playService.playSequence(this._diagram, entry, this.TRANSITION_TIME_CONSTANT);
    }

    incrementStartMarking(entry: FiringEntry, placeId: string): void {
        const newMarking = { ...entry.startMarking };
        newMarking[placeId] = (newMarking[placeId] || 0) + 1;
        entry.startMarking = newMarking;
    }

    decrementStartMarking(entry: FiringEntry, placeId: string): void {
        if ((entry.startMarking[placeId] || 0) > 0) {
            const newMarking = { ...entry.startMarking };
            newMarking[placeId] = (newMarking[placeId] || 0) - 1;
            entry.startMarking = newMarking;
        }
    }

    incrementEndMarking(entry: FiringEntry, placeId: string): void {
        const newMarking = { ...entry.endMarking };
        newMarking[placeId] = (newMarking[placeId] || 0) + 1;
        entry.endMarking = newMarking;
    }

    decrementEndMarking(entry: FiringEntry, placeId: string): void {
        if ((entry.endMarking[placeId] || 0) > 0) {
            const newMarking = { ...entry.endMarking };
            newMarking[placeId] = (newMarking[placeId] || 0) - 1;
            entry.endMarking = newMarking;
        }
    }

    protected isDisabled(tokens: number) {
        return tokens <= 0;
    }
}
