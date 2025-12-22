import { inject, Injectable, signal } from '@angular/core';
import { FiringEntry } from '../classes/firing-entry';
import { ToasterNotificationService } from './toaster-notification.service';
import { DiagramTransition } from '../classes/diagram/diagram-transition';
import { Diagram } from '../classes/diagram/diagram';
import { SourcePetriNetService } from './source-petri-net.service';
import { TabStateService } from './tab-state.service';
import { Tab } from '../classes/tabs';
import { ReachabilityGraphService } from '../reachability-graph.service';

@Injectable({ providedIn: 'root' })
export class PlayService {
    private _notificationService = inject(ToasterNotificationService);
    private _sourceNetService = inject(SourcePetriNetService);
    private _tabStateService = inject(TabStateService);
    private _reachabilityGraphService = inject(ReachabilityGraphService);

    private _startMarking: Record<string, number> = {};
    private _currentMarking = signal<Record<string, number>>(this._startMarking);
    firingEntries = signal<FiringEntry[]>([]);

    set startMarking(marking: Record<string, number>) {
        this._startMarking = marking;
    }

    set currentMarking(marking: Record<string, number>) {
        this._currentMarking.set(marking);
    }

    /**
     * Clears all firing entries in the firing sequence table.
     */
    resetFiringEntries(): void {
        this.firingEntries.set([]);
    }

    /**
     * Fires a transition if it is activated, updates the diagram
     * and records the firing in the firing sequence.
     * Also updates the ReachabilityGraph via the ReachabilityGraphService.
     * @param diagram The diagram containing the transition.
     * @param node The transition node to be fired.
     */
    processTransitionClick(diagram: Diagram, node: DiagramTransition): void {
        if (node.isActivated()) {
            node.fire();
            diagram.updateMarking();
            this._sourceNetService.updateEditedNet(diagram);
            this._addTransitionToFiringSequence(node.label);
        } else
            this._notificationService.showWarning(
                'TOASTER.HEADER.TRANSITION_NOT_ACTIVATED',
                'TOASTER.BODY.TRANSITION_NOT_ACTIVATED',
                { messageParams: { label: node.label } },
            );
    }

    isTransitionAndActivated(node: DiagramTransition): boolean {
        return this._tabStateService.currentTab() === Tab.PLAY && node.isActivated();
    }

    /**
     * Updates the current firing entry when a transition is fired.
     * If no entry exists, creates a new one.
     * @param label The label of the fired transition.
     */
    private _addTransitionToFiringSequence(label: string): void {
        this.firingEntries.update((entries) => {
            let lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                lastEntry = this._updateFiringEntry(lastEntry, label);
                this._reachabilityGraphService.convertFiringEntryLabelToReachabilityGraphID(lastEntry);
                return [...entries];
            }
            const newEntry: FiringEntry = {
                id: 0,
                firingSequence: label,
                transitionCount: 1,
                startMarking: this._startMarking,
                endMarking: this._currentMarking(),
            };
            this._reachabilityGraphService.convertFiringEntryLabelToReachabilityGraphID(newEntry);
            return [...entries, newEntry];
        });
    }

    /**
     * Appends the label of a fired transition to a firing sequence
     * and updates transition count and end marking accordingly.
     * @param entry The entry to be updated.
     * @param label The label of the fired transition.
     * @returns The updated firing entry.
     */
    private _updateFiringEntry(entry: FiringEntry, label: string): FiringEntry {
        entry.firingSequence += ` ${label}`;
        entry.transitionCount += 1;
        entry.endMarking = this._currentMarking();
        return entry;
    }
}
