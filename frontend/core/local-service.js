var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// local-service.ts
import { GAME_STATE } from "./common";
import { Service } from "./services";
export class LocalService extends Service {
    constructor() {
        super();
        this._input = {
            up: false,
            right: false,
            down: false,
            left: false
        };
        this._players = new Map();
        this._playerId = "local-player"; // pode virar UUID depois
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            // cria o player local no centro da tela
            const player = {
                id: this._playerId,
                x: 400,
                y: 300
            };
            this._players.set(this._playerId, player);
            this._gamestate = GAME_STATE.PLAYING;
            // emite evento pra quem quiser ouvir (opcional)
            this._events.emit("connected", { playerId: this._playerId });
            return true;
        });
    }
    disconnect() {
        this._players.clear();
        this._gamestate = GAME_STATE.WAITING_FOR_PLAYERS;
        this._events.emit("disconnected");
    }
    getPlayers() {
        return Array.from(this._players.values());
    }
    update(delta) {
        if (this._gamestate !== GAME_STATE.PLAYING)
            return;
        const player = this._players.get(this._playerId);
        if (!player)
            return;
        const speed = 0.2; // pixels por ms (200 px por segundo, por exemplo)
        const step = speed * delta;
        if (this._input.up)
            player.y -= step;
        if (this._input.down)
            player.y += step;
        if (this._input.left)
            player.x -= step;
        if (this._input.right)
            player.x += step;
        // (opcional) limitar dentro da área do jogo
        player.x = Phaser.Math.Clamp(player.x, 0, 800);
        player.y = Phaser.Math.Clamp(player.y, 0, 600);
        this._players.set(this._playerId, player);
        // emite snapshot (opcional, se quiser reatividade por evento)
        this._events.emit("stateChanged", this.getPlayers());
    }
    handleInput(up, right, down, left) {
        this._input.up = up;
        this._input.right = right;
        this._input.down = down;
        this._input.left = left;
    }
}
