import { inject, Injectable, signal } from '@angular/core';
import { FiringEntry } from '../classes/firing-entry';
import { ToasterNotificationService } from './toaster-notification.service';
import { DiagramTransition } from '../classes/diagram/diagram-transition';

@Injectable({ providedIn: 'root' })
export class PlayService {
    /**
     * To be implemented:
     * - get endMarking
     * - reset firingEntries when net is cleared
     * */
    firingEntries = signal<FiringEntry[]>([{ id: 1, firingSequence: '', transitionCount: 0, endMarking: '' }]);
    private _notificationService = inject(ToasterNotificationService);

    processTransitionClick(node: DiagramTransition): void {
        if (node.isActivated()) {
            node.fire();
            this.addTransitionToFiringSequence(node.label);
        }
        else
            this._notificationService.showWarning(
                'Transition not activated',
                `The transition ${node.label} is not activated and cannot be fired.`,
            );
        }

    addTransitionToFiringSequence(label: string): void {
        this.firingEntries.update((entries) => {
            const lastEntry = entries[entries.length - 1];
            lastEntry.firingSequence += label;
            lastEntry.transitionCount += 1;
            return [...entries];
        });
    }
}
