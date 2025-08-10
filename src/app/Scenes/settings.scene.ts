// import { GameUI } from "../components/ui/GameUI";

// export class SettingScene extends Phaser.Scene {
//     private backgroundOverlay!: Phaser.GameObjects.Rectangle;
//     private settingsPanel!: Phaser.GameObjects.Rectangle;
//     private masterVolume: number = 1;
//     private sfxVolume: number = 1;
//     private musicVolume: number = 1;
//     private isFullscreen: boolean = false;

//     constructor() {
//         super({ key: 'settings' });
//     }

//     preload() {
//         // Load any settings-specific assets
//         this.load.image('slider-bg', 'assets/global/ui/slider_bg.png');
//         this.load.image('slider-handle', 'assets/global/ui/slider_handle.png');
//     }

//     create() {
//         // Load saved settings
//         this.loadSettings();

//         // Create background overlay
//         this.backgroundOverlay = this.add.rectangle(
//             this.scale.width / 2,
//             this.scale.height / 2,
//             this.scale.width,
//             this.scale.height,
//             0x000000,
//             0.8
//         ).setDepth(200).setInteractive();

//         // Create settings panel
//         this.settingsPanel = this.add.rectangle(
//             this.scale.width / 2,
//             this.scale.height / 2,
//             600,
//             500,
//             0x2c3e50
//         ).setDepth(201);

//         // Add settings panel border
//         const panelBorder = this.add.rectangle(
//             this.scale.width / 2,
//             this.scale.height / 2,
//             604,
//             504,
//             0x34495e
//         ).setDepth(200);

//         this.createSettingsContent();
//     }

//     private createSettingsContent() {
//         const centerX = this.scale.width / 2;
//         const centerY = this.scale.height / 2;

//         // Title
//         const title = this.add.text(centerX, centerY - 200, 'SETTINGS', {
//             fontSize: '32px',
//             color: '#ffffff',
//             fontStyle: 'bold'
//         }).setOrigin(0.5).setDepth(202);

//         // Close button
//         const closeBtn = this.add.text(centerX + 280, centerY - 230, '×', {
//             fontSize: '40px',
//             color: '#ffffff'
//         }).setOrigin(0.5).setDepth(202).setInteractive();

//         closeBtn.on('pointerdown', () => {
//             this.closeSettings();
//         });

//         closeBtn.on('pointerover', () => {
//             closeBtn.setScale(1.2);
//             closeBtn.setColor('#ff6b6b');
//         });

//         closeBtn.on('pointerout', () => {
//             closeBtn.setScale(1);
//             closeBtn.setColor('#ffffff');
//         });

//         // Audio Settings Section
//         this.add.text(centerX, centerY - 150, 'AUDIO', {
//             fontSize: '24px',
//             color: '#3498db',
//             fontStyle: 'bold'
//         }).setOrigin(0.5).setDepth(202);

//         // Master Volume
//         this.createVolumeSlider(centerX, centerY - 110, 'Master Volume', this.masterVolume, (value) => {
//             this.masterVolume = value;
//             this.game.sound.volume = value;
//         });

//         // SFX Volume
//         this.createVolumeSlider(centerX, centerY - 60, 'SFX Volume', this.sfxVolume, (value) => {
//             this.sfxVolume = value;
//             // Apply to SFX sounds
//         });

//         // Music Volume
//         this.createVolumeSlider(centerX, centerY - 10, 'Music Volume', this.musicVolume, (value) => {
//             this.musicVolume = value;
//             // Apply to background music
//         });

//         // Graphics Settings Section
//         this.add.text(centerX, centerY + 50, 'GRAPHICS', {
//             fontSize: '24px',
//             color: '#3498db',
//             fontStyle: 'bold'
//         }).setOrigin(0.5).setDepth(202);

//         // Fullscreen Toggle
//         this.createToggleButton(centerX, centerY + 90, 'Fullscreen', this.isFullscreen, (value) => {
//             this.isFullscreen = value;
//             this.toggleFullscreen();
//         });

//         // Controls Section
//         this.add.text(centerX, centerY + 140, 'CONTROLS', {
//             fontSize: '24px',
//             color: '#3498db',
//             fontStyle: 'bold'
//         }).setOrigin(0.5).setDepth(202);

//         // Controls info
//         const controlsText = this.add.text(centerX, centerY + 180, 
//             'Use ARROW KEYS or WASD to move\nPress SPACE to interact', {
//             fontSize: '16px',
//             color: '#bdc3c7',
//             align: 'center'
//         }).setOrigin(0.5).setDepth(202);

//         // Save & Apply Button
//         const saveBtn = this.add.text(centerX, centerY + 230, 'SAVE & APPLY', {
//             fontSize: '20px',
//             color: '#ffffff',
//             backgroundColor: '#27ae60',
//             padding: { x: 30, y: 15 }
//         }).setOrigin(0.5).setDepth(202).setInteractive();

//         saveBtn.on('pointerdown', () => {
//             this.saveSettings();
//             this.closeSettings();
//         });

//         saveBtn.on('pointerover', () => {
//             saveBtn.setScale(1.1);
//             saveBtn.setBackgroundColor('#2ecc71');
//         });

