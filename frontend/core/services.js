// services.ts
// import Phaser from "phaser";
import { GAME_STATE } from "./common";
export class Service {
    constructor() {
        this._events = new Phaser.Events.EventEmitter();
        this._gamestate = GAME_STATE.WAITING_FOR_PLAYERS;
    }
    get events() {
        return this._events;
    }
    get gameState() {
        return this._gamestate;
    }
}
