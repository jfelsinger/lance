type TimerEventType = 'repeat' | 'single';

// TODO: needs documentation
// I think the API could be simpler
//   - Timer.run(waitSteps, cb)
//   - Timer.repeat(waitSteps, count, cb) // count=null=>forever
//   - Timer.cancel(cb)
export default class Timer {
    currentTime: number = 0;
    isActive: boolean = false;
    idCounter: number = 0;
    events: Record<number, TimerEvent> = {};

    constructor() {
    }

    play() {
        this.isActive = true;
    }

    tick() {
        let event;
        let eventId;

        if (this.isActive) {
            this.currentTime++;

            for (eventId in this.events) {
                event = this.events[eventId];
                if (event) {

                    if (event.type == 'repeat') {
                        if ((this.currentTime - event.startOffset) % event.time == 0) {
                            event.callback.apply(event.thisContext, event.args);
                        }
                    }
                    if (event.type == 'single') {
                        if ((this.currentTime - event.startOffset) % event.time == 0) {
                            event.callback.apply(event.thisContext, event.args);
                            event.destroy();
                        }
                    }

                }

            }
        }
    }

    destroyEvent(eventId: number) {
        delete this.events[eventId];
    }

    loop(time: number, callback: any) {
        let timerEvent = new TimerEvent(this,
            TimerEvent.TYPES.repeat,
            time,
            callback
        );

        this.events[timerEvent.id] = timerEvent;

        return timerEvent;
    }

    add(time: number, callback: any, thisContext: any, args: any) {
        let timerEvent = new TimerEvent(this,
            TimerEvent.TYPES.single,
            time,
            callback,
            thisContext,
            args
        );

        this.events[timerEvent.id] = timerEvent;
        return timerEvent;
    }

    // todo implement timer delete all events

    destroy(id: number) {
        delete this.events[id];
    }
}

// timer event
class TimerEvent {
    id: number;
    timer: Timer;
    type: string;
    time: number;
    callback: any;
    startOffset: number;
    thisContext: any;
    args: any;

    constructor(timer: Timer, type: TimerEventType, time: number, callback: any, thisContext?: any, args?: any) {
        this.id = ++timer.idCounter;
        this.timer = timer;
        this.type = type;
        this.time = time;
        this.callback = callback;
        this.startOffset = timer.currentTime;
        this.thisContext = thisContext;
        this.args = args;
    }

    destroy() {
        this.timer.destroy(this.id);
    };

    static TYPES: { [key in TimerEventType]: key } = {
        repeat: 'repeat',
        single: 'single'
    };
}

