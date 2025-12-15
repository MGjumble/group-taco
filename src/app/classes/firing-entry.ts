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
        public isClosed: boolean
    ) {}

    get formattedStartMarking(): string {
        return this.formatMarking(this.startMarking);
    }

    set formattedStartMarking(formattedMarking: string) {
        this.startMarking = this.parseMarking(formattedMarking);
    }

    get formattedEndMarking(): string {
        return this.formatMarking(this.endMarking);
    }

    set formattedEndMarking(formattedMarking: string) {
        this.endMarking = this.parseMarking(formattedMarking);
    }

    private formatMarking(marking: Record<string, number>): string {
        return Object.entries(marking)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    }

    private parseMarking(formattedMarking: string): Record<string, number> {
        const marking: Record<string, number> = {};
        const entries = formattedMarking.split(',').map((entry) => entry.trim());
        for (const entry of entries) {
            const [key, value] = entry.split(':').map((part) => part.trim());
            if (key && value && !isNaN(Number(value))) {
                marking[key] = Number(value);
            }
        }
        return marking;
    }
}
