import EventEmitter from 'eventemitter3';

const SIXTY_PER_SEC = 1000 / 60;
const LOOP_SLOW_THRESH = 0.3;
const LOOP_SLOW_COUNT = 10;

type SchedulerOptions = {
    period: number,
    delay: number,
    stepPeriod: number,
    tick: () => void,
};

/**
 * Scheduler class
 *
 */
export default class Scheduler extends EventEmitter {
    options: Required<SchedulerOptions>;
    nextExecTime: number = 0;
    requestedDelay: number = 0;
    delayCounter: number = 0;

    /**
     * schedule a function to be called
     *
     * @param {Object} options the options
     * @param {Function} options.tick the function to be called
     * @param {Number} options.period number of milliseconds between each invocation, not including the function's execution time
     * @param {Number} options.delay number of milliseconds to add when delaying or hurrying the execution
     */
    constructor(options?: SchedulerOptions) {
        super();
        this.options = Object.assign({
            tick: null,
            period: SIXTY_PER_SEC,
            delay: SIXTY_PER_SEC / 3
        }, options);
    }

    // in same cases, setTimeout is ignored by the browser,
    // this is known to happen during the first 100ms of a touch event
    // on android chrome.  Double-check the game loop using requestAnimationFrame
    nextTickChecker() {
        let currentTime = (new Date()).getTime();
        if (currentTime > this.nextExecTime) {
            this.delayCounter++;
            this.callTick();
            this.nextExecTime = currentTime + this.options.stepPeriod;
        }

        if (typeof window !== 'undefined') {
            window.requestAnimationFrame(this.nextTickChecker.bind(this));
        }
    }

    nextTick() {
        let stepStartTime = (new Date()).getTime();
        if (stepStartTime > this.nextExecTime + this.options.period * LOOP_SLOW_THRESH) {
            this.delayCounter++;
        } else
            this.delayCounter = 0;

        this.callTick();
        this.nextExecTime = stepStartTime + this.options.period + this.requestedDelay;
        this.requestedDelay = 0;
        setTimeout(this.nextTick.bind(this), this.nextExecTime - (new Date()).getTime());
    }

    callTick() {
        if (this.delayCounter >= LOOP_SLOW_COUNT) {
            this.emit('loopRunningSlow');
            this.delayCounter = 0;
        }
        this.options.tick();
    }

    /**
     * start the schedule
     * @return {Scheduler} returns this scheduler instance
     */
    start(): this {
        setTimeout(this.nextTick.bind(this));
        if (typeof window === 'object' && typeof window.requestAnimationFrame === 'function')
            window.requestAnimationFrame(this.nextTickChecker.bind(this));
        return this;
    }

    /**
     * delay next execution
     */
    delayTick() {
        this.requestedDelay += this.options.delay;
    }

    /**
     * hurry the next execution
     */
    hurryTick() {
        this.requestedDelay -= this.options.delay;
    }
}
