import InterpolateStrategy from './syncStrategies/InterpolateStrategy';
import ExtrapolateStrategy from './syncStrategies/ExtrapolateStrategy';
import FrameSyncStrategy from './syncStrategies/FrameSyncStrategy';
import SyncStrategy from './syncStrategies/SyncStrategy';
import { ClientEngine } from './ClientEngine';

const strategies = {
    extrapolate: ExtrapolateStrategy,
    interpolate: InterpolateStrategy,
    frameSync: FrameSyncStrategy
} as const;

export type SynchronizerOptions = {
    sync: keyof typeof strategies;
}

export default class Synchronizer {
    clientEngine: ClientEngine;
    options: SynchronizerOptions;
    syncStrategy: SyncStrategy;

    // create a synchronizer instance
    constructor(clientEngine: ClientEngine, options: SynchronizerOptions) {
        this.clientEngine = clientEngine;
        this.options = options || {};

        if (!strategies.hasOwnProperty(this.options.sync)) {
            throw new Error(`ERROR: unknown synchronzation strategy ${this.options.sync}`);
        }

        this.syncStrategy = (new strategies[this.options.sync](this.clientEngine, this.options)) as any;
    }
}
