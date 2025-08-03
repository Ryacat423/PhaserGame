import Phaser from 'phaser';
import { Component, OnInit } from '@angular/core';
import { WelcomeScene } from '../../Scenes/welcome.scene';
import { TutorialScene } from '../../Scenes/tutorial.scene';

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
        TutorialScene
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