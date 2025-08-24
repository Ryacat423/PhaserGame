export class Food extends Phaser.Physics.Arcade.Sprite {
    private bobEffect: Phaser.Tweens.Tween;
    private sparkleEffect: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(0.3);
        this.setCollideWorldBounds(true);
        this.setDepth(1);
    
        this.bobEffect = scene.tweens.add({
            targets: this,
            y: y - 5,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.sparkleEffect = scene.tweens.add({
            targets: this,
            alpha: 0.8,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Power1'
        });
    }

    override destroy(fromScene?: boolean): void {
        if (this.bobEffect) {
            this.bobEffect.destroy();
        }
        if (this.sparkleEffect) {
            this.sparkleEffect.destroy();
        }
        super.destroy(fromScene);
    }
}