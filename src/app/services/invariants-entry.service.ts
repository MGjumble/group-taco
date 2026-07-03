import { computed, inject, Injectable, signal } from '@angular/core';
import { ModeService } from './mode.service';
import { InvariantEntry } from '../classes/invariant-entry';
import { InvariantsValidationService } from './invariants-validation.service';
import { Tab } from '../classes/tabs';
import { DiagramPlace } from '../classes/diagram/diagram-place';

@Injectable({ providedIn: 'root' })
export class InvariantsEntryService {
    private _modeService = inject(ModeService);
    private _validationService = inject(InvariantsValidationService);

    showTransitionWeights = signal<boolean>(true);
    currentEntry = signal<InvariantEntry | undefined>(undefined);

    private _idCounter = 0;
    private _isExamMode = computed(() => this._modeService.isExamMode(Tab.INVARIANTS));

    isEntryActive = (id: number) => computed(() => this.currentEntry()?.id === id);

    getCurrentEntry(): InvariantEntry {
        let currentEntry = this.currentEntry() || this.addEmptyEntry();
        this.currentEntry.set(currentEntry);
        return currentEntry;
    }

    processPlaceClicked(place: DiagramPlace, weightDiff: number): void {
        let entry = this.getCurrentEntry();
        this.updateEntry(entry, place, weightDiff);
        if (this._isExamMode()) entry.setValidity(undefined);
        else this._validationService.validateEntry(entry);
    }

    /**
     * Clears all entries in the table.
     */
    clearInputEntries(): void {
        this._validationService.inputEntries.set([]);
        this.currentEntry.set(undefined);
    }

    /**
     * Deletes a firing entry from the firing sequence table.
     * @param id - The ID of the firing entry that is to be deleted
     * @param diagram - The current Petri net diagram.
     */
    deleteEntry(id: number): void {
        this._validationService.inputEntries.update((entries) => entries.filter((entry) => entry.id !== id));
        if (id === this.currentEntry()?.id || this._validationService.inputEntries().length === 0) {
            this.currentEntry.set(undefined);
        }
    }

    updateEntry(entry: InvariantEntry, place: DiagramPlace, weightDiff: number): void {
        entry.selectPlace(place.displayLabel, weightDiff);
        this._validationService.inputEntries.update(entries => [...entries]);
    }

    activateEntry(id: number): void {
        const entry = this._validationService.inputEntries().find((entry) => entry.id === id);
        console.log(entry, entry?.notation);
        this.currentEntry.set(entry);
    }

    /**
     * Creates a new empty entry with start values.
     * @returns An entry with an empty sequence.
     */
    addEmptyEntry(): InvariantEntry {
        const newEntry = new InvariantEntry(
            this.getNewId(),
            '',
            undefined,
            undefined,
            undefined,
            this._validationService.allPlaceLabels,
            this._validationService.allTransitionLabels,
            this._validationService.placeFlows,
        );
        this.currentEntry.set(newEntry);
        this._validationService.inputEntries.update((entries) => [...entries, newEntry]);
        return newEntry;
    }

    /**
     * Generates a new unique ID for a entry.
     * @returns The new ID
     */
    getNewId(): number {
        return ++this._idCounter;
    }
}
