import { TestBed } from '@angular/core/testing';
import { InvariantsEntryService } from './invariants-entry.service';
import { ModeService } from './mode.service';
import { InvariantsValidationService } from './invariants-validation.service';
import { InvariantEntry, InvariantValidity } from '../classes/invariant-entry';
import { DiagramPlace } from '../classes/diagram/diagram-place';
import { Tab } from '../classes/tabs';
import { signal } from '@angular/core';

// #region Mock Services

class MockModeService {
    private _examModeTab: Tab | null = null;

    isExamMode(tab: Tab): boolean {
        return this._examModeTab === tab;
    }

    setExamModeForTab(tab: Tab | null): void {
        this._examModeTab = tab;
    }
}

class MockInvariantsValidationService {
    allPlaceLabels: string[] = [];
    allTransitionLabels: string[] = [];
    placeFlows: Map<string, Map<string, number>> = new Map();
    inputEntries = signal<InvariantEntry[]>([]);

    validateEntry = jasmine.createSpy('validateEntry');
}

// #endregion

// #region Test Data Factories

function createMockDiagramPlace(id: string, label: string): DiagramPlace {
    return new DiagramPlace(id, 0, label);
}

function createTestInvariantEntry(
    id: number,
    placeLabels: string[] = ['P1', 'P2'],
    transitionLabels: string[] = ['T1'],
    placeFlows: Map<string, Map<string, number>> = new Map(),
): InvariantEntry {
    return new InvariantEntry(id, placeLabels, transitionLabels, placeFlows);
}

// #endregion

