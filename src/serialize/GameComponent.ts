import { GameObject } from './GameObject';
export class GameComponent {
    /**
     * the gameObject this component is attached to. This gets set in the addComponent method
     * @member {GameObject}
     */
    parentObject?: GameObject;

    constructor() {
    }

    static get name() {
        return this.constructor.name;
    }

    static get netScheme(): any {
        return null;
    }
}

export default GameComponent;
