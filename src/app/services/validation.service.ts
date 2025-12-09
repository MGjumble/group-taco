// Service / utility for validating a drawn process net against the original Petri net
// Based on user-provided specification, with minor fixes (e.g., producer count increment).

export interface PetriNet {
    places: string[];
    transitions: string[];
    arcs: Record<string, number>; // key: "source,target" -> weight
    labels: Record<string, string>; // original transition id -> label (e.g. t1 -> A)
    marking?: Record<string, number>;
    startPlaces?: string[];
}

export interface ProcessElement {
    id: string;
    type: 'Place' | 'Transition';
    label: string; // places: original place id (e.g. p4), transitions: action label (e.g. A/B/C/...)
    isStartPlace?: boolean;
}

export interface ProcessConnection {
    from: string; // element id
    to: string; // element id
    weight: number; // arc weight in the process net (>= 1)
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateProcessNet(
    net: PetriNet,
    elements: ProcessElement[],
    connections: ProcessConnection[],
): ValidationResult {
    const errors: string[] = [];

    const elementMap = new Map<string, ProcessElement>(elements.map((e) => [e.id, e]));
    const placeLabelById = new Map<string, string>();
    const transitionLabelById = new Map<string, string>();
    elements.forEach((el) => {
        if (el.type === 'Place') {
            placeLabelById.set(el.id, el.label);
        } else {
            transitionLabelById.set(el.id, el.label);
        }
    });

    const connectionsByTarget: Record<string, ProcessConnection[]> = {};
    const connectionsBySource: Record<string, ProcessConnection[]> = {};
    connections.forEach((conn) => {
        (connectionsBySource[conn.from] ||= []).push(conn);
        (connectionsByTarget[conn.to] ||= []).push(conn);
    });

    const errorsFromStructure = validateTransitionsForStructure(net, elements, connections, elementMap);
    errors.push(...errorsFromStructure);

    const errorsFromPlaces = validatePlaceInputs(net, elements, connectionsByTarget, placeLabelById);
    errors.push(...errorsFromPlaces);

    const errorsFromProducerLimit = validateProducerUniqueness(elements, connections, elementMap);
    errors.push(...errorsFromProducerLimit);

    const errorsFromStartPlaces = validateStartPlacesPresence(net, elements);
    errors.push(...errorsFromStartPlaces);

    const errorsFromCycles = validateAcyclicity(elements, connections);
    errors.push(...errorsFromCycles);

    return {
        valid: errors.length === 0,
        errors,
    };
}

function validateTransitionsForStructure(
    net: PetriNet,
    elements: ProcessElement[],
    connections: ProcessConnection[],
    elementMap: Map<string, ProcessElement>,
): string[] {
    const errors: string[] = [];

    const mapLabelToTransition = (label: string): string | undefined =>
        Object.keys(net.labels).find((t) => net.labels[t] === label);

    // --------- 2) Original pre/post sets (by label) and weights ---------
    const origPre: Record<string, string[]> = {};
    const origPost: Record<string, string[]> = {};
    const origPreW: Record<string, Record<string, number>> = {}; // t -> place -> weight
    const origPostW: Record<string, Record<string, number>> = {}; // t -> place -> weight

    net.transitions.forEach((t) => {
        origPre[t] = [];
        origPost[t] = [];
        origPreW[t] = {};
        origPostW[t] = {};
    });

    Object.entries(net.arcs).forEach(([arc, weight]) => {
        const [from, to] = arc.split(',');
        if (net.places.includes(from) && net.transitions.includes(to)) {
            origPre[to].push(from);
            origPreW[to][from] = weight;
        } else if (net.transitions.includes(from) && net.places.includes(to)) {
            origPost[from].push(to);
            origPostW[from][to] = weight;
        }
    });

    // --------- 3) Process net pre/post sets (by label) and weights ---------
    const procPre: Record<string, string[]> = {};
    const procPost: Record<string, string[]> = {};
    const procPreW: Record<string, Record<string, number>> = {}; // tOcc -> placeLabel -> sum weight
    const procPostW: Record<string, Record<string, number>> = {}; // tOcc -> placeLabel -> sum weight

    elements
        .filter((e) => e.type === 'Transition')
        .forEach((t) => {
            procPre[t.id] = [];
            procPost[t.id] = [];
            procPreW[t.id] = {};
            procPostW[t.id] = {};
        });

    connections.forEach((c) => {
        const src = elementMap.get(c.from);
        const tgt = elementMap.get(c.to);
        if (!src || !tgt) return;

        if (src.type === 'Place' && tgt.type === 'Transition') {
            // store original place label (already the original id)
            procPre[tgt.id].push(src.label);
            procPreW[tgt.id][src.label] = (procPreW[tgt.id][src.label] || 0) + (c.weight || 1);
        }
        if (src.type === 'Transition' && tgt.type === 'Place') {
            procPost[src.id].push(tgt.label);
            procPostW[src.id][tgt.label] = (procPostW[src.id][tgt.label] || 0) + (c.weight || 1);
        }
    });

    elements
        .filter((e) => e.type === 'Transition')
        .forEach((tOcc) => {
            const originalT = mapLabelToTransition(tOcc.label);
            if (!originalT) {
                errors.push(`❌ Transition ${tOcc.label} hat keine passende Beschriftung im Petrinetz.`);
                return;
            }

            const normalize = (values: string[]) => Array.from(new Set(values)).sort();

            const expectedPre = origPre[originalT];
            const actualPre = procPre[tOcc.id];
            const expectedPreSet = normalize(expectedPre);
            const actualPreSet = normalize(actualPre);
            if (JSON.stringify(expectedPreSet) !== JSON.stringify(actualPreSet)) {
                errors.push(
                    `❌ Vorbereich falsch bei ${tOcc.label}. Erwartet: ${expectedPreSet.join(',')} / Gefunden: ${actualPreSet.join(',')}`,
                );
            } else {
                // If structure matches, verify weights for each required place label
                expectedPreSet.forEach((pl) => {
                    const expW = origPreW[originalT][pl] ?? 1;
                    const actW = procPreW[tOcc.id][pl] ?? 0;
                    if (expW !== actW) {
                        errors.push(
                            `❌ Vorbereichsgewicht falsch bei ${tOcc.label} für Stelle ${pl}. Erwartet: ${expW} / Gefunden: ${actW}`,
                        );
                    }
                });
            }

            const expectedPost = origPost[originalT];
            const actualPost = procPost[tOcc.id];
            const expectedPostSet = normalize(expectedPost);
            const actualPostSet = normalize(actualPost);
            if (JSON.stringify(expectedPostSet) !== JSON.stringify(actualPostSet)) {
                errors.push(
                    `❌ Nachbereich falsch bei ${tOcc.label}. Erwartet: ${expectedPostSet.join(',')} / Gefunden: ${actualPostSet.join(',')}`,
                );
            } else {
                expectedPostSet.forEach((pl) => {
                    const expW = origPostW[originalT][pl] ?? 1;
                    const actW = procPostW[tOcc.id][pl] ?? 0;
                    if (expW !== actW) {
                        errors.push(
                            `❌ Nachbereichsgewicht falsch bei ${tOcc.label} für Stelle ${pl}. Erwartet: ${expW} / Gefunden: ${actW}`,
                        );
                    }
                });
            }
        });

    return errors;
}

function validatePlaceInputs(
    net: PetriNet,
    elements: ProcessElement[],
    connectionsByTarget: Record<string, ProcessConnection[]>,
    placeLabelById: Map<string, string>,
): string[] {
    const errors: string[] = [];

    elements
        .filter((el) => el.type === 'Place')
        .forEach((place) => {
            const isStartNode = place.isStartPlace ?? false;
            const incoming = connectionsByTarget[place.id] || [];
            if (!isStartNode && incoming.length === 0) {
                errors.push(
                    `❌ Stelle ${place.label} besitzt keinen eingehenden Bogen, obwohl sie kein Startplatz in diesem Prozessnetz ist.`,
                );
            }
        });

    return errors;
}

function validateProducerUniqueness(
    elements: ProcessElement[],
    connections: ProcessConnection[],
    elementMap: Map<string, ProcessElement>,
): string[] {
    const errors: string[] = [];
    const producerCount: Record<string, number> = {};
    connections.forEach((conn) => {
        const src = elementMap.get(conn.from);
        const tgt = elementMap.get(conn.to);
        if (src?.type === 'Transition' && tgt?.type === 'Place') {
            producerCount[tgt.id] = (producerCount[tgt.id] || 0) + 1;
        }
    });

    Object.entries(producerCount).forEach(([placeId, count]) => {
        if (count > 1) {
            errors.push(`❌ Stelle ${placeId} hat mehr als einen Produzenten – verletzt Kausalität.`);
        }
    });
    return errors;
}

function validateAcyclicity(elements: ProcessElement[], connections: ProcessConnection[]): string[] {
    const errors: string[] = [];
    const graph: Record<string, string[]> = {};
    elements.forEach((el) => (graph[el.id] = []));
    connections.forEach((c) => graph[c.from].push(c.to));

    const visited = new Set<string>();
    const stack = new Set<string>();

    const visit = (node: string): boolean => {
        if (stack.has(node)) return true;
        if (visited.has(node)) return false;
        visited.add(node);
        stack.add(node);
        for (const nxt of graph[node]) {
            if (visit(nxt)) return true;
        }
        stack.delete(node);
        return false;
    };

    if (Object.keys(graph).some((node) => visit(node))) {
        errors.push('❌ Prozessnetz enthält einen Zyklus – Prozessnetze müssen azyklisch sein.');
    }

    return errors;
}

function validateStartPlacesPresence(net: PetriNet, elements: ProcessElement[]): string[] {
    const errors: string[] = [];
    const requiredStartPlaces = new Set(
        Object.entries(net.marking ?? {})
            .filter(([, tokens]) => (tokens ?? 0) > 0)
            .map(([placeId]) => placeId),
    );
    if (requiredStartPlaces.size === 0) {
        return errors;
    }

    const providedStartPlaces = new Set(net.startPlaces ?? []);
    const missingProvided = [...requiredStartPlaces].filter((placeId) => !providedStartPlaces.has(placeId));
    if (missingProvided.length > 0) {
        errors.push(
            `❌ Startplätze fehlen im Prozessnetz: ${missingProvided.join(', ')}. Bitte alle markierten Plätze platzieren.`,
        );
    }

    const drawnPlaceLabels = new Set(elements.filter((el) => el.type === 'Place').map((el) => el.label));
    const missingDrawn = [...requiredStartPlaces].filter((placeId) => !drawnPlaceLabels.has(placeId));
    if (missingDrawn.length > 0) {
        errors.push(`❌ Die markierten Startplätze (${missingDrawn.join(', ')}) befinden sich nicht im Prozessnetz.`);
    }

    return errors;
}
