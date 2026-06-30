/**
 * Represents an error in an input sequence, including the translatable error type (e.g., 'PLAY.NOT_ACTIVATED'),
 * the invalid label, and the sequence context (visited labels until the error occured).
 */
export interface EntryError {
    type: string;
    invalidLabel: string;
    visitedLabels: string[];
}
