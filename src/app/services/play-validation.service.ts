import { inject, Injectable } from '@angular/core';

import { ToasterNotificationService } from './toaster-notification.service';
import { PlayService } from './play.service';
import { Diagram } from '../classes/diagram/diagram';
import { FiringEntry } from '../classes/firing-entry';

@Injectable({ providedIn: 'root' })
export class PlayValidationService {
    // TODO:
    // - use notification service to provide user feedback
    // - validate transition count/ marking input
    private _notificationService = inject(ToasterNotificationService);
    private _playService = inject(PlayService);

    private readonly _MAX_SEQUENCES: number = 10;
    private readonly _MAX_TRANSITIONS_DEFAULT: number = 100;

    findFiringSequences(
        diagram: Diagram,
        demandedStartMarking: Record<string, number>,
        demandedEndMarking: Record<string, number>,
        demandedTransitionCount?: number,
    ): void {
        const self: PlayValidationService = this;
        let sequenceCount: number = 0;

        function isValidTransitionCount(currentLength: number): boolean {
            if (demandedTransitionCount !== undefined) return currentLength === demandedTransitionCount;
            else return currentLength <= self._MAX_TRANSITIONS_DEFAULT;
        }

        function depthFirstSearch(
            currentMarking: Record<string, number>,
            firedTransitions: string[],
            visited: Set<string>,
        ) {
            if (sequenceCount >= self._MAX_SEQUENCES) return;

            if (isEqualMarking(currentMarking, demandedEndMarking) && isValidTransitionCount(firedTransitions.length)) {
                self._playService.addFiringEntry(
                    firedTransitions.join(' '),
                    firedTransitions.length,
                    demandedStartMarking,
                    demandedEndMarking,
                    true
                );
                sequenceCount++;
            }

            if (firedTransitions.length >= (demandedTransitionCount ?? self._MAX_SEQUENCES)) return;

            // Prevent cycle formation
            const markingKey = JSON.stringify(currentMarking);
            if (visited.has(markingKey)) return;
            const newVisited = new Set(visited);
            newVisited.add(markingKey);

            for (const transition of diagram.transitions) {
                // Save old marking for the case of the current transition not firing
                const oldMarking = { ...diagram.marking };
                const successfullyFired = self._playService.processTransitionClick(diagram, transition, false, false, false);
                if (successfullyFired) {
                    depthFirstSearch(
                        { ...diagram.marking },
                        [...firedTransitions, transition.label || transition.id],
                        newVisited,
                    );
                    diagram.marking = oldMarking;
                }
            }
        }

        depthFirstSearch(demandedStartMarking, [], new Set());

        function isEqualMarking(a: Record<string, number>, b: Record<string, number>): boolean {
            const aKeys = Object.keys(a);
            const bKeys = Object.keys(b);
            if (aKeys.length !== bKeys.length) return false;
            return aKeys.every((key) => key in b && a[key] === b[key]);
        }
    }

    /**
     * Validates a firing entry input based on the diagram and the keyboard event.
     * @param diagram
     *          The diagram on which the firing entry is to be validated.
     * @param entry
     *          The firing entry to be validated.
     * @param event
     *          The keyboard event that triggered the validation.
     * @returns
     */
    validateInput(diagram: Diagram | undefined, entry: FiringEntry, event: KeyboardEvent): void {
        if (!diagram || event.key === ' ' || event.key === ',' || event.key === ';') return;
        if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete') {
            let isValid: boolean = false;
            entry.transitionCount = entry.labels.length;
            const possibleTransitions: string[] = diagram.transitions.map((t) => t.label || t.id) || [];
            const hasOnlyValidTransitions: boolean = this._hasOnlyValidTransitions(possibleTransitions, entry.labels);
            // TODO: provide user feedback if invalid transitions are present
            if (hasOnlyValidTransitions) isValid = this._isValidFiringEntry(diagram, entry);
            entry.isValid = isValid;
        }
    }

    /**
     * Checks if all labels correspond to (the start of) existing transitions in the diagram.
     * @param possibleTransitions
     *          The transitions present in the diagram.
     * @param labels
     *          The labels to be validated.
     * @returns true if all labels correnspond to (the start of) existing transitions, false otherwise.
     */
    private _hasOnlyValidTransitions(possibleTransitions: string[], labels: string[]): boolean {
        if (labels.length === 0) return true;
        if (possibleTransitions.length === 0 && labels.length > 0) return false;
        return labels.every(
            (label) =>
                possibleTransitions.includes(label) ||
                possibleTransitions.some((transition) => transition.startsWith(label)),
        );
    }

    /**
     * Checks whether a firing entry is valid for a given diagram.
     * @param diagram
     *          The diagram on which the firing entry is to be validated.
     * @param entry
     *          The firing entry to be validated.
     * @returns true if the firing entry is valid, false otherwise.
     */
    private _isValidFiringEntry(diagram: Diagram, entry: FiringEntry): boolean {
        const endMarking: string = entry.formattedEndMarking;
        this._playService.playSequence(diagram, entry, 0, false);
        return endMarking === entry.formattedEndMarking;
    }
}
