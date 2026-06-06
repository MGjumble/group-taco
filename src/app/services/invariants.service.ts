import { inject, Injectable, signal } from "@angular/core";
import { ModeService } from "./mode.service";
import { ToasterNotificationService } from "./toaster-notification.service";
import { SourcePetriNetService } from "./source-petri-net.service";
import { InvariantEntry } from "../classes/invariant-entry";
import { InvariantsValidationService } from "./invariants-validation.service";

@Injectable({ providedIn: 'root' })
export class InvariantsService {
    private _modeService = inject(ModeService);
    private _notificationService = inject(ToasterNotificationService);
    private _sourceNetService = inject(SourcePetriNetService);
    private _validationService = inject(InvariantsValidationService);

    private _currentEntry: InvariantEntry | undefined;
    private _currentText = '2p1 * -p3, p4;5p6 -3 p2';
    private _idCounter = 0;

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

    /**
     * Clears all firing entries in the firing sequence table.
     */
    clearInputEntries(): void {
        this.inputEntries.set([]);
        this.currentEntry = undefined;
        this.currentText = '';
    }

    resetInvariants() {
        console.log("Resetting invariants");
        this.inputEntries.set([]);
        this._validationService.resetComputedInvariants();
    }
}