import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import { filter } from 'rxjs';

import { Diagram } from '../../../classes/diagram/diagram';
import { InvariantEntry, InvariantValidity } from '../../../classes/invariant-entry';
import { Tab } from '../../../classes/tabs';
import { DisplayService } from '../../../services/display.service';
import { ModeService } from '../../../services/mode.service';
import { InvariantsValidationService } from '../../../services/invariants-validation.service';
import { InvariantsEntryService } from '../../../services/invariants-entry.service';
import { InvariantsModalComponent } from './invariants-modal/invariants-modal.component';
import { InvariantsConfirmDialogComponent } from './invariants-confirm-dialog/invariants-confirm-dialog.component';
import {
    DrawToolbarAction,
    DrawToolbarComponent,
    DrawToolbarInstruction,
} from '../../draw-toolbar/draw-toolbar.component';
import { InvariantsDisplayComponent } from './invariants-display/invariants-display.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-invariants',
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
        MatTooltipModule,
        TranslateModule,
        InvariantsDisplayComponent,
        DrawToolbarComponent,
    ],
    templateUrl: './invariants.component.html',
    styleUrl: './invariants.component.css',
})
export class InvariantsComponent {
    private _displayService = inject(DisplayService);
    private _dialog = inject(MatDialog);
    private _matIconRegistry = inject(MatIconRegistry);
    private _domSanitizer = inject(DomSanitizer);
    protected modeService = inject(ModeService);
    protected entryService = inject(InvariantsEntryService);
    protected validationService = inject(InvariantsValidationService);
    protected InvariantValidity = InvariantValidity;

    protected readonly diagram = toSignal(this._displayService.diagram$, { initialValue: undefined });

    protected inputEntries = this.validationService.inputEntries;
    protected isExamMode = computed(() => this.modeService.isExamMode(Tab.INVARIANTS));

    constructor() {
        effect(() => {
            const diagram = this.diagram();

            if (diagram instanceof Diagram) this.validationService.initialize(diagram);
            else {
                this.entryService.deleteAllEntries();
                this.entryService.overrideShowTransitionBalances.set(null);
            }
        });

        this._matIconRegistry.addSvgIcon(
            'empty-taco',
            this._domSanitizer.bypassSecurityTrustResourceUrl('assets/images/empty-taco.svg'),
        );
        this._matIconRegistry.addSvgIcon(
            'cropped-taco',
            this._domSanitizer.bypassSecurityTrustResourceUrl('assets/images/cropped-taco.svg'),
        );
    }

    protected readonly toolbarActions = computed<DrawToolbarAction[]>(() => {
        const diagram = this.diagram();
        return [
            {
                icon: 'add',
                tooltip: 'INVARIANTS.NEW_ENTRY',
                color: 'primary',
                isActive: diagram !== undefined,
                action: () => this._onNewEntry(),
            },
            {
                icon: 'checklist',
                tooltip: 'INVARIANTS.VALIDATE_ENTRIES',
                color: 'primary',
                isActive: diagram !== undefined,
                action: () => this._onValidateEntries(),
            },
            {
                icon: 'remove_red_eye',
                tooltip: 'INVARIANTS.SHOW_INVARIANTS',
                color: 'primary',
                isActive: diagram !== undefined,
                action: () => this._onShowComputedInvariants(),
            },
        ];
    });

    protected readonly toolbarInstructions = computed<DrawToolbarInstruction[]>(() => {
        return [
            { label: 'INVARIANTS.GOAL', text: 'INVARIANTS.GOAL_TEXT' },
            { label: 'INVARIANTS.TRANSITION_BALANCES', text: 'INVARIANTS.TRANSITION_BALANCES_TEXT' },
            { label: 'INVARIANTS.DIFFICULTY_LEVELS', text: 'INVARIANTS.DIFFICULTY_LEVELS_TEXT' },
        ];
    });

    /**
     * Deletes an invariant entry by its ID.
     * @param id - The ID of the invariant entry to delete.
     */
    protected onDeleteEntry(id: number): void {
        this.entryService.deleteEntry(id);
    }

    /**
     * Deletes all invariant entries.
     */
    protected onDeleteAllEntries(): void {
        this.entryService.deleteAllEntries();
    }

    /**
     * Activates a specific invariant entry by its ID.
     * @param id - The ID of the invariant entry to activate.
     */
    protected onActivateEntry(id: number): void {
        this.entryService.activateEntry(id);
    }

    /**
     * Creates a new empty invariant entry.
     */
    private _onNewEntry(): void {
        if (this.diagram()) this.entryService.addEmptyEntry();
    }

    /**
     * Validates all invariant entries.
     */
    private _onValidateEntries(): void {
        if (this.diagram()) this.validationService.validateAllEntries();
    }

    /**
     * Opens a confirmation dialog to compute and display the minimal invariants of the Petri net.
     * If confirmed, calls the method to compute and show the results.
     */
    private _onShowComputedInvariants(): void {
        const dialogRef = this._dialog.open(InvariantsConfirmDialogComponent);

        dialogRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this._showComputedInvariants();
            }
        });
    }

    /**
     * Computes the minimal invariants for the current Petri net and displays them in a modal dialog.
     * Converts each invariant vector to its notation (e.g., "p1 + p2 - p3") for user-friendly display.
     */
    private _showComputedInvariants(): void {
        const diagram = this.diagram();
        if (!diagram || !(diagram instanceof Diagram)) return;
        const vectors = this.validationService.computedMinInvariants();
        const notations = [];
        for (const vector of vectors) {
            const notation = InvariantEntry.toNotation(vector, diagram.getPlaceLabels());
            notations.push(notation);
        }
        this._dialog.open(InvariantsModalComponent, {
            data: { notations: notations },
        });
    }
}
