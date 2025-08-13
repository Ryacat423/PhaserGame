export class Poison extends Phaser.Physics.Arcade.Sprite {
    private pulseEffect: Phaser.Tweens.Tween;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(0.25);
        this.setCollideWorldBounds(true);
        this.setDepth(1);
        
        this.setTint(0x8B008B);
        this.pulseEffect = scene.tweens.add({
            targets: this,
            scaleX: 0.3,
            scaleY: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        scene.tweens.add({
            targets: this,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });
    }

    override destroy(fromScene?: boolean): void {
        if (this.pulseEffect) {
            this.pulseEffect.destroy();
        }
        super.destroy(fromScene);
    }
}