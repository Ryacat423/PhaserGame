export class LevelsScene extends Phaser.Scene {

    back!: Phaser.GameObjects.Image;
    level1!: Phaser.GameObjects.Image;

    constructor() {
        super({key: 'levels'})
    }

    preload(): void {
        this.load.image('bglevel', 'assets/scene/levels/levelbg.png');
        this.load.image('level_1', 'assets/scene/levels/level_1.png');
        this.load.image('level_2', 'assets/scene/levels/level_2.png');
    }

    create(): void {
        this.add.image(0, 0, 'bglevel')
        .setOrigin(0, 0)
        .setDisplaySize(this.scale.width, this.scale.height);
        
        this.level1 = this.add.image(280, 320, 'level_1').setScale(0.45);
        this.add.image(460, 320, 'level_2').setScale(0.45);
        
        this.back = this.add.image(110, 340, 'btn-next').setScale(0.1).setFlipX(true);

        this.back
            .setInteractive()
            .once('pointerdown', () => {
                this.scene.stop(); 
                this.scene.start('welcome');
            });

        this.level1
            .setInteractive()
            .once('pointerdown', () => {
                this.scene.stop(); 
                this.scene.start('level1');
            });
    }
}