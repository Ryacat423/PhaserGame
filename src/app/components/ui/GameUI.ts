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
    private playerLives: number = 1;
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
        
        this.hideButton = this.add.image(this.scale.width - 60, this.scale.height - 60, 'btn-hide-disabled')
            .setScale(0.1)
            .setDepth(101)
            .setAlpha(0.5)
            .setInteractive();
            
        this.uiElements.push(frame, this.home, this.settings, this.reset, this.help, this.hideButton);
        this.setupLivesDisplay();
        this.setupFoodDisplay();
        this.setupHideButton();
        this.setupEventListeners();        
        this.loadSavedLives();
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

    private loadSavedLives(): void {
        const savedLives = localStorage.getItem('playerLives');
        if (savedLives) {
            try {
                this.playerLives = parseInt(savedLives);
                this.playerLives = Math.max(0, Math.min(this.maxLives, this.playerLives));
            } catch (e) {
                this.playerLives = this.maxLives;
            }
        } else {
            this.playerLives = this.maxLives;
        }
        this.updateLivesDisplay();
    }

    private saveLives(): void {
        localStorage.setItem('playerLives', this.playerLives.toString());
    }

    private initializeLives(): void {
        const savedLives = localStorage.getItem('playerLives');
        if (!savedLives) {
            this.playerLives = this.maxLives;
            this.saveLives();
        }
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

    public loseLife(amount: number = 1): void {
        console.log('loseLife called with amount:', amount, 'Current lives:', this.playerLives);
        
        if (this.playerLives > 0) {
            this.playerLives = Math.max(0, this.playerLives - amount);
            console.log('Lives after damage:', this.playerLives);
            this.saveLives();
            this.updateLivesDisplay();

            this.createDamageEffect(amount);
            
            if (this.playerLives <= 0) {
                console.log('Game Over!');
                this.onGameOver();
            }
        }
    }

    private createDamageEffect(damageAmount: number): void {
        if (this.avatarTintTween) {
            this.avatarTintTween.stop();
        }

        this.avatarSprite.setTint(0xff0000);
        
        this.avatarTintTween = this.tweens.add({
            targets: this.avatarSprite,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: damageAmount - 1,
            ease: 'Power1',
            onComplete: () => {
                this.avatarSprite.clearTint();
                this.avatarSprite.setAlpha(1);
            }
        });

        const damageText = this.add.text(150, 90, `-${damageAmount}`, {
            fontSize: '24px',
            color: '#ff0000',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(103);

        this.tweens.add({
            targets: damageText,
            y: 70,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    private onGameOver(): void {
        this.showGameOverScreen();
        this.togglePause();
    }

    private showGameOverScreen(): void {
        const overlay = this.add.image(
            this.scale.width / 2, 
            this.scale.height / 2, 
            'game-over'
        ).setDepth(200);

        
        const homeBtn = this.add.image(
            400,
            500,
            'game-home'
        )
        .setInteractive()
        .setDepth(202);

        const tryAgainBtn = this.add.image(
            620,
            500,
            'game-replay'
        )
        .setInteractive()
        .setDepth(202);
        
        const gameOverElements = [overlay, tryAgainBtn, homeBtn];
        this.data.set('gameOverOverlay', gameOverElements);

        tryAgainBtn.on('pointerdown', () => {
            this.cleanupGameOverScreen();
            this.resetLivesAndRestart();
        });

        homeBtn.on('pointerdown', () => {
            this.cleanupGameOverScreen();
            this.game.events.emit('returnToWelcome');
        });

        // Add hover effects for the image buttons
        [tryAgainBtn, homeBtn].forEach(btn => {
            btn.on('pointerover', () => {
                this.tweens.add({
                    targets: btn,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100
                });
            });

            btn.on('pointerout', () => {
                this.tweens.add({
                    targets: btn,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            });
        });
    }

    private cleanupGameOverScreen(): void {
        const gameOverOverlay = this.data.get('gameOverOverlay');
        if (gameOverOverlay) {
            gameOverOverlay.forEach((element: Phaser.GameObjects.GameObject) => {
                element.destroy();
            });
            this.data.remove('gameOverOverlay');
        }
    }

    private resetLivesAndRestart(): void {
        this.playerLives = this.maxLives;
        this.saveLives();
        this.resetCurrentLevel();
    }

    public resetLives(): void {
        this.playerLives = this.maxLives;
        this.saveLives();
        this.updateLivesDisplay();
    }

    public onSceneStart(): void {
        this.time.delayedCall(10, () => {
            this.loadSavedLives();
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
            console.log('UI: Player hit by dog');
            this.loseLife(1);
        });
        
        this.events.on('sceneStarted', () => {
            this.onSceneStart();
        });

        this.game.events.on('levelStarted', () => {
            this.togglePause();
            this.onSceneStart();
            this.setupFoodCounter();
            this.stopOtherLevelUIs();
        });

        this.game.events.on('levelReset', () => {
            this.onSceneStart();
            this.setupFoodCounter();
            this.stopOtherLevelUIs();
        });

        this.game.events.on('foodCollected', (collected: number, total: number) => {
            this.updateFoodCounter(collected, total);
        });

        this.game.events.on('levelCompleted', () => {
            this.foodCounterText.setText("All foods collected!");
            this.foodCounterText.setColor('#00ff00');

            this.saveLives();
            
            this.time.delayedCall(1000, () => {
                this.togglePause();
                this.showLevelCompleteScreen();
            });
        });
    }

    private stopOtherLevelUIs(): void {
        const currentScene = this.getActiveGameScene();
        if (!currentScene) return;

        const sceneKey = currentScene.scene.key;

        const levelUIScenes = ['Level2UI', 'Level3UI', 'Level4UI'];
        levelUIScenes.forEach(uiSceneKey => {
            if (this.scene.manager.isActive(uiSceneKey)) {
                const shouldStop = 
                    (sceneKey === 'level2' && uiSceneKey !== 'Level2UI') ||
                    (sceneKey === 'level3' && uiSceneKey !== 'Level3UI') ||
                    (sceneKey === 'level4' && uiSceneKey !== 'Level4UI') ||
                    (!['level2', 'level3', 'level4'].includes(sceneKey));
                    
                if (shouldStop) {
                    this.scene.stop(uiSceneKey);
                }
            }
        });

        if (sceneKey === 'level2' && !this.scene.manager.isActive('Level2UI')) {
            this.scene.launch('Level2UI');
        } else if (sceneKey === 'level3' && !this.scene.manager.isActive('Level3UI')) {
            this.scene.launch('Level3UI');
        } else if (sceneKey === 'level4' && !this.scene.manager.isActive('Level4UI')) {
            this.scene.launch('Level4UI');
        }
    }

    private showLevelCompleteScreen(): void {

        const overlay = this.add.image(
            this.scale.width / 2, 
            this.scale.height / 2, 
            'game-complete'
        ).setDepth(200);

        const statsText = this.add.text(
            640,
            385,
            `${this.playerLives}`,
            {
                fontSize: '50px',
                color: '#ffffff',
                stroke: '#000000ff',
                strokeThickness: 3.5,
                fontFamily: 'Arial',
            }
        ).setOrigin(0.5).setDepth(202);


        const homeBtn = this.add.image(
            270,
            550,
            'game-home'
        )
        .setInteractive()
        .setDepth(202);

        const replayBtn = this.add.image(
            500,
            550,
            'game-replay'
        )
        .setInteractive()
        .setDepth(202);

        const nextBtn = this.add.image(
            720,
            550,
            'game-next'
        )
        .setInteractive()
        .setDepth(202);

        const completeElements = [overlay, statsText, homeBtn, nextBtn, replayBtn];
        this.data.set('completeOverlay', completeElements);

        homeBtn.on('pointerdown', () => {
            this.cleanupCompleteScreen();
            this.game.events.emit('returnToWelcome');
        });

        nextBtn.on('pointerdown', () => {
            this.cleanupCompleteScreen();
            this.goToNextLevel();
        });

        replayBtn.on('pointerdown', () => {
            this.cleanupCompleteScreen();
            this.resetCurrentLevel();
        });

        // Add hover effects for the image buttons
        [homeBtn, nextBtn, replayBtn].forEach(btn => {
            btn.on('pointerover', () => {
                this.tweens.add({
                    targets: btn,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100
                });
            });

            btn.on('pointerout', () => {
                this.tweens.add({
                    targets: btn,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            });
        });

        this.updateGameProgress();
    }

    private cleanupCompleteScreen(): void {
        const completeOverlay = this.data.get('completeOverlay');
        if (completeOverlay) {
            completeOverlay.forEach((element: Phaser.GameObjects.GameObject) => {
                element.destroy();
            });
            this.data.remove('completeOverlay');
        }
    }

    private updateGameProgress(): void {
        const currentScene = this.getActiveGameScene();
        if (!currentScene) return;

        const sceneKey = currentScene.scene.key;
        let levelNumber = 0;

        switch (sceneKey) {
            case 'level1': levelNumber = 1; break;
            case 'level2': levelNumber = 2; break;
            case 'level3': levelNumber = 3; break;
            case 'level4': levelNumber = 4; break;
            default: return;
        }

        let progress = { completedLevels: 0 };
        const saved = localStorage.getItem('gameProgress');
        if (saved) {
            try {
                progress = JSON.parse(saved);
            } catch (e) {
                progress = { completedLevels: 0 };
            }
        }

        if (levelNumber > progress.completedLevels) {
            progress.completedLevels = levelNumber;
            localStorage.setItem('gameProgress', JSON.stringify(progress));
            console.log(`Level ${levelNumber} completed! Next level unlocked.`);
        }
    }

    private goToNextLevel(): void {
        const currentScene = this.getActiveGameScene();
        if (!currentScene) return;

        const sceneKey = currentScene.scene.key;
        let nextLevel = '';

        switch (sceneKey) {
            case 'level1': nextLevel = 'level2'; break;
            case 'level2': nextLevel = 'level3'; break;
            case 'level3': nextLevel = 'level4'; break;
            case 'level4':
                this.scene.stop();
                this.scene.start('levels');
                return;
            default:
                this.scene.stop();
                this.scene.start('levels');
                return;
        }

        const progress = localStorage.getItem('gameProgress');
        let completedLevels = 0;
        if (progress) {
            try {
                completedLevels = JSON.parse(progress).completedLevels;
            } catch (e) {
                completedLevels = 0;
            }
        }

        const nextLevelNum = parseInt(nextLevel.replace('level', ''));
        if (nextLevelNum <= completedLevels + 1) {
            currentScene.scene.stop(sceneKey);
            currentScene.scene.start(nextLevel);
        } else {
            this.scene.stop();
            this.scene.start('levels');
        }
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

            this.cleanupCompleteScreen();
            this.cleanupGameOverScreen();
            
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

    public startNewGame(): void {
        this.playerLives = this.maxLives;
        this.saveLives();
        this.updateLivesDisplay();
    }
}