export class FrameScene extends Phaser.Scene {
    private frameImage!: Phaser.GameObjects.Image;
    private closeButton!: Phaser.GameObjects.Image;
    
    constructor() {
        super({ key: 'frame' });
    }

    preload() {
        this.load.image('frame_overlay', 'assets/ui/frame_overlay.png');
        this.load.image('btn_close', 'assets/ui/btn_close.png');
    }

    create() {
        const bg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5)
            .setOrigin(0)
            .setInteractive();

        this.frameImage = this.add.image(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'frame_overlay'
        ).setScale(0.8);

        this.closeButton = this.add.image(
            this.frameImage.x + this.frameImage.displayWidth/2 - 30,
            this.frameImage.y - this.frameImage.displayHeight/2 + 30,
            'btn_close'
        )
        .setScale(0.5)
        .setInteractive();

        bg.on('pointerdown', () => this.scene.stop());
        this.closeButton.on('pointerdown', () => this.scene.stop());
    }
}