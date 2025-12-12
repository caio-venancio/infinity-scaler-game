// services.ts
// import Phaser from "phaser";
import { GAME_STATE } from "../common/common";
import type { GameState } from "../common/common"

export interface PlayerSnapshot {
  id: string;
  x: number;
  y: number;
}

export abstract class Service {
  protected _events: Phaser.Events.EventEmitter;
  protected _gamestate: GameState;

  constructor() {
    this._events = new Phaser.Events.EventEmitter();
    this._gamestate = GAME_STATE.WAITING_FOR_PLAYERS;
  }

  get events(): Phaser.Events.EventEmitter {
    return this._events;
  }

  get gameState(): GameState {
    return this._gamestate;
  }

  // Conecta no “servidor” (local ou remoto)
  public abstract connect(): Promise<boolean>;

  // Desconecta / limpa recursos
  public abstract disconnect(): void;

  // Retorna o snapshot de todos os players conhecidos
  public abstract getPlayers(): PlayerSnapshot[];

  // Avança a simulação interna (chamado a cada frame pelo Phaser)
  public abstract update(delta: number): void;

  // Recebe input do jogador local
  public abstract handleInput(
    up: boolean,
    right: boolean,
    down: boolean,
    left: boolean
  ): void;
}
