import Serializable from './Serializable';
import BaseTypes from './BaseTypes';
import { GameEngine } from '../GameEngine';
import type { BendingOptions } from '../types/Bend';
import { GameComponent } from './GameComponent';

/**
 * GameObject is the base class of all game objects.
 * It is created only for the purpose of clearly defining the game
 * object interface.
 * Game developers will use one of the subclasses such as DynamicObject,
 * or PhysicalObject.
 */
export class GameObject extends Serializable {
    id!: number;
    playerId: number;
    components: Record<string, GameComponent> = {};
    savedCopy?: this;
    _roomName?: string;
    inputId: number = 0;

    static get netScheme() {
        return {
            id: { type: BaseTypes.TYPES.INT32 },
            playerId: { type: BaseTypes.TYPES.INT16 }
        };
    }

    /**
    * Creates an instance of a game object.
    * @param {GameEngine} gameEngine - the gameEngine this object will be used in
    * @param {Object} options - options for instantiation of the GameObject
    * @param {Number} id - if set, the new instantiated object will be set to this id instead of being generated a new one. Use with caution!
    * @param {Object} props - additional properties for creation
    * @param {Number} props.playerId - the playerId value of the player who owns this object
    */
    constructor(public gameEngine: GameEngine, options?: { id: number }, props?: { playerId: number }) {
        super();
        /**
         * The gameEngine this object will be used in
         * @member {GameEngine}
         */
        this.gameEngine = gameEngine;

        /**
        * ID of this object's instance.
        * There are three cases of instance creation which can occur:
        * 1. In the normal case, the constructor is asked to assign an ID which is unique
        * across the entire game world, including the server and all the clients.
        * 2. In extrapolation mode, the client may have an object instance which does not
        * yet exist on the server, these objects are known as shadow objects.  Their IDs must
        * be allocated from a different range.
        * 3. Also, temporary objects are created on the client side each time a sync is received.
        * These are used for interpolation purposes and as bending targets of position, velocity,
        * angular velocity, and orientation.  In this case the id will be set to null.
        * @member {Number}
        */
        if (options && 'id' in options)
            this.id = options.id;
        else if (this.gameEngine)
            this.id = this.gameEngine.world.getNewId();

        /**
        * playerId of player who created this object
        * @member {Number}
        */
        this.playerId = (props && props.playerId) ? props.playerId : 0;
    }

    /**
     * Called after the object is added to to the game world.
     * This is the right place to add renderer sub-objects, physics sub-objects
     * and any other resources that should be created
     * @param {GameEngine} gameEngine the game engine
     */
    onAddToWorld(gameEngine: GameEngine) { }

    /**
     * Called after the object is removed from game-world.
     * This is where renderer sub-objects and any other resources should be freed
     * @param {GameEngine} gameEngine the game engine
     */
    onRemoveFromWorld(gameEngine: GameEngine) { }

    /**
     * Formatted textual description of the game object.
     * @return {String} description - a string description
     */
    toString(): string {
        return `game-object[${this.id}]`;
    }

    /**
     * Formatted textual description of the game object's current bending properties.
     * @return {String} description - a string description
     */
    bendingToString(): string {
        return 'no bending';
    }

    saveState<TThis extends this>(other?: TThis) {
        this.savedCopy = (new (this as any).constructor(this.gameEngine, { id: null }));
        this.savedCopy?.syncTo(other ? other : this);
    }
    /**
     * Bending is defined as the amount of error correction that will be applied
     * on the client side to a given object's physical attributes, incrementally,
     * by the time the next server broadcast is expected to arrive.
     *
     * When this percentage is 0.0, the client always ignores the server object's value.
     * When this percentage is 1.0, the server object's attributes will be applied in full.
     *
     * The GameObject bending attribute is implemented as a getter, and can provide
     * distinct values for position, velocity, angle, and angularVelocity.
     * And in each case, you can also provide overrides for local objects,
     * these attributes will be called, respectively, positionLocal, velocityLocal,
     * angleLocal, angularVelocityLocal.
     *
     * @example
     * get bending() {
     *   return {
     *     position: { percent: 1.0, min: 0.0 },
     *     velocity: { percent: 0.0, min: 0.0 },
     *     angularVelocity: { percent: 0.0 },
     *     angleLocal: { percent: 1.0 }
     *   }
     * };
     *
     * @memberof GameObject
     * @member {Object} bending
     */
    get bending(): BendingOptions {
        return {
            position: { percent: 1.0, min: 0.0 },
            velocity: { percent: 0.0, min: 0.0 },
            angularVelocity: { percent: 0.0 },
            angleLocal: { percent: 1.0 }
        };
    }

    // TODO:
    // rather than pass worldSettings on each bend, they could
    // be passed in on the constructor just once.
    bendFromSavedToCurrentState(percent: number, worldSettings: any, isLocal: boolean, increments: number) {
        if (this.savedCopy) {
            this.bendToCurrent(this.savedCopy, percent, worldSettings, isLocal, increments);
        }
        this.savedCopy = undefined;
    }

    bendToCurrent<TThis extends this>(fromSource: TThis, percent: number, worldSettings: any, isLocal: boolean, increments: number) {
    }

    /**
     * synchronize this object to the state of an other object, by copying all the netscheme variables.
     * This is used by the synchronizer to create temporary objects, and must be implemented by all sub-classes as well.
     * @param {GameObject} other the other object to synchronize to
     */
    syncTo<TThis extends this>(other: TThis) {
        super.syncTo(other);
        this.playerId = other.playerId;
    }

    // apply a single bending increment
    applyIncrementalBending(stepsDesc: any) { }

    // clean up resources
    destroy() { }

    addComponent(componentInstance: any) {
        componentInstance.parentObject = this;
        this.components[componentInstance.constructor.name] = componentInstance;

        // a gameEngine might not exist if this class is instantiated by the serializer
        if (this.gameEngine) {
            this.gameEngine.emit('componentAdded', this, componentInstance);
        }
    }

    removeComponent(componentName: string) {
        // todo cleanup of the component ?
        delete this.components[componentName];

        // a gameEngine might not exist if this class is instantiated by the serializer
        if (this.gameEngine) {
            this.gameEngine.emit('componentRemoved', this, componentName);
        }
    }

    /**
     * Check whether this game object has a certain component
     * @param {Object} componentClass the comp
     * @return {Boolean} true if the gameObject contains this component
     */
    hasComponent(componentClass: any): boolean {
        return componentClass.name in this.components;
    }

    getComponent(componentClass: any) {
        return this.components[componentClass.name];
    }

}

export default GameObject;