//         saveBtn.on('pointerout', () => {
//             saveBtn.setScale(1);
//             saveBtn.setBackgroundColor('#27ae60');
//         });
//     }

//     private createVolumeSlider(x: number, y: number, label: string, value: number, onchange: (value: number) => void) {
//         // Label
//         this.add.text(x - 200, y, label, {
//             fontSize: '18px',
//             color: '#ffffff'
//         }).setOrigin(0, 0.5).setDepth(202);

//         // Slider background
//         const sliderBg = this.add.rectangle(x + 50, y, 200, 8, 0x7f8c8d).setDepth(202);

//         // Slider handle
//         const handle = this.add.circle(x + 50 - 100 + (value * 200), y, 12, 0xe74c3c)
//             .setDepth(203)
//             .setInteractive();

//         // Value text
//         const valueText = this.add.text(x + 170, y, Math.round(value * 100) + '%', {
//             fontSize: '16px',
//             color: '#ecf0f1'
//         }).setOrigin(0, 0.5).setDepth(202);

//         // Make slider interactive
//         let isDragging = false;

//         handle.on('pointerdown', () => {
//             isDragging = true;
//         });

//         this.input.on('pointerup', () => {
//             isDragging = false;
//         });

//         this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
//             if (isDragging) {
//                 const sliderLeft = x + 50 - 100;
//                 const sliderRight = x + 50 + 100;
//                 const newX = Phaser.Math.Clamp(pointer.x, sliderLeft, sliderRight);
                
//                 handle.x = newX;
//                 const newValue = (newX - sliderLeft) / 200;
                
//                 valueText.setText(Math.round(newValue * 100) + '%');
//                 onchange(newValue);
//             }
//         });

//         // Click on slider track to jump to position
//         sliderBg.setInteractive().on('pointerdown', (pointer: Phaser.Input.Pointer) => {
//             const sliderLeft = x + 50 - 100;
//             const clickValue = (pointer.x - sliderLeft) / 200;
//             const clampedValue = Phaser.Math.Clamp(clickValue, 0, 1);
            
//             handle.x = sliderLeft + (clampedValue * 200);
//             valueText.setText(Math.round(clampedValue * 100) + '%');
//             onchange(clampedValue);
//         });
//     }

//     private createToggleButton(x: number, y: number, label: string, value: boolean, onchange: (value: boolean) => void) {
//         // Label
//         this.add.text(x - 200, y, label, {
//             fontSize: '18px',
//             color: '#ffffff'
//         }).setOrigin(0, 0.5).setDepth(202);

//         // Toggle background
//         const toggleBg = this.add.rectangle(x + 50, y, 60, 30, value ? 0x27ae60 : 0x7f8c8d)
//             .setDepth(202)
//             .setInteractive();

//         // Toggle handle
//         const toggleHandle = this.add.circle(
//             x + 50 + (value ? 15 : -15), 
//             y, 
//             12, 
//             0xffffff
//         ).setDepth(203);

//         // Toggle state text
//         const stateText = this.add.text(x + 100, y, value ? 'ON' : 'OFF', {
//             fontSize: '16px',
//             color: '#ecf0f1'
//         }).setOrigin(0, 0.5).setDepth(202);

//         toggleBg.on('pointerdown', () => {
//             const newValue = !value;
//             value = newValue;
            
//             // Update visual state
//             toggleBg.setFillStyle(newValue ? 0x27ae60 : 0x7f8c8d);
//             toggleHandle.x = x + 50 + (newValue ? 15 : -15);
//             stateText.setText(newValue ? 'ON' : 'OFF');
            
//             onchange(newValue);
//         });

//         toggleBg.on('pointerover', () => {
//             toggleBg.setScale(1.1);
//         });

//         toggleBg.on('pointerout', () => {
//             toggleBg.setScale(1);
//         });
//     }

//     private toggleFullscreen() {
//         if (this.scale.isFullscreen) {
//             this.scale.stopFullscreen();
//         } else {
//             this.scale.startFullscreen();
//         }
//     }

//     private loadSettings() {
//         // Load from localStorage or use defaults
//         const savedSettings = localStorage.getItem('gameSettings');
//         if (savedSettings) {
//             const settings = JSON.parse(savedSettings);
//             this.masterVolume = settings.masterVolume ?? 1;
//             this.sfxVolume = settings.sfxVolume ?? 1;
//             this.musicVolume = settings.musicVolume ?? 1;
//             this.isFullscreen = settings.isFullscreen ?? false;
//         }

//         // Apply loaded settings
//         this.game.sound.volume = this.masterVolume;
//     }

//     private saveSettings() {
//         const settings = {
//             masterVolume: this.masterVolume,
//             sfxVolume: this.sfxVolume,
//             musicVolume: this.musicVolume,
//             isFullscreen: this.isFullscreen
//         };

//         localStorage.setItem('gameSettings', JSON.stringify(settings));
        
//         // Emit event to notify other scenes of settings changes
//         this.game.events.emit('settingsUpdated', settings);
//     }

//     private closeSettings() {
//         this.scene.stop();
        
//         // Resume game if it was paused
//         const uiScene = this.scene.get('UIScene') as GameUI;
//         if (uiScene) {
//             // You might want to add a resume method or emit an event
//         }
//     }
// }