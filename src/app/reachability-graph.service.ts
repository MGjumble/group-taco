import { Injectable, inject, signal } from '@angular/core';
import { PlayService } from './services/play.service';
import { FiringEntry } from '../classes/firing-entry';
import { ReachabilityGraph } from './classes/reachability-graph.model';
import { ToasterNotificationService } from './toaster-notification.service';
import { DiagramTransition } from '../classes/diagram/diagram-transition';
import { Diagram } from '../classes/diagram/diagram';
import { SourcePetriNetService } from './source-petri-net.service';
import { TabStateService } from './tab-state.service';
import { Tab } from '../classes/tabs';

@Injectable({
    providedIn: 'root',
})
export class ReachabilityGraphService {
    private _playService = inject(PlayService);
    private firedMarking = FiringEntry;
    

    //beim Initialisieren direkt den ersten Knoten anlegen
    //erst danach vom Firing übernehmen
    //bekommt firing entry und macht dann eine nodeID daraus und übergibt an reachability graph als stateNode+//woher x und y?

    // get marking
    // only take numbers from record of Sting and number, display as label and add to model (Id)

    /**
     * Gets firing entry label (Place names and tokens) from play service
     * Converts to RG ID (only displays token numbers sorted ascending by place id (alphanumerical))
     * Erstellt einzelnes state-Objekt
     * @param firingEntryLabel The label of the fired transition.
     */
convertFiringEntryLabelToReachabilityGraphID(firingEntry: FiringEntry){
// firingEntry.endMarking.
//Fallunterscheidung zwischen erstem Aufruf und dann Aufruf nach Schalten / Firing
let reachabilityLabel: string = Object.entries(firingEntry.endMarking).map(([key, value]) => `${value}`)
             .join(' ');
console.log(reachabilityLabel);

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
