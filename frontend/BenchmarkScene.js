// BenchmarkScene.ts
import Phaser from "phaser";

export class BenchmarkScene extends Phaser.Scene {
  cubes= [];
  fpsText;

  constructor() {
    super("BenchmarkScene");
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // cria 1000 cubos
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;

      // cubo simples (retângulo) – barato de desenhar
      const cube = this.add.rectangle(x, y, 16, 16, 0xffffff);
      // cor aleatória só pra visualizar diferença
      cube.setFillStyle(Phaser.Display.Color.RandomRGB().color);

      this.cubes.push(cube);
    }

    // texto pra mostrar FPS
    this.fpsText = this.add.text(10, 10, "FPS: 0", {
      fontSize: "16px",
      color: "#00ff00",
    }).setScrollFactor(0);
  }

  update(time, delta) {
    // movimenta um pouco os cubos só pra ter trabalho de redraw
    for (const cube of this.cubes) {
      cube.x += 20 * (delta / 1000);
      if (cube.x > this.scale.width) {
        cube.x = 0;
      }
    }

    // atualiza FPS
    const fps = this.game.loop.actualFps;
    this.fpsText.setText(`FPS: ${fps.toFixed(0)}`);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game", // id do div no HTML
  scene: [BenchmarkScene],
};

const bench = new Phaser.Game(config);
