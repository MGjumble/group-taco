import { Injectable, inject, signal, WritableSignal, Signal } from '@angular/core';
import { FiringEntry } from './classes/firing-entry';
import { FiringEdge, ReachabilityGraph } from './classes/reachability-graph.model';
import { StateNode } from './classes/reachability-graph.model';
import { SvgArcComponent } from './components/display/svg-arc/svg-arc.component';
import { SvgNodeComponent } from './components/display/svg-node/svg-node.component';
import { ModeService } from './services/mode.service';
import { AppMode } from './classes/app-mode';
import { SourcePetriNetService } from './services/source-petri-net.service';
import { Diagram } from './classes/diagram/diagram';
import { subscribeOn } from 'rxjs';
import { TabStateService } from './services/tab-state.service';

@Injectable({
    providedIn: 'root',
})
export class ReachabilityGraphService {
    private _reachabilityGraph: WritableSignal<ReachabilityGraph> = signal(new ReachabilityGraph());
    private _modeService: ModeService = inject(ModeService);
    private _sourceNetService = inject(SourcePetriNetService);
    private _startMarkingRG: Record<string, number> = {};
    private _currentMarkingRG = signal<Record<string, number>>(this._startMarkingRG);
    // private _rgTabStateService = inject(TabStateService);

    //TODO: Later on, implement better algorithm for placement of StateNodes
    private xCounter = 2;
    private yCounter = 2;
    //Counter for StateNodeIDs
    private idCounter = 1;
    //Counter für Kanten im EG
    private rgEdgeCounter = 1;
    //Changed for Arc recognition; StateNodes to be cmpared by ID, not by label
    private initialRgId: string = 'RG' + this.idCounter;
    private currentSourceRgId: string = 'RG' + this.idCounter;
    private currentTargetRgId = '';

    set startMarkingRG(marking: Record<string, number>) {
        this._startMarkingRG = marking;
    }

    set currentMarkingRG(marking: Record<string, number>) {
        this._currentMarkingRG.set(marking);
    }

    get reachabilityGraphSignal(): Signal<ReachabilityGraph> {
        return this._reachabilityGraph.asReadonly();
    }

    /**
     * Method to initialize first StateNode of Reachability Graph
     * Extracts marking from reachability-graph-display
     * beim Initialisieren direkt den ersten Knoten anlegen
     *
     */
    initializeReachabilityGraphFirstStateNode() {
        if (!this._sourceNetService.getCurrentSourceNet()) return;
        if (this._modeService.currentMode() === AppMode.LEARN) {
            //AUTOMATISCH StateNode erzeugen
            //Current marking auslesen
            this._startMarkingRG = this._sourceNetService.getCurrentSourceNet()?.startMarking || {};
            const initialReachabilityLabel: string = Object.values(this._startMarkingRG).join(' ');
            //x und y Startwert konstant festlegen
            const initialX = 100;
            const initialY = 100;
            //neuen StateNode erzeugen
            const initialStateNode = new StateNode(
                this.initialRgId,
                initialX,
                initialY,
                initialReachabilityLabel,
                this.startMarkingRG,
            );

            this._reachabilityGraph.update((graph) => {
                const newGraph = new ReachabilityGraph();
                newGraph.nodes = [...graph.nodes, initialStateNode];
                newGraph.edges = [...graph.edges];
                return newGraph;
            });

            console.log('initialReachabilityLabel' + initialReachabilityLabel);
            //increment counters
            this.idCounter++;
        } else if (this._modeService.currentMode() === AppMode.EXAM) {
            //nur im Hintergrund vergleichen, User gibt NodeLabel, also Marking, selbst ein und bekommt Feedback
        }
    }

    /**
     * Gets firing entry label (Place names and tokens) from play service
     * Converts to RG ID (only displays token numbers sorted ascending by place id (alphanumerical))
     * Erstellt einzelnes state-Objekt
     * erst danach vom Firing übernehmen
     * @param firingEntryLabel The label of the fired transition.
     */

    convertFiringEntryLabelToReachabilityGraphID(firingEntry: FiringEntry, label: string) {
        const _markingRG = this._sourceNetService.getCurrentSourceNet()?.currentMarking$ || {};
        //Vorherigen Zustand für Arc speichern
        const previousReachabilityLabel: string = Object.entries(firingEntry.startMarking)
            .map(([key, value]) => `${value}`)
            .join(' ');

        //Zustand nach Schalten / Target für Arcs
        const currentReachabilityLabel: string = Object.entries(firingEntry.endMarking)
            .map(([key, value]) => `${value}`)
            .join(' ');

        //IDs werden verglichen bei Source und Target
        //TO-DO: ANPASSEN UND SCHAUEN, WIE ES KLAPPT

        const currentRgId: string = 'RG' + this.idCounter;
        console.log('currentRGID' + currentRgId);
        console.log('currentSourceRgId' + this.currentSourceRgId);
        this.currentTargetRgId = currentRgId;
        console.log('currentTargetRgId' + this.currentTargetRgId);

        //x und y Startwert konstant festlegen
        const currentX: number = this.xCounter * 100;
        const currentY: number = this.yCounter * 100;
        //neuen StateNode erzeugen
        const currentStateNode = new StateNode(
            currentRgId,
            currentX,
            currentY,
            currentReachabilityLabel,
            this.startMarkingRG,
        );

        const currentRgEdgeId: string = 'Edge' + this.rgEdgeCounter;
        const currentRgEdgeLabel: string = label;
        //get FiringSequence and save as path for RG
        const currentRgEdgeFiringPath: string = firingEntry.firingSequence;

        const currentFiringEdge = new FiringEdge(
            currentRgEdgeId,
            this.currentSourceRgId,
            this.currentTargetRgId,
            currentRgEdgeLabel,
            currentRgEdgeFiringPath,
        );

        this._reachabilityGraph.update((graph) => {
            const newGraph = new ReachabilityGraph();
            newGraph.nodes = [...graph.nodes, currentStateNode];
            newGraph.edges = [...graph.edges, currentFiringEdge];
            return newGraph;
        });

        console.log(this._reachabilityGraph());

        //increment counters
        this.idCounter++;
        this.xCounter++;
        this.yCounter++;
        this.rgEdgeCounter++;

        //change target to new source for arcs
        this.currentSourceRgId = this.currentTargetRgId;
        //delete "old" target
        this.currentTargetRgId = '';

        console.log(currentReachabilityLabel);
    }
    //Methode public ALLE state nodes zurückgeben
    //Methode 2 public ALLE edges zurückgeben
}
