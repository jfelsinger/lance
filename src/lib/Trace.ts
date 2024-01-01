enum TRACE_LEVEL {
    TRACE_ALL = 0,
    TRACE_DEBUG = 1,
    TRACE_INFO = 2,
    TRACE_WARN = 3,
    TRACE_ERROR = 4,
    TRACE_NONE = 1000,
}

/**
 * Tracing Services.
 * Use the trace functions to trace game state.  Turn on tracing by
 * specifying the minimum trace level which should be recorded.  For
 * example, setting traceLevel to Trace.TRACE_INFO will cause info,
 * warn, and error traces to be recorded.
 */
class Trace {
    traceBuffer: any[] = [];
    step: string;

    error: any;
    warn: any;
    info: any;
    debug: any;

    constructor(public options: { traceLevel: TRACE_LEVEL } = { traceLevel: TRACE_LEVEL.TRACE_DEBUG }) {
        this.options = Object.assign({
            traceLevel: Trace.TRACE_DEBUG
        }, options);

        this.step = 'initializing';

        // syntactic sugar functions
        this.error = this.trace.bind(this, Trace.TRACE_ERROR);
        this.warn = this.trace.bind(this, Trace.TRACE_WARN);
        this.info = this.trace.bind(this, Trace.TRACE_INFO);
        this.debug = this.trace.bind(this, Trace.TRACE_DEBUG);
        this.trace = this.trace.bind(this, Trace.TRACE_ALL);
    }

    /**
     * Include all trace levels.
     * @memberof Trace
     * @member {Number} TRACE_ALL
     */
    static get TRACE_ALL() { return TRACE_LEVEL.TRACE_ALL; }

    /**
     * Include debug traces and higher.
     * @memberof Trace
     * @member {Number} TRACE_DEBUG
     */
    static get TRACE_DEBUG() { return TRACE_LEVEL.TRACE_DEBUG; }

    /**
     * Include info traces and higher.
     * @memberof Trace
     * @member {Number} TRACE_INFO
     */
    static get TRACE_INFO() { return TRACE_LEVEL.TRACE_INFO; }

    /**
     * Include warn traces and higher.
     * @memberof Trace
     * @member {Number} TRACE_WARN
     */
    static get TRACE_WARN() { return TRACE_LEVEL.TRACE_WARN; }

    /**
     * Include error traces and higher.
     * @memberof Trace
     * @member {Number} TRACE_ERROR
     */
    static get TRACE_ERROR() { return TRACE_LEVEL.TRACE_ERROR; }

    /**
     * Disable all tracing.
     * @memberof Trace
     * @member {Number} TRACE_NONE
     */
    static get TRACE_NONE() { return TRACE_LEVEL.TRACE_NONE; }

    trace(level: TRACE_LEVEL, dataCB: any) {

        // all traces must be functions which return strings
        if (typeof dataCB !== 'function') {
            throw new Error(`Lance trace was called but instead of passing a function, it received a [${typeof dataCB}]`);
        }

        if (level < this.options.traceLevel)
            return;

        this.traceBuffer.push({ data: dataCB(), level, step: this.step, time: new Date() });
    }

    rotate() {
        let buffer = this.traceBuffer;
        this.traceBuffer = [];
        return buffer;
    }

    get length() {
        return this.traceBuffer.length;
    }

    setStep(s: string) {
        this.step = s;
    }
}

export default Trace;
