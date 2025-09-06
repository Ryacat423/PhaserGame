import { GameMap } from "../../objects/GameMap";
import { Player } from "../../objects/Player";

export class LevelCustom extends Phaser.Scene {
    
    gameConfig!: any;
    customConfig!: any;

    background!: Phaser.GameObjects.Image;
    player!: Player;
    gameMap!: GameMap;

    constructor() {
        super({key: 'level-custom'});
    }

    init(): void {
        this.customConfig = localStorage.getItem('lvl');
        this.gameConfig = JSON.parse(this.customConfig);

        console.log(this.gameConfig);
    }

    create(): void {
        this.background = this.add.image(0, 0, this.gameConfig.map)
            .setOrigin(0)
            .setDepth(0);

        this.player = new Player(this, 300, 100);
        this.add.existing(this.player);
        this.gameMap = new GameMap(this, this.player);
    }

    override update(): void {
        this.player.update();
    }
}