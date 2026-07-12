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

    private _idCounter = 0;
    private _isExamMode = computed(() => this._modeService.isExamMode(Tab.INVARIANTS));

    activeEntry = signal<InvariantEntry | null>(null);
    overrideShowTransitionBalances = signal<boolean | null>(null);
    showTransitionBalances = computed(() => this.overrideShowTransitionBalances() ?? !this._isExamMode());

    /**
     * Returns a computed signal indicating whether the entry with the given ID is currently active.
     * @param id - The ID of the invariant entry to check.
     * @returns A computed signal that is true if the entry with the given ID is active, false otherwise.
     */
    isEntryActive = (id: number) => computed(() => this.activeEntry()?.id === id);

    /**
     * Processes a place click event by updating the current invariant entry's weight for the place.
     * In exam mode, validity is reset to undefined. In learn mode, the entry is validated.
     * @param place - The diagram place that was clicked.
     * @param weightDiff - The difference to apply to the place's weight (+1 or -1).
     */
    processPlaceClicked(place: DiagramPlace, weightDiff: number): void {
        if (!place) return;
        let entry = this.getActiveEntry();
        this.updateEntry(entry, place, weightDiff);
        if (this._isExamMode()) entry.setValidity(undefined);
        else this._validationService.validateEntry(entry);
    }


    /**
     * Deletes an invariant entry by its ID from the input entries list.
     * If the deleted entry was the current entry or the list is empty afterward, resets the active entry.
     * @param id - The ID of the invariant entry to delete.
     */
    deleteEntry(id: number): void {
        this._validationService.inputEntries.update((entries) => entries.filter((entry) => entry.id !== id));
        if (id === this.activeEntry()?.id || this._validationService.inputEntries().length === 0) {
            this.activeEntry.set(null);
        }
    }

    /**
     * Deletes all invariant entries and resets the active entry.
     */
    deleteAllEntries(): void {
        this._validationService.inputEntries.set([]);
        this.activeEntry.set(null);
    }

    /**
     * Activates the invariant entry with the specified ID.
     * @param id - The ID of the invariant entry to activate.
     */
    activateEntry(id: number): void {
        const entry = this._validationService.inputEntries().find((entry) => entry.id === id) || null;
        this.activeEntry.set(entry);
    }

    /**
     * Gets the active invariant entry, creating a new empty entry if none exists.
     * @returns The active invariant entry (or a new one if none was active).
     */
    getActiveEntry(): InvariantEntry {
        let activeEntry = this.activeEntry() || this.addEmptyEntry();
        this.activeEntry.set(activeEntry);
        return activeEntry;
    }

    /**
     * Creates a new empty invariant entry with default weights (0) for all places.
     * The new entry is added to the input entries list and set as the active entry.
     * @returns The newly created invariant entry.
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
        this.activeEntry.set(newEntry);
        this._validationService.inputEntries.update((entries) => [...entries, newEntry]);
        return newEntry;
    }

    /**
     * Generates and returns a new unique ID for an invariant entry.
     * @returns The new unique ID.
     */
    getNewId(): number {
        return ++this._idCounter;
    }

    /**
     * Updates an invariant entry by applying a weight change to a specific place.
     * Triggers a re-render of the entries list by updating the signal.
     * @param entry - The invariant entry to update.
     * @param place - The diagram place whose weight should be updated.
     * @param weightDiff - The difference to apply to the place's weight (+1 or -1).
     */
    updateEntry(entry: InvariantEntry, place: DiagramPlace, weightDiff: number): void {
        if (!entry || !place) return;
        entry.selectPlace(place.displayLabel, weightDiff);
        this._validationService.inputEntries.update((entries) => [...entries]);
    }
}
