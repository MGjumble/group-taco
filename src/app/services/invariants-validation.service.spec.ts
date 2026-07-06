import { TestBed } from '@angular/core/testing';
import { InvariantsValidationService } from './invariants-validation.service';
import { ToasterNotificationService } from './toaster-notification.service';
import { ModeService } from './mode.service';
import { PlaceInvariantsService } from './invariants-computing.service';
import { InvariantEntry, InvariantValidity } from '../classes/invariant-entry';
import { Diagram } from '../classes/diagram/diagram';
import { DiagramPlace } from '../classes/diagram/diagram-place';
import { DiagramTransition } from '../classes/diagram/diagram-transition';
import { DiagramArc } from '../classes/diagram/diagram-arc';

// #region Mock Services

class MockToasterNotificationService {
    showSuccess = jasmine.createSpy('showSuccess');
    showInfo = jasmine.createSpy('showInfo');
    showWarning = jasmine.createSpy('showWarning');
    showError = jasmine.createSpy('showError');
}

class MockModeService {
    isExamMode = jasmine.createSpy('isExamMode').and.returnValue(false);
}

class MockPlaceInvariantsService {
    placeInvariants = jasmine.createSpy('placeInvariants').and.returnValue([]);
    calculateMinimalPIs = jasmine.createSpy('calculateMinimalPIs').and.returnValue([]);
}

// #endregion

// #region Test Data Factories

/**
 * Creates a diagram with 2 places and 1 transition:
 * P1 --[1]--> T1 --[1]--> P2
 */
function createSimpleDiagram(): Diagram {
    const p1 = new DiagramPlace('p1', 0, 'P1');
    const p2 = new DiagramPlace('p2', 0, 'P2');

    const arc1 = new DiagramArc('a1', 'p1', 't1', 1);
    const arc2 = new DiagramArc('a2', 't1', 'p2', 1);

    // T1: input from P1, output to P2
    const t1 = new DiagramTransition('t1', 'T1', [p1], [p2], [arc1], [arc2]);

    return new Diagram([p1, p2], [t1], [arc1, arc2]);
}

/**
 * Creates a more complex diagram:
 * P1 --[1]--> T1 --[1]--> P2
 * P1 --[1]--> T2 --[1]--> P3
 * P2 --[1]--> T2
 */
function createComplexDiagram(): Diagram {
    const p1 = new DiagramPlace('p1', 0, 'P1');
    const p2 = new DiagramPlace('p2', 0, 'P2');
    const p3 = new DiagramPlace('p3', 0, 'P3');

    const arc1 = new DiagramArc('a1', 'p1', 't1', 1); // P1 -> T1
    const arc2 = new DiagramArc('a2', 't1', 'p2', 1); // T1 -> P2
    const arc3 = new DiagramArc('a3', 'p1', 't2', 1); // P1 -> T2
    const arc4 = new DiagramArc('a4', 't2', 'p3', 1); // T2 -> P3
    const arc5 = new DiagramArc('a5', 'p2', 't2', 1); // P2 -> T2

    // T1: input from P1, output to P2
    const t1 = new DiagramTransition('t1', 'T1', [p1], [p2], [arc1], [arc2]);

    // T2: input from P1 and P2, output to P3
    const t2 = new DiagramTransition('t2', 'T2', [p1, p2], [p3], [arc3, arc5], [arc4]);

    return new Diagram([p1, p2, p3], [t1, t2], [arc1, arc2, arc3, arc4, arc5]);
}

/**
 * Creates an InvariantEntry with the given vector
 */
function createInvariantEntry(
    id: number,
    vector: number[],
    placeLabels: string[],
    transitionLabels: string[],
    placeFlows: Map<string, Map<string, number>>,
): InvariantEntry {
    const entry = new InvariantEntry(
        id,
        '',
        undefined,
        undefined,
        undefined,
        placeLabels,
        transitionLabels,
        placeFlows,
    );

    const placeWeights = new Map<string, number>();
    vector.forEach((weight, index) => {
        placeWeights.set(placeLabels[index], weight);
    });
    entry.placeWeights.set(placeWeights);
    entry.notation = InvariantEntry.toNotation(vector, placeLabels);

    return entry;
}

// #endregion