describe('InvariantsEntryService', () => {
    let service: InvariantsEntryService;
    let mockModeService: MockModeService;
    let mockValidationService: MockInvariantsValidationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                InvariantsEntryService,
                { provide: ModeService, useClass: MockModeService },
                { provide: InvariantsValidationService, useClass: MockInvariantsValidationService },
            ],
        });

        service = TestBed.inject(InvariantsEntryService);
        mockModeService = TestBed.inject(ModeService) as unknown as MockModeService;
        mockValidationService = TestBed.inject(
            InvariantsValidationService,
        ) as unknown as MockInvariantsValidationService;

        // Reset mock state
        mockModeService.setExamModeForTab(null);
        mockValidationService.inputEntries.set([]);
        mockValidationService.validateEntry.calls.reset();
    });

    // #region Initialization Tests

    describe('Initialization', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('should have showTransitionBalances as true by default', () => {
            expect(service.showTransitionBalances()).toBeTrue();
        });

        it('should have activeEntry as null by default', () => {
            expect(service.activeEntry()).toBeNull();
        });

        it('should have _idCounter starting at 0', () => {
            // Access private property through any cast
            expect((service as any)._idCounter).toBe(0);
        });
    });

    // #endregion

    // #region Signal Tests

    describe('Signals', () => {
        describe('showTransitionBalances', () => {
            it('should get and set showTransitionBalances', () => {
                service.overrideShowTransitionBalances.set(false);
                expect(service.showTransitionBalances()).toBeFalse();

                service.overrideShowTransitionBalances.set(true);
                expect(service.showTransitionBalances()).toBeTrue();
            });
        });

        describe('activeEntry', () => {
            it('should get and set activeEntry', () => {
                const entry = createTestInvariantEntry(1);
                service.activeEntry.set(entry);
                expect(service.activeEntry()).toBe(entry);
            });

            it('should be null after setting null', () => {
                const entry = createTestInvariantEntry(1);
                service.activeEntry.set(entry);
                service.activeEntry.set(null);
                expect(service.activeEntry()).toBeNull();
            });
        });
    });

    // #endregion

    // #region Computed Properties Tests

    describe('Computed Properties', () => {
        describe('isEntryActive', () => {
            it('should return true when entry is active', () => {
                const entry = createTestInvariantEntry(1);
                service.activeEntry.set(entry);

                const isActive = service.isEntryActive(1);
                expect(isActive()).toBeTrue();
            });

            it('should return false when entry is not active', () => {
                const entry1 = createTestInvariantEntry(1);
                const entry2 = createTestInvariantEntry(2);
                service.activeEntry.set(entry1);

                const isActive = service.isEntryActive(2);
                expect(isActive()).toBeFalse();
            });

            it('should return false when no entry is active', () => {
                const isActive = service.isEntryActive(1);
                expect(isActive()).toBeFalse();
            });

            it('should update when activeEntry changes', () => {
                const entry1 = createTestInvariantEntry(1);
                const entry2 = createTestInvariantEntry(2);

                service.activeEntry.set(entry1);
                expect(service.isEntryActive(1)()).toBeTrue();
                expect(service.isEntryActive(2)()).toBeFalse();

                service.activeEntry.set(entry2);
                expect(service.isEntryActive(1)()).toBeFalse();
                expect(service.isEntryActive(2)()).toBeTrue();
            });
        });

        describe('_isExamMode', () => {
            it('should return false by default', () => {
                const isExamMode = (service as any)._isExamMode();
                expect(isExamMode).toBeFalse();
            });

            it('should return true when in exam mode for INVARIANTS tab', () => {
                mockModeService.setExamModeForTab(Tab.INVARIANTS);
                const isExamMode = (service as any)._isExamMode();
                expect(isExamMode).toBeTrue();
            });

            it('should return false for other tabs in exam mode', () => {
                mockModeService.setExamModeForTab(Tab.DRAW);
                const isExamMode = (service as any)._isExamMode();
                expect(isExamMode).toBeFalse();
            });
        });
    });

    // #endregion

    // #region getNewId Tests

    describe('getNewId', () => {
        it('should start at 1 and increment', () => {
            expect(service.getNewId()).toBe(1);
            expect(service.getNewId()).toBe(2);
            expect(service.getNewId()).toBe(3);
        });

        it('should generate unique IDs for each call', () => {
            const id1 = service.getNewId();
            const id2 = service.getNewId();
            const id3 = service.getNewId();

            expect(id1).not.toBe(id2);
            expect(id2).not.toBe(id3);
            expect(id1).not.toBe(id3);
        });

        it('should continue incrementing across multiple calls', () => {
            const firstCall = service.getNewId();
            const secondCall = service.getNewId();
            expect(secondCall).toBe(firstCall + 1);
        });
    });

    // #endregion

    // #region addEmptyEntry Tests

    describe('addEmptyEntry', () => {
        beforeEach(() => {
            mockValidationService.allPlaceLabels = ['P1', 'P2'];
            mockValidationService.allTransitionLabels = ['T1'];
            mockValidationService.placeFlows = new Map();
        });

        it('should create a new entry with auto-incremented ID', () => {
            const entry1 = service.addEmptyEntry();
            const entry2 = service.addEmptyEntry();

            expect(entry1.id).toBe(1);
            expect(entry2.id).toBe(2);
        });

        it('should set activeEntry to the new entry', () => {
            const entry = service.addEmptyEntry();
            expect(service.activeEntry()).toBe(entry);
        });

        it('should add the entry to inputEntries', () => {
            const entry = service.addEmptyEntry();
            expect(mockValidationService.inputEntries()).toContain(entry);
        });

        it('should create entry with correct place and transition labels', () => {
            mockValidationService.allPlaceLabels = ['P1', 'P2', 'P3'];
            mockValidationService.allTransitionLabels = ['T1', 'T2'];

            const entry = service.addEmptyEntry();

            expect(entry.allPlaces).toEqual(['P1', 'P2', 'P3']);
            expect(entry.allTransitions).toEqual(['T1', 'T2']);
        });

        it('should create entry with correct placeFlows reference', () => {
            const placeFlows = new Map<string, Map<string, number>>();
            mockValidationService.placeFlows = placeFlows;

            const entry = service.addEmptyEntry();
            expect(entry.placeFlows).toBe(placeFlows);
        });

        it('should create entry with empty notation initially', () => {
            const entry = service.addEmptyEntry();
            expect(entry.notation).toBe('');
        });

        it('should create entry with undefined validity initially', () => {
            const entry = service.addEmptyEntry();
            expect(entry.validity).toBeUndefined();
        });
    });

    // #endregion

    // #region getActiveEntry Tests

    describe('getActiveEntry', () => {
        beforeEach(() => {
            mockValidationService.allPlaceLabels = ['P1', 'P2'];
            mockValidationService.allTransitionLabels = ['T1'];
            mockValidationService.placeFlows = new Map();
        });

        it('should return existing activeEntry', () => {
            const existingEntry = createTestInvariantEntry(1, ['P1', 'P2'], ['T1']);
            service.activeEntry.set(existingEntry);

            const result = service.getActiveEntry();
            expect(result).toBe(existingEntry);
        });

        it('should create and return new entry when activeEntry is null', () => {
            const result = service.getActiveEntry();

            expect(result).toBeDefined();
            expect(service.activeEntry()).toBe(result);
            expect(result.id).toBe(1);
        });

        it('should set activeEntry to the returned entry', () => {
            const result = service.getActiveEntry();
            expect(service.activeEntry()).toBe(result);
        });

        it('should add new entry to inputEntries when activeEntry was null', () => {
            const result = service.getActiveEntry();
            expect(mockValidationService.inputEntries()).toContain(result);
        });

        it('should not add duplicate entry when called multiple times with existing activeEntry', () => {
            const initialEntry = service.addEmptyEntry();
            const initialCount = mockValidationService.inputEntries().length;

            service.getActiveEntry();
            service.getActiveEntry();

            expect(mockValidationService.inputEntries().length).toBe(initialCount);
        });
    });

    // #endregion

    // #region processPlaceClicked Tests

    describe('processPlaceClicked', () => {
        let place: DiagramPlace;

        beforeEach(() => {
            place = createMockDiagramPlace('p1', 'P1');
            mockValidationService.allPlaceLabels = ['P1', 'P2'];
            mockValidationService.allTransitionLabels = ['T1'];
            mockValidationService.placeFlows = new Map();
        });

        it('should create new entry if activeEntry is null', () => {
            service.processPlaceClicked(place, 1);

            expect(service.activeEntry()).toBeDefined();
            expect(mockValidationService.inputEntries().length).toBe(1);
        });

        it('should update existing activeEntry', () => {
            const entry = service.addEmptyEntry();
            const initialPlaceWeights = entry.placeWeights();

            service.processPlaceClicked(place, 1);

            const updatedPlaceWeights = service.activeEntry()!.placeWeights();
            expect(updatedPlaceWeights.get('P1')).toBe(1);
        });

        it('should call selectPlace on the entry with correct parameters', () => {
            const entry = service.addEmptyEntry();
            const initialNotation = entry.notation;

            service.processPlaceClicked(place, 1);

            const updatedEntry = service.activeEntry()!;
            expect(updatedEntry.notation).not.toBe(initialNotation);
        });

        it('should call updateEntry with the entry and place', () => {
            const entry = service.addEmptyEntry();
            const updateEntrySpy = spyOn(service, 'updateEntry');

            service.processPlaceClicked(place, 1);

            expect(updateEntrySpy).toHaveBeenCalledWith(entry, place, 1);
        });

        describe('Exam Mode', () => {
            it('should NOT validate entry in exam mode', () => {
                mockModeService.setExamModeForTab(Tab.INVARIANTS);
                service.addEmptyEntry();

                service.processPlaceClicked(place, 1);

                expect(mockValidationService.validateEntry).not.toHaveBeenCalled();
            });

            it('should set validity to undefined in exam mode', () => {
                mockModeService.setExamModeForTab(Tab.INVARIANTS);
                const entry = service.addEmptyEntry();

                service.processPlaceClicked(place, 1);

                expect(entry.validity).toBeUndefined();
            });
        });

        describe('Non-Exam Mode', () => {
            it('should validate entry in non-exam mode', () => {
                const entry = service.addEmptyEntry();

                service.processPlaceClicked(place, 1);

                expect(mockValidationService.validateEntry).toHaveBeenCalledWith(entry);
            });

            it('should not set validity to undefined in non-exam mode', () => {
                const entry = service.addEmptyEntry();
                entry.setValidity(InvariantValidity.VALID_MINIMAL);

                service.processPlaceClicked(place, 1);

                // Validity should not be reset to undefined
                expect(entry.validity).not.toBeUndefined();
            });
        });
    });

    // #endregion

    // #region updateEntry Tests

    describe('updateEntry', () => {
        let place: DiagramPlace;
        let entry: InvariantEntry;

        beforeEach(() => {
            place = createMockDiagramPlace('p1', 'P1');
            mockValidationService.allPlaceLabels = ['P1', 'P2'];
            mockValidationService.allTransitionLabels = ['T1'];
            mockValidationService.placeFlows = new Map();

            entry = service.addEmptyEntry();
        });

        it('should call selectPlace on the entry', () => {
            const initialPlaceWeights = entry.placeWeights();
            const initialWeight = initialPlaceWeights.get('P1') || 0;

            service.updateEntry(entry, place, 1);

            const updatedPlaceWeights = entry.placeWeights();
            expect(updatedPlaceWeights.get('P1')).toBe(initialWeight + 1);
        });

        it('should update inputEntries signal', () => {
            const initialEntries = mockValidationService.inputEntries();
            service.updateEntry(entry, place, 1);

            // The signal should be updated (though with same entries)
            expect(mockValidationService.inputEntries()).toEqual(initialEntries);
        });

        it('should handle positive weight difference', () => {
            service.updateEntry(entry, place, 2);
            expect(entry.placeWeights().get('P1')).toBe(2);
        });

        it('should handle negative weight difference', () => {
            service.updateEntry(entry, place, 1);
            service.updateEntry(entry, place, -1);
            expect(entry.placeWeights().get('P1')).toBe(0);
        });

        it('should handle weight difference of zero', () => {
            service.updateEntry(entry, place, 0);
            expect(entry.placeWeights().get('P1')).toBe(0);
        });
    });

    // #endregion

    // #region deleteEntry Tests

    describe('deleteEntry', () => {
        let entry1: InvariantEntry;
        let entry2: InvariantEntry;

        beforeEach(() => {
            mockValidationService.allPlaceLabels = ['P1', 'P2'];
            mockValidationService.allTransitionLabels = ['T1'];
            mockValidationService.placeFlows = new Map();

            entry1 = service.addEmptyEntry();
            entry2 = service.addEmptyEntry();
        });

        it('should remove entry from inputEntries', () => {
            expect(mockValidationService.inputEntries()).toContain(entry1);

            service.deleteEntry(entry1.id);

            expect(mockValidationService.inputEntries()).not.toContain(entry1);
            expect(mockValidationService.inputEntries()).toContain(entry2);
        });

        it('should set activeEntry to null if deleted entry was active', () => {
            service.activeEntry.set(entry1);
            expect(service.activeEntry()).toBe(entry1);

            service.deleteEntry(entry1.id);

            expect(service.activeEntry()).toBeNull();
        });

        it('should keep activeEntry unchanged if deleted entry was not active', () => {
            service.activeEntry.set(entry2);

            service.deleteEntry(entry1.id);

            expect(service.activeEntry()).toBe(entry2);
        });

        it('should set activeEntry to null if inputEntries becomes empty', () => {
            service.activeEntry.set(entry2);
            expect(mockValidationService.inputEntries().length).toBe(2);

            service.deleteEntry(entry1.id);
            service.deleteEntry(entry2.id);

            expect(service.activeEntry()).toBeNull();
        });

        it('should handle deleting non-existent entry', () => {
            const initialCount = mockValidationService.inputEntries().length;

            service.deleteEntry(999); // Non-existent ID

            expect(mockValidationService.inputEntries().length).toBe(initialCount);
        });
    });

    // #endregion

    // #region clearInputEntries Tests (deleteAllEntries)

    describe('deleteAllEntries', () => {
        beforeEach(() => {
            mockValidationService.allPlaceLabels = ['P1', 'P2'];
            mockValidationService.allTransitionLabels = ['T1'];
            mockValidationService.placeFlows = new Map();

            service.addEmptyEntry();
            service.addEmptyEntry();
        });

        it('should clear all entries from inputEntries', () => {
            expect(mockValidationService.inputEntries().length).toBe(2);

            service.deleteAllEntries();

            expect(mockValidationService.inputEntries().length).toBe(0);
        });

        it('should set activeEntry to null', () => {
            const entry = service.addEmptyEntry();
            service.activeEntry.set(entry);

            service.deleteAllEntries();

            expect(service.activeEntry()).toBeNull();
        });

        it('should handle clearing empty list', () => {
            service.deleteAllEntries(); // Clear when already empty
            expect(mockValidationService.inputEntries().length).toBe(0);
            expect(service.activeEntry()).toBeNull();
        });
    });

    // #endregion

    // #region activateEntry Tests

    describe('activateEntry', () => {
        let entry1: InvariantEntry;
        let entry2: InvariantEntry;

        beforeEach(() => {
            mockValidationService.allPlaceLabels = ['P1', 'P2'];
            mockValidationService.allTransitionLabels = ['T1'];
            mockValidationService.placeFlows = new Map();

            entry1 = service.addEmptyEntry();
            entry2 = service.addEmptyEntry();
        });

        it('should set activeEntry to the found entry', () => {
            service.activateEntry(entry1.id);
            expect(service.activeEntry()).toBe(entry1);
        });

        it('should set activeEntry to null if entry not found', () => {
            service.activateEntry(999); // Non-existent ID
            expect(service.activeEntry()).toBeNull();
        });

        it('should activate correct entry by ID', () => {
            service.activateEntry(entry2.id);
            expect(service.activeEntry()).toBe(entry2);
        });

        it('should update isEntryActive computed property', () => {
            service.activateEntry(entry1.id);

            expect(service.isEntryActive(entry1.id)()).toBeTrue();
            expect(service.isEntryActive(entry2.id)()).toBeFalse();
        });
    });

    // #endregion

    // #region Edge Cases and Error Handling

    describe('Edge Cases', () => {
        it('should handle multiple rapid calls to addEmptyEntry', () => {
            const entries = [];
            for (let i = 0; i < 10; i++) {
                entries.push(service.addEmptyEntry());
            }

            expect(entries.length).toBe(10);
            expect(entries[0].id).toBe(1);
            expect(entries[9].id).toBe(10);
        });

        it('should handle activating entry that was deleted', () => {
            const entry = service.addEmptyEntry();
            const entryId = entry.id;

            service.deleteEntry(entryId);
            service.activateEntry(entryId);

            expect(service.activeEntry()).toBeNull();
        });

        it('should handle processPlaceClicked with undefined place', () => {
            expect(() => service.processPlaceClicked(null as any, 1)).not.toThrow();
        });

        it('should handle updateEntry with null entry', () => {
            const place = createMockDiagramPlace('p1', 'P1');
            expect(() => service.updateEntry(null as any, place, 1)).not.toThrow();
        });

        it('should maintain separate state across multiple service instances', () => {
            // This tests that the service maintains its own state
            const entry1 = service.addEmptyEntry();
            const entry2 = service.addEmptyEntry();

            expect(entry1.id).toBe(1);
            expect(entry2.id).toBe(2);
            expect(service.activeEntry()).toBe(entry2);
        });

        it('should reset activeEntry when adding new entry after clearing', () => {
            service.addEmptyEntry();
            service.deleteAllEntries();
            expect(service.activeEntry()).toBeNull();

            const newEntry = service.addEmptyEntry();
            expect(service.activeEntry()).toBe(newEntry);
        });
    });

    // #endregion
});
