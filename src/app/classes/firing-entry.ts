/**
 * Representing a transition firing sequence in the petri net.
 */
export class FiringEntry {
    constructor(
        public id: number,
        public firingSequence: string,
        public transitionCount: number,
        public startMarking: Record<string, number>,
        public endMarking: Record<string, number>,
        public isClosed: boolean,
    ) {}

    get formattedStartMarking(): string {
        return this.formatMarking(this.startMarking);
    }

    get formattedEndMarking(): string {
        return this.formatMarking(this.endMarking);
    }
    /**
     * Formats a marking into a string representation.
     * @param marking
     *          The marking to be formatted.
     * @returns The formatted marking string.
     */
    private formatMarking(marking: Record<string, number>): string {
        return Object.entries(marking)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    }
}
