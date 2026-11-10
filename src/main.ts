import Phaser from 'phaser';
import 'sweetalert2/dist/sweetalert2.min.css';
import { WelcomeScene } from './Scenes/welcome.scene';
import { TutorialScene } from './Scenes/tutorial.scene';
import { LevelsScene } from './Scenes/levels.scene';
import { InformationScene } from './Scenes/information.scene';
import { Level1Scene } from './Scenes/levels/level_1.scene';
import { Level2Scene } from './Scenes/levels/level_2.scene';
import { Level3Scene } from './Scenes/levels/level_3.scene';
import { Level4Scene } from './Scenes/levels/level_4.scene';
import { CustomPanel } from './Scenes/levels/custom.panel';
import { LevelCustom } from './Scenes/levels/level_custom';
import { CustomLevels } from './Scenes/levels/custom_levels';
import { StoryScene } from './Scenes/story/story.scene';
import { SettingScene } from './Scenes/settings.scene';
import { GameUI } from './components/ui/GameUI';
import { Level2UI } from './components/ui/Level2UI';
import { Level3UI } from './components/ui/Level3UI';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1000,
  height: 600,
  backgroundColor: '#000000',
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 } }
  },
  scene: [
    WelcomeScene,
    LevelsScene,
    SettingScene,
    CustomLevels,
    TutorialScene,
    InformationScene,
    StoryScene,
    Level1Scene,
    Level2Scene,
    Level3Scene,
    Level4Scene,
    CustomPanel,
    LevelCustom,
    GameUI,
    Level2UI,
    Level3UI
  ]
};

const game = new Phaser.Game(config);

if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
