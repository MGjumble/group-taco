export interface Pnml {
    pnml: {
        net: PnmlNet;
    };
}

export interface PnmlNet {
    '@_id': string;
    '@_type': string;
    place: PnmlPlace[];
    transition: PnmlTransition[];
    arc: PnmlArc[];
}

export interface PnmlPlace {
    '@_id': string;
    graphics: {
        position: PnmlPosition;
    };
    initialMarking?: {
        text?: string | number;
    };
}

export interface PnmlTransition {
    '@_id': string;
    name?: {
        text?: string;
    };
    graphics: {
        position: PnmlPosition;
    };
}

export interface PnmlArc {
    '@_id': string;
    '@_source': string;
    '@_target': string;
    inscription: {
        text?: number;
    };
    graphics: {
        position?: PnmlPosition[] | PnmlPosition;
    };
}

export interface PnmlPosition {
    '@_x': number;
    '@_y': number;
}
