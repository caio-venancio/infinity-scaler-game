// local-service.ts
import { GAME_STATE } from "../common/common";
import { Service } from "./services";
import type { PlayerSnapshot } from "./services"

export class LocalService extends Service {
  private _players: Map<string, PlayerSnapshot>;
  private _playerId: string;
  private _input = {
    up: false,
    right: false,
    down: false,
    left: false
  };

  constructor() {
    super();
    this._players = new Map();
    this._playerId = "local-player"; // pode virar UUID depois
  }

  public async connect(): Promise<boolean> {
    // cria o player local no centro da tela
    const player: PlayerSnapshot = {
      id: this._playerId,
      x: 400,
      y: 300
    };

    this._players.set(this._playerId, player);
    this._gamestate = GAME_STATE.PLAYING;

    // emite evento pra quem quiser ouvir (opcional)
    this._events.emit("connected", { playerId: this._playerId });

    return true;
  }

  public disconnect(): void {
    this._players.clear();
    this._gamestate = GAME_STATE.WAITING_FOR_PLAYERS;
    this._events.emit("disconnected");
  }

  public getPlayers(): PlayerSnapshot[] {
    return Array.from(this._players.values());
  }

  public update(delta: number): void {
    if (this._gamestate !== GAME_STATE.PLAYING) return;

    const player = this._players.get(this._playerId);
    if (!player) return;

    const speed = 0.2; // pixels por ms (200 px por segundo, por exemplo)
    const step = speed * delta;

    if (this._input.up) player.y -= step;
    if (this._input.down) player.y += step;
    if (this._input.left) player.x -= step;
    if (this._input.right) player.x += step;

    // (opcional) limitar dentro da área do jogo
    player.x = Phaser.Math.Clamp(player.x, 0, 800);
    player.y = Phaser.Math.Clamp(player.y, 0, 600);

    this._players.set(this._playerId, player);

    // emite snapshot (opcional, se quiser reatividade por evento)
    this._events.emit("stateChanged", this.getPlayers());
  }

  public handleInput(
    up: boolean,
    right: boolean,
    down: boolean,
    left: boolean
  ): void {
    this._input.up = up;
    this._input.right = right;
    this._input.down = down;
    this._input.left = left;
  }
}
