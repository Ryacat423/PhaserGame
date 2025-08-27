export class GameUI extends Phaser.Scene {
    private uiElements: Phaser.GameObjects.GameObject[] = [];
    private home!: Phaser.GameObjects.Image;
    private reset!: Phaser.GameObjects.Image;
    private settings!: Phaser.GameObjects.Image;
    private pause!: Phaser.GameObjects.Image;
    private help!: Phaser.GameObjects.Image;
    private hideButton!: Phaser.GameObjects.Image;
    private isHideButtonEnabled: boolean = false;
    private isPaused: boolean = false;
    
    private avatarSprite!: Phaser.GameObjects.Sprite;
    private avatarFrame!: Phaser.GameObjects.Image;
    private maxLives: number = 9;
    private playerLives: number = 9;
    private livesText!: Phaser.GameObjects.Text;
    private livesIcon!: Phaser.GameObjects.Image;
    private avatarTintTween?: Phaser.Tweens.Tween;

    private foodCounterText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'UIScene' });
    }

    preload() {
        this.load.image('avatar_frame', 'assets/global/ui/avatar-frame.png');
        this.load.image('game_frame', 'assets/scene/tutorial/frame.png');
        this.load.image('movement_modal', 'assets/scene/tutorial/movement.png');
        this.load.image('btn-hide-disabled', 'assets/global/ui/hide_disabled.png');
        this.load.image('btn-hide', 'assets/global/ui/btn-hide.png');
        
        this.load.image('pause-overlay', 'assets/global/ui/pause-overlay.png');
        this.load.image('act-btn-resume', 'assets/global/ui/act-btn-resume.png');
        this.load.image('act-btn-settings', 'assets/global/ui/act-btn-settings.png');
        this.load.image('act-btn-mainmenu', 'assets/global/ui/act-btn-mainmenu.png');

        this.load.image('life', 'assets/global/ui/heart_life.png');
    }

    create() {
        this.avatarFrame = this.add.image(-10, -10, 'avatar_frame')
            .setOrigin(0)
            .setDepth(101);

        this.avatarSprite = this.add.sprite(30, 40, 'cat')
            .setScale(.3)
            .setDepth(102)
            .play('cat_idle');
        
        const frame = this.add.image(0, 0, 'game_frame')
            .setOrigin(0)
            .setDisplaySize(this.scale.width, this.scale.height)
            .setDepth(100);

        const assetKeys: string[] = ['btn-home', 'btn-settings', 'btn-reset', 'btn-pause'];
        this.setupUIButtons(assetKeys);
        
        // this.help = this.add.image(900, 40, 'btn-info')
        //     .setScale(0.5)
        //     .setInteractive()
        //     .setDepth(101);

        this.hideButton = this.add.image(this.scale.width - 60, this.scale.height - 60, 'btn-hide-disabled')
            .setScale(0.1)
            .setDepth(101)
            .setAlpha(0.5)
            .setInteractive();
            
        this.uiElements.push(frame, this.home, this.settings, this.reset, this.help, this.hideButton);
        // this.setupHelpModal();
        this.setupLivesDisplay();
        this.setupFoodDisplay();
        this.setupHideButton();
        this.setupEventListeners();        
        this.initializeLives();
    }

    private setupLivesDisplay(): void {
        this.livesIcon = this.add.image(100, 90, 'life')
            .setScale(0.15)
            .setDepth(102);

        this.livesText = this.add.text(110, 93, `${this.playerLives}`, {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(102);
    }

    private initializeLives(): void {
        this.playerLives = this.maxLives;
        this.updateLivesDisplay();
    }

    private updateLivesDisplay(): void {
        if (!this.livesText || !this.livesText.active) {
            return;
        }

        this.livesText.setText(`${this.playerLives}`);

        if (this.playerLives <= 3) {
            this.livesText.setColor('#ff4444');
        } else if (this.playerLives <= 5) {
            this.livesText.setColor('#ffaa44');
        } else {
            this.livesText.setColor('#ffffff');
        }
    }

    public loseLife(): void {
        if (this.playerLives > 0) {
            this.playerLives--;
            this.updateLivesDisplay();            
            if (this.playerLives <= 0) {
                alert('gameover')
                this.onGameOver();
            }
        }
    }

    private onGameOver(): void {
        this.resetCurrentLevel();
    }

    public resetLives(): void {
        this.playerLives = this.maxLives;
        this.updateLivesDisplay();
    }

    public onSceneStart(): void {
        this.time.delayedCall(10, () => {
            this.resetLives();
        });

        this.time.delayedCall(50, () => {
            this.setHideButtonEnabled(false);
        });
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
        this.events.off('playerNearBox');
        this.events.off('playerHitByDog');
        this.events.off('sceneStarted');
        this.game.events.off('levelStarted');
        this.game.events.off('levelReset');
        this.game.events.off('foodCollected');
        this.game.events.off('levelCompleted');

        this.events.on('playerNearBox', (isNear: boolean) => {
            this.setHideButtonEnabled(isNear);
        });

        this.events.on('playerHitByDog', () => {
            this.loseLife();
        });

        this.events.on('sceneStarted', () => {
            this.onSceneStart();
        });

        this.game.events.on('levelStarted', () => {
            this.onSceneStart();
            this.setupFoodCounter();
        });

        this.game.events.on('levelReset', () => {
            this.onSceneStart();
            this.setupFoodCounter();
        });

        this.game.events.on('foodCollected', (collected: number, total: number) => {
            this.updateFoodCounter(collected, total);
        });

        this.game.events.on('levelCompleted', () => {
            this.foodCounterText.setText("All foods collected!");
            this.foodCounterText.setColor('#00ff00');
        });
    }


    private setHideButtonEnabled(enabled: boolean) {
        this.isHideButtonEnabled = enabled;
        
        if (!this.hideButton || !this.tweens) return;
        
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
            const overlay = this.add.rectangle(
                this.scale.width / 2, 
                this.scale.height / 2, 
                this.scale.width, 
                this.scale.height, 
                0x000000, 
                0.7
            ).setDepth(150);

            const helpModal = this.add.image(500, 300, 'movement_modal')
                .setDepth(151);

            const closeBtn = this.add.image(800, 130, 'btn-close')
                .setDepth(201)
                .setScale(0.5)
                .setInteractive();
                
            this.uiElements.push(helpModal, closeBtn);

            closeBtn.on('pointerdown', () => {
                helpModal.destroy();
                closeBtn.destroy();
                overlay.destroy();
                this.uiElements = this.uiElements.filter(e => e !== helpModal && e !== closeBtn);
            });
        });
    }

    private setupUIButtons(assetKeys: string[]) {
        const spacing = 60;      
        const endY = 40;           
        const screenWidth = this.scale.width;

        assetKeys.forEach((key, i) => {
            const x = screenWidth - (spacing * (i + 1));

            const button = this.add.image(x, endY, key)
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
            if (key === 'btn-pause') this.pause = button;
        });
    }

    private handleButtonAction(key: string) {
        switch (key) {
            case 'btn-home':
                this.game.events.emit('returnToWelcome');
                break;
            case 'btn-settings':
                this.pauseGame();
                this.scene.launch('settings');
                break;
            case 'btn-reset':
                this.resetCurrentLevel();
                break;
            case 'btn-pause':
                this.togglePause();
                break;
        }
    }

    private togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
            this.showPauseOverlay();
        }
    }

    private pauseGame() {
        const gameScene = this.getActiveGameScene();
        if (gameScene) {
            if (gameScene.physics && gameScene.physics.world) {
                gameScene.physics.world.pause();
            }
            if (gameScene.tweens) {
                gameScene.tweens.pauseAll();
            }
            if (gameScene.anims) {
                gameScene.anims.pauseAll();
            }
            
            this.isPaused = true;
        }
    }

    private resumeGame() {
        const gameScene = this.getActiveGameScene();
        if (gameScene) {
            if (gameScene.physics && gameScene.physics.world) {
                gameScene.physics.world.resume();
            }
            if (gameScene.tweens) {
                gameScene.tweens.resumeAll();
            }
            if (gameScene.anims) {
                gameScene.anims.resumeAll();
            }
            
            this.isPaused = false;
            this.hidePauseOverlay();
        }
    }

    private showPauseOverlay() {
        const overlay = this.add.rectangle(
            this.scale.width / 2, 
            this.scale.height / 2, 
            this.scale.width, 
            this.scale.height, 
            0x000000, 
            0.7
        ).setDepth(150);

        const pausePanel = this.add.image(500, 300, 'pause-overlay')
            .setDepth(151);

        const resumeBtn = this.add.image(500, 230, 'act-btn-resume')
            .setOrigin(0.5)
            .setDepth(152)
            .setScale(.7)
            .setInteractive();

        const settingsBtn = this.add.image(500, 320, 'act-btn-settings')
            .setOrigin(0.5)
            .setDepth(152)
            .setScale(.7)
            .setInteractive();

        const mainMenuBtn = this.add.image(500, 400, 'act-btn-mainmenu')
            .setOrigin(0.5)
            .setDepth(152)
            .setScale(.7)
            .setInteractive();

        this.data.set('pauseOverlay', [overlay, pausePanel, resumeBtn, settingsBtn, mainMenuBtn]);
        resumeBtn.on('pointerdown', () => {
            this.resumeGame();
        });

        settingsBtn.on('pointerdown', () => {
            this.scene.launch('settings');
        });

        mainMenuBtn.on('pointerdown', () => {
            this.resumeGame();
            this.game.events.emit('returnToWelcome');
        });

        [resumeBtn, settingsBtn, mainMenuBtn].forEach(btn => {
            btn.on('pointerover', () => {
                btn.setScale(.9);
            });
            btn.on('pointerout', () => {
                btn.setScale(.7);
            });
        });
    }

    private hidePauseOverlay() {
        const pauseOverlay = this.data.get('pauseOverlay');
        if (pauseOverlay) {
            pauseOverlay.forEach((element: Phaser.GameObjects.GameObject) => {
                element.destroy();
            });
            this.data.remove('pauseOverlay');
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

            if (this.isPaused) {
                this.resumeGame();
            }
            
            currentScene.events.emit('beforeSceneRestart');
            currentScene.sound.stopAll();
            this.game.events.emit('levelReset');

            this.time.delayedCall(100, () => {
                this.scene.stop(sceneKey);
                this.scene.start(sceneKey);
            });
        }
    }

    private setupFoodDisplay() {
        this.foodCounterText = this.add.text(450, 16, `Foods: 0/${this.getTotalFoodCount()}`, {
            fontSize: "20px",
            color: "#ffffff",
            fontFamily: "Arial",
            stroke: "#000000",
            strokeThickness: 2
        }).setDepth(102);
    }

    private setupFoodCounter(): void {
        const gameScene = this.getActiveGameScene();
        if (gameScene && (gameScene as any).getItemSystem) {
            const itemSystem = (gameScene as any).getItemSystem();
            const collectedFoods = 0; 
            this.updateFoodCounter(collectedFoods, this.getTotalFoodCount());
            this.foodCounterText.setColor('#ffffff');
        } else {
            this.time.delayedCall(100, () => {
                this.setupFoodCounter();
            });
        }
    }

    private getTotalFoodCount(): number {
        const gameScene = this.getActiveGameScene();
        if (gameScene && (gameScene as any).getItemSystem) {
            const itemSystem = (gameScene as any).getItemSystem();
            const totalFoods = itemSystem.getFoods().length;

            return totalFoods;
        } 

        return 0;
    }

    private updateFoodCounter(collected: number, total: number): void {
        this.foodCounterText.setText(`Foods: ${collected}/${total}`);
        const progress = collected / total;
        if (progress >= 1) {
            this.foodCounterText.setColor('#00ff00');
        } else if (progress >= 0.7) {
            this.foodCounterText.setColor('#ffff00');
        } else {
            this.foodCounterText.setColor('#ffffff');
        }
    }

}