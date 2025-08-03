import { Player } from "../objects/Player";
import { Dog } from "../objects/Dog";

export class TutorialScene extends Phaser.Scene {
    private player!: Player;
    private dog!: Dog;

    private uiCamera!: Phaser.Cameras.Scene2D.Camera;
    private uiElements: Phaser.GameObjects.GameObject[] = [];

    constructor() {
        super({ key: 'tutorial' });
    }

    preload(): void {
        this.load.image('game_frame', 'assets/scene/tutorial/frame.png');
        this.load.image('game_tutorial_map', 'assets/scene/tutorial/tutorial_map.png');
    }

    create(): void {
        // === World Camera (Main) ===
        const background = this.add.image(0, 0, 'game_tutorial_map')
            .setOrigin(0)
            .setDepth(0);

        this.player = new Player(this, 500, 300);
        this.add.existing(this.player);

        // Create the Dog instance
        this.dog = new Dog(this, 300, 300, this.player);
        this.add.existing(this.dog);

        const mainCam = this.cameras.main;
        mainCam.setBounds(0, 0, background.width, background.height);
        mainCam.startFollow(this.player);
        mainCam.setZoom(1.5);

        // === UI Elements ===
        const frame = this.add.image(0, 0, 'game_frame')
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(100)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.uiElements.push(frame);

        // === UI Camera ===
        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.ignore([background, this.player, this.dog]);
        mainCam.ignore(this.uiElements);
    }

    override update(): void {
        this.player.update();
        this.dog.update(1,1);
    }
}
