import Phaser from 'phaser';
import { addSceneSound } from '../../utils/sound';
import { UIManager } from '../../components/ui/UIManager';

/** A full bolt from the lightning spritesheet, used as the story's lightning icon. */
const LIGHTNING_ICON_FRAME = 8;
interface StoryDialogue {
    speaker: string;
    text: string;
    image?: string;
    spriteAnim?: { key: string, anim: string, scale: number };
    position?: 'left' | 'right' | 'center';
}

interface LevelStory {
    background: string;
    dialogues: StoryDialogue[];
}

export class StoryScene extends Phaser.Scene {
    private currentDialogueIndex: number = 0;
    private levelStories!: Map<string, LevelStory>;
    private targetLevel!: string;
    
    private dialogueBox!: Phaser.GameObjects.Container;
    private speakerText!: Phaser.GameObjects.Text;
    private dialogueText!: Phaser.GameObjects.Text;
    private characterImage?: Phaser.GameObjects.Image;
    private characterSprite?: Phaser.GameObjects.Sprite;
    private skipButton!: Phaser.GameObjects.Container;
    private continueIndicator!: Phaser.GameObjects.Text;
    
    private isTyping: boolean = false;
    private typingTimer?: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'StoryScene' });
    }

    preload() {
        UIManager.preloadGameplayAssets(this);

        this.load.audio('meow-click', 'assets/global/audio/meow-click.mp3');

        this.load.image('box_icon', 'assets/global/bg/box.webp');
        this.load.image('snowflake_large', 'assets/scene/levels/2/snowflake.webp');
        this.load.image('flashlight_icon', 'assets/scene/levels/3/battery.webp');
        this.load.image('poison_icon', 'assets/global/food/poison.webp');
    }

    init(data: { level: string }) {
        this.targetLevel = data.level || 'level1';
        this.currentDialogueIndex = 0;
        this.stopAllLevelUIs();
        this.hideGameUI();
    }


    private hideGameUI(): void {
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.scene.isActive()) {
            this.game.events.emit('hideUIForStory');
        }
    }

    private stopAllLevelUIs(): void {
        const levelUIScenes = ['Level2UI', 'Level3UI', 'Level4UI'];
        levelUIScenes.forEach(sceneKey => {
            if (this.scene.manager.isActive(sceneKey)) {
                this.scene.stop(sceneKey);
            }
        });
    }


    create() {
        this.setupLevelStories();
        this.createBackground();
        this.createDialogueBox();
        this.catIdleSprite();
        this.createSkipButton();
        this.setupInputs();
        this.startLevelMusic();
        this.showDialogue(0);
    }

    private setupLevelStories(): void {
        this.levelStories = new Map();
        this.levelStories.set('level1', {
            background: 'level1_map',
            dialogues: [
                {
                    speaker: 'Mingming',
                    text: '*yawn* What a beautiful day in the meadow!',
                    position: 'left'
                },
                {
                    speaker: 'Mingming',
                    text: 'My tummy is rumbling... I need to find some food!',
                    position: 'left'
                },
                {
                    speaker: 'Tutorial',
                    text: 'MOVEMENT: Use WASD to move around. Hold SHIFT to sprint faster!',
                    position: 'center'
                },
                {
                    speaker: 'Mingming',
                    text: 'Oh no! The neighborhood dogs are out today. They always chase me when they see me...',
                    spriteAnim: { key: 'dog', anim: 'dog_run', scale: 0.3 },
                    position: 'left'
                },
                {
                    speaker: 'Tutorial',
                    text: 'HIDING: When you get close to a box, press SPACE to hide inside!',
                    image: 'box_icon',
                    position: 'center'
                },
                {
                    speaker: 'Mingming',
                    text: 'Perfect! I can use these boxes to hide from the dogs while I search for food.',
                    position: 'left'
                },
                {
                    speaker: 'Tutorial',
                    text: 'BE CAREFUL: Collect the good food, but avoid the poison! It will slow you down.',
                    image: 'poison_icon',
                    position: 'center'
                },
                {
                    speaker: 'Mingming',
                    text: "Let's go! Time to sneak around and collect all the yummy food! 🐱",
                    position: 'left'
                }
            ]
        });

        this.levelStories.set('level2', {
            background: 'level2_map',
            dialogues: [
                {
                    speaker: 'Mingming',
                    text: 'Brr... Why did I come to this snowy area? Oh right, I heard there\'s food here too!',
                    position: 'left'
                },
                {
                    speaker: 'Mingming',
                    text: '*shivers* It\'s so cold! I can feel my whiskers freezing...',
                    position: 'left'
                },
                {
                    speaker: 'Tutorial',
                    text: 'COLDNESS BAR: You\'ll get colder over time in the snow. When full, you\'ll move slower!',
                    image: 'snowflake_large',
                    position: 'center'
                },
                {
                    speaker: 'Mingming',
                    text: 'Look! There\'s a warm bonfire! I should stay near it to warm up.',
                    position: 'left'
                },
                {
                    speaker: 'Tutorial',
                    text: 'BONFIRE: Stay close to warm up and reduce coldness. But DON\'T touch it or you\'ll get burned!',
                    spriteAnim: { key: 'fire', anim: 'sway', scale: 0.4 },
                    position: 'center'
                },
                {
                    speaker: 'Mingming',
                    text: 'Got it! Stay warm, avoid dogs, collect food. Easy peasy! ...I hope. 😿',
                    position: 'left'
                }
            ]
        });

        this.levelStories.set('level3', {
            background: 'level3_map',
            dialogues: [
                {
                    speaker: 'Mingming',
                    text: 'Why did I agree to search for food at night? It\'s so dark out here...',
                    position: 'left'
                },
                {
                    speaker: 'Mingming',
                    text: 'At least I brought my flashlight! But... *checks* ...the battery is running low.',
                    position: 'left'
                },
                {
                    speaker: 'Tutorial',
                    text: 'FLASHLIGHT: Your light will fade as the battery drains. Find batteries to recharge it!',
                    image: 'flashlight_icon',
                    position: 'center'
                },
                {
                    speaker: 'Mingming',
                    text: 'I can barely see anything when the battery is low. Better collect those batteries quickly!',
                    position: 'left'
                },
                {
                    speaker: 'Mingming',
                    text: '*hoot hoot* What was that?! Just an owl... Stay calm, Mingming. You can do this! 🦉',
                    position: 'left'
                }
            ]
        });

        this.levelStories.set('level4', {
            background: 'level4_map',
            dialogues: [
                {
                    speaker: 'Mingming',
                    text: '*thunder rumbles* This is the worst idea I\'ve ever had...',
                    position: 'left'
                },
                {
                    speaker: 'Mingming',
                    text: 'But I\'m SO hungry! There has to be food around here somewhere!',
                    position: 'left'
                },
                {
                    speaker: 'Tutorial',
                    text: 'LIGHTNING STRIKES: Red warning circles will appear before lightning strikes!',
                    image: 'lightning_icon',
                    position: 'center'
                },
                {
                    speaker: 'Tutorial',
                    text: 'When you see a red warning, RUN! Getting hit by lightning will hurt... a LOT!',
                    image: 'lightning_icon',
                    position: 'center'
                },
                {
                    speaker: 'Mingming',
                    text: 'Dogs, rain, AND lightning?! This better be worth it... *gulp* 😰',
                    position: 'left'
                },
                {
                    speaker: 'Mingming',
                    text: 'Okay Mingming, you\'ve made it this far. One last adventure! Let\'s finish this! ⚡',
                    position: 'left'
                }
            ]
        });
    }

    private startLevelMusic(): void {
        const musicMap: { [key: string]: { key: string, volume: number } } = {
            'level1': { key: 'level1_theme', volume: 0.3 },
            'level2': { key: 'level2_theme', volume: 0.3 },
            'level3': { key: 'level3_theme', volume: 0.3 },
            'level4': { key: 'level4_theme', volume: 0.3 }
        };

        const musicConfig = musicMap[this.targetLevel];
        if (musicConfig) {
            if (!this.cache.audio.exists(musicConfig.key)) {
                
                return;
            }
            
            const music = addSceneSound(this, musicConfig.key, { 
                loop: true,
                volume: musicConfig.volume 
            });
            music.play();
            
            this.events.once('shutdown', () => {
                if (music.isPlaying) {
                    music.stop();
                }
            });
        }
    }

    private createBackground(): void {
        const story = this.levelStories.get(this.targetLevel);
        if (story) {
            const bg = this.add.image(0, 0, story.background)
                .setOrigin(0)
                .setDisplaySize(this.scale.width, this.scale.height);
            
            this.add.rectangle(
                this.scale.width / 2,
                this.scale.height / 2,
                this.scale.width,
                this.scale.height,
                0x000000,
                0.6
            ).setDepth(1);
        }
    }

    private createDialogueBox(): void {
        const boxHeight = 180;
        const boxY = this.scale.height - boxHeight;
        
        this.dialogueBox = this.add.container(0, boxY).setDepth(10);

        const bg = this.add.rectangle(
            this.scale.width / 2,
            boxHeight / 2,
            this.scale.width - 40,
            boxHeight - 20,
            0x000000,
            0.85
        );
        
        const border = this.add.rectangle(
            this.scale.width / 2,
            boxHeight / 2,
            this.scale.width - 40,
            boxHeight - 20
        );
        border.setStrokeStyle(3, 0xffffff, 1);

        this.speakerText = this.add.text(60, 20, '', {
            fontSize: '24px',
            fontFamily: 'Arial Black',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.dialogueText = this.add.text(60, 60, '', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: this.scale.width - 140 }
        });

        this.continueIndicator = this.add.text(
            this.scale.width - 80,
            boxHeight - 30,
            '▼',
            {
                fontSize: '20px',
                color: '#ffffff'
            }
        );

        this.tweens.add({
            targets: this.continueIndicator,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.dialogueBox.add([bg, border, this.speakerText, this.dialogueText, this.continueIndicator]);
    }

    catIdleSprite(): void {
        this.textures.get('cat_idle').setFilter(Phaser.Textures.FilterMode.NEAREST);
        const cat = this.add.sprite(900, 550, 'cat_idle')
        .setScale(1.8)
        .setDepth(10)
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

    private createSkipButton(): void {
        this.skipButton = this.add.container(100, 560).setDepth(20);

        const buttonBg = this.add.rectangle(0, 0, 100, 40, 0x000000, 0.7);
        buttonBg.setStrokeStyle(2, 0xffffff, 1);
        
        const buttonText = this.add.text(0, 0, 'SKIP', {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.skipButton.add([buttonBg, buttonText]);
        this.skipButton.setSize(100, 40);
        this.skipButton.setInteractive();

        this.skipButton.on('pointerover', () => {
            buttonBg.setFillStyle(0x333333, 0.9);
            this.tweens.add({
                targets: this.skipButton,
                scale: 1.1,
                duration: 100
            });
        });

        this.skipButton.on('pointerout', () => {
            buttonBg.setFillStyle(0x000000, 0.7);
            this.tweens.add({
                targets: this.skipButton,
                scale: 1,
                duration: 100
            });
        });

        this.skipButton.on('pointerdown', () => {
            this.skipStory();
        });
    }

    private setupInputs(): void {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const bounds = this.skipButton.getBounds();
            if (!Phaser.Geom.Rectangle.Contains(bounds, pointer.x, pointer.y)) {
                this.playMeowClick();
                this.nextDialogue();
            }
        });

        this.input.keyboard?.on('keydown-SPACE', () => {
            this.playMeowClick();
            this.nextDialogue();
        });

        this.input.keyboard?.on('keydown-ENTER', () => {
            this.playMeowClick();
            this.nextDialogue();
        });

        this.input.keyboard?.on('keydown-ESC', () => {
            this.skipStory();
        });
    }

    private playMeowClick(): void {
        if (this.sound.get('meow-click')) {
            this.sound.get('meow-click').stop();
        }
        this.sound.play('meow-click', { volume: .7 });
    }

    private showDialogue(index: number): void {
        const story = this.levelStories.get(this.targetLevel);
        if (!story || index >= story.dialogues.length) {
            this.endStory();
            return;
        }

        const dialogue = story.dialogues[index];
        
        if (this.characterImage) {
            this.characterImage.destroy();
            this.characterImage = undefined;
        }
        if (this.characterSprite) {
            this.characterSprite.destroy();
            this.characterSprite = undefined;
        }

        this.speakerText.setText(dialogue.speaker);
        if (dialogue.spriteAnim) {
            this.characterSprite = this.add.sprite(
                this.scale.width / 2,
                this.scale.height / 2 - 80,
                dialogue.spriteAnim.key
            )
            .setScale(dialogue.spriteAnim.scale)
            .setDepth(5)
            .play(dialogue.spriteAnim.anim);

            this.tweens.add({
                targets: this.characterSprite,
                scale: dialogue.spriteAnim.scale * 1.1,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        else if (dialogue.image) {
            const isLightning = dialogue.image === 'lightning_icon';
            const imageScale = isLightning ? 0.5 : 
                              dialogue.image === 'box_icon' ? 0.9 :
                              dialogue.image === 'flashlight_icon' ? 0.4 :
                              dialogue.image === 'poison_icon' ? 0.9 : 0.1;
            
            this.characterImage = this.add.image(
                this.scale.width / 2,
                this.scale.height / 2 - 80,
                isLightning ? 'lightning' : dialogue.image,
                isLightning ? LIGHTNING_ICON_FRAME : undefined
            )
            .setScale(imageScale)
            .setDepth(5);

            this.tweens.add({
                targets: this.characterImage,
                scale: imageScale * 1.1,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        this.typeText(dialogue.text);
    }

    private typeText(text: string): void {
        this.isTyping = true;
        this.dialogueText.setText('');
        this.continueIndicator.setVisible(false);
        
        let currentChar = 0;
        
        if (this.typingTimer) {
            this.typingTimer.destroy();
        }

        this.typingTimer = this.time.addEvent({
            delay: 30,
            callback: () => {
                if (currentChar < text.length) {
                    this.dialogueText.setText(text.substring(0, currentChar + 1));
                    currentChar++;
                } else {
                    this.isTyping = false;
                    this.continueIndicator.setVisible(true);
                    if (this.typingTimer) {
                        this.typingTimer.destroy();
                    }
                }
            },
            loop: true
        });
    }

    private nextDialogue(): void {
        if (this.isTyping) {
            if (this.typingTimer) {
                this.typingTimer.destroy();
            }
            const story = this.levelStories.get(this.targetLevel);
            if (story) {
                this.dialogueText.setText(story.dialogues[this.currentDialogueIndex].text);
            }
            this.isTyping = false;
            this.continueIndicator.setVisible(true);
            return;
        }

        this.currentDialogueIndex++;
        this.showDialogue(this.currentDialogueIndex);
    }

    private skipStory(): void {
        this.sound.play('meow-click', { volume: 0.3 });
        
        if (this.typingTimer) {
            this.typingTimer.destroy();
        }
        
        this.endStory();
    }

    private endStory(): void {
        if (this.typingTimer) {
            this.typingTimer.destroy();
        }

        if (this.characterImage) {
            this.characterImage.destroy();
        }
        if (this.characterSprite) {
            this.characterSprite.destroy();
        }

        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(this.targetLevel);
        });
    }
    
    shutdown() {
        if (this.typingTimer) {
            this.typingTimer.destroy();
        }
        if (this.characterImage) {
            this.characterImage.destroy();
        }
        if (this.characterSprite) {
            this.characterSprite.destroy();
        }
        this.input.keyboard?.removeAllListeners();
        this.input.removeAllListeners();
    }
}