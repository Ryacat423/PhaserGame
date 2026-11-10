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
import { Level4UI } from './components/ui/Level4UI';

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
    Level3UI,
    Level4UI
  ]
};

const game = new Phaser.Game(config);

pauseWhileOffScreen(game);

/**
 * Phaser already pauses when the tab is hidden. When embedded (e.g. on the portfolio), also
 * pause and mute while the iframe is scrolled out of view, so it doesn't use CPU or keep
 * playing music under the rest of the page.
 */
function pauseWhileOffScreen(game: Phaser.Game): void {
  if (window.self === window.top || !('IntersectionObserver' in window)) return;

  let pausedByUs = false;
  let wasMuted = false;
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting && !game.isPaused) {
      pausedByUs = true;
      wasMuted = game.sound.mute;
      game.sound.mute = true;
      game.pause();
    } else if (entry.isIntersecting && pausedByUs) {
      pausedByUs = false;
      game.sound.mute = wasMuted;
      game.resume();
    }
  }).observe(document.getElementById('game')!);
}

if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
