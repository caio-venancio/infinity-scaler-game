import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene"



/**
 * Configuração do Phaser
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 800,
  height: 600,
  scene: [GameScene]
};

new Phaser.Game(config);
