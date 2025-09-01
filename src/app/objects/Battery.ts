export class Battery extends Phaser.Physics.Arcade.Sprite {
    private chargeValue: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(0.1);
        this.setCollideWorldBounds(true);
        this.setDepth(1);
        this.chargeValue = 25;

        this.setTint(0xFFD700);
    }

    public getChargeValue(): number {
        return this.chargeValue;
    }

    override destroy(fromScene?: boolean): void {
        super.destroy(fromScene);
    }
}