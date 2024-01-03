export type BendOption = {
    percent: number;
    min?: number;
    max?: number;
};

export type IncrementalBendOption = BendOption & {
    increments: number
};

export type BendingOptions<TKeys extends string = string> =
    & Partial<Record<`${TKeys}Local`, BendOption>>
    & Partial<Record<TKeys, BendOption>>;

export type IncrementalBendingOptions<TKeys extends string = string> =
    & Partial<Record<`${TKeys}Local`, IncrementalBendOption>>
    & Partial<Record<TKeys, IncrementalBendOption>>;

export type BendingDeltas<TKeys extends string = string, TData = unknown> =
    & Partial<Record<`${TKeys}Delta`, TData>>;

export interface Bendable<TKeys extends string = string, TData = unknown> {
    bendDeltas: BendingDeltas<TKeys, TData>
    defaultBendingOptions?: IncrementalBendOption;
    bendingOptions?: IncrementalBendingOptions<TKeys>;
    bendingIncrements?: number;

    applyIncrementalBending(step?: { dt?: number }): void;
    bendFromSavedToCurrentState(percent: number, worldSettings: any, isLocal: boolean, increments: number): void;
    bendToCurrent<TThis extends this>(fromSource: TThis, percent: number, worldSettings: any, isLocal: boolean, increments: number): void;
    // bendTo<TThis extends this>(target: TThis, percent: number, worldSettings: any, isLocal: boolean, increments: number): void;
    bendToString(): string;
}
