import Phaser from 'phaser';
import { FONTS } from '../../config/fonts';
import { storage } from '../../utils/storage';
import { onGameEvent, onSceneEvent } from '../../utils/events';
import { addSceneSound } from '../../utils/sound';
import { sheetScale } from '../../config/sprites';
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

    private outSound!: Phaser.Sound.BaseSound;
    private foodCounterText!: Phaser.GameObjects.Text;
    private currentGameMode: 'adventure' | 'custom' = 'adventure';
    
    constructor() {
        super({ key: 'UIScene' });
    }

    preload() {
        this.load.image('avatar_frame', 'assets/global/ui/avatar-frame.webp');
        this.load.image('game_frame', 'assets/scene/tutorial/frame.webp');
        this.load.image('movement_modal', 'assets/scene/tutorial/movement.webp');
        this.load.image('btn-hide-disabled', 'assets/global/ui/hide_disabled.webp');
        this.load.image('btn-hide', 'assets/global/ui/btn-hide.webp');
        
        this.load.image('pause-overlay', 'assets/global/ui/pause-overlay.webp');
        this.load.image('act-btn-resume', 'assets/global/ui/act-btn-resume.webp');
        this.load.image('act-btn-settings', 'assets/global/ui/act-btn-settings.webp');
        this.load.image('act-btn-mainmenu', 'assets/global/ui/act-btn-mainmenu.webp');
        this.load.audio('out', 'assets/global/audio/out.mp3');

        this.load.image('life', 'assets/global/ui/heart_life.webp');
    }

    create() {
        // Phaser reuses this scene object, so per-run lists start empty each time.
        this.uiElements = [];
        this.avatarFrame = this.add.image(-10, -10, 'avatar_frame')
            .setOrigin(0)
            .setDepth(101);

        this.createAvatar();
        
        const frame = this.add.image(0, 0, 'game_frame')
            .setOrigin(0)
            .setDisplaySize(this.scale.width, this.scale.height)
            .setDepth(100);

        const assetKeys: string[] = ['btn-home', 'btn-reset', 'btn-pause'];
        this.setupUIButtons(assetKeys);
        
        this.hideButton = this.add.image(this.scale.width - 60, this.scale.height - 60, 'btn-hide-disabled')
            .setScale(0.1)
            .setDepth(101)
            .setAlpha(0.5)
            .setInteractive();
        
        this.outSound = addSceneSound(this, 'out');
        this.uiElements.push(frame, this.home, this.settings, this.reset, this.help, this.hideButton);
        this.setupLivesDisplay();
        this.setupFoodDisplay();
        this.setupHideButton();
        this.setupEventListeners();
        // The level announces itself before this scene has started listening, so check lives
        // here too; otherwise a game could start (and keep going) with 0 lives.
        this.onSceneStart();
    }

    /** Centre of the round avatar frame, and the radius inside its wooden rim. */
    private static readonly AVATAR = { x: 55, y: 55, radius: 52 };

    /**
     * The pixel cat from the welcome screen, framed so only its face shows in the circle. In the
     * 125x150 cat_idle frames the head spans x 2-92, y 4-82; its centre is at (47, 43).
     */
    private createAvatar(): void {
        const { x, y, radius } = GameUI.AVATAR;
        const scale = 1.0;
        const headCentre = { x: 47, y: 43 };
        const frameCentre = { x: 125 / 2, y: 150 / 2 };
        // A little below the circle's centre, so the ears clear the rim and the chin fills the bottom.
        const faceY = y + 9;

        this.avatarSprite = this.add.sprite(
            x - (headCentre.x - frameCentre.x) * scale,
            faceY - (headCentre.y - frameCentre.y) * scale,
            'cat_idle', 1
        )
            .setScale(scale)
            .setDepth(102);
        this.textures.get('cat_idle').setFilter(Phaser.Textures.FilterMode.NEAREST);
        if (this.anims.exists('idle')) this.avatarSprite.play('idle');
        this.time.addEvent({
            delay: 3500,
            loop: true,
            callback: () => {
                if (!this.anims.exists('blink') || !this.avatarSprite.active) return;
                this.avatarSprite.play('blink');
                this.avatarSprite.once('animationcomplete', () => this.avatarSprite.play('idle'));
            }
        });

        const mask = this.make.graphics({}, false).fillCircle(x, y, radius);
        this.avatarSprite.setMask(mask.createGeometryMask());
    }

    /** Lives as a small badge just right of the avatar: heart, then the count. */
    private setupLivesDisplay(): void {
        const badge = this.add.graphics().setDepth(101.5);
        badge.fillStyle(0x2b1a0e, 0.72);
        badge.fillRoundedRect(96, 82, 70, 30, 15);
        badge.lineStyle(2, 0xe8b76a, 0.9);
        badge.strokeRoundedRect(96, 82, 70, 30, 15);
        this.uiElements.push(badge);

        this.livesIcon = this.add.image(116, 97, 'life')
            .setScale(0.085)
            .setDepth(102);

        this.livesText = this.add.text(134, 97, `${this.playerLives}`, {
            fontSize: '22px',
            color: '#ffffff',
            fontFamily: FONTS.display,
            stroke: '#3a2412',
            strokeThickness: 4
        }).setOrigin(0, 0.5).setDepth(102);
    }

    private determineGameMode(): 'adventure' | 'custom' {
        const gameScene = this.getActiveGameScene();
        if (gameScene && gameScene.scene.key === 'level-custom') {
            return 'custom';
        }
        return 'adventure';
    }

    private getLifeStorageKey(): string {
        return this.currentGameMode === 'custom' ? 'playerLivesCustom' : 'playerLivesAdventure';
    }

    private loadSavedLives(): void {
        this.currentGameMode = this.determineGameMode();
        const storageKey = this.getLifeStorageKey();
        const savedLives = storage.getItem(storageKey);
        
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
        const storageKey = this.getLifeStorageKey();
        storage.setItem(storageKey, this.playerLives.toString());
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
                this.outSound.play();
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
            fontFamily: FONTS.body,
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
        this.forcePlayerOutOfBox();
        this.stopAllDogs();
        this.stopAllGameActivity();
        this.showGameOverScreen();
        this.pauseGame();
    }

    private stopAllDogs(): void {
        const gameScene = this.getActiveGameScene();
        if (gameScene && typeof (gameScene as any).getDogs === 'function') {
            const dogs = (gameScene as any).getDogs();
            dogs.forEach((dog: any) => {
                if (dog && typeof dog.stopBark === 'function') {
                    dog.stopBark();
                }
            });
        }
    }

    private stopAllGameActivity(): void {
        const gameScene = this.getActiveGameScene();
        if (!gameScene) return;
        if (gameScene.time) {
            gameScene.time.removeAllEvents();
        }
        
        if (gameScene.tweens) {
            gameScene.tweens.killAll();
        }

        if ((gameScene as any).player) {
            const player = (gameScene as any).player;
            if (player.body) {
                player.body.setVelocity(0, 0);
            }
        }

        if (typeof (gameScene as any).getDogs === 'function') {
            const dogs = (gameScene as any).getDogs();
            dogs.forEach((dog: any) => {
                if (dog) {
                    dog.stopBark();
                    if (dog.body) {
                        dog.body.setVelocity(0, 0);
                    }

                    if (dog.scene && dog.scene.time) {
                        dog.scene.time.removeAllEvents();
                    }
                }
            });
        }
    }

    private forcePlayerOutOfBox(): void {
        const gameScene = this.getActiveGameScene();
        if (gameScene && typeof (gameScene as any).gameMap !== 'undefined') {
            const gameMap = (gameScene as any).gameMap;
            if (gameMap && typeof gameMap.getBoxes === 'function') {
                const boxes = gameMap.getBoxes();
                boxes.forEach((box: any) => {
                    if (box && typeof box.forceStopHiding === 'function') {
                        box.forceStopHiding();
                    }
                });
            }
        }
    }

    private showGameOverScreen(): void {
        this.showResultPanel('gameOverOverlay', 'game-over', [
            {
                texture: 'game-home',
                onClick: () => {
                    this.cleanupGameOverScreen();
                    this.stopAllDogs();
                    this.game.events.emit('returnToWelcome');
                }
            },
            {
                texture: 'game-replay',
                onClick: () => {
                    this.cleanupGameOverScreen();
                    this.resetLivesAndRestart();
                }
            }
        ]);
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

    private checkLivesBeforeStart(): boolean {
        if (this.playerLives <= 0) {
            this.showNoLivesWarning();
            return false;
        }
        return true;
    }

    /**
     * Starting a level with no lives left shows the same wooden game-over panel as losing your
     * last life, with Replay (refill lives and play this level) and Home. It used to be a plain
     * text screen whose Reset button sent you back to the title screen.
     */
    private showNoLivesWarning(): void {
        this.showGameOverScreen();
    }

    public onSceneStart(): void {
        this.currentGameMode = this.determineGameMode();
        
        this.time.delayedCall(10, () => {
            this.loadSavedLives();
            
            if (!this.checkLivesBeforeStart()) {
                const gameScene = this.getActiveGameScene();
                if (gameScene) {
                    this.time.delayedCall(100, () => {
                        gameScene.scene.pause();
                    });
                }
            }
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
        onSceneEvent(this, 'playerNearBox', (isNear: boolean) => {
            this.setHideButtonEnabled(isNear);
        });

        onSceneEvent(this, 'playerHitByDog', () => {
            console.log('UI: Player hit by dog');
            this.loseLife(1);
        });
        
        onSceneEvent(this, 'sceneStarted', () => {
            this.onSceneStart();
        });

        onGameEvent(this, 'levelStarted', () => {
            this.onSceneStart();
            this.setupFoodCounter();
            this.stopOtherLevelUIs();
        });

        onGameEvent(this, 'levelReset', () => {
            this.onSceneStart();
            this.setupFoodCounter();
            this.stopOtherLevelUIs();
        });

        onGameEvent(this, 'foodCollected', (collected: number, total: number) => {
            this.updateFoodCounter(collected, total);
        });

        onGameEvent(this, 'hideUIForStory', () => {
            this.hideUIElements();
        });

        onGameEvent(this, 'showUIForStory', () => {
            this.showUIElements();
        });

        onGameEvent(this, 'levelCompleted', () => {
            this.foodCounterText.setText("All foods collected!");
            this.foodCounterText.setColor('#00ff00');

            this.saveLives();
            this.forcePlayerOutOfBox();
            this.stopAllDogs();
            this.stopAllGameActivity();
            this.pauseGame();
            
            const currentScene = this.getActiveGameScene();
            const isLevel4 = currentScene && currentScene.scene.key === 'level4';
            const isCustomLevel = currentScene && currentScene.scene.key === 'level-custom';
            
            if (isCustomLevel) {
                this.showCustomLevelCompleteScreen();
            } else if (isLevel4) {
                this.showAdventureCompleteScreen();
            } else {
                this.showLevelCompleteScreen();
            }
        });
    }

    private hideUIElements(): void {
        if (this.foodCounterText) {
            this.foodCounterText.setVisible(false);
        }
    }

    private showUIElements(): void {
        if (this.foodCounterText) {
            this.foodCounterText.setVisible(true);
        }
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

    private showCustomLevelCompleteScreen(): void {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);
        overlay.setDepth(200);

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a1a, 0.95);
        panel.lineStyle(4, 0x00ff00, 1);
        panel.fillRoundedRect(200, 150, 600, 350, 20);
        panel.strokeRoundedRect(200, 150, 600, 350, 20);
        panel.setDepth(201);

        const title = this.add.text(
            this.scale.width / 2,
            200,
            'LEVEL COMPLETE!',
            {
                fontSize: '42px',
                color: '#00ff00',
                fontFamily: FONTS.display,
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setDepth(202);

        const successMsg = this.add.text(
            this.scale.width / 2,
            270,
            'You collected all the food!',
            {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: FONTS.body
            }
        ).setOrigin(0.5).setDepth(202);

        const livesLabel = this.add.text(
            this.scale.width / 2 - 80,
            330,
            'Lives Remaining:',
            {
                fontSize: '18px',
                color: '#ffffff',
                fontFamily: FONTS.body
            }
        ).setOrigin(0, 0.5).setDepth(202);

        const livesValue = this.add.text(
            this.scale.width / 2 + 80,
            330,
            `${this.playerLives}`,
            {
                fontSize: '32px',
                color: '#00ff00',
                fontFamily: FONTS.display
            }
        ).setOrigin(1, 0.5).setDepth(202);

        const customLevelsBtn = this.add.text(
            this.scale.width / 2 - 100,
            420,
            'CUSTOM LEVELS',
            {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: FONTS.display,
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setDepth(202).setInteractive();

        const replayBtn = this.add.text(
            this.scale.width / 2 + 100,
            420,
            'REPLAY',
            {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: FONTS.display,
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setDepth(202).setInteractive();

        const customCompleteElements = [overlay, panel, title, successMsg, livesLabel, livesValue, customLevelsBtn, replayBtn];
        this.data.set('customCompleteOverlay', customCompleteElements);

        customLevelsBtn.on('pointerdown', () => {
            this.cleanupCustomCompleteScreen();
            this.stopAllDogs();
            
            // Get the current game scene and stop it
            const currentScene = this.getActiveGameScene();
            if (currentScene) {
                currentScene.scene.stop();
            }
            
            // Stop all level-specific UI scenes
            const levelUIScenes = ['Level2UI', 'Level3UI', 'Level4UI'];
            levelUIScenes.forEach(uiSceneKey => {
                if (this.scene.manager.isActive(uiSceneKey)) {
                    this.scene.stop(uiSceneKey);
                }
            });
            
            // Stop UIScene itself
            this.scene.stop('UIScene');
            
            // Start custom levels scene
            this.scene.start('custom_levels');
        });

        replayBtn.on('pointerdown', () => {
            this.cleanupCustomCompleteScreen();
            this.stopAllDogs();
            this.resetCurrentLevel();
        });

        [customLevelsBtn, replayBtn].forEach(btn => {
            btn.on('pointerover', () => {
                btn.setBackgroundColor('#555555');
                btn.setScale(1.1);
            });

            btn.on('pointerout', () => {
                btn.setBackgroundColor('#333333');
                btn.setScale(1);
            });
        });
    }

    private cleanupCustomCompleteScreen(): void {
        const customCompleteOverlay = this.data.get('customCompleteOverlay');
        if (customCompleteOverlay) {
            customCompleteOverlay.forEach((element: Phaser.GameObjects.GameObject) => {
                element.destroy();
            });
            this.data.remove('customCompleteOverlay');
        }
        
        if (this.isPaused) {
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
            }
            this.isPaused = false;
            this.hidePauseOverlay();
        }
    }

    private showAdventureCompleteScreen(): void {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);
        overlay.setDepth(200);

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a1a, 0.95);
        panel.lineStyle(4, 0xFFD700, 1);
        panel.fillRoundedRect(200, 100, 600, 400, 20);
        panel.strokeRoundedRect(200, 100, 600, 400, 20);
        panel.setDepth(201);

        const catSprite = this.add.sprite(
            this.scale.width / 2,
            this.scale.height / 2 - 20,
            'cat'
        )
        .setScale(sheetScale('cat', 0.4))
        .setDepth(202)
        .play('cat_jump');

        catSprite.on('animationcomplete', () => {
            catSprite.play('cat_jump');
        });

        const title = this.add.text(
            this.scale.width / 2,
            150,
            'ADVENTURE COMPLETE!',
            {
                fontSize: '42px',
                color: '#FFD700',
                fontFamily: FONTS.display,
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setDepth(202);

        const livesLabel = this.add.text(
            this.scale.width / 2 - 80,
            380,
            'Lives Remaining:',
            {
                fontSize: '18px',
                color: '#ffffff',
                fontFamily: FONTS.body
            }
        ).setOrigin(0, 0.5).setDepth(202);

        const livesValue = this.add.text(
            this.scale.width / 2 + 80,
            380,
            `${this.playerLives}`,
            {
                fontSize: '32px',
                color: '#00ff00',
                fontFamily: FONTS.display
            }
        ).setOrigin(1, 0.5).setDepth(202);

        const homeBtn = this.add.text(
            this.scale.width / 2 - 100,
            450,
            'MAIN MENU',
            {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: FONTS.display,
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setDepth(202).setInteractive();

        const replayBtn = this.add.text(
            this.scale.width / 2 + 100,
            450,
            'REPLAY',
            {
                fontSize: '20px',
                color: '#ffffff',
                fontFamily: FONTS.display,
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setDepth(202).setInteractive();

        const adventureElements = [overlay, panel, catSprite, title, livesLabel, livesValue, homeBtn, replayBtn];
        this.data.set('adventureOverlay', adventureElements);

        homeBtn.on('pointerdown', () => {
            this.cleanupAdventureScreen();
            this.game.events.emit('returnToWelcome');
        });

        replayBtn.on('pointerdown', () => {
            this.cleanupAdventureScreen();
            this.resetCurrentLevel();
        });

        [homeBtn, replayBtn].forEach(btn => {
            btn.on('pointerover', () => {
                btn.setBackgroundColor('#555555');
                btn.setScale(1.1);
            });

            btn.on('pointerout', () => {
                btn.setBackgroundColor('#333333');
                btn.setScale(1);
            });
        });

        this.updateGameProgress();
    }

    private cleanupAdventureScreen(): void {
        const adventureOverlay = this.data.get('adventureOverlay');
        if (adventureOverlay) {
            adventureOverlay.forEach((element: Phaser.GameObjects.GameObject) => {
                element.destroy();
            });
            this.data.remove('adventureOverlay');
        }
        
        if (this.isPaused) {
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
            }
            this.isPaused = false;
            this.hidePauseOverlay();
        }
    }

    private showLevelCompleteScreen(): void {
        this.showResultPanel('completeOverlay', 'game-complete', [
            {
                texture: 'game-home',
                onClick: () => {
                    this.cleanupCompleteScreen();
                    this.stopAllDogs();
                    this.game.events.emit('returnToWelcome');
                }
            },
            {
                texture: 'game-replay',
                onClick: () => {
                    this.cleanupCompleteScreen();
                    this.stopAllDogs();
                    this.resetCurrentLevel();
                }
            },
            {
                texture: 'game-next',
                onClick: () => {
                    this.cleanupCompleteScreen();
                    this.stopAllDogs();
                    this.goToNextLevel();
                }
            }
        ]);

        this.updateGameProgress();
    }

    /**
     * The wooden result panels (level complete, game over): a dim backdrop that blocks clicks to
     * the game, the panel art, the lives count after its "REMAINING:" label, and a row of buttons
     * on the parchment. The buttons used to sit on the panel's bottom edge, partly off it.
     */
    private showResultPanel(
        dataKey: string,
        texture: string,
        buttons: { texture: string; onClick: () => void }[]
    ): void {
        if (this.data.get(dataKey)) return;
        const cx = this.scale.width / 2;

        const dim = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.55)
            .setOrigin(0)
            .setDepth(199)
            .setInteractive();
        const panel = this.add.image(cx, this.scale.height / 2, texture).setDepth(200);
        const lives = this.add.text(640, 385, `${this.playerLives}`, {
            fontSize: '44px',
            fontFamily: FONTS.display,
            color: '#ffffff',
            stroke: '#5a3a1a',
            strokeThickness: 8
        }).setOrigin(0, 0.5).setDepth(201);

        const spacing = 185;
        const firstX = cx - ((buttons.length - 1) * spacing) / 2;
        const buttonImages = buttons.map(({ texture: key, onClick }, i) => {
            const btn = this.add.image(firstX + i * spacing, 482, key)
                .setScale(0.78)
                .setDepth(202)
                .setInteractive({ useHandCursor: true });
            btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 0.86, duration: 100 }));
            btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 0.78, duration: 100 }));
            btn.on('pointerdown', onClick);
            return btn;
        });

        this.data.set(dataKey, [dim, panel, lives, ...buttonImages]);
    }

    private cleanupCompleteScreen(): void {
        const completeOverlay = this.data.get('completeOverlay');
        if (completeOverlay) {
            completeOverlay.forEach((element: Phaser.GameObjects.GameObject) => {
                element.destroy();
            });
            this.data.remove('completeOverlay');
        }
        
        if (this.isPaused) {
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
            }
            this.isPaused = false;
            this.hidePauseOverlay();
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
        const saved = storage.getItem('gameProgress');
        if (saved) {
            try {
                progress = JSON.parse(saved);
            } catch (e) {
                progress = { completedLevels: 0 };
            }
        }

        if (levelNumber > progress.completedLevels) {
            progress.completedLevels = levelNumber;
            storage.setItem('gameProgress', JSON.stringify(progress));
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

        const progress = storage.getItem('gameProgress');
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
            currentScene.scene.start('StoryScene', { level: nextLevel });
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
                this.stopAllDogs();
                this.game.events.emit('returnToWelcome');
                break;
            case 'btn-settings':
                this.pauseGame();
                this.scene.launch('settings');
                break;
            case 'btn-reset':
                this.stopAllDogs();
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

    /** HUD scenes that run alongside a level and have timers of their own. */
    private static readonly LEVEL_HUDS = ['Level2UI', 'Level3UI', 'Level4UI'];

    /**
     * Pauses the level scene and its HUD scenes outright. It used to pause only physics, tweens
     * and animations, so timers kept going: the cold meter filled, the flashlight drained and
     * lightning kept striking while the pause menu was open.
     */
    private pauseGame() {
        const gameScene = this.getActiveGameScene();
        if (!gameScene) return;

        if (gameScene.scene.isActive()) gameScene.scene.pause();
        GameUI.LEVEL_HUDS.forEach(key => {
            if (this.scene.manager.isActive(key)) this.scene.pause(key);
        });
        // Menus and result panels draw above the level HUDs.
        this.scene.bringToTop();
        this.isPaused = true;
    }

    private resumeGame() {
        const gameScene = this.getActiveGameScene();
        if (!gameScene) return;

        if (gameScene.scene.isPaused()) gameScene.scene.resume();
        // Back to the in-game order: level HUD bars above this scene's frame, touch controls on top.
        // Scene operations are queued, so decide from the state before resuming.
        GameUI.LEVEL_HUDS.forEach(key => {
            const paused = this.scene.manager.isPaused(key);
            if (!paused && !this.scene.manager.isActive(key)) return;
            if (paused) this.scene.resume(key);
            this.scene.bringToTop(key);
        });
        if (this.scene.manager.isActive('TouchControls')) this.scene.bringToTop('TouchControls');
        this.isPaused = false;
        this.hidePauseOverlay();
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
            this.stopAllDogs();
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
                    scene.scene.key !== 'StoryScene' &&
                    !scene.scene.key.includes('UI') &&
                    scene.scene.key !== 'TouchControls' &&
                    (scene.scene.isActive() || scene.scene.isPaused())
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
            this.cleanupAdventureScreen();
            this.cleanupCustomCompleteScreen();
            
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