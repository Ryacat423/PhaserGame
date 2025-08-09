export class GameUI extends Phaser.Scene {
    private uiElements: Phaser.GameObjects.GameObject[] = [];
    private home!: Phaser.GameObjects.Image;
    private reset!: Phaser.GameObjects.Image;
    private settings!: Phaser.GameObjects.Image;
    private help!: Phaser.GameObjects.Image;

    constructor() {
        super({ key: 'UIScene' });
    }

    preload() {
        this.load.image('game_frame', 'assets/scene/tutorial/frame.png');
        this.load.image('movement_modal', 'assets/scene/tutorial/movement.png');
    }

    create() {
        const frame = this.add.image(0, 0, 'game_frame')
            .setOrigin(0)
            .setDisplaySize(this.scale.width, this.scale.height)
            .setDepth(100);

        const assetKeys: string[] = ['btn-home', 'btn-settings', 'btn-reset'];
        this.setupUIButtons(assetKeys);
        
        this.help = this.add.image(900, 40, 'btn-info')
            .setScale(0.5)
            .setInteractive()
            .setDepth(101);
            
        this.uiElements.push(frame, this.home, this.settings, this.reset, this.help);

        this.setupHelpModal();
    }

    private setupHelpModal() {
        this.help.on('pointerdown', () => {
            const helpModal = this.add.image(500, 300, 'movement_modal')
                .setDepth(200);
                
            const closeBtn = this.add.image(800, 130, 'btn-close')
                .setDepth(201)
                .setScale(0.5)
                .setInteractive();
                
            this.uiElements.push(helpModal, closeBtn);

            closeBtn.on('pointerdown', () => {
                helpModal.destroy();
                closeBtn.destroy();
                this.uiElements = this.uiElements.filter(e => e !== helpModal && e !== closeBtn);
            });
        });
    }

    private setupUIButtons(assetKeys: string[]) {
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

            if (key === 'btn-home') this.home = button;
            if (key === 'btn-settings') this.settings = button;
            if (key === 'btn-reset') this.reset = button;
        });
    }

    private handleButtonAction(key: string) {
        switch (key) {
            case 'btn-home':
                this.game.events.emit('returnToWelcome');
                break;
            case 'btn-settings':
                this.scene.start('settings');
                break;
            case 'btn-reset':
                this.resetCurrentLevel();
                break;
        }
    }

    private resetCurrentLevel() {
        const gameScenes = this.scene.manager.scenes.filter(
            scene => scene.scene.key !== 'UIScene' && scene.scene.isActive()
        );
        
        if (gameScenes.length > 0) {
            const currentScene = gameScenes[0];
            const sceneKey = currentScene.scene.key;
            
            // Stop and restart the current game scene
            this.scene.stop(sceneKey);
            this.scene.start(sceneKey);
        }
    }
}
