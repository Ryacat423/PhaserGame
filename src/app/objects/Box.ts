export class Box extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        this.setScale(.15);
    }

    private isOpen: boolean = false;
    private boxSound!: Phaser.Sound.BaseSound;
    private nearPlayer: boolean = false;

    
    public setIsOpen(isOpen: boolean) {
        this.isOpen = isOpen;
    }

    public getState(): boolean {
        return this.isOpen;
    }
}