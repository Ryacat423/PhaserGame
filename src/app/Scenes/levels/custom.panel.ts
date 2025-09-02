export class CustomPanel extends Phaser.Scene {

    back!: Phaser.GameObjects.Image;

    constructor(){
        super({key: 'custom_panel'});
    }

    preload(): void {
        this.load.image('custom_bg', 'assets/scene/levels/4/background.jpg');
    }

    create(): void {
        this.add.image(0, 0, 'custom_bg')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);


        this.back = this.add.image(100, 70, 'btn-next')
            .setScale(.09)
            .setInteractive()
            .setFlipX(true)
            .once('pointerdown', () => {
                this.scene.stop();
                this.scene.start('welcome');
            });

            
    }
}