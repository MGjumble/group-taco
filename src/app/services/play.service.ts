import { inject, Injectable, signal } from '@angular/core';
import { FiringEntry } from '../classes/firing-entry';
import { ToasterNotificationService } from './toaster-notification.service';
import { DiagramTransition } from '../classes/diagram/diagram-transition';
import { Diagram } from '../classes/diagram/diagram';
import { SourcePetriNetService } from './source-petri-net.service';
import { TabStateService } from './tab-state.service';
import { Tab } from '../classes/tabs';

@Injectable({ providedIn: 'root' })
export class PlayService {
    private _notificationService = inject(ToasterNotificationService);
    private _sourceNetService = inject(SourcePetriNetService);
    private _tabStateService = inject(TabStateService);

    private _startMarking: Record<string, number> = {};
    private _currentMarking = signal<Record<string, number>>(this._startMarking);
    private _lastMarking: Record<string, number> | undefined = undefined;
    private _idCounter = 0;

    firingEntries = signal<FiringEntry[]>([]);

    set startMarking(marking: Record<string, number>) {
        this._startMarking = marking;
    }

    set currentMarking(marking: Record<string, number>) {
        this._currentMarking.set(marking);
    }

    /**
     * Recovers the marking of the diagram from the last marking stored in the service.
     * @param diagram
     *          The diagram to recover the marking for.
     */
    recoverLastMarking(diagram: Diagram): void {
        if (this._lastMarking) diagram.marking = this._lastMarking;
    }

    /**
     * Clears all firing entries in the firing sequence table and deletes the last marking.
     */
    resetFiringEntries(): void {
        this.firingEntries.set([]);
        this._lastMarking = undefined;
    }

    /**
     * Fires a transition if it is activated, updates the diagram
     * and records the firing in the firing sequence.
     * @param diagram
     *          The diagram containing the transition.
     * @param node
     *          The transition node to be fired.
     */
    processTransitionClick(diagram: Diagram, node: DiagramTransition): void {
        if (node.isActivated()) {
            node.fire();
            diagram.updateMarking();
            this._lastMarking = diagram.marking;
            this._sourceNetService.updateEditedNet(diagram);
            this._addTransitionToFiringSequence(node.label);
        } else
            this._notificationService.showWarning(
                'TOASTER.HEADER.TRANSITION_NOT_ACTIVATED',
                'TOASTER.BODY.TRANSITION_NOT_ACTIVATED',
                { messageParams: { label: node.label } },
            );
    }

    /**
     * Checks if a transition can be fired in the current tab and state.
     * @param node
     *          The transition to be checked
     * @returns true if the transition can be fired
     */
    canBeFired(node: DiagramTransition): boolean {
        return (
            (this._tabStateService.currentTab() === Tab.PLAY ||
                this._tabStateService.currentTab() === Tab.REACHABILITY_GRAPH) &&
            node.isActivated()
        );
    }

    /**
     * Starts a new, empty firing sequence.
     * @param diagram
     *          The diagram for which the firing sequence is started.
     */
    startNewFiringSequence(diagram: Diagram): void {
        diagram.resetMarking();
        this._lastMarking = diagram.marking;
        this._closeLastFiringEntry();
        this.firingEntries.update((entries) => {
            entries.push(this._getEmptyFiringEntry());
            return entries;
        });
        setTimeout(() => {
            document.getElementById('firing-sequence-input')?.focus();
        }, 0);
    }

    /**
     * Deletes a firing entry from the firing sequence table.
     * @param id
     *          The ID of the firing entry that is to be deleted
     */
    deleteFiringEntry(id: number): void {
        this.firingEntries.update((entries) => entries.filter((entry) => entry.id !== id));
    }

    /**
     * Updates the current firing entry when a transition is fired.
     * If no entry exists, creates a new one.
     * @param label
     *          The label of the fired transition.
     */
    private _addTransitionToFiringSequence(label: string): void {
        this.firingEntries.update((entries) => {
            let lastEntry = entries[entries.length - 1];
            if (!lastEntry) {
                lastEntry = this._getEmptyFiringEntry();
                entries.push(lastEntry);
            }
            lastEntry = this._updateFiringEntry(lastEntry, label);
            return entries;
        });
    }

    /**
     * Appends the label of a fired transition to a firing sequence
     * and updates transition count and end marking accordingly.
     * @param entry
     *          The entry to be updated.
     * @param label
     *          The label of the fired transition.
     * @returns The updated firing entry.
     */
    private _updateFiringEntry(entry: FiringEntry, label: string): FiringEntry {
        entry.firingSequence += ` ${label}`;
        entry.transitionCount += 1;
        entry.endMarking = this._currentMarking();
        return entry;
    }

    /**
     * Closes the last firing entry in the firing table, preventing further updates to it.
     */
    private _closeLastFiringEntry(): void {
        this.firingEntries.update((entries) => {
            const lastEntry = entries[entries.length - 1];
            if (lastEntry && !lastEntry.isClosed) lastEntry.isClosed = true;
            return entries;
        });
    }

    /**
     * Creates a new empty firing entry with start values.
     * @returns A firing entry with an empty sequence
     */
    private _getEmptyFiringEntry(): FiringEntry {
        return new FiringEntry(this._getNewId(), '', 0, this._startMarking, this._startMarking, false);
    }

    /**
     * Generates a new unique ID for a firing entry.
     * @returns The new ID
     */
    private _getNewId(): number {
        return this._idCounter++;
    }
}
