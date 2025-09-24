export class LevelsScene extends Phaser.Scene {
    private back!: Phaser.GameObjects.Image;
    private level1!: Phaser.GameObjects.Image;
    private level2!: Phaser.GameObjects.Image;
    private level3!: Phaser.GameObjects.Image;
    private level4!: Phaser.GameObjects.Image;
    private customPanel!: Phaser.GameObjects.Image;
    
    private customSlots: Phaser.GameObjects.Container[] = [];
    private savedLevels: any[] = [];

    private lockWarning!: Phaser.GameObjects.Image;
    
    constructor() {
        super({key: 'levels'})
    }

    init(): void {
        this.loadCustomLevels();
    }

    private loadCustomLevels(): void {
        const saved = localStorage.getItem('customLevels');
        if (saved) {
            try {
                this.savedLevels = JSON.parse(saved);
            } catch (e) {
                this.savedLevels = [];
            }
        }
    }

    preload(): void {
        this.load.image('bglevel', 'assets/scene/levels/levelbg.png');
        this.load.image('level_1', 'assets/scene/levels/level_1.png');
        this.load.image('level_2', 'assets/scene/levels/level_2.png');
        this.load.image('level_3', 'assets/scene/levels/level_3.png');
        this.load.image('level_4', 'assets/scene/levels/level_4.png');
        this.load.image('level_custom', 'assets/scene/levels/level_custom.png');
        // this.load.image('custom_slot', 'assets/scene/levels/custom_slot.png');
        this.load.image('lock_icon', 'assets/scene/levels/lock.png');
    }

    create(): void {
        this.add.image(0, 0, 'bglevel')
            .setOrigin(0, 0)
            .setAlpha(.78)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.add.sprite(320, 280, 'snow').setScale(.164).play('blow').setDepth(10);

        this.add.text(this.scale.width / 2, 50, 'SELECT LEVEL', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.createCampaignLevels();

        this.createCustomSection();

        this.back = this.add.image(50, 50, 'btn-next')
            .setScale(0.1)
            .setFlipX(true)
            .setInteractive()
            .once('pointerdown', () => {
                this.scene.stop(); 
                this.scene.start('welcome');
            });

        this.setupButtonHovers();
    }

    private createCampaignLevels(): void {

        // Level 1 - Meadows (always unlocked)
        this.level1 = this.add.image(120, 280, 'level_1')
            .setScale(0.58)
            .setInteractive();

        // Level 2 - Winter
        this.level2 = this.add.image(320, 280, 'level_2')
            .setScale(0.59)
            .setInteractive();
        
        // Level 3 - Night
        this.level3 = this.add.image(510, 280, 'level_3')
            .setScale(0.64)
            .setInteractive();
        
        // Level 4 - Storm
        this.level4 = this.add.image(705, 280, 'level_4')
            .setScale(0.64)
            .setInteractive();

        // Set alpha and interactivity based on unlock status
        const isLevel2Unlocked = this.checkLevelUnlocked(2);
        const isLevel3Unlocked = this.checkLevelUnlocked(3);
        const isLevel4Unlocked = this.checkLevelUnlocked(4);

        if (!isLevel2Unlocked) {
            this.level2.setAlpha(0.4);
            this.add.image(320, 280, 'lock_icon').setScale(0.3).setAlpha(0.8);
        }
        if (!isLevel3Unlocked) {
            this.level3.setAlpha(0.4);
            this.add.image(510, 280, 'lock_icon').setScale(0.3).setAlpha(0.8);
        }
        if (!isLevel4Unlocked) {
            this.level4.setAlpha(0.4);
            this.add.image(705, 280, 'lock_icon').setScale(0.3).setAlpha(0.8);
        }

        // this.addDifficultyStars(280, 355, 1);  // Level 1
        // this.addDifficultyStars(480, 355, 2);  // Level 2
        // this.addDifficultyStars(680, 355, 3);  // Level 3
        // this.addDifficultyStars(875, 355, 4);  // Level 4

        // Level click handlers
        this.level1.once('pointerdown', () => {
            this.scene.stop();
            this.scene.start('level1');
        });

        this.level2.once('pointerdown', () => {
            if (isLevel2Unlocked) {
                this.scene.stop();
                this.scene.start('level2');
            } else {
                this.showLockedMessage();
            }
        });

        this.level3.once('pointerdown', () => {
            if (isLevel3Unlocked) {
                this.scene.stop();
                this.scene.start('level3');
            } else {
                this.showLockedMessage();
            }
        });

        this.level4.once('pointerdown', () => {
            if (isLevel4Unlocked) {
                this.scene.stop();
                this.scene.start('level4');
            } else {
                this.showLockedMessage();
            }
        });
    }

    private createCustomSection(): void {
        this.add.text(this.scale.width / 2, 410, 'CUSTOM LEVELS', {
            fontSize: '20px',
            color: '#00FF00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.customPanel = this.add.image(890, 286, 'level_custom')
            .setScale(0.59)
            .setInteractive()
            .once('pointerdown', () => {
                this.scene.stop();
                this.scene.start('custom_panel');
            });

        this.add.text(180, 540, 'Create New', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.createCustomSlots();
    }

    private createCustomSlots(): void {
        const startX = 380;
        const startY = 480;
        const spacing = 150;
        const maxSlots = 3;

        for (let i = 0; i < maxSlots; i++) {
            const x = startX + (i * spacing);
            
            if (i < this.savedLevels.length) {
                const level = this.savedLevels[i];
                const container = this.add.container(x, startY);
                
                const bg = this.add.rectangle(0, 0, 120, 120, 0x444444, 0.8)
                    .setStrokeStyle(2, 0x00ff00)
                    .setInteractive();
                const mapPreview = this.add.image(0, -20, level.config.map)
                    .setScale(0.08);
                
                const nameText = this.add.text(0, 30, level.name, {
                    fontSize: '12px',
                    color: '#ffffff',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);

                const diffColors = {
                    easy: 0x00ff00,
                    medium: 0xffff00,
                    hard: 0xff8800,
                    extreme: 0xff0000
                };
                
                const diffIndicator = this.add.circle(40, -40, 8, 
                    diffColors[level.config.difficulty as keyof typeof diffColors] || 0xffffff);
                
                container.add([bg, mapPreview, nameText, diffIndicator]);

                bg.on('pointerdown', () => {
                    this.scene.stop();
                    this.scene.start('level-custom', level.config);
                });
                
                bg.on('pointerover', () => {
                    bg.setFillStyle(0x666666, 0.9);
                    container.setScale(1.1);
                });
                
                bg.on('pointerout', () => {
                    bg.setFillStyle(0x444444, 0.8);
                    container.setScale(1);
                });
                
                this.customSlots.push(container);
            } else {
                const emptySlot = this.add.rectangle(x, startY, 120, 120, 0x222222, 0.5)
                    .setStrokeStyle(2, 0x666666, 0.5);
                
                this.add.text(x, startY, 'Empty', {
                    fontSize: '12px',
                    color: '#666666',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
            }
        }
    }

    private addDifficultyStars(x: number, y: number, difficulty: number): void {
        const maxStars = 5;
        const starSize = 12;
        const spacing = 15;
        const startX = x - ((maxStars * spacing) / 2);
        
        for (let i = 0; i < maxStars; i++) {
            const star = this.add.star(
                startX + (i * spacing), 
                y, 
                5, 
                starSize / 2, 
                starSize, 
                i < difficulty ? 0xFFD700 : 0x333333
            );
            
            if (i < difficulty) {
                this.tweens.add({
                    targets: star,
                    alpha: 0.7,
                    duration: 1000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        }
    }

    private checkLevelUnlocked(level: number): boolean {
        const progress = localStorage.getItem('gameProgress');
        if (progress) {
            try {
                const parsed = JSON.parse(progress);
                return parsed.completedLevels >= (level - 1);
            } catch (e) {
                console.error('Error parsing game progress:', e);
            }
        }

        return level === 1;
    }

    private showLockedMessage(): void {
        this.lockWarning = this.add.image(this.scale.width / 2, this.scale.height / 2 - 100,'lock_warning')
        .setOrigin(0.5).setDepth(300);
        
        this.tweens.add({
            targets: this.lockWarning,
            alpha: 0,
            y: this.lockWarning.y - 50,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => this.lockWarning.destroy()
        });
    }

    private setupButtonHovers(): void {
        const levelButtons = [this.level1, this.customPanel];

        if (this.checkLevelUnlocked(2)) {
            levelButtons.push(this.level2);
        }
        if (this.checkLevelUnlocked(3)) {
            levelButtons.push(this.level3);
        }
        if (this.checkLevelUnlocked(4)) {
            levelButtons.push(this.level4);
        }
        
        levelButtons.forEach(button => {
            if (!button) return;
            
            button.on('pointerover', () => {
                this.tweens.add({
                    targets: button,
                    scale: button.scaleX * 1.1,
                    duration: 100,
                    ease: 'Power1'
                });
            });

            button.on('pointerout', () => {
                this.tweens.add({
                    targets: button,
                    scale: button.scaleX / 1.1,
                    duration: 100,
                    ease: 'Power1'
                });
            });
        });

        this.back.on('pointerover', () => {
            this.tweens.add({
                targets: this.back,
                scale: 0.12,
                duration: 100,
                ease: 'Power1'
            });
        });

        this.back.on('pointerout', () => {
            this.tweens.add({
                targets: this.back,
                scale: 0.1,
                duration: 100,
                ease: 'Power1'
            });
        });
    }
}