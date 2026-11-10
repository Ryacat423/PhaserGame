import Phaser from 'phaser';
import { sortOnce } from '../utils/depth';
export class Battery extends Phaser.Physics.Arcade.Sprite {
    private chargeValue: number;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Was 0.1 (about 12x6 px), easy to miss even in the flashlight beam.
        this.setScale(0.3);
        this.setCollideWorldBounds(true);
        sortOnce(this);
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