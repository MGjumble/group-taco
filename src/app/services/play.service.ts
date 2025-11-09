import { Injectable, signal } from '@angular/core';
import { FiringEntry } from '../classes/firing-entry';

@Injectable({ providedIn: 'root' })
export class PlayService {
    /**
     * To be implemented:
     * - get endMarking
     * - reset firingEntries when net is cleared 
     * */ 
    firingEntries = signal<FiringEntry[]>([{ id: 1, firingSequence: '', transitionCount: 0, endMarking: '' }]);

    processTransitionClick(label: string, isActivated: boolean): void {
        if (isActivated) this.addTransitionToFiringSequence(label);
        // Replace the console.log with appropriate handling (toast) in future
        else console.log('Transition with label', label, 'is not activated.');
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
