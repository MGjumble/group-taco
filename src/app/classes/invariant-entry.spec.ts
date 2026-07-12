import { InvariantEntry, InvariantValidity } from './invariant-entry';

describe('InvariantEntry', () => {
    const mockPlaces = ['p1', 'p2', 'p3'];
    const mockTransitions = ['t1', 't2'];
    const mockPlaceFlows = new Map<string, Map<string, number>>([
        [
            'p1',
            new Map([
                ['t1', 1],
                ['t2', -1],
            ]),
        ],
        [
            'p2',
            new Map([
                ['t1', -1],
                ['t2', 1],
            ]),
        ],
        [
            'p3',
            new Map([
                ['t1', 0],
                ['t2', 0],
            ]),
        ],
    ]);

    let entry: InvariantEntry;

    beforeEach(() => {
        entry = new InvariantEntry(
            1,
            '', // notation
            undefined,
            undefined,
            undefined,
            mockPlaces,
            mockTransitions,
            mockPlaceFlows,
        );
    });

    // ---- Constructor ----
    describe('constructor', () => {
        it('should initialize placeWeights with 0 for each place', () => {
            const weights = entry.placeWeights();
            expect(weights.get('p1')).toBe(0);
            expect(weights.get('p2')).toBe(0);
            expect(weights.get('p3')).toBe(0);
        });

        it('should initialize transitionBalances with 0 for each transition', () => {
            const weights = entry.transitionBalances();
            expect(weights.get('t1')).toBe(0);
            expect(weights.get('t2')).toBe(0);
        });
    });

    // ---- Getter ----
    describe('getters', () => {
        it('labels should return all place labels', () => {
            expect(entry.labels).toEqual(mockPlaces);
        });

        it('vector should return all place weights as array', () => {
            expect(entry.vector).toEqual([0, 0, 0]);
        });
    });

    // ---- setValidity ----
    describe('setValidity', () => {
        it('should set validity to VALID_MINIMAL', () => {
            entry.setValidity(InvariantValidity.VALID_MINIMAL);
            expect(entry.validity).toBe(InvariantValidity.VALID_MINIMAL);
        });

        it('should allow resetting to undefined', () => {
            entry.setValidity(InvariantValidity.INVALID_TRIVIAL);
            entry.setValidity(undefined);
            expect(entry.validity).toBeUndefined();
        });
    });

    // ---- selectPlace ----
    describe('selectPlace', () => {
        it('should increase place weight by weightDiff', () => {
            entry.selectPlace('p1', 2);
            expect(entry.placeWeights().get('p1')).toBe(2);
        });

        it('should decrease place weight by weightDiff', () => {
            entry.selectPlace('p1', -3);
            expect(entry.placeWeights().get('p1')).toBe(-3);
        });

        it('should update transition weights based on place flows', () => {
            entry.selectPlace('p1', 1);
            const transitionBalances = entry.transitionBalances();
            expect(transitionBalances.get('t1')).toBe(1);
            expect(transitionBalances.get('t2')).toBe(-1);
        });

        it('should update notation after selecting a place', () => {
            entry.selectPlace('p1', 1);
            expect(entry.notation).toBe('p1');
        });

        it('should handle weightDiff = 0 (no-op)', () => {
            const initialWeights = new Map(entry.placeWeights());
            entry.selectPlace('p1', 0);
            expect(entry.placeWeights()).toEqual(initialWeights);
        });

        it('should ignore unknown place labels', () => {
            entry.selectPlace('unknown', 1);
            expect(entry.placeWeights().get('p1')).toBe(0);
        });

        it('should handle empty placeFlows (no transition updates)', () => {
            const emptyFlows = new Map<string, Map<string, number>>();
            const entry = new InvariantEntry(1, '', undefined, undefined, undefined, ['p1'], ['t1'], emptyFlows);

            entry.selectPlace('p1', 5);
            expect(entry.placeWeights().get('p1')).toBe(5);
            expect(entry.transitionBalances().get('t1')).toBe(0);
        });
    });

    // ---- toNotation (static) ----
    describe('toNotation (static)', () => {
        it('should return empty string for empty vector', () => {
            expect(InvariantEntry.toNotation([], [])).toBe('');
        });

        it('should format positive weights with +', () => {
            expect(InvariantEntry.toNotation([1, 1], ['p1', 'p2'])).toBe('p1 + p2');
        });

        it('should format negative weights with -', () => {
            expect(InvariantEntry.toNotation([-1, -1], ['p1', 'p2'])).toBe('- p1 - p2');
        });

        it('should omit coefficients of 1 or -1', () => {
            expect(InvariantEntry.toNotation([1, -1, 2], ['p1', 'p2', 'p3'])).toBe('p1 - p2 + 2p3');
        });

        it('should skip zero weights', () => {
            expect(InvariantEntry.toNotation([1, 0, -1], ['p1', 'p2', 'p3'])).toBe('p1 - p3');
        });

        it('should handle first element without leading +', () => {
            expect(InvariantEntry.toNotation([2, 3], ['p1', 'p2'])).toBe('2p1 + 3p2');
        });

        it('should handle large coefficients', () => {
            expect(InvariantEntry.toNotation([100, -200], ['p1', 'p2'])).toBe('100p1 - 200p2');
        });
    });

    describe('InvariantValidity', () => {
        it('should have all expected values', () => {
            expect(Object.values(InvariantValidity)).toEqual([
                InvariantValidity.VALID_MINIMAL,
                InvariantValidity.VALID_NOT_MINIMAL,
                InvariantValidity.INVALID_NOT_FINAL,
                InvariantValidity.INVALID_FINAL,
                InvariantValidity.INVALID_TRIVIAL,
                InvariantValidity.INCOMPLETE,
            ]);
        });
    });
});
