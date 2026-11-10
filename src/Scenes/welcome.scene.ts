import Phaser from 'phaser';
import { UIManager } from "../components/ui/UIManager";

export class WelcomeScene extends Phaser.Scene {
    private uiManager: UIManager = new UIManager(this);
    private start!: Phaser.GameObjects.Image;
    private help!: Phaser.GameObjects.Image;
    private tutorial!: Phaser.GameObjects.Image;

    gameConfig: any

    constructor() {
        super({ key: 'welcome' });
    }

    preload(): void {
        UIManager.preloadMenuAssets(this);

        this.load.image('welcome-bg', 'assets/scene/welcome/bg1.webp');
        this.load.image('btn-start', 'assets/scene/welcome/start_button.webp');
        this.load.image('btn-tutorial', 'assets/scene/welcome/tutorial_button.webp');

        this.load.image('title', 'assets/scene/welcome/game_title.webp');
        this.load.image('dog_house', 'assets/scene/welcome/dog_house.webp');
    }

    create(): void {
        this.uiManager.initSounds();

        this.uiManager.createAnimations();
        this.uiManager.playDogSleep(315, 380, 0.2, 10);

        this.createUI();
        this.loadGameplayInBackground();
        this.catIdleSprite();
    }

    /**
     * Starts downloading level assets once the menu is on screen, so the first screen only waits
     * for what it shows and levels still open without a wait.
     */
    private loadGameplayInBackground(): void {
        UIManager.preloadGameplayAssets(this);
        this.load.once(Phaser.Loader.Events.COMPLETE, () => UIManager.createAnimations(this));
        this.load.start();
    }

    createUI(): void {
        this.add.image(0,0, 'welcome-bg')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);
            
        this.add.image(240, 370, 'dog_house')
            .setDepth(0)
            .setFlipX(true)
            .setScale(.6);

        const title = this.add.image(500, 150, 'title')
            .setDisplaySize(700, 380);

        this.start = this.add.image(500, 250, 'adventure_btn').setScale(.4)
        this.tutorial = this.add.image(500, 330, 'custom_mode_btn').setScale(.4)
        this.help = this.add.image(950, 50, 'btn-info').setScale(.5)


        this.tweens.add({
            targets: title,
            y: title.y - 10,
            scale: 0.8,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.start.setInteractive().on('pointerdown', () => {
            this.uiManager.playClickSound();

            this.time.delayedCall(150, () => {
                this.cleanUp();
                this.scene.sleep();
                this.scene.start('levels');
            });
        });
     
        this.tutorial.setInteractive().on('pointerdown', () => {
            this.uiManager.playClickSound();

            this.time.delayedCall(150, () => {
                this.uiManager.stopTheme();
                this.cleanUp();
                this.scene.sleep();
                this.scene.start('custom_levels');
            });
        });

        this.help.setInteractive().on('pointerdown', () => {
            this.uiManager.playClickSound();

            this.time.delayedCall(150, () => {
                this.cleanUp();
                this.scene.sleep();
                this.scene.start('information');
            });
        });
    
        this.createTooltip(this.help, "Character Information");

        this.setupButtonHover(this.start, false);
        this.setupButtonHover(this.tutorial, false);
        this.setupButtonHover(this.help, true);
    }
                
    setupButtonHover(button: any, info: boolean): void {
        button.on('pointerover', () => {
            this.tweens.add({
                targets: button,
                scale: info ? 0.7 : 0.5,
                duration: 100,
                ease: 'Power1'
            });
        });

        button.on('pointerout', () => {
            this.tweens.add({
                targets: button,
                scale: info ? 0.5 : 0.4,
                duration: 100,
                ease: 'Power1'
            });
        });
    }

    createTooltip(target: Phaser.GameObjects.Image, text: string): void {
        const tooltipBg = this.add.rectangle(0, 0, 220, 40, 0xadd8e6, 0.9)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff)
            .setVisible(false)
            .setDepth(5);

        (tooltipBg as any).radius = 25;

        const tooltipText = this.add.text(0, 0, text, {
            fontSize: '16px',
            color: '#000',
            fontStyle: 'bold',
            align: 'center',
        })
        .setOrigin(0.5)
        .setVisible(false)
        .setDepth(6);

        target.on('pointerover', () => {
            tooltipBg.setPosition(target.x - 160, target.y).setVisible(true);
            tooltipText.setPosition(target.x - 160, target.y).setVisible(true);
        });

        target.on('pointerout', () => {
            tooltipBg.setVisible(false);
            tooltipText.setVisible(false);
        });
    }

    catIdleSprite(): void {
        this.textures.get('cat_idle').setFilter(Phaser.Textures.FilterMode.NEAREST);
        const cat = this.add.sprite(805, 550, 'cat_idle')
        .setScale(1.8)
        .play('idle');

        const scheduleBlink = () => {
        this.time.delayedCall(Phaser.Math.Between(3000, 6000), () => {
            cat.play('blink');

            cat.once('animationcomplete-blink', () => {
            cat.play('idle');
            scheduleBlink();
            });
        });
        };

        scheduleBlink();
    }

    cleanUp(): void {
        this.children.removeAll(true);     
        this.tweens.killAll();             
        this.time.clearPendingEvents();     
        this.sound.stopAll();           
    }
}