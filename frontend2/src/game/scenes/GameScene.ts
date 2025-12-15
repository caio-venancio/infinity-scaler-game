import Phaser from "phaser";
// import { LocalService } from "../../services/local-service";
import OnlineService from "../../services/OnlineService"
// import { LocalService } from "../../services/local-service";

type PlayerSpriteMap = Record<string, Phaser.GameObjects.Rectangle>;

export class GameScene extends Phaser.Scene {
  private service!: OnlineService;
  private players: PlayerSpriteMap = {};
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super("GameScene");
  }

  create() {
    // this.service = new LocalService();
    this.service = new OnlineService("ws://localhost:8080");
    this.service.connect();

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.service.disconnect();
    });
  }

  update(_time: number, delta: number) {
    this.service.handleInput(
      this.cursors.up?.isDown ?? false,
      this.cursors.right?.isDown ?? false,
      this.cursors.down?.isDown ?? false,
      this.cursors.left?.isDown ?? false
    );

    this.service.update(delta);

    this.syncPlayers();
  }

  private syncPlayers() {
    const list = this.service.getPlayers();
    const seen = new Set<string>();

    for (const p of list) {
      seen.add(p.id);

      if (!this.players[p.id]) {
        this.players[p.id] = this.add.rectangle(p.x, p.y, 50, 50, 0xffffff);
      }

      this.players[p.id].x = p.x;
      this.players[p.id].y = p.y;
    }

    for (const id of Object.keys(this.players)) {
      if (!seen.has(id)) {
        this.players[id].destroy();
        delete this.players[id];
      }
    }
  }
}
