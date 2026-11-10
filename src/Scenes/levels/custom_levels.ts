import Phaser from 'phaser';
import { storage } from '../../utils/storage';
export class CustomLevels extends Phaser.Scene {
    private customSlots: Phaser.GameObjects.Container[] = [];
    private savedLevels: any[] = [];
    private customPanel!: Phaser.GameObjects.Image;
    private back!: Phaser.GameObjects.Image;

    constructor() {
        super({key: 'custom_levels'})
    }

    init(): void {
        this.loadCustomLevels();
    }

    preload(): void {
        this.load.image('bglevel', 'assets/scene/levels/levelbg.webp');
    }
    
    create(): void {
        this.add.image(0, 0, 'bglevel')
            .setOrigin(0, 0)
            .setAlpha(.78)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.createCustomSection();
        this.createCustomSlots();

        this.back = this.add.image(50, 50, 'btn-next')
            .setScale(0.1)
            .setFlipX(true)
            .setInteractive()
            .once('pointerdown', () => {
                this.scene.stop(); 
                this.scene.start('welcome');
            });
    }

    private loadCustomLevels(): void {
        const saved = storage.getItem('customLevels');
        if (saved) {
            try {
                this.savedLevels = JSON.parse(saved);
            } catch (e) {
                this.savedLevels = [];
            }
        }
    }

    private createCustomSection(): void {
        this.add.text(this.scale.width / 2, 80, 'CUSTOM LEVELS', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Background rectangle
        const bg = this.add.rectangle(890, 286, 140, 140, 0x2a2a2a, 0.9)
            .setStrokeStyle(3, 0x00ff00)
            .setInteractive();
        
        // Plus icon
        const plusVertical = this.add.rectangle(890, 266, 6, 50, 0x00ff00);
        const plusHorizontal = this.add.rectangle(890, 266, 50, 6, 0x00ff00);
        
        // Text
        const text = this.add.text(890, 311, 'Create New Level', {
            fontSize: '14px',
            color: '#00ff00',
            fontFamily: 'Arial',
            align: 'center'
        }).setOrigin(0.5);
        
        bg.on('pointerdown', () => {
            this.scene.stop();
            this.scene.start('custom_panel');
        });
        
        bg.on('pointerover', () => {
            bg.setFillStyle(0x3a3a3a, 1);
            bg.setStrokeStyle(3, 0x00ff88);
            text.setColor('#00ff88');
            plusVertical.setFillStyle(0x00ff88);
            plusHorizontal.setFillStyle(0x00ff88);
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0x2a2a2a, 0.9);
            bg.setStrokeStyle(3, 0x00ff00);
            text.setColor('#00ff00');
            plusVertical.setFillStyle(0x00ff00);
            plusHorizontal.setFillStyle(0x00ff00);
        });

        this.createCustomSlots();
    }

    private createCustomSlots(): void {
        const startX = 380;
        const startY = 280;
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
}