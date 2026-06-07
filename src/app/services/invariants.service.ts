import { computed, inject, Injectable, signal } from "@angular/core";
import { ModeService } from "./mode.service";
import { ToasterNotificationService } from "./toaster-notification.service";
import { SourcePetriNetService } from "./source-petri-net.service";
import { InvariantEntry, InvariantValidity } from "../classes/invariant-entry";
import { InvariantsValidationService } from "./invariants-validation.service";
import { Diagram } from "../classes/diagram/diagram";
import { Tab } from "../classes/tabs";
import { DiagramPlace } from "../classes/diagram/diagram-place";

@Injectable({ providedIn: 'root' })
export class InvariantsService {
    private _modeService = inject(ModeService);
    private _notificationService = inject(ToasterNotificationService);
    private _sourceNetService = inject(SourcePetriNetService);
    private _validationService = inject(InvariantsValidationService);

    private _currentEntry: InvariantEntry | undefined;
    private _currentText = '2p1 + 2* -p3, p4;5p6 -3 p2';
    private _idCounter = 0;
    private _isExamMode = computed(() => this._modeService.isExamMode(Tab.INVARIANTS));

    inputEntries = signal<InvariantEntry[]>([]);

    /**
     * Returns the current firing sequence as a string.
     * @returns The current firing sequence.
     */
    get currentEntry(): InvariantEntry | undefined {
        return this._currentEntry;
    }

    /**
     * Sets the currently active firing entry. This is used to avoid unnecessary
     * validation, e.g. when spaces are added or removed.
     * @param entry - The firing entry to set as current.
     */
    set currentEntry(entry: InvariantEntry | undefined) {
        this._currentEntry = entry;
    }

    /**
     * Returns the current firing sequence as a string.
     * @returns The current firing sequence.
     */
    get currentText(): string {
        return this._currentText;
    }

    /**
     * Sets the current firing sequence.
     * @param sequence - The firing sequence to set.
     */
    set currentText(text: string) {
        this._currentText = text;
    }

    processPlaceClicked(diagram: Diagram, place: DiagramPlace, isRightClick: boolean): void {
        const entry: InvariantEntry =
            this._currentEntry && !this._currentEntry.isClosed
                ? this._currentEntry
                : this.getEmptyEntry();
        this._currentEntry = entry;
        this.updateEntry(entry, place.displayLabel, isRightClick);
        if (this._isExamMode()) entry.setValidity(undefined, null);
        else this._validationService.validateEntry(diagram, entry);
    }

    /**
     * Clears all firing entries in the firing sequence table.
     */
    clearInputEntries(): void {
        this.inputEntries.set([]);
        this.currentEntry = undefined;
        this.currentText = '';
    }

    resetInvariants() {
        this.clearInputEntries();
        this._validationService.resetComputedInvariants();
    }
    
    /**
     * Starts a new, empty entry.
     * @param diagram - The diagram for which the entry is started.
     */
    startNewEntry(diagram: Diagram): void {
        diagram.resetMarking();
        if (this._currentEntry) this.closeCurrentFiringEntry();
        this.getEmptyEntry();
        setTimeout(() => {
            document.getElementById('invariant-input')?.focus();
        }, 0);
        this._currentText = '';
    }

    /**
     * Deletes a firing entry from the firing sequence table.
     * @param id - The ID of the firing entry that is to be deleted
     * @param diagram - The current Petri net diagram.
     */
    deleteEntry(id: number): void {
        this.inputEntries.update((entries) => entries.filter((entry) => entry.id !== id));
        if (id === this._currentEntry?.id || this.inputEntries().length === 0) {
            this._currentEntry = undefined;
        }
    }

    /**
     * Adds a predefined firing entry to the firing table.
     * @param text - The text.
     */
    addValidEntry(
        text: string,
    ) {
        if (this._currentEntry) this.closeCurrentFiringEntry();
        const newEntry = new InvariantEntry(this.getNewId(), text, true, InvariantValidity.VALID_MINIMAL);
        this.inputEntries.update((entries) => {
            entries.push(newEntry);
            return entries;
        });
    }

    /**
     * Appends the label of a fired transition to the current firing sequence.
     * Updates the transition count and optionally the end marking accordingly.
     * @param label
     *          The label of the fired transition.
     */
    updateEntry(entry: InvariantEntry,label: string, positive: boolean): void {
        if (entry.text.length === 0) entry.text = label;
        //TODO: If the new input place is already present in the text, they should be summed up
        else entry.text = entry.text.replace(/[\s,;]+$/, '') + (positive ? ' + ' : ' - ') + label;
        this._currentText = entry.text;
    }

    /**
     * Closes the current firing entry in the firing table, preventing further updates to it.
     */
    closeCurrentFiringEntry(): void {
        if (this._currentEntry)
            this.inputEntries.update((entries) => {
                this._currentEntry!.isClosed = true;
                return entries;
            });
        this._currentEntry = undefined;
    }

    /**
     * Creates a new empty firing entry with start values.
     * @returns A firing entry with an empty sequence.
     */
    private getEmptyEntry(): InvariantEntry {
        const newEntry = new InvariantEntry(this.getNewId(), '', false, undefined);
        this._currentEntry = newEntry;
        this.inputEntries.update((entries) => {
            entries.push(newEntry);
            return entries;
        });
        return newEntry;
    }

    /**
     * Generates a new unique ID for a firing entry.
     * @returns The new ID
     */
    getNewId(): number {
        return this._idCounter++;
    }
}