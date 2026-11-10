import Phaser from 'phaser';
import { FONTS } from '../config/fonts';
import { storage } from '../utils/storage';
import { GameUI } from "../components/ui/GameUI";

export class SettingScene extends Phaser.Scene {
    private backgroundOverlay!: Phaser.GameObjects.Rectangle;
    private masterVolume: number = 1;
    private sfxVolume: number = 1;
    private musicVolume: number = 1;
    private isFullscreen: boolean = false;

    constructor() {
        super({ key: 'settings' });
    }


    create() {
        console.log('Settings scene created');
        this.loadSettings();
        
        // Bring this scene to the front
        this.scene.bringToTop();
        
        // Pause the game scene when settings opens
        const gameScenes = this.scene.manager.scenes.filter(
            scene => scene.scene.key !== 'UIScene' && 
                    scene.scene.key !== 'welcome' && 
                    scene.scene.key !== 'settings' &&
                    scene.scene.key !== 'StoryScene' &&
                    !scene.scene.key.includes('UI') &&
                    scene.scene.isActive()
        );
        
        gameScenes.forEach(scene => {
            if (scene.physics && scene.physics.world) {
                scene.physics.world.pause();
            }
        });
        
        this.createBackground();
        this.createSettingsPanel();
    }


    private createBackground(): void {
        const graphics = this.add.graphics();

        // 🌿 Gradient background: deep to soft green (matching custom panel)
        graphics.fillGradientStyle(0x1b4332, 0x2d6a4f, 0x40916c, 0x74c69d, 1);
        graphics.fillRect(0, 0, 1000, 600);

        // Gentle green glow circles for depth
        const circles = [
            { x: 150, y: 100, radius: 130, color: 0x95d5b2, alpha: 0.12 },
            { x: 850, y: 200, radius: 180, color: 0x74c69d, alpha: 0.10 },
            { x: 500, y: 500, radius: 160, color: 0x52b788, alpha: 0.15 }
        ];

        circles.forEach(circle => {
            graphics.fillStyle(circle.color, circle.alpha);
            graphics.fillCircle(circle.x, circle.y, circle.radius);
        });

        // Dark overlay for focus
        this.backgroundOverlay = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.3
        ).setDepth(200).setInteractive();
    }

    private createSettingsPanel(): void {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Main panel background (brown wood texture)
        const panel = this.add.graphics();
        panel.fillStyle(0x8B5E3C, 0.95);
        panel.lineStyle(4, 0x5C4033, 1);
        panel.fillRoundedRect(150, 80, 700, 440, 15);
        panel.strokeRoundedRect(150, 80, 700, 440, 15);
        panel.setDepth(201);

        // Inner shadow effect
        panel.lineStyle(2, 0x3E2723, 0.5);
        panel.strokeRoundedRect(155, 85, 690, 430, 12);

        // Title bar
        const titleBar = this.add.graphics();
        titleBar.fillStyle(0x6B4226, 1);
        titleBar.fillRoundedRect(150, 80, 700, 60, { tl: 15, tr: 15, bl: 0, br: 0 });
        titleBar.setDepth(201);

        // Title text
        this.add.text(centerX, 110, '⚙️ SETTINGS', {
            fontSize: '28px',
            color: '#fff5e1',
            fontFamily: FONTS.body,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(202);

        // Close button
        const closeBtn = this.createWoodButton(centerX + 320, 110, '×', 40);
        closeBtn.on('pointerdown', () => this.closeSettings());

        // Audio Section
        this.createSectionHeader(centerX, 170, 'AUDIO');
        
        this.createVolumeSlider(centerX, 215, 'Master Volume', this.masterVolume, (value) => {
            this.masterVolume = value;
            this.game.sound.volume = value;
        });

        this.createVolumeSlider(centerX, 265, 'SFX Volume', this.sfxVolume, (value) => {
            this.sfxVolume = value;
        });

        this.createVolumeSlider(centerX, 315, 'Music Volume', this.musicVolume, (value) => {
            this.musicVolume = value;
        });
        // Save Button
        const saveBtn = this.createWoodButton(centerX, 485, 'SAVE & APPLY');
        saveBtn.on('pointerdown', () => {
            this.saveSettings();
            this.closeSettings();
        });
    }

    private createSectionHeader(x: number, y: number, text: string): void {
        // Decorative line before text
        const line1 = this.add.graphics();
        line1.lineStyle(2, 0x52b788, 0.6);
        line1.lineBetween(x - 180, y, x - 80, y);
        line1.setDepth(202);

        // Section title
        this.add.text(x, y, text, {
            fontSize: '20px',
            color: '#52b788',
            fontFamily: FONTS.body,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(202);

        // Decorative line after text
        const line2 = this.add.graphics();
        line2.lineStyle(2, 0x52b788, 0.6);
        line2.lineBetween(x + 80, y, x + 180, y);
        line2.setDepth(202);
    }

    private createWoodButton(x: number, y: number, text: string, fontSize: number = 18): Phaser.GameObjects.Container {
        const container = this.add.container(x, y).setDepth(202);

        // Button background
        const buttonBg = this.add.graphics();
        const width = text === '×' ? 30 : 180;
        const height = text === '×' ? 30 : 45;
        
        buttonBg.fillStyle(0x6B4226, 1);
        buttonBg.lineStyle(2, 0x4a2f1a, 1);
        buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 8);
        buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 8);

        // Button text
        const buttonText = this.add.text(0, 0, text, {
            fontSize: `${fontSize}px`,
            color: '#fff5e1',
            fontFamily: FONTS.body,
            fontStyle: text === '×' ? 'normal' : 'bold'
        }).setOrigin(0.5);

        container.add([buttonBg, buttonText]);
        container.setSize(width, height);
        container.setInteractive();

        // Hover effects
        container.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x8B5E3C, 1);
            buttonBg.lineStyle(2, 0x6B4226, 1);
            buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 8);
            buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
            container.setScale(1.05);
            buttonText.setColor(text === '×' ? '#ff6b6b' : '#ffffff');
        });

        container.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x6B4226, 1);
            buttonBg.lineStyle(2, 0x4a2f1a, 1);
            buttonBg.fillRoundedRect(-width/2, -height/2, width, height, 8);
            buttonBg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
            container.setScale(1);
            buttonText.setColor('#fff5e1');
        });

        return container;
    }

    private createVolumeSlider(x: number, y: number, label: string, value: number, onchange: (value: number) => void): void {
        // Label
        this.add.text(x - 230, y, label, {
            fontSize: '16px',
            color: '#f4e1c1',
            fontFamily: FONTS.body
        }).setOrigin(0, 0.5).setDepth(202);

        // Slider track background
        const trackBg = this.add.graphics();
        trackBg.fillStyle(0x3E2723, 0.8);
        trackBg.fillRoundedRect(x - 50, y - 4, 200, 8, 4);
        trackBg.setDepth(202);

        // Slider track fill (shows volume level)
        const trackFill = this.add.graphics();
        const fillWidth = value * 200;
        trackFill.fillStyle(0x52b788, 1);
        trackFill.fillRoundedRect(x - 50, y - 4, fillWidth, 8, 4);
        trackFill.setDepth(202);

        // Slider handle
        const handle = this.add.circle(x - 50 + (value * 200), y, 12, 0x74c69d)
            .setDepth(203)
            .setStrokeStyle(2, 0x2d6a4f)
            .setInteractive();

        // Value text
        const valueText = this.add.text(x + 170, y, Math.round(value * 100) + '%', {
            fontSize: '16px',
            color: '#d4a373',
            fontFamily: FONTS.body,
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(202);

        // Make slider interactive
        let isDragging = false;

        handle.on('pointerdown', () => {
            isDragging = true;
            handle.setFillStyle(0x95d5b2);
        });

        this.input.on('pointerup', () => {
            if (isDragging) {
                isDragging = false;
                handle.setFillStyle(0x74c69d);
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (isDragging) {
                const sliderLeft = x - 50;
                const sliderRight = x + 150;
                const newX = Phaser.Math.Clamp(pointer.x, sliderLeft, sliderRight);
                
                handle.x = newX;
                const newValue = (newX - sliderLeft) / 200;
                
                // Update fill
                trackFill.clear();
                trackFill.fillStyle(0x52b788, 1);
                trackFill.fillRoundedRect(sliderLeft, y - 4, newValue * 200, 8, 4);
                
                valueText.setText(Math.round(newValue * 100) + '%');
                onchange(newValue);
            }
        });

        // Click on slider track to jump to position
        trackBg.setInteractive(
            new Phaser.Geom.Rectangle(x - 50, y - 4, 200, 8), 
            Phaser.Geom.Rectangle.Contains
        ).on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const sliderLeft = x - 50;
            const clickValue = (pointer.x - sliderLeft) / 200;
            const clampedValue = Phaser.Math.Clamp(clickValue, 0, 1);
            
            handle.x = sliderLeft + (clampedValue * 200);
            
            // Update fill
            trackFill.clear();
            trackFill.fillStyle(0x52b788, 1);
            trackFill.fillRoundedRect(sliderLeft, y - 4, clampedValue * 200, 8, 4);
            
            valueText.setText(Math.round(clampedValue * 100) + '%');
            onchange(clampedValue);
        });
    }

    private createToggleButton(x: number, y: number, label: string, value: boolean, onchange: (value: boolean) => void): void {
        // Label
        this.add.text(x - 230, y, label, {
            fontSize: '16px',
            color: '#f4e1c1',
            fontFamily: FONTS.body
        }).setOrigin(0, 0.5).setDepth(202);

        // Toggle container
        const toggleContainer = this.add.container(x + 20, y).setDepth(202);

        // Toggle background track
        const toggleBg = this.add.graphics();
        toggleBg.fillStyle(value ? 0x52b788 : 0x5C4033, 1);
        toggleBg.lineStyle(2, 0x3E2723, 1);
        toggleBg.fillRoundedRect(-30, -15, 60, 30, 15);
        toggleBg.strokeRoundedRect(-30, -15, 60, 30, 15);

        // Toggle handle (circle)
        const toggleHandle = this.add.circle(
            value ? 15 : -15,
            0,
            12,
            0xfff5e1
        ).setStrokeStyle(2, 0x6B4226);

        toggleContainer.add([toggleBg, toggleHandle]);
        toggleContainer.setSize(60, 30);
        toggleContainer.setInteractive();

        // State text
        const stateText = this.add.text(x + 80, y, value ? 'ON' : 'OFF', {
            fontSize: '16px',
            color: value ? '#52b788' : '#9c6644',
            fontFamily: FONTS.body,
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setDepth(202);

        // Toggle interaction
        toggleContainer.on('pointerdown', () => {
            const newValue = !value;
            value = newValue;
            
            // Update visual state
            toggleBg.clear();
            toggleBg.fillStyle(newValue ? 0x52b788 : 0x5C4033, 1);
            toggleBg.lineStyle(2, 0x3E2723, 1);
            toggleBg.fillRoundedRect(-30, -15, 60, 30, 15);
            toggleBg.strokeRoundedRect(-30, -15, 60, 30, 15);
            
            // Animate handle
            this.tweens.add({
                targets: toggleHandle,
                x: newValue ? 15 : -15,
                duration: 200,
                ease: 'Power2'
            });
            
            stateText.setText(newValue ? 'ON' : 'OFF');
            stateText.setColor(newValue ? '#52b788' : '#9c6644');
            
            onchange(newValue);
        });

        toggleContainer.on('pointerover', () => {
            toggleContainer.setScale(1.1);
        });

        toggleContainer.on('pointerout', () => {
            toggleContainer.setScale(1);
        });
    }

    private toggleFullscreen(): void {
        if (this.scale.isFullscreen) {
            this.scale.stopFullscreen();
        } else {
            this.scale.startFullscreen();
        }
    }

    private loadSettings(): void {
        const savedSettings = storage.getItem('gameSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.masterVolume = settings.masterVolume ?? 1;
            this.sfxVolume = settings.sfxVolume ?? 1;
            this.musicVolume = settings.musicVolume ?? 1;
            this.isFullscreen = settings.isFullscreen ?? false;
        }

        this.game.sound.volume = this.masterVolume;
    }

    private saveSettings(): void {
        const settings = {
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume,
            musicVolume: this.musicVolume,
            isFullscreen: this.isFullscreen
        };

        storage.setItem('gameSettings', JSON.stringify(settings));
        this.game.events.emit('settingsUpdated', settings);
    }

    private closeSettings(): void {
        this.scene.stop();
        
        const uiScene = this.scene.get('UIScene') as GameUI;
        if (uiScene) {
            // UI scene will handle resume if needed
        }
    }
}