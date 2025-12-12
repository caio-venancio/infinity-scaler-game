import Phaser from "phaser";
import { LocalService } from "../services/local-service";

/**
 * Tipos auxiliares
 */
type PlayerSpriteMap = Record<string, Phaser.GameObjects.Rectangle>;

let service: LocalService;
let players: PlayerSpriteMap = {};
let cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

/**
 * Configuração do Phaser
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scene: {
    preload,
    create,
    update
  }
};

new Phaser.Game(config);

/**
 * Phaser lifecycle
 */
function preload(this: Phaser.Scene) {
  // carregar assets aqui, se precisar
}

function create(this: Phaser.Scene) {
  // 1) Instancia e conecta no serviço local
  service = new LocalService();
  service.connect();

  // 2) Captura teclado
  cursors = this.input.keyboard!.createCursorKeys();

  // 3) Cleanup ao sair da cena
  this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    service.disconnect();
  });
}

function update(this: Phaser.Scene, _time: number, delta: number) {
  if (!service) return;

  // 1) Envia input do jogador local
  service.handleInput(
    cursors.up?.isDown ?? false,
    cursors.right?.isDown ?? false,
    cursors.down?.isDown ?? false,
    cursors.left?.isDown ?? false
  );

  // 2) Atualiza a simulação do "servidor"
  service.update(delta);

  // 3) Sincroniza os jogadores na tela
  syncPlayers(this);
}

/**
 * Sincroniza sprites com o estado vindo do Service
 */
function syncPlayers(scene: Phaser.Scene) {
  const list = service.getPlayers();
  const seenIds = new Set<string>();

  list.forEach((p) => {
    seenIds.add(p.id);

    // cria sprite se não existir
    if (!players[p.id]) {
      players[p.id] = scene.add.rectangle(p.x, p.y, 50, 50, 0xffffff);
    }

    // atualiza posição
    players[p.id].x = p.x;
    players[p.id].y = p.y;
  });

  // remove jogadores que saíram
  Object.keys(players).forEach((id) => {
    if (!seenIds.has(id)) {
      players[id].destroy();
      delete players[id];
    }
  });
}
