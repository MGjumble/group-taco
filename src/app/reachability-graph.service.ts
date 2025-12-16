import { Injectable, inject, signal } from '@angular/core';
import { FiringEntry } from './classes/firing-entry';
import { ReachabilityGraph } from './classes/reachability-graph.model';
import { StateNode } from './classes/reachability-graph.model';
import { ModeService } from './services/mode.service';
import { AppMode } from './classes/app-mode';
// import { ToasterNotificationService } from './toaster-notification.service';
// import { DiagramTransition } from '../classes/diagram/diagram-transition';
import { SourcePetriNetService } from './services/source-petri-net.service';
import { Diagram } from './classes/diagram/diagram';
import { subscribeOn } from 'rxjs';
// import { TabStateService } from './tab-state.service';
// import { Tab } from '../classes/tabs';

@Injectable({
    providedIn: 'root',
})
export class ReachabilityGraphService {
    private _reachabilityGraph: ReachabilityGraph = new ReachabilityGraph();
    private _modeService: ModeService = inject(ModeService);
    private _sourceNetService = inject(SourcePetriNetService);
    private _startMarkingRG: Record<string, number> = {};
    private _currentMarkingRG = signal<Record<string, number>>(this._startMarkingRG);

    set startMarkingRG(marking: Record<string, number>) {
        this._startMarkingRG = marking;
    }

    set currentMarkingRG(marking: Record<string, number>) {
        this._currentMarkingRG.set(marking);
    }

    //bekommt firing entry und macht dann eine nodeID daraus und übergibt an reachability graph als stateNode+//woher x und y?

    // get marking
    // only take numbers from record of Sting and number, display as label and add to model (Id)

    //also update reachability graph model? --> dem reach service übergeben, nach Sortierung, service entfernt placebezeichner und sortiert nur nummern

    //node übergeben bzw ganzes Diagram und DiagramTransition an RGService
    //Node als StateNode behandeln und Label
    //KOMPLETTES KEY VALUE PAIR , damit gerechnet und später zurückgegeben werden kann
    //place und number of tokens

    /**
     * Method to initialize first StateNode of Reachability Graph
     * Extracts marking from reachability-graph-display
     * beim Initialisieren direkt den ersten Knoten anlegen
     *
     */
    initializeReachabilityGraphFirstStateNode() {
        if (this._modeService.currentMode() === AppMode.LEARN) {
            //AUTOMATISCH StateNode erzeugen
            //Current marking auslesen
            this._startMarkingRG = this._sourceNetService.getCurrentSourceNet()?.startMarking || {};
            let reachabilityLabel: string = Object.values(this.startMarkingRG).join('');
            let initialRgId: string = 'RG00';
            //x und y Startwert konstant festlegen
            let initialX: number = 100;
            let initialY: number = 100;
            //neuen StateNode erzeugen
            let initialStateNode = new StateNode(
                initialRgId,
                initialX,
                initialY,
                reachabilityLabel,
                this.startMarkingRG,
            );
            this._reachabilityGraph.nodes.push(initialStateNode);

            console.log(reachabilityLabel);
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

    //WIRKLICH VON HIER NEHMEN - ODER AUS DEM RG-Mdoel mit Subscrbe, wenn sich das Netz ändert? - Was ist "sauberer"?
    convertFiringEntryLabelToReachabilityGraphID(firingEntry: FiringEntry) {
        // firingEntry.endMarking.
        //Fallunterscheidung zwischen erstem Aufruf und dann Aufruf nach Schalten / Firing
        let reachabilityLabel: string = Object.entries(firingEntry.endMarking)
            .map(([key, value]) => `${value}`)
            .join(' ');
        console.log(reachabilityLabel);

        //HIER X UND Y EINFACH JE +100 FÜR DEN ANFANG
        //später dann aus Algorithmus ziehen (Spring Embedder oder Sugiyama, für alle Tabs gleich)

        // return new DiagramPlace(id, initialTokens);

        //new State Node

        //add StateNode zu Liste/ fullRG

        //nextStateNode

        // })

        //   formatMarking(marking: Record<string, number>): string {
        //         return Object.entries(marking)
        //             .map(([key, value]) => `${key}:${value}`)
        //             .join(', ');
        //     }
        //use only Label or use complete FirngEntry?
    }

    //Methode public ALLE state nodes zurückgeben

    //Methode 2 public ALLE edges zurückgeben

    //Methode public ALLE state nodes zurückgeben

    //Methode 2 public ALLE edges zurückgeben
}
