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

    currentEntry = signal<InvariantEntry | undefined>(undefined);
    private _idCounter = 0;
    private _isExamMode = computed(() => this._modeService.isExamMode(Tab.INVARIANTS));

    inputEntries = signal<InvariantEntry[]>([]);

    isEntryActive = (id: number) => computed(() => this.currentEntry()?.id === id);

    getCurrentEntry(): InvariantEntry {
        return this.currentEntry() || this.addEmptyEntry();
    }

    processPlaceClicked(place: DiagramPlace, isRightClick: boolean): void {
        let entry = this.getCurrentEntry();
        const weightDiff = isRightClick ? 1 : -1;
        this.updateEntry(entry, place, weightDiff);
        if (this._isExamMode()) entry.setValidity(undefined, null);
        this.currentEntry.set(entry);
        //TODO: Validate invariant in learning mode
    }

    /**
     * Clears all entries in the table.
     */
    clearInputEntries(): void {
        this.inputEntries.set([]);
        this.currentEntry.set(undefined);
    }

    /**
     * Deletes a firing entry from the firing sequence table.
     * @param id - The ID of the firing entry that is to be deleted
     * @param diagram - The current Petri net diagram.
     */
    deleteEntry(id: number): void {
        this.inputEntries.update((entries) => entries.filter((entry) => entry.id !== id));
        if (id === this.currentEntry()?.id || this.inputEntries().length === 0) {
            this.currentEntry.set(undefined);
        }
    }

    updateEntry(entry: InvariantEntry, place: DiagramPlace, weightDiff: number): void {
        entry.selectPlace(place.displayLabel, weightDiff);
    }

    activateEntry(id: number): void {
        console.log(this.inputEntries());
        const entry = this.inputEntries().find((entry) => entry.id === id);
        console.log(entry, entry?.notation);
        this.currentEntry.set(entry);
    }

    /**
     * Creates a new empty entry with start values.
     * @returns An entry with an empty sequence.
     */
    addEmptyEntry(): InvariantEntry {
        const newEntry = new InvariantEntry(this.getNewId(), '', undefined, "", this._validationService.allPlaceLabels, this._validationService.allTransitionLabels, this._validationService.placeFlows);
        this.currentEntry.set(newEntry);
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
        return ++this._idCounter;
    }
}