import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { config, filter, Subscription, take, tap } from 'rxjs';
import { Diagram } from '../../../../classes/diagram/diagram';
import { InvariantEntry, InvariantValidity } from '../../../../classes/invariant-entry';
import { Tab } from '../../../../classes/tabs';
import { ToastList } from '../../../../classes/toast';
import { DisplayService } from '../../../../services/display.service';
import { ModeService } from '../../../../services/mode.service';
import { InvariantsValidationService } from '../../../../services/invariants-validation.service';
import { InvariantsEntryService } from '../../../../services/invariants-entry.service';
import { ToasterNotificationService } from '../../../../services/toaster-notification.service';
import { MatDialog } from '@angular/material/dialog';
import { InvariantsModalComponent } from '../invariants-modal/invariants-modal.component';
import { ConfirmDialogComponent } from 'src/app/components/confirm-dialog/confirm-dialog.component';
import { InvariantsConfirmDialogComponent } from '../invariants-confirm-dialog/invariants-confirm-dialog.component';

@Component({
    selector: 'app-invariants-table',
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconButton,
        MatIcon,
        MatSliderModule,
        MatExpansionModule,
        TranslateModule,
        MatTooltip,
    ],
    templateUrl: './invariants-table.component.html',
    styleUrl: './invariants-table.component.css',
})
export class InvariantsTableComponent implements OnInit, OnDestroy {
    private _sub?: Subscription;

    modeService = inject(ModeService);
    private _notificationService = inject(ToasterNotificationService);
    private _displayService = inject(DisplayService);
    private _dialog = inject(MatDialog);
    entryService = inject(InvariantsEntryService);
    validationService = inject(InvariantsValidationService);
    InvariantValidity = InvariantValidity;

    inputEntries = this.validationService.inputEntries;
    diagram: Diagram | undefined;
    isExamMode = computed(() => this.modeService.isExamMode(Tab.INVARIANTS));

    ngOnInit(): void {
        this._sub = this._displayService.diagram$
            .pipe(
                tap((_) => {
                    this.diagram = undefined;
                }),
                filter((diagram): diagram is Diagram => diagram instanceof Diagram),
            )
            .subscribe((diagram: Diagram) => {
                this.diagram = diagram;
            });
    }

    ngOnDestroy(): void {
        this._sub?.unsubscribe();
    }

    /**
     * Deletes a firing entry by its ID.
     * @param id - The ID of the entry to delete.
     */
    onDeleteEntry(id: number): void {
        this.entryService.deleteEntry(id);
    }

    /**
     * Deletes all firing entries and resets the diagram marking.
     */
    onDeleteAllEntries(): void {
        this.entryService.clearInputEntries();
        this._displayService.diagram$
            .pipe(
                take(1),
                filter((diagram) => !!diagram && diagram instanceof Diagram),
            )
            .subscribe((diagram) => {
                diagram.resetMarking();
            });
    }

    /**
     * Creates a new firing entry.
     */
    onNewEntry(): void {
        if (this.diagram) this.entryService.addEmptyEntry();
    }

    onActivateEntry(id: number): void {
        this.entryService.activateEntry(id);
    }

    /**
     * Validates all firing sequences and shows a notification with the results.
     */
    async onValidateEntries(): Promise<void> {
        if (!this.diagram) return;
        const invalidEntries: ToastList[] = [];
        for (const entry of this.inputEntries()) {
            await this.validationService.validateEntry(entry, true);
            if (entry.validity !== InvariantValidity.VALID_MINIMAL) invalidEntries.push({ message: entry.notation });
        }
        if (invalidEntries.length === 0)
            this._notificationService.showSuccess(
                'TOASTER.HEADER.VALIDATION_COMPLETED',
                'TOASTER.BODY.ALL_MIN_INVARIANTS_FOUND',
            );
        else
            this._notificationService.showWarning(
                'TOASTER.HEADER.VALIDATION_COMPLETED',
                'TOASTER.BODY.INVALID_INVARIANT_ENTRIES',
                { duration: 8000, list: invalidEntries },
            );
    }

    /**
     * Finds firing sequences based on the current Petri net and user-defined limits.
     */
    onShowInvariants(): void {
        if (!this.diagram) return;
        const vectors = this.validationService.computedMinInvariants();
        const notations = [];
        for (let vector of vectors) {
            const notation = InvariantEntry.toNotation(vector, this.diagram.getPlaceLabels());
            notations.push(notation);
        }
        this._dialog.open(InvariantsModalComponent, {
            data: { notations: notations },
        });
    }

    /**
     * Checks if buttons should be disabled (e.g., when no Petri net is loaded or a sequence is playing).
     * @returns true if buttons should be disabled, false otherwise.
     */
    isButtonDisabled(): boolean {
        return !this.diagram;
    }

    /**
     * Adds a new firing entry when the "Add" button is clicked.
     * @param panel - The expansion panel containing the button.
     * @param event - The click event.
     */
    onAddButton(panel: MatExpansionPanel, event: Event): void {
        event.stopPropagation();
        if (!panel.expanded) panel.open();
        this.onNewEntry();
    }

    /**
     * Validates all sequences when the "Validate" button is clicked.
     * @param panel - The expansion panel containing the button.
     * @param event - The click event.
     */
    onValidateButton(panel: MatExpansionPanel, event: Event): void {
        event.stopPropagation();
        if (!panel.expanded) panel.open();
        this.onValidateEntries().catch(console.error);
    }

    /**
     * Finds sequences when the "Find" button is clicked.
     * @param panel - The expansion panel containing the button.
     * @param event - The click event.
     */
    onShowInvariantsButton(event: Event): void {
        event.stopPropagation();
        const dialogRef = this._dialog.open(InvariantsConfirmDialogComponent);

        dialogRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.onShowInvariants();
            }
        });
    }
}
