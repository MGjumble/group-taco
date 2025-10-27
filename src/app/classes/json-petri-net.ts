export interface JsonPetriNet {
    places: string[];
    transitions: string[];
    arcs?: Record<string, number>;
    actions?: string[];
    labels?: Record<string, string>;
    marking?: Record<string, number>;
    layout?: Record<string, Coords | Coords[]>;
}

export interface Coords {
    x: number;
    y: number;
}
