import { inject, Injectable, signal } from '@angular/core';

import { ToasterNotificationService } from './toaster-notification.service';
import { SourcePetriNetService } from './source-petri-net.service';
import { TabStateService } from './tab-state.service';
import { Tab } from '../classes/tabs';
import { Diagram } from '../classes/diagram/diagram';
import { DiagramTransition } from '../classes/diagram/diagram-transition';
import { FiringEntry } from '../classes/firing-entry';

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
     * Plays a firing sequence on a diagram.
     * @param diagram
     *          The diagram on which the firing sequence is played.
     * @param entry
     *          The firing entry containing the sequence to be played.
     * @param transitionTime
     *          The time period between firing each transition in milliseconds.
     */
    playSequence(diagram: Diagram, entry: FiringEntry, transitionTime: number): void {
        diagram.marking = { ...entry.startMarking };
        for (let i = 0; i < entry.labels.length; i++) {
            const label = entry.labels[i];
            const node: DiagramTransition | undefined = diagram.getTransitionByLabel(label);

            if (node) {
                setTimeout(() => {
                    this.processTransitionClick(diagram, node, true);
                    entry.endMarking = diagram.marking;
                }, transitionTime * i);
            }
        }
        setTimeout(() => {
            diagram.marking = { ...entry.startMarking };
        }, transitionTime);
    }

    /**
     * Fires a transition if it is activated, updates the diagram
     * and records the firing in the firing sequence.
     * @param diagram
     *          The diagram containing the transition.
     * @param node
     *          The transition node to be fired.
     * @param test
     *          Whether this is a test firing (does not update firing sequence).
     */
    processTransitionClick(
        diagram: Diagram,
        node: DiagramTransition,
        test: boolean = false,
        notify: boolean = true,
    ): boolean {
        if (node.isActivated()) {
            node.fire();
            diagram.updateMarking();
            this._lastMarking = diagram.marking;
            if (!test) {
                this._sourceNetService.updateEditedNet(diagram);
                this._addTransitionToFiringSequence(node.label);
            }
            return true;
        } else if (notify) {
            this._notificationService.showWarning(
                'TOASTER.HEADER.TRANSITION_NOT_ACTIVATED',
                'TOASTER.BODY.TRANSITION_NOT_ACTIVATED',
                { messageParams: { label: node.label } },
            );
        }
        return false;
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

    getLastFiringEntry(): FiringEntry {
        if (this.firingEntries().length === 0)
            this.firingEntries.update((entries) => {
                entries.push(this._getEmptyFiringEntry());
                return entries;
            });
        return this.firingEntries().at(-1)!;
    }

    /**
     * Starts a new, empty firing sequence.
     * @param diagram
     *          The diagram for which the firing sequence is started.
     */
    startNewFiringSequence(diagram: Diagram): void {
        diagram.marking = this._startMarking;
        this._lastMarking = this._startMarking;
        this.closeLastFiringEntry();
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
     * If no ID is given, the last firing entry is deleted.
     * @param id
     *          The ID of the firing entry that is to be deleted
     */
    deleteFiringEntry(id: number | undefined = undefined): void {
        if (!id) this.closeLastFiringEntry();
        this.firingEntries.update((entries) => entries.filter((entry) => entry.id !== id || this._idCounter));
    }

    addFiringEntry(
        firingSequence: string,
        transitionCount: number,
        startMarking: Record<string, number>,
        endMarking: Record<string, number>,
    ) {
        this.closeLastFiringEntry();
        const newEntry = new FiringEntry(
            this.getNewId(),
            firingSequence,
            transitionCount,
            startMarking,
            endMarking,
            true,
        );
        this.firingEntries.update((entries) => {
            entries.push(newEntry);
            return entries;
        });
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
    closeLastFiringEntry(): void {
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
        return new FiringEntry(this.getNewId(), '', 0, this._startMarking, this._startMarking, false);
    }

    /**
     * Generates a new unique ID for a firing entry.
     * @returns The new ID
     */
    getNewId(): number {
        return this._idCounter++;
    }
}
