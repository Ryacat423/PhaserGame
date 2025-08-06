import { Player } from "../objects/Player";
import { Dog } from "../objects/Dog";
import { Food } from "../objects/Food";

export class TutorialScene extends Phaser.Scene {
    private player!: Player;
    private dog!: Dog;
    private foods: Food[] = [];
    private uiCamera!: Phaser.Cameras.Scene2D.Camera;
    private uiElements: Phaser.GameObjects.GameObject[] = [];
    private gameTheme!: Phaser.Sound.BaseSound;

    // Buttons
    private home!: Phaser.GameObjects.Image;
    private reset!: Phaser.GameObjects.Image;
    private settings!: Phaser.GameObjects.Image;
    private pause!: Phaser.GameObjects.Image;
    private help!: Phaser.GameObjects.Image;

    constructor() {
        super({ key: 'tutorial' });
    }

    preload(): void {
        this.load.image('game_frame', 'assets/scene/tutorial/frame.png');
        this.load.image('movement_modal', 'assets/scene/tutorial/movement.png');
        this.load.image('game_tutorial_map', 'assets/scene/tutorial/tutorial_map.png');
        this.load.audio('game_theme', 'assets/global/audio/gameplay.ogg');
    }

    create(): void {
        this.gameTheme = this.sound.add('game_theme');
        if (!this.gameTheme.isPlaying) {
            this.gameTheme.play();
        }

        // === World Camera (Main) ===
        const background = this.add.image(0, 0, 'game_tutorial_map')
            .setOrigin(0)
            .setDepth(0);

        this.player = new Player(this, 500, 300);
        this.add.existing(this.player);

        this.dog = new Dog(this, 300, 300, this.player);
        this.add.existing(this.dog);
        this.createFoodItems();

        this.makeTrees();

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
            
        const assetKeys: string[] = ['btn-home', 'btn-settings', 'btn-reset'];
        const uiButtons = this.setupUIButtons(assetKeys);

        this.home = uiButtons[0];
        this.settings = uiButtons[1];
        this.reset = uiButtons[2];
        this.help = this.add.image(900, 40, 'btn-info')
            .setScale(0.5)
            .setInteractive()
            .setDepth(101);
            
        this.setupHelpModal();
        this.uiElements.push(frame, ...uiButtons, this.help);
        
        // === UI Camera ===
        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.ignore([...this.foods]);
        this.uiCamera.ignore([background, this.player, this.dog]);
        mainCam.ignore(this.uiElements);
    }

    private setupHelpModal(): void {
        let help_modal: Phaser.GameObjects.Image;
        let close: Phaser.GameObjects.Image;

        this.help.on('pointerdown', () => {
            help_modal = this.add.image(500, 300, 'movement_modal')
                .setDepth(200)
                .setScrollFactor(0);
            close = this.add.image(800, 130, 'btn-close')
                .setDepth(201)
                .setScrollFactor(0)
                .setScale(0.5)
                .setInteractive();
            this.uiElements.push(help_modal, close);
            this.uiCamera.ignore(this.uiElements);

            close.on('pointerdown', () => {
                help_modal.destroy();
                close.destroy();
                // this.uiElements = this.uiElements.filter(e => e !== help_modal && e !== close);
            });
        });
    }

    private createFoodItems(): void {
        const foodTextures = ['food1', 'food2', 'food3', 'food4', 'food5'];
        const foodCount = 10;

        for (let i = 0; i < foodCount; i++) {
            const texture = foodTextures[Phaser.Math.Between(0, foodTextures.length - 1)];
            const x = Phaser.Math.Between(100, this.scale.width - 100);
            const y = Phaser.Math.Between(100, this.scale.height - 100);
            
            const food = new Food(this, x, y, texture);
            this.foods.push(food);  
            
            this.physics.add.overlap(
                this.player, 
                food, 
                (player, food) => this.collectFood(food as Food), 
                undefined, 
                this
            );
        }
    }

    private collectFood(food: Food): void {
        const index = this.foods.indexOf(food);
        if (index !== -1) {
            this.foods.splice(index, 1);
        }
        
        food.destroy();
    }
    
    private setupUIButtons(assetKeys: string[]): Phaser.GameObjects.Image[] {
        const buttons: Phaser.GameObjects.Image[] = [];
        const startX = 60;
        const endY = 40;

        assetKeys.forEach((key, i) => {
            const button = this.add.image(startX * (i + 1), endY, key)
                .setScale(0.23)
                .setInteractive()
                .setDepth(101);

            button.on('pointerover', () => {
                this.tweens.add({
                    targets: button,
                    scale: 0.26,
                    duration: 100,
                    ease: 'Power1'
                });
            });

            button.on('pointerout', () => {
                this.tweens.add({
                    targets: button,
                    scale: 0.23,
                    duration: 100,
                    ease: 'Power1'
                });
            });

            button.on('pointerdown', () => {
                this.handleButtonAction(key);
            });

            buttons.push(button);
        });

        return buttons;
    }

    private handleButtonAction(key: string): void {
        this.scene.stop();
        this.gameTheme.stop();
        this.dog.stopBark();

        switch (key) {
            case 'btn-home':
                this.scene.start('welcome');
                break;
            case 'btn-settings':
                this.scene.start('settings');
                break;
            case 'btn-reset':
                this.scene.start('tutorial');
                break;
            default:
                break;
        }
    }

    private makeTrees(): void {
        this.add.image(40, 80, 'tree')
            .setScale(0.5)
            .setAngle(-5);
    }

    override update(): void {
        this.player.update();
        this.dog.update(1, 1);
    }
}
