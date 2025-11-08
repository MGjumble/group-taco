// Service / utility for validating a drawn process net against the original Petri net
// Based on user-provided specification, with minor fixes (e.g., producer count increment).

export interface PetriNet {
    places: string[];
    transitions: string[];
    arcs: Record<string, number>; // key: "source,target" -> weight
    labels: Record<string, string>; // original transition id -> label (e.g. t1 -> A)
}

export interface ProcessElement {
    id: string;
    type: 'Place' | 'Transition';
    label: string; // places: original place id (e.g. p4), transitions: action label (e.g. A/B/C/...)
}

export interface ProcessConnection {
    from: string; // element id
    to: string; // element id
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

    // --------- 1) Map Transition-Labels back to Petri-Net transitions ---------
    const mapLabelToTransition = (label: string): string | undefined =>
        Object.keys(net.labels).find((t) => net.labels[t] === label);

    // --------- 2) Original pre/post sets ---------
    const origPre: Record<string, string[]> = {};
    const origPost: Record<string, string[]> = {};

    net.transitions.forEach((t) => {
        origPre[t] = [];
        origPost[t] = [];
    });

    Object.entries(net.arcs).forEach(([arc, _weight]) => {
        const [from, to] = arc.split(',');
        if (net.places.includes(from) && net.transitions.includes(to)) {
            origPre[to].push(from);
        } else if (net.transitions.includes(from) && net.places.includes(to)) {
            origPost[from].push(to);
        }
    });

    // --------- 3) Process net pre/post sets ---------
    const procPre: Record<string, string[]> = {};
    const procPost: Record<string, string[]> = {};

    elements
        .filter((e) => e.type === 'Transition')
        .forEach((t) => {
            procPre[t.id] = [];
            procPost[t.id] = [];
        });

    const elementMap = new Map<string, ProcessElement>(elements.map((e) => [e.id, e]));

    connections.forEach((c) => {
        const src = elementMap.get(c.from);
        const tgt = elementMap.get(c.to);
        if (!src || !tgt) return;

        if (src.type === 'Place' && tgt.type === 'Transition') {
            // store original place label (already the original id)
            procPre[tgt.id].push(src.label);
        }
        if (src.type === 'Transition' && tgt.type === 'Place') {
            procPost[src.id].push(tgt.label);
        }
    });

    // --------- 4) Structural compliance ---------
    elements
        .filter((e) => e.type === 'Transition')
        .forEach((tOcc) => {
            const originalT = mapLabelToTransition(tOcc.label);
            if (!originalT) {
                errors.push(`❌ Transition ${tOcc.id} (${tOcc.label}) hat keine passende Beschriftung im Petrinetz.`);
                return;
            }

            const expectedPre = origPre[originalT].slice().sort();
            const actualPre = procPre[tOcc.id].slice().sort();
            if (JSON.stringify(expectedPre) !== JSON.stringify(actualPre)) {
                errors.push(
                    `❌ Vorbereich falsch bei ${tOcc.id} (${tOcc.label}). Erwartet: ${expectedPre.join(',')} / Gefunden: ${actualPre.join(
                        ',',
                    )}`,
                );
            }

            const expectedPost = origPost[originalT].slice().sort();
            const actualPost = procPost[tOcc.id].slice().sort();
            if (JSON.stringify(expectedPost) !== JSON.stringify(actualPost)) {
                errors.push(
                    `❌ Nachbereich falsch bei ${tOcc.id} (${tOcc.label}). Erwartet: ${expectedPost.join(',')} / Gefunden: ${actualPost.join(
                        ',',
                    )}`,
                );
            }
        });

    // --------- 5) Unique token origin (each place copy max 1 predecessor) ---------
    const producerCount: Record<string, number> = {};
    connections.forEach((c) => {
        const src = elementMap.get(c.from);
        const tgt = elementMap.get(c.to);
        if (src?.type === 'Transition' && tgt?.type === 'Place') {
            producerCount[tgt.id] = (producerCount[tgt.id] || 0) + 1;
        }
    });

    Object.entries(producerCount).forEach(([placeId, count]) => {
        if (count > 1) {
            errors.push(`❌ Stelle ${placeId} hat mehr als einen Produzenten – verletzt Kausalität.`);
        }
    });

    // --------- 6) Acyclicity ---------
    const graph: Record<string, string[]> = {};
    elements.forEach((el) => (graph[el.id] = []));
    connections.forEach((c) => graph[c.from].push(c.to));

    function hasCycle(): boolean {
        const visited = new Set<string>();
        const stack = new Set<string>();

        function visit(node: string): boolean {
            if (stack.has(node)) return true;
            if (visited.has(node)) return false;
            visited.add(node);
            stack.add(node);
            for (const nxt of graph[node]) {
                if (visit(nxt)) return true;
            }
            stack.delete(node);
            return false;
        }

        return Object.keys(graph).some(visit);
    }

    if (hasCycle()) {
        errors.push('❌ Prozessnetz enthält einen Zyklus – Prozessnetze müssen azyklisch sein.');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
