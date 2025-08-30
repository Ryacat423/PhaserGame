export class LevelsScene extends Phaser.Scene {

    back!: Phaser.GameObjects.Image;
    level1!: Phaser.GameObjects.Image;
    level2!: Phaser.GameObjects.Image;
    level3!: Phaser.GameObjects.Image;

    constructor() {
        super({key: 'levels'})
    }

    preload(): void {
        this.load.image('bglevel', 'assets/scene/levels/levelbg.png');
        this.load.image('level_1', 'assets/scene/levels/level_1.png');
        this.load.image('level_2', 'assets/scene/levels/level_2.png');
        this.load.image('level_3', 'assets/scene/levels/level_3.png');
    }

    create(): void {
        this.add.image(0, 0, 'bglevel')
        .setOrigin(0, 0)
        .setDisplaySize(this.scale.width, this.scale.height);
        
        this.add.sprite(480, 330, 'snow').setScale(.164).play('blow').setDepth(10)
        this.level1 = this.add.image(280, 320, 'level_1').setScale(0.58);
        
        this.level2 = this.add.image(480, 320, 'level_2').setScale(0.58);
        
        this.level3 = this.add.image(680, 320, 'level_3').setScale(0.58);

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
    
        this.level2
            .setInteractive()
            .once('pointerdown', () => {
                this.scene.stop(); 
                this.scene.start('level2');
            });

        this.level3
            .setInteractive()
            .once('pointerdown', () => {
                this.scene.stop();
                this.scene.start('level3');
            })
    }
}