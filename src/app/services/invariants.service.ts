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

    get currentEntry(): InvariantEntry | undefined {
        return this._currentEntry;
    }

    set currentEntry(entry: InvariantEntry | undefined) {
        this._currentEntry = entry;
    }

    get currentText(): string {
        return this._currentText;
    }

    set currentText(text: string) {
        this._currentText = text;
    }

    processPlaceClicked(place: DiagramPlace, isRightClick: boolean): void {
        const entry: InvariantEntry =
            this._currentEntry && !this._currentEntry.isClosed
                ? this._currentEntry
                : this.getEmptyEntry();
        this._currentEntry = entry;
        const weightDiff = isRightClick ? 1 : -1;
        this.updateEntry(entry, place.displayLabel, weightDiff);
        if (this._isExamMode()) entry.setValidity(undefined, null);
        else this._validationService.validateEntry(entry);
    }

    /**
     * Clears all entries in the table.
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
        if (this._currentEntry) this.closeCurrentEntry();
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
        if (this._currentEntry) this.closeCurrentEntry();
        const newEntry = new InvariantEntry(this.getNewId(), text, true, InvariantValidity.VALID_MINIMAL, this._validationService.allowedLabels);
        this.inputEntries.update((entries) => {
            entries.push(newEntry);
            return entries;
        });
    }

    updateEntry(entry: InvariantEntry, label: string, weightDiff: number): void {
        entry.changePlaceWeight(label, weightDiff);
        this._currentText = entry.text;
    }

    /**
     * Closes the current entry in the table, preventing further updates to it.
     */
    closeCurrentEntry(): void {
        if (this._currentEntry)
            this.inputEntries.update((entries) => {
                this._currentEntry!.isClosed = true;
                return entries;
            });
        this._currentEntry = undefined;
    }

    /**
     * Creates a new empty entry with start values.
     * @returns An entry with an empty sequence.
     */
    private getEmptyEntry(): InvariantEntry {
        const newEntry = new InvariantEntry(this.getNewId(), '', false, undefined, this._validationService.allowedLabels);
        this._currentEntry = newEntry;
        this.inputEntries.update((entries) => {
            entries.push(newEntry);
            return entries;
        });
        return newEntry;
    }

    /**
     * Generates a new unique ID for a entry.
     * @returns The new ID
     */
    getNewId(): number {
        return this._idCounter++;
    }
}