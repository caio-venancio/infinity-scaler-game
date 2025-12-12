import { LocalService } from "../core/local-service.js";

var config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

let service;
let players = {};   // mapa: { [id]: sprite }
let cursors;        // setas do teclado

var game = new Phaser.Game(config);

function preload() {
  // carregar sprites se quiser
}

function create() {
  // 1) Instancia e conecta no “servidor local”
  service = new LocalService();
  service.connect(); // se o nome for diferente, troca aqui

  // 2) Captura as setas do teclado
  cursors = this.input.keyboard.createCursorKeys();

  // 3) Quando a cena for desligada, desconecta o serviço
  this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    if (service && service.disconnect) {
      service.disconnect();
    }
  });
}

// update(time, delta) é chamado várias vezes por segundo
function update(time, delta) {
  if (!service) return;

  // 1) Monta o input do jogador local com base nas teclas
  const input = {
    up: cursors.up.isDown,
    down: cursors.down.isDown,
    left: cursors.left.isDown,
    right: cursors.right.isDown
  };

  // 2) Envia input pro “servidor” local
  if (service.handleInput) {
    service.handleInput(input);
  }

  // 3) Avança a simulação dentro do LocalService
  if (service.update) {
    service.update(delta);
  }

  // 4) Sincroniza os sprites com a lista de jogadores do serviço
  syncPlayers.call(this);
}

/**
 * Lê os jogadores do LocalService e:
 * - cria sprites novos para ids que ainda não existem
 * - atualiza posição dos já existentes
 * - remove sprites de ids que saíram
 */
function syncPlayers() {
  if (!service.getPlayers) return;

  // pega a lista atual de players do “servidor”
  const list = service.getPlayers() || []; // ex.: [{ id, x, y }, ...]

  const seenIds = new Set();

  // cria/atualiza sprites de todos os players da lista
  list.forEach((p) => {
    seenIds.add(p.id);

    // se ainda não existe sprite para esse player, cria
    if (!players[p.id]) {
      // você pode trocar o rectangle por sprite, tipo this.add.sprite(...)
      const sprite = this.add.rectangle(p.x, p.y, 50, 50, 0xffffff);
      players[p.id] = sprite;
    }

    // atualiza posição
    const sprite = players[p.id];
    sprite.x = p.x;
    sprite.y = p.y;
  });

  // remove sprites de players que não estão mais na lista
  Object.keys(players).forEach((id) => {
    if (!seenIds.has(id)) {
      players[id].destroy();
      delete players[id];
    }
  });
}
