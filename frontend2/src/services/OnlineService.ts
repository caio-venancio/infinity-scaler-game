import { GAME_STATE } from "../common/common";
import { Service } from "./services";
import type { PlayerSnapshot } from "./services";

type ClientMessage =
  | { type: "join"; nickname?: string }
  | { type: "input"; up: boolean; right: boolean; down: boolean; left: boolean }
  | { type: "leave" }
  | { type: "ping"; t: number };

type ServerMessage =
  | { type: "welcome"; playerId: string }
  | { type: "snapshot"; players: PlayerSnapshot[] }
  | { type: "pong"; t: number }
  | { type: "error"; message: string };

export default class OnlineService extends Service {
  private _players: Map<string, PlayerSnapshot> = new Map();

  private _input = { up: false, right: false, down: false, left: false };

  private _ws: WebSocket | null = null;
  private _serverUrl: string;
  private _sendInputEveryMs = 50; // 20 Hz de input (ajuste depois)
  private _sinceLastSend = 0;

  constructor(serverUrl: string) {
    super();
    this._serverUrl = serverUrl;
  }

  public async connect(): Promise<boolean> {
    if (this._ws) return true;

    return new Promise<boolean>((resolve) => {
      const ws = new WebSocket(this._serverUrl);
      this._ws = ws;

      ws.onopen = () => {
        // pede para entrar no jogo
        const joinMsg: ClientMessage = { type: "join", nickname: "player" };
        ws.send(JSON.stringify(joinMsg));
        resolve(true);
      };

      ws.onmessage = (event) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(event.data) as ServerMessage;
        } catch {
          return;
        }

        switch (msg.type) {
          case "welcome": {
            this._gamestate = GAME_STATE.PLAYING;
            this._events.emit("connected", { playerId: msg.playerId });
            break;
          }

          case "snapshot": {
            this._players.clear();
            for (const p of msg.players) {
              this._players.set(p.id, p);
            }
            this._events.emit("stateChanged", this.getPlayers());
            break;
          }

          case "error": {
            this._events.emit("error", msg.message);
            break;
          }
        }
      };

      ws.onclose = () => {
        this._ws = null;
        this._players.clear();
        this._gamestate = GAME_STATE.WAITING_FOR_PLAYERS;
        this._events.emit("disconnected");
      };

      ws.onerror = () => {
        // Se deu erro antes do welcome, voltamos pro waiting
        this._events.emit("error", "Falha ao conectar no servidor.");
      };
    });
  }

  public disconnect(): void {
    if (!this._ws) return;

    try {
      const leaveMsg: ClientMessage = { type: "leave" };
      this._ws.send(JSON.stringify(leaveMsg));
    } catch {
      // ignora
    }

    this._ws.close();
    // o cleanup final acontece no onclose
  }

  public getPlayers(): PlayerSnapshot[] {
    return Array.from(this._players.values());
  }

  /**
   * No OnlineService, update NÃO move player localmente.
   * Ele só controla quando enviar o input e deixa o servidor mandar snapshots.
   */
  public update(delta: number): void {
    if (this._gamestate !== GAME_STATE.PLAYING) return;
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;

    this._sinceLastSend += delta;
    if (this._sinceLastSend < this._sendInputEveryMs) return;
    this._sinceLastSend = 0;

    const inputMsg: ClientMessage = {
      type: "input",
      up: this._input.up,
      right: this._input.right,
      down: this._input.down,
      left: this._input.left
    };

    this._ws.send(JSON.stringify(inputMsg));
  }

  public handleInput(up: boolean, right: boolean, down: boolean, left: boolean): void {
    this._input.up = up;
    this._input.right = right;
    this._input.down = down;
    this._input.left = left;
  }
}
