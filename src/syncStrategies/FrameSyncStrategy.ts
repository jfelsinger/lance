import { SyncStrategy, type SYNC_APPLIED } from './SyncStrategy'
import { ClientEngine } from '../ClientEngine';
import { GameEngine } from '../GameEngine';

const defaults = {
    worldBufferLength: 60,
    clientStepLag: 0
};

export class FrameSyncStrategy extends SyncStrategy {

    constructor(clientEngine: ClientEngine, inputOptions: any) {
        const options = Object.assign({}, defaults, inputOptions);
        super(clientEngine, options);
    }

    // apply a new sync
    override applySync(sync: any, _required: boolean): SYNC_APPLIED | undefined {

        this.needFirstSync = false;
        this.gameEngine.trace.debug(() => 'framySync applying sync');
        let world = this.gameEngine.world;

        for (let ids in (sync.syncObjects)) {
            let ev = sync.syncObjects[ids][0];
            let curObj = world.objects[ev.objectInstance.id];
            if (curObj) {
                curObj.syncTo(ev.objectInstance);
            } else {
                this.addNewObject(ev.objectInstance.id, ev.objectInstance);
            }
        }

        // destroy objects
        for (let objId in (world.objects)) {
            let objEvents = sync.syncObjects[objId];

            // if this was a full sync, and we did not get a corresponding object,
            // remove the local object
            if (sync.fullUpdate && !objEvents && +objId < this.gameEngine.options.clientIDSpace) {
                this.gameEngine.removeObjectFromWorld(objId);
                continue;
            }

            if (!objEvents || +objId >= this.gameEngine.options.clientIDSpace)
                continue;

            // if we got an objectDestroy event, destroy the object
            objEvents.forEach((e: any) => {
                if (e.eventName === 'objectDestroy') this.gameEngine.removeObjectFromWorld(objId);
            });
        }

        return this.SYNC_APPLIED;
    }

}

export default FrameSyncStrategy;
