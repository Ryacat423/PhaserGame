export class Battery extends Phaser.Physics.Arcade.Sprite {
    private glowEffect: Phaser.Tweens.Tween;
    private chargeValue: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(0.2);
        this.setCollideWorldBounds(true);
        this.setDepth(1);
        this.chargeValue = 25; // Each battery gives 25% charge
        
        // Yellow glow effect for batteries
        this.setTint(0xFFD700);
        
        this.glowEffect = scene.tweens.add({
            targets: this,
            alpha: 0.6,
            scaleX: 0.25,
            scaleY: 0.25,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Additional sparkling effect
        scene.tweens.add({
            targets: this,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    public getChargeValue(): number {
        return this.chargeValue;
    }

    override destroy(fromScene?: boolean): void {
        if (this.glowEffect) {
            this.glowEffect.destroy();
        }
        super.destroy(fromScene);
    }
}