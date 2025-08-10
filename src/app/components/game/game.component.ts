import Phaser from 'phaser';
import { Component, OnInit } from '@angular/core';
import { WelcomeScene } from '../../Scenes/welcome.scene';
import { TutorialScene } from '../../Scenes/tutorial.scene';
import { LevelsScene } from '../../Scenes/levels.scene';
import { InformationScene } from '../../Scenes/information.scene';
import { Level1Scene } from '../../Scenes/levels/level_1.scene';
import { GameUI } from '../ui/GameUI';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})
export class GameComponent implements OnInit {
  
  phaserGame!: Phaser.Game;
  config: Phaser.Types.Core.GameConfig;

  constructor() {
    this.config = {
      type: Phaser.AUTO,
      height: 600,
      width: 1000,
      scene: [ 
        WelcomeScene,
        TutorialScene,
        LevelsScene,
        InformationScene,
        Level1Scene,
        GameUI
      ],
      parent: 'game',
      backgroundColor: "#000000ff",
      pixelArt: false,
      physics: {
        default: 'arcade',
        arcade: {
          // debug: true,
          y: 0,
          x: 0
        }
      }
    }
  }

  ngOnInit(): void {
    this.phaserGame = new Phaser.Game(this.config);
  }
}