describe('InvariantsValidationService', () => {
    let service: InvariantsValidationService;
    let mockToasterService: MockToasterNotificationService;
    let mockModeService: MockModeService;
    let mockComputingService: MockPlaceInvariantsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                InvariantsValidationService,
                { provide: ToasterNotificationService, useClass: MockToasterNotificationService },
                { provide: ModeService, useClass: MockModeService },
                { provide: PlaceInvariantsService, useClass: MockPlaceInvariantsService },
            ],
        });

        service = TestBed.inject(InvariantsValidationService);
        mockToasterService = TestBed.inject(ToasterNotificationService) as unknown as MockToasterNotificationService;
        mockModeService = TestBed.inject(ModeService) as unknown as MockModeService;
        mockComputingService = TestBed.inject(PlaceInvariantsService) as unknown as MockPlaceInvariantsService;
    });

    // #region Initialization Tests

    describe('Initialization', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('should initialize with diagram data', () => {
            const diagram = createSimpleDiagram();

            service.initialize(diagram);

            expect(service.allPlaceLabels).toEqual(['P1', 'P2']);
            expect(service.allTransitionLabels).toEqual(['T1']);
        });

        it('should set placeFlows correctly for simple diagram', () => {
            const diagram = createSimpleDiagram();
            service.initialize(diagram);

            const placeFlows = service.placeFlows;

            // P1 has output to T1 (weight 1), so flow is -1
            const p1Flows = placeFlows.get('P1');
            expect(p1Flows?.get('T1')).toBe(-1);

            // P2 has input from T1 (weight 1), so flow is +1
            const p2Flows = placeFlows.get('P2');
            expect(p2Flows?.get('T1')).toBe(1);
        });

        it('should set placeFlows correctly for complex diagram', () => {
            const diagram = createComplexDiagram();
            service.initialize(diagram);

            const placeFlows = service.placeFlows;
            const p1Flows = placeFlows.get('P1');
            const p2Flows = placeFlows.get('P2');
            const p3Flows = placeFlows.get('P3');

            // P1 -> T1 (-1), P1 -> T2 (-1)
            expect(p1Flows?.get('T1')).toBe(-1);
            expect(p1Flows?.get('T2')).toBe(-1);

            // T1 -> P2 (+1), P2 -> T2 (-1)
            expect(p2Flows?.get('T1')).toBe(1);
            expect(p2Flows?.get('T2')).toBe(-1);

            // T2 -> P3 (+1)
            expect(p3Flows?.get('T1')).toBeUndefined();
            expect(p3Flows?.get('T2')).toBe(1);
        });
    });

    // #endregion

    // #region createIncidenceMatrix Tests

    describe('createIncidenceMatrix', () => {
        it('should create correct incidence matrix for simple diagram', () => {
            const diagram = createSimpleDiagram();
            const matrix = service.createIncidenceMatrix(diagram);

            // 2 places, 1 transition
            expect(matrix.length).toBe(2);
            expect(matrix[0].length).toBe(1);

            // P1: -1 (input to T1)
            expect(matrix[0][0]).toBe(-1);
            // P2: +1 (output from T1)
            expect(matrix[1][0]).toBe(1);
        });

        it('should create correct incidence matrix for complex diagram', () => {
            const diagram = createComplexDiagram();
            const matrix = service.createIncidenceMatrix(diagram);

            // 3 places, 2 transitions
            expect(matrix.length).toBe(3);
            expect(matrix[0].length).toBe(2);

            // P1: -1 (T1), -1 (T2)
            expect(matrix[0][0]).toBe(-1);
            expect(matrix[0][1]).toBe(-1);

            // P2: +1 (from T1), -1 (to T2)
            expect(matrix[1][0]).toBe(1);
            expect(matrix[1][1]).toBe(-1);

            // P3: 0 (no T1), +1 (from T2)
            expect(matrix[2][0]).toBe(0);
            expect(matrix[2][1]).toBe(1);
        });

        it('should handle empty diagram', () => {
            const emptyDiagram = new Diagram([], [], []);
            const matrix = service.createIncidenceMatrix(emptyDiagram);

            expect(matrix.length).toBe(0);
        });

        it('should handle diagram with only places', () => {
            const p1 = new DiagramPlace('p1', 0, 'P1');
            const p2 = new DiagramPlace('p2', 0, 'P2');
            const t1 = new DiagramTransition('t1', 'T1', [], [], [], []);
            const diagram = new Diagram([p1, p2], [t1], []);

            const matrix = service.createIncidenceMatrix(diagram);
            expect(matrix.length).toBe(2);
            expect(matrix[0].length).toBe(1);
            expect(matrix[1].length).toBe(1);
            expect(matrix[0][0]).toBe(0);
            expect(matrix[1][0]).toBe(0);
        });

        it('should handle diagram with only transitions', () => {
            const p1 = new DiagramPlace('p1', 0, 'P1');
            const t1 = new DiagramTransition('t1', 'T1', [], [], [], []);
            const diagram = new Diagram([p1], [t1], []);

            const matrix = service.createIncidenceMatrix(diagram);
            expect(matrix.length).toBe(1);
            expect(matrix[0].length).toBe(1);
            expect(matrix[0][0]).toBe(0);
        });
    });

    // #endregion

    // #region setPlaceFlows Tests

    describe('setPlaceFlows', () => {
        it('should set place flows from transitions', () => {
            const diagram = createSimpleDiagram();
            service.allPlaceLabels = diagram.getPlaceLabels();
            service.setPlaceFlows(diagram.transitions);

            const flows = service.placeFlows;
            expect(flows.size).toBe(2);
            expect(flows.get('P1')?.get('T1')).toBe(-1);
            expect(flows.get('P2')?.get('T1')).toBe(1);
        });
    });

    // #endregion

    // #region _areVectorsEqual Tests

    describe('_areVectorsEqual', () => {
        let method: (a: number[], b: number[]) => boolean;

        beforeEach(() => {
            const diagram = createSimpleDiagram();
            service.initialize(diagram);
            method = (service as any)._areVectorsEqual.bind(service);
        });

        it('should return true for equal vectors', () => {
            expect(method([1, 0, -1], [1, 0, -1])).toBeTrue();
        });

        it('should return false for different length vectors', () => {
            expect(method([1, 2], [1, 2, 3])).toBeFalse();
        });

        it('should return true for numerically equal vectors within epsilon', () => {
            expect(method([1.00000000001, 0], [1, 0])).toBeTrue();
            expect(method([0.00000000001, 0], [0, 0])).toBeTrue();
        });

        it('should return false for different vectors', () => {
            expect(method([1, 0], [0, 1])).toBeFalse();
        });

        it('should return true for empty vectors', () => {
            expect(method([], [])).toBeTrue();
        });
    });

    // #endregion

    // #region _isInvariant Tests

    describe('_isInvariant', () => {
        let method: (vector: number[]) => boolean;

        beforeEach(() => {
            const diagram = createSimpleDiagram();
            service.initialize(diagram);
            method = (service as any)._isInvariant.bind(service);
        });

        it('should return true for valid invariant vector', () => {
            // For P1 --[1]--> T1 --[1]--> P2
            // [1, 1] is valid: -1*1 + 1*1 = 0
            expect(method([1, 1])).toBeTrue();
        });

        it('should return false for invalid invariant vector', () => {
            // [1, 0] is not valid: -1*1 + 1*0 = -1 != 0
            expect(method([1, 0])).toBeFalse();
        });

        it('should return true for zero vector', () => {
            // Zero vector is always a trivial invariant
            expect(method([0, 0])).toBeTrue();
        });

        it('should return true for scaled valid invariant', () => {
            // [2, 2] is also valid: -1*2 + 1*2 = 0
            expect(method([2, 2])).toBeTrue();
        });
    });

    // #endregion

    // #region validateEntry Tests

    describe('validateEntry', () => {
        let diagram: Diagram;
        let placeLabels: string[];
        let transitionLabels: string[];
        let placeFlows: Map<string, Map<string, number>>;

        beforeEach(() => {
            diagram = createSimpleDiagram();
            service.initialize(diagram);
            placeLabels = diagram.getPlaceLabels();
            transitionLabels = diagram.getTransitionLabels();
            placeFlows = service.placeFlows;

            service.computedMinInvariants.set([[1, 1]]);
        });

        describe('Trivial Vector', () => {
            it('should set INVALID_TRIVIAL for all-zero vector on final validation', () => {
                const entry = createInvariantEntry(1, [0, 0], placeLabels, transitionLabels, placeFlows);

                service.validateEntry(entry, true);

                expect(entry.validity).toBe(InvariantValidity.INVALID_TRIVIAL);
            });

            it('should not set validity for all-zero vector on non-final validation', () => {
                const entry = createInvariantEntry(1, [0, 0], placeLabels, transitionLabels, placeFlows);

                service.validateEntry(entry, false);

                expect(entry.validity).toBeUndefined();
            });
        });

        describe('Exact Match with Computed Minimal Invariants', () => {
            it('should set VALID_MINIMAL for exact match', () => {
                const entry = createInvariantEntry(1, [1, 1], placeLabels, transitionLabels, placeFlows);

                service.validateEntry(entry, false);

                expect(entry.validity).toBe(InvariantValidity.VALID_MINIMAL);
            });
        });

        describe('Incomplete Invariants', () => {
            it('should set INCOMPLETE for partial invariant on non-final validation', () => {
                service.computedMinInvariants.set([[2, 2]]);
                const entry = createInvariantEntry(1, [1, 1], placeLabels, transitionLabels, placeFlows);

                service.validateEntry(entry, false);

                expect(entry.validity).toBe(InvariantValidity.INCOMPLETE);
            });

            it('should calculate correct missing places count', () => {
                service.computedMinInvariants.set([[2, 3]]);
                const entry = createInvariantEntry(1, [1, 1], placeLabels, transitionLabels, placeFlows);

                service.validateEntry(entry, false);

                expect(entry.missingPlacesCount).toBe(2);
            });

            it('should calculate correct missing weights count', () => {
                service.computedMinInvariants.set([[2, 3]]);
                const entry = createInvariantEntry(1, [1, 1], placeLabels, transitionLabels, placeFlows);

                service.validateEntry(entry, false);

                expect(entry.missingWeightsCount).toBe(3);
            });

            it('should set INVALID_FINAL for incomplete invariant on final validation', () => {
                service.computedMinInvariants.set([[2, 2]]);
                const entry = createInvariantEntry(1, [1, 0], placeLabels, transitionLabels, placeFlows);

                service.validateEntry(entry, true);

                expect(entry.validity).toBe(InvariantValidity.INVALID_FINAL);
            });
        });

        describe('Valid Non-Minimal Invariants', () => {
            it('should set VALID_NOT_MINIMAL for valid invariant that is not minimal', () => {
                service.computedMinInvariants.set([[1, 1]]);
                const entry = createInvariantEntry(1, [2, 2], placeLabels, transitionLabels, placeFlows);

                service.validateEntry(entry, false);

                expect(entry.validity).toBe(InvariantValidity.VALID_NOT_MINIMAL);
            });
        });

        describe('Invalid Invariants', () => {
            it('should set INVALID_NOT_FINAL for non-invariant on non-final validation', () => {
                service.computedMinInvariants.set([[2, 2]]);

                const entry = createInvariantEntry(1, [3, 0], placeLabels, transitionLabels, placeFlows);

                service.validateEntry(entry, false);

                expect(entry.validity).toBe(InvariantValidity.INVALID_NOT_FINAL);
            });

            it('should set INVALID_FINAL for non-invariant on final validation', () => {
                service.computedMinInvariants.set([[2, 2]]);

                const entry = createInvariantEntry(1, [1, 0], placeLabels, transitionLabels, placeFlows);

                service.validateEntry(entry, true);

                expect(entry.validity).toBe(InvariantValidity.INVALID_FINAL);
            });
        });
    });

    // #endregion

    // #region validateAllEntries Tests

    describe('validateAllEntries', () => {
        let diagram: Diagram;
        let placeLabels: string[];
        let transitionLabels: string[];
        let placeFlows: Map<string, Map<string, number>>;

        beforeEach(() => {
            diagram = createSimpleDiagram();

            service.allPlaceLabels = diagram.getPlaceLabels();
            service.allTransitionLabels = diagram.getTransitionLabels();
            service.setPlaceFlows(diagram.transitions);
            (service as any)._incidenceMatrix = service.createIncidenceMatrix(diagram);

            placeLabels = diagram.getPlaceLabels();
            transitionLabels = diagram.getTransitionLabels();
            placeFlows = service.placeFlows;

            service.computedMinInvariants.set([[1, 1]]);

            mockToasterService.showSuccess.calls.reset();
            mockToasterService.showInfo.calls.reset();
        });

        it('should validate all entries and show success when all minimal invariants found', () => {
            const entry1 = createInvariantEntry(1, [1, 1], placeLabels, transitionLabels, placeFlows);
            service.inputEntries.set([entry1]);

            service.validateAllEntries();

            expect(mockToasterService.showSuccess).toHaveBeenCalledWith(
                'TOASTER.HEADER.VALIDATION_COMPLETED',
                'TOASTER.BODY.ALL_MIN_INVARIANTS_FOUND',
            );
        });

        it('should show info when minimal invariants are missing', () => {
            service.computedMinInvariants.set([
                [1, 1],
                [2, 2],
            ]);

            const entry1 = createInvariantEntry(1, [1, 1], placeLabels, transitionLabels, placeFlows);
            service.inputEntries.set([entry1]);

            service.validateAllEntries();

            expect(mockToasterService.showInfo).toHaveBeenCalledWith(
                'TOASTER.HEADER.VALIDATION_COMPLETED',
                'TOASTER.BODY.MIN_INVARIANTS_MISSING',
            );
        });
    });

    // #endregion

    // #region Computed Properties Tests

    describe('Computed Properties', () => {
        let diagram: Diagram;

        beforeEach(() => {
            diagram = createSimpleDiagram();
            service.initialize(diagram);
            mockToasterService.showSuccess.calls.reset();
        });

        describe('foundMinInvariants', () => {
            it('should return invariants that match input entries', () => {
                service.computedMinInvariants.set([
                    [1, 1],
                    [2, 2],
                    [0, 1],
                ]);

                const entry1 = createInvariantEntry(
                    1,
                    [1, 1],
                    diagram.getPlaceLabels(),
                    diagram.getTransitionLabels(),
                    service.placeFlows,
                );
                const entry2 = createInvariantEntry(
                    2,
                    [2, 2],
                    diagram.getPlaceLabels(),
                    diagram.getTransitionLabels(),
                    service.placeFlows,
                );

                service.inputEntries.set([entry1, entry2]);

                const found = service.foundMinInvariants();

                expect(found.length).toBe(2);
                expect(found).toContain([1, 1]);
                expect(found).toContain([2, 2]);
            });

            it('should return empty array when no input entries', () => {
                service.computedMinInvariants.set([
                    [1, 1],
                    [2, 2],
                ]);
                service.inputEntries.set([]);

                const found = service.foundMinInvariants();
                expect(found).toEqual([]);
            });

            it('should return empty array when no matches', () => {
                service.computedMinInvariants.set([[1, 1]]);
                const entry1 = createInvariantEntry(
                    1,
                    [2, 2],
                    diagram.getPlaceLabels(),
                    diagram.getTransitionLabels(),
                    service.placeFlows,
                );
                service.inputEntries.set([entry1]);

                const found = service.foundMinInvariants();
                expect(found).toEqual([]);
            });
        });

        describe('remainingMinInvariants', () => {
            it('should return invariants not found in input entries', () => {
                service.computedMinInvariants.set([
                    [1, 1],
                    [2, 2],
                    [0, 1],
                ]);

                const entry1 = createInvariantEntry(
                    1,
                    [1, 1],
                    diagram.getPlaceLabels(),
                    diagram.getTransitionLabels(),
                    service.placeFlows,
                );

                service.inputEntries.set([entry1]);

                const remaining = service.remainingMinInvariants();

                expect(remaining.length).toBe(2);
                expect(remaining).toContain([2, 2]);
                expect(remaining).toContain([0, 1]);
            });

            it('should show success toast when all invariants found and not in exam mode', () => {
                service.computedMinInvariants.set([[1, 1]]);

                const entry1 = createInvariantEntry(
                    1,
                    [1, 1],
                    diagram.getPlaceLabels(),
                    diagram.getTransitionLabels(),
                    service.placeFlows,
                );

                service.inputEntries.set([entry1]);
                mockModeService.isExamMode.and.returnValue(false);

                service.remainingMinInvariants();

                expect(mockToasterService.showSuccess).toHaveBeenCalledWith(
                    'TOASTER.HEADER.SUCCESS',
                    'TOASTER.BODY.ALL_MIN_INVARIANTS_FOUND',
                );
            });

            it('should not show success toast in exam mode', () => {
                service.computedMinInvariants.set([[1, 1]]);

                const entry1 = createInvariantEntry(
                    1,
                    [1, 1],
                    diagram.getPlaceLabels(),
                    diagram.getTransitionLabels(),
                    service.placeFlows,
                );

                service.inputEntries.set([entry1]);
                mockModeService.isExamMode.and.returnValue(true);

                service.remainingMinInvariants();

                expect(mockToasterService.showSuccess).not.toHaveBeenCalled();
            });

            it('should return all invariants when no input entries', () => {
                service.computedMinInvariants.set([
                    [1, 1],
                    [2, 2],
                ]);
                service.inputEntries.set([]);

                const remaining = service.remainingMinInvariants();

                expect(remaining.length).toBe(2);
                expect(remaining).toContain([1, 1]);
                expect(remaining).toContain([2, 2]);
            });
        });
    });

    // #endregion

    // #region Getter/Setter Tests

    describe('Getters and Setters', () => {
        it('should get and set allPlaceLabels', () => {
            const labels = ['P1', 'P2', 'P3'];
            service.allPlaceLabels = labels;
            expect(service.allPlaceLabels).toEqual(labels);
        });

        it('should get and set allTransitionLabels', () => {
            const labels = ['T1', 'T2'];
            service.allTransitionLabels = labels;
            expect(service.allTransitionLabels).toEqual(labels);
        });

        it('should get placeFlows map', () => {
            const diagram = createSimpleDiagram();
            service.initialize(diagram);

            const flows = service.placeFlows;
            expect(flows).toBeDefined();
            expect(flows).toBeInstanceOf(Map);
        });

        it('should get inputEntries signal', () => {
            expect(service.inputEntries()).toEqual([]);

            const diagram = createSimpleDiagram();
            service.initialize(diagram);
            const entry = createInvariantEntry(
                1,
                [1, 1],
                diagram.getPlaceLabels(),
                diagram.getTransitionLabels(),
                service.placeFlows,
            );

            service.inputEntries.set([entry]);
            expect(service.inputEntries()).toEqual([entry]);
        });

        it('should get computedMinInvariants signal', () => {
            expect(service.computedMinInvariants()).toEqual([]);

            service.computedMinInvariants.set([[1, 1]]);
            expect(service.computedMinInvariants()).toEqual([[1, 1]]);
        });
    });

    // #endregion

    // #region Edge Cases and Error Handling

    describe('Edge Cases', () => {
        it('should handle empty diagram gracefully', () => {
            const emptyDiagram = new Diagram([], [], []);

            expect(() => service.initialize(emptyDiagram)).not.toThrow();
            expect(service.allPlaceLabels).toEqual([]);
            expect(service.allTransitionLabels).toEqual([]);
        });

        it('should handle large vectors', () => {
            const method = (service as any)._areVectorsEqual.bind(service);
            const largeVector1 = Array(100)
                .fill(0)
                .map((_, i) => i);
            const largeVector2 = Array(100)
                .fill(0)
                .map((_, i) => i);

            expect(method(largeVector1, largeVector2)).toBeTrue();
        });

        it('should handle negative weights in incidence matrix', () => {
            const p1 = new DiagramPlace('p1', 0, 'P1');
            const p2 = new DiagramPlace('p2', 0, 'P2');

            const arc1 = new DiagramArc('a1', 'p1', 't1', 2);
            const arc2 = new DiagramArc('a2', 't1', 'p2', 3);

            // T1: input from P1 with weight 2, output to P2 with weight 3
            const t1 = new DiagramTransition('t1', 'T1', [p1], [p2], [arc1], [arc2]);

            const diagram = new Diagram([p1, p2], [t1], [arc1, arc2]);
            const matrix = service.createIncidenceMatrix(diagram);

            expect(matrix[0][0]).toBe(-2);
            expect(matrix[1][0]).toBe(3);
        });
    });

    // #endregion
});
