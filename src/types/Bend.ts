export type Bend = {
    percent: number;
    min?: number;
    max?: number;
};

export type IncrementalBend = Bend & {
    increments: number
};

export type Bending<TKeys extends string = string> =
    Partial<Record<TKeys, Bend>>;

export type IncrementalBending<TKeys extends string = string> =
    Partial<Record<TKeys, IncrementalBend>>;
