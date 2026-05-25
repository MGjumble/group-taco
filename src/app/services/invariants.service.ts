import { inject, Injectable, signal } from "@angular/core";
import { ModeService } from "./mode.service";
import { ToasterNotificationService } from "./toaster-notification.service";
import { SourcePetriNetService } from "./source-petri-net.service";
import { Invariant } from "../classes/invariant";
import { Diagram } from "../classes/diagram/diagram";
import { DiagramPlace } from "../classes/diagram/diagram-place";

@Injectable({ providedIn: 'root' })
export class InvariantsService {
    private _modeService = inject(ModeService);
    private _notificationService = inject(ToasterNotificationService);
    private _sourceNetService = inject(SourcePetriNetService);

    private _currentInvariantEntry: Invariant | undefined;
    private _currentInvariantStr = '2p1 * -p3, p4;5p6 -3 p2';
    private _idCounter = 0;

    inputInvariants = signal<Invariant[]>([]);
    calculatedInvariants = signal<Invariant[]>([]);

    findInvariants(diagram: Diagram) {
        const incidenceMatrix = this.createIncidenceMatrix(diagram);
        const extendedMatrix = this.extendIncidenceMatrix(incidenceMatrix);
        this.calculatedInvariants.set(this.calculateInvariants(diagram.places, extendedMatrix));
    }

    resetInvariants() {
        console.log("Resetting invariants");
        this.inputInvariants.set([]);
        this.calculatedInvariants.set([]);
    }

    createIncidenceMatrix(diagram: Diagram): number[][] {
        const places = diagram.places;
        const transitions = diagram.transitions;
        const matrix: number[][] = Array.from({ length: places.length }, () => Array(transitions.length).fill(0));
        for (let i = 0; i < transitions.length; i++) {
            const inputFlows = transitions[i].getInputFlow();
            const outputFlows = transitions[i].getOutputFlow();
            inputFlows.forEach(({ place, weight }) => {
                const pIndex = places.findIndex(p => p.id === place.id);
                matrix[pIndex][i] -= weight;
            });

            outputFlows.forEach(({ place, weight }) => {
                const pIndex = places.findIndex(p => p.id === place.id);
                matrix[pIndex][i] += weight;
            });
        }
        return matrix;
    }

    extendIncidenceMatrix(matrix: number[][]): number[][] {
        const extendedMatrix: number[][] = matrix.map((row, i) => {
            const extendedRow = [...row];
            for (let j = 0; j < matrix.length; j++) {
                extendedRow.push(i === j ? 1 : 0);
            }
            return extendedRow;
        });
        return extendedMatrix;
    }

    calculateInvariants(allPlaces: DiagramPlace[], extendedMatrix: number[][]): Invariant[] {
        const invariant = new Invariant(this._idCounter++, this._currentInvariantStr, new Map(), true);
        invariant.parseText(allPlaces);
        return [invariant];
    }
}