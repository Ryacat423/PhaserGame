export class GameUI extends Phaser.Scene {
    private uiElements: Phaser.GameObjects.GameObject[] = [];
    private home!: Phaser.GameObjects.Image;
    private reset!: Phaser.GameObjects.Image;
    private settings!: Phaser.GameObjects.Image;
    private help!: Phaser.GameObjects.Image;
    private hideButton!: Phaser.GameObjects.Image;
    private isHideButtonEnabled: boolean = false;

    constructor() {
        super({ key: 'UIScene' });
    }

    preload() {
        this.load.image('game_frame', 'assets/scene/tutorial/frame.png');
        this.load.image('movement_modal', 'assets/scene/tutorial/movement.png');
        this.load.image('btn-hide-disabled', 'assets/global/ui/hide_disabled.png');
        this.load.image('btn-hide', 'assets/global/ui/btn-hide.png');
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

        this.hideButton = this.add.image(this.scale.width - 60, this.scale.height - 60, 'btn-hide-disabled')
            .setScale(0.1)
            .setDepth(101)
            .setAlpha(0.5)
            .setInteractive();
            
        this.uiElements.push(frame, this.home, this.settings, this.reset, this.help, this.hideButton);

        this.setupHelpModal();
        this.setupHideButton();
        this.setupEventListeners();
    }

    private setupHideButton() {        
        this.hideButton.on('pointerdown', () => {
            if (this.isHideButtonEnabled) {
                const gameScene = this.getActiveGameScene();
                if (gameScene) {
                    gameScene.events.emit('hideButtonPressed');
                }
            }
        });

        this.hideButton.on('pointerover', () => {
            if (this.isHideButtonEnabled) {
                this.tweens.add({
                    targets: this.hideButton,
                    scale: 0.12,
                    duration: 100,
                    ease: 'Power1'
                });
            }
        });

        this.hideButton.on('pointerout', () => {
            if (this.isHideButtonEnabled) {
                this.tweens.add({
                    targets: this.hideButton,
                    scale: 0.1,
                    duration: 100,
                    ease: 'Power1'
                });
            }
        });
    }

    private setupEventListeners() {
        this.events.on('playerNearBox', (isNear: boolean) => {
            this.setHideButtonEnabled(isNear);
        });
    }

    private setHideButtonEnabled(enabled: boolean) {
        this.isHideButtonEnabled = enabled;
        
        if (enabled) {
            this.hideButton.setTexture('btn-hide');
            this.hideButton.setAlpha(1);

            this.tweens.add({
                targets: this.hideButton,
                alpha: 0.7,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            this.hideButton.setTexture('btn-hide-disabled');
            this.hideButton.setAlpha(0.5);
            this.tweens.killTweensOf(this.hideButton);
        }
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

    private getActiveGameScene(): Phaser.Scene | null {
        const gameScenes = this.scene.manager.scenes.filter(
            scene => scene.scene.key !== 'UIScene' && 
                    scene.scene.key !== 'welcome' && 
                    scene.scene.key !== 'settings' && 
                    scene.scene.isActive()
        );
        
        return gameScenes.length > 0 ? gameScenes[0] : null;
    }

    private resetCurrentLevel() {
        const currentScene = this.getActiveGameScene();
        
        if (currentScene) {
            const sceneKey = currentScene.scene.key;
            
            console.log(`Resetting scene: ${sceneKey}`);
            
            this.setHideButtonEnabled(false);
            currentScene.sound.stopAll();
            this.time.delayedCall(100, () => {
                this.scene.stop(sceneKey);
                this.scene.start(sceneKey);
            });
        }
    }
}