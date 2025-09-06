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
        UIManager.preloadAssets(this);

        this.load.image('welcome-bg', 'assets/scene/welcome/bg1.png');
        this.load.image('btn-start', 'assets/scene/welcome/start_button.png');
        this.load.image('btn-tutorial', 'assets/scene/welcome/tutorial_button.png');

        this.load.image('title', 'assets/scene/welcome/game_title.png');
        this.load.image('dog_house', 'assets/scene/welcome/dog_house.png');

        this.load.spritesheet('cat_idle', 'assets/sprites/cat_idle.png', {
            frameWidth: 125,
            frameHeight: 150
        });
    }

    create(): void {
        this.uiManager.initSounds();

        this.uiManager.createAnimations();
        this.uiManager.playDogSleep(315, 380, 0.2, 10);

        this.createUI();
        this.createAnimations();
        this.catIdleSprite();

        
    }

    // init(): void {
    //     localStorage.clear()
    // }
    
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

        this.start = this.add.image(500, 250, 'btn-start').setScale(0.2)
        this.tutorial = this.add.image(500, 310, 'btn-tutorial').setScale(0.2)
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
                this.scene.start('tutorial');
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
    
        this.setupButtonHover(this.start, false);
        this.setupButtonHover(this.tutorial, false);
        this.setupButtonHover(this.help, true);
    }
                
    setupButtonHover(button: any, info: boolean): void {
        button.on('pointerover', () => {
            this.tweens.add({
                targets: button,
                scale: info ? 0.7 : 0.27,
                duration: 100,
                ease: 'Power1'
            });
        });

        button.on('pointerout', () => {
            this.tweens.add({
                targets: button,
                scale: info ? 0.5 : 0.2,
                duration: 100,
                ease: 'Power1'
            });
        });
    }

    createAnimations(): void {
        if(!this.anims.exists('idle')){
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('cat_idle', {
                    frames: [1, 1, 1, 2, 2, 3, 3, 3]
                }),
                frameRate: 12,
                repeat: -1
            });
    
            this.anims.create({
                key: 'blink',
                frames: this.anims.generateFrameNumbers('cat_idle', {
                    frames: [4, 5, 6, 7, 8, 5, 4]
                }),
                frameRate: 12,
                repeat: 0
            });
        }
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