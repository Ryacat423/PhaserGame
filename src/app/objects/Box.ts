import { Player } from "./Player";

export type BoxState = 'AVAILABLE' | 'UNAVAILABLE';

export class Box extends Phaser.Physics.Arcade.Sprite {

    private static readonly AVAILABLE: BoxState = 'AVAILABLE';
    private static readonly UNAVAILABLE: BoxState = 'UNAVAILABLE';

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(.15);
    }

    private isOpen: boolean = false;
    private currentState: BoxState = Box.AVAILABLE
    private boxSound!: Phaser.Sound.BaseSound;
    private nearPlayer: boolean = false;
    private detectionRadius = 100;

    private box!: Phaser.GameObjects.Image;

    private player!: Player;

    
    public setIsOpen(isOpen: boolean) {
        this.isOpen = isOpen;
    }

    public getState(): boolean {
        return this.isOpen;
    }

    private checkIfClose(): void {
        this.scene.physics.add.collider(
            this.player, 
            this,
            this.checkIfClose
        );
    }   

    private createBox(boxState: BoxState) {
        this.box = this.scene.add.image(100, 100, 'box-open');

        switch(boxState) {
            case Box.AVAILABLE:
                this.box.setTexture('box-open');
                break;
            case Box.UNAVAILABLE:
                this.box.setTexture('box-cat');
                break;
        }
    }

    private generateRandom(): number {
        return Math.floor(Math.random() * 740);
    }

    private hideAvailable(): boolean {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
        return distance < this.detectionRadius;
    }
}