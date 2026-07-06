import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { TranslateModule } from '@ngx-translate/core';
import { filter, Subscription, take, tap } from 'rxjs';
import { Diagram } from '../../../classes/diagram/diagram';
import { InvariantEntry, InvariantValidity } from '../../../classes/invariant-entry';
import { Tab } from '../../../classes/tabs';
import { DisplayService } from '../../../services/display.service';
import { ModeService } from '../../../services/mode.service';
import { InvariantsValidationService } from '../../../services/invariants-validation.service';
import { InvariantsEntryService } from '../../../services/invariants-entry.service';
import { MatDialog } from '@angular/material/dialog';
import { InvariantsModalComponent } from './invariants-modal/invariants-modal.component';
import { InvariantsConfirmDialogComponent } from './invariants-confirm-dialog/invariants-confirm-dialog.component';
import { DrawToolbarAction, DrawToolbarComponent, DrawToolbarInstruction, DrawToolbarToggle } from '../../draw-toolbar/draw-toolbar.component';
import { InvariantsDisplayComponent } from './invariants-display/invariants-display.component';
import { DomSanitizer } from '@angular/platform-browser';

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
        TranslateModule,
        InvariantsDisplayComponent,
        DrawToolbarComponent,
    ],
    templateUrl: './invariants.component.html',
    styleUrl: './invariants.component.css',
})

export class InvariantsComponent implements OnInit, OnDestroy {
    private _sub?: Subscription;

    modeService = inject(ModeService);
    private _displayService = inject(DisplayService);
    private _dialog = inject(MatDialog);
    private _matIconRegistry = inject(MatIconRegistry);
    private _domSanitizer = inject(DomSanitizer);
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
                    this.entryService.clearInputEntries();
                }),
                filter((diagram): diagram is Diagram => diagram instanceof Diagram),
            )
            .subscribe((diagram: Diagram) => {
                this.diagram = diagram;
                this.validationService.initialize(diagram);
            });
    }

    ngOnDestroy(): void {
        this._sub?.unsubscribe();
    }

    constructor() {
        this._matIconRegistry.addSvgIcon(
            'empty-taco',
            this._domSanitizer.bypassSecurityTrustResourceUrl('assets/images/empty-taco.svg'),
        );
        this._matIconRegistry.addSvgIcon(
            'cropped-taco',
            this._domSanitizer.bypassSecurityTrustResourceUrl('assets/images/cropped-taco.svg'),
        );
    }
    
    protected readonly toolbarActions = computed<DrawToolbarAction[]>(() => [
        {
            icon: 'add',
            tooltip: 'INVARIANTS.NEW_ENTRY',
            color: 'primary',
            isActive: this.diagram !== undefined,
            action: () => this.onNewEntry(),
        },
        {
            icon: 'checklist',
            tooltip: 'INVARIANTS.VALIDATE_ENTRIES',
            color: 'primary',
            isActive: this.inputEntries().length > 0,
            action: () => this.onValidateEntries(),
        },
        {
            icon: 'remove_red_eye',
            tooltip: 'INVARIANTS.SHOW_INVARIANTS',
            color: 'primary',
            isActive: this.diagram !== undefined,
            action: () => this.onShowComputedInvariants(),
        },
    ]);

    protected readonly toolbarInstructions = computed<DrawToolbarInstruction[]>(() => {
        return [
            { label: 'INVARIANTS.GOAL', text: 'INVARIANTS.GOAL_TEXT' },
            { label: 'INVARIANTS.TRANSITION_BALANCES', text: 'INVARIANTS.TRANSITION_BALANCES_TEXT' },
            { label: 'INVARIANTS.DIFFICULTY_LEVELS', text: 'INVARIANTS.DIFFICULTY_LEVELS_TEXT' },
        ];
    });

    protected readonly toolbarToggle = computed<DrawToolbarToggle | null>(() => ({
        label: 'INVARIANTS.SHOW_TRANSITION_BALANCES',
        tooltip: '',
        checked: this.entryService.showTransitionBalances(),
        onChange: (checked: boolean) => this.entryService.showTransitionBalances.set(checked)
    }));

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
    onValidateEntries(): void {
        if (!this.diagram) return;
        this.validationService.validateAllEntries();
    }

    /**
     * Finds sequences when the "Find" button is clicked.
     */
    onShowComputedInvariants(): void {
        const dialogRef = this._dialog.open(InvariantsConfirmDialogComponent);

        dialogRef.afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.showComputedInvariants();
            }
        });
    }

    /**
     * Finds firing sequences based on the current Petri net and user-defined limits.
     */
    showComputedInvariants(): void {
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
}
