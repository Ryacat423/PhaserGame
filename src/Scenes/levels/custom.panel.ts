import Phaser from 'phaser';
import { storage } from '../../utils/storage';
import { showDialog } from '../../utils/dialog';
import { Checkbox } from "../../interfaces/game.interfaces";

interface SavedLevel {
    name: string;
    config: LevelConfig;
    dateCreated: number;
    thumbnail?: string;
}

interface LevelConfig {
    map: string;
    mechanics: {
        snow: boolean;
        night: boolean;
        lightning: boolean;
        none: boolean;
    };
    spawnables: {
        foods: number;
        poison: number;
        dog: number;
        batteries?: number;
    };
}

export class CustomPanel extends Phaser.Scene {
    private back!: Phaser.GameObjects.Image;
    private checkboxes!: Checkbox[];
    private createMap!: Phaser.GameObjects.Image;
    
    private savedLevels: SavedLevel[] = [];
    private maxSlots: number = 3;
    
    private levelSlots: Phaser.GameObjects.Container[] = [];
    private selectedSlot: number = -1;
    
    private chosenMapText?: Phaser.GameObjects.Text;
    private levelNameInput?: HTMLInputElement;
    
    private config: LevelConfig = {
        map: 'level1_map',
        mechanics: {
            snow: false,
            night: false,
            lightning: false,
            none: true
        },
        spawnables: {
            foods: 10,
            poison: 5,
            dog: 3,
            batteries: 0
        }
    };

    constructor() {
        super({ key: 'custom_panel' });
    }

    init(): void {
        this.loadSavedLevels();
    }

    private loadSavedLevels(): void {
        const saved = storage.getItem('customLevels');
        if (saved) {
            try {
                this.savedLevels = JSON.parse(saved);
            } catch (e) {
                this.savedLevels = [];
            }
        } else {
            this.savedLevels = [];
        }
    }

    private saveLevels(): void {
        storage.setItem('customLevels', JSON.stringify(this.savedLevels));
    }

    preload(): void {
        this.load.image('checkbox', 'assets/scene/levels/4/checkbox.webp');
        this.load.image('checkmark', 'assets/scene/levels/4/checkmark.webp');
    }

    create(): void {
        this.createCustomBackground();
        
        // Create main panel
        this.createMainPanel();

        // Back button
        this.back = this.add.image(50, 50, 'btn-next')
            .setScale(.09)
            .setInteractive()
            .setFlipX(true)
            .once('pointerdown', () => {
                this.cleanupAndReturn();
            });

        this.createSaveSlots();
        this.createLevelNameField();
        this.createMapPreviews();
        this.createCheckboxes();
        this.createSpawnableInputs();
        this.createActionButtons();
    }

    private createCustomBackground(): void {
        const graphics = this.add.graphics();

        // 🌿 Gradient background: deep to soft green
        graphics.fillGradientStyle(0x1b4332, 0x2d6a4f, 0x40916c, 0x74c69d, 1);
        graphics.fillRect(0, 0, 1000, 600);

        // Gentle green glow circles for depth
        const circles = [
            { x: 120, y: 120, radius: 150, color: 0x95d5b2, alpha: 0.12 },
            { x: 880, y: 180, radius: 200, color: 0x74c69d, alpha: 0.10 },
            { x: 500, y: 480, radius: 180, color: 0x52b788, alpha: 0.15 }
        ];

        circles.forEach(circle => {
            graphics.fillStyle(circle.color, circle.alpha);
            graphics.fillCircle(circle.x, circle.y, circle.radius);
        });
    }

    private createMainPanel(): void {
        const panel = this.add.graphics();
        panel.fillStyle(0x8B5E3C, 0.95);
        panel.lineStyle(3, 0x5C4033, 1);
        
        panel.fillRoundedRect(50, 30, 900, 540, 15);
        panel.strokeRoundedRect(50, 30, 900, 540, 15);

        panel.lineStyle(1, 0x3E2723, 0.5);
        panel.strokeRoundedRect(55, 35, 890, 530, 12);
        const titleBar = this.add.graphics();
        titleBar.fillStyle(0x6B4226, 1);
        titleBar.fillRoundedRect(50, 30, 900, 50, { tl: 15, tr: 15, bl: 0, br: 0 });

        this.add.text(500, 55, '🎮 CREATE CUSTOM LEVEL', {
            fontSize: '24px',
            color: '#fff5e1', 
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }


    private cleanupAndReturn(): void {
        this.cleanupHTML();
        this.scene.stop();
        this.scene.start('welcome');
    }

    private createSaveSlots(): void {
        const startX = 180;
        const startY = 120;
        const slotHeight = 120;

        this.add.text(90, 90, 'SAVE SLOTS', {
            fontSize: '16px',
            color: '#f4e1c1',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });

        for (let i = 0; i < this.maxSlots; i++) {
            const container = this.add.container(startX, startY + 40 + i * slotHeight);

            const bg = this.add.rectangle(0, 0, 200, 100, 0x5C4033, 0.8)
                .setStrokeStyle(2, 0x8B5E3C)
                .setInteractive();
            
            const slotText = this.add.text(0, -30, `Slot ${i + 1}`, {
                fontSize: '16px',
                color: '#f8e3c4',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            let contentText: Phaser.GameObjects.Text;
            
            if (i < this.savedLevels.length) {
                const level = this.savedLevels[i];
                contentText = this.add.text(0, 0, level.name, {
                    fontSize: '14px',
                    color: '#d4a373',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                
                const dateText = this.add.text(0, 20, 
                    new Date(level.dateCreated).toLocaleDateString(), {
                    fontSize: '10px',
                    color: '#b08968', 
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                
                container.add([bg, slotText, contentText, dateText]);
            } else {
                contentText = this.add.text(0, 0, 'Empty', {
                    fontSize: '14px',
                    color: '#9c6644',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                
                container.add([bg, slotText, contentText]);
            }

            bg.on('pointerdown', () => this.selectSlot(i));
            bg.on('pointerover', () => bg.setFillStyle(0xB8860B, 0.9));
            bg.on('pointerout', () => {
                bg.setFillStyle(this.selectedSlot === i ? 0xA97142 : 0x5C4033, 0.8);
            });

            this.levelSlots.push(container);
        }
    }


    private selectSlot(index: number): void {
        this.selectedSlot = index;
        
        this.levelSlots.forEach((container, i) => {
            const bg = container.list[0] as Phaser.GameObjects.Rectangle;
            bg.setFillStyle(i === index ? 0x2f855a : 0x1a202c, 0.8);
        });

        if (index < this.savedLevels.length) {
            this.loadLevel(this.savedLevels[index]);
        }
    }

    private loadLevel(level: SavedLevel): void {
        this.config = { ...level.config };
        this.updateUIFromConfig();
        
        if (this.levelNameInput) {
            this.levelNameInput.value = level.name;
        }
    }

    private updateUIFromConfig(): void {
        this.updateMechanicsCheckboxes();
        
        if (this.chosenMapText) {
            const mapNames: { [key: string]: string } = {
                'level1_map': 'Meadows',
                'level2_map': 'Snowy Plains',
                'level3_map': 'Night Yard'
            };
            this.chosenMapText.setText(`Chosen: ${mapNames[this.config.map] || 'Unknown'}`);
        }
    }

    private createLevelNameField(): void {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter level name...';
        input.maxLength = 20;
        input.style.position = 'absolute';
        input.style.left = '500px';
        input.style.top = '120px';
        input.style.width = '240px';
        input.style.padding = '8px 12px';
        input.style.fontSize = '14px';
        input.style.backgroundColor = '#2d3748';
        input.style.color = '#e2e8f0';
        input.style.border = '2px solid #4a5568';
        input.style.borderRadius = '8px';
        input.style.outline = 'none';
        
        input.addEventListener('focus', () => {
            input.style.borderColor = '#4299e1';
        });
        
        input.addEventListener('blur', () => {
            input.style.borderColor = '#4a5568';
        });
        
        document.body.appendChild(input);
        this.levelNameInput = input;
    }

    private createActionButtons(): void {
        const saveBtn = this.add.image(880, 500, 'save_btn')
            .setScale(0.25)
            .setInteractive()
            .on('pointerdown', () => this.saveCurrentLevel());

        const deleteBtn = this.add.image(880, 550, 'delete_btn')
            .setScale(0.25)
            .setInteractive()
            .on('pointerdown', () => this.deleteSelectedLevel());

        [saveBtn, deleteBtn].forEach(btn => {
            btn.on('pointerover', () => btn.setScale(btn.scaleX * 1.1));
            btn.on('pointerout', () => btn.setScale(btn.scaleX / 1.1));
        });
    }

    private saveCurrentLevel(): void {
        const levelName = this.levelNameInput?.value || `Level ${Date.now()}`;
        
        if (this.selectedSlot === -1) {
            showDialog({
                title: 'Select a Slot',
                text: 'Please select a save slot first',
                icon: 'warning'
            });
            return;
        }

        const savedLevel: SavedLevel = {
            name: levelName,
            config: { ...this.config },
            dateCreated: Date.now()
        };

        this.savedLevels[this.selectedSlot] = savedLevel;
        this.saveLevels();
        
        this.updateSlotDisplay(this.selectedSlot);
        
        showDialog({
            title: 'Level Saved!',
            text: `${levelName} saved to Slot ${this.selectedSlot + 1}`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    }

    private updateSlotDisplay(index: number): void {
        if (index >= this.levelSlots.length || index >= this.savedLevels.length) return;
        
        const container = this.levelSlots[index];
        const level = this.savedLevels[index];
        
        container.removeAll(true);
        
        const bg = this.add.rectangle(0, 0, 200, 100, 0x1a202c, 0.8)
            .setStrokeStyle(2, 0x4a5568)
            .setInteractive();
        
        const slotText = this.add.text(0, -30, `Slot ${index + 1}`, {
            fontSize: '16px',
            color: '#a0aec0',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        const contentText = this.add.text(0, 0, level.name, {
            fontSize: '14px',
            color: '#48bb78',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        const dateText = this.add.text(0, 20, 
            new Date(level.dateCreated).toLocaleDateString(), {
            fontSize: '10px',
            color: '#718096',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        container.add([bg, slotText, contentText, dateText]);
        
        bg.on('pointerdown', () => this.selectSlot(index));
        bg.on('pointerover', () => bg.setFillStyle(0x2d3748, 0.9));
        bg.on('pointerout', () => {
            bg.setFillStyle(this.selectedSlot === index ? 0x2f855a : 0x1a202c, 0.8);
        });
    }

    private deleteSelectedLevel(): void {
        if (this.selectedSlot === -1 || this.selectedSlot >= this.savedLevels.length) {
            showDialog({
                title: 'No Level Selected',
                text: 'Please select a saved level to delete',
                icon: 'warning'
            });
            return;
        }

        showDialog({
            title: 'Delete Level?',
            text: `Delete ${this.savedLevels[this.selectedSlot].name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                this.savedLevels.splice(this.selectedSlot, 1);
                this.saveLevels();
                this.cleanupHTML();
                this.scene.restart();
            }
        });
    }

    private createCheckboxes(): void {
        this.checkboxes = [];
        const mechanicsStartX = 440;
        const mechanicsStartY = 380;
        const spacing = 35;
        
        this.add.text(mechanicsStartX, mechanicsStartY - 30, 'MECHANICS:', {
            fontSize: '14px',
            color: '#cbd5e0',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5);
        
        const mechanics = [
            { key: 'snow', label: 'SNOW', y: mechanicsStartY },
            { key: 'night', label: 'NIGHT', y: mechanicsStartY + spacing },
            { key: 'lightning', label: 'STORM', y: mechanicsStartY + spacing * 2 },
            { key: 'none', label: 'NONE', y: mechanicsStartY + spacing * 3 }
        ];

        mechanics.forEach((mechanic) => {
            const checkbox = this.createCheckbox(
                mechanicsStartX, 
                mechanic.y, 
                this.config.mechanics[mechanic.key as keyof typeof this.config.mechanics] || false,
                (checked: boolean) => {
                    if (mechanic.key === 'none') {
                        if (checked) {
                            Object.keys(this.config.mechanics).forEach(key => {
                                this.config.mechanics[key as keyof typeof this.config.mechanics] = false;
                            });
                            this.config.mechanics.none = true;
                        }
                    } else {
                        if (checked) {
                            this.config.mechanics.none = false;
                        }
                        this.config.mechanics[mechanic.key as keyof typeof this.config.mechanics] = checked;
                    }
                    this.updateMechanicsCheckboxes();
                    this.updateBatterySpawnable();
                }
            );
            
            checkbox.mechanicKey = mechanic.key;
            this.checkboxes.push(checkbox);
            
            this.add.text(mechanicsStartX + 25, mechanic.y, mechanic.label, {
                fontSize: '12px',
                color: '#e2e8f0',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
        });
    }

    private updateBatterySpawnable(): void {
        if (this.config.mechanics.night) {
            this.config.spawnables.batteries = 5;
        } else {
            this.config.spawnables.batteries = 0;
        }
    }

    private createSpawnableInputs(): void {
        const inputStartX = 780;
        const inputStartY = 380;
        const spacing = 35;

        this.add.text(inputStartX - 50, inputStartY - 30, 'SPAWNS:', {
            fontSize: '14px',
            color: '#cbd5e0',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const spawnables = [
            { key: 'foods', label: 'Food:', value: this.config.spawnables.foods },
            { key: 'poison', label: 'Poison:', value: this.config.spawnables.poison },
            { key: 'dog', label: 'Dogs:', value: this.config.spawnables.dog }
        ];

        spawnables.forEach((spawnable, index) => {
            this.add.text(inputStartX - 50, inputStartY + index * spacing, spawnable.label, {
                fontSize: '14px',
                color: '#e2e8f0',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.createNumberInput(
                inputStartX, 
                inputStartY + index * spacing, 
                spawnable.value,
                `${spawnable.key}-input`,
                (value: number) => {
                    this.config.spawnables[spawnable.key as keyof typeof this.config.spawnables] = value;
                }
            );
        });
    }

    private createCheckbox(x: number, y: number, initialState: boolean, callback: (checked: boolean) => void): Checkbox {
        const checkboxBg = this.add.image(x, y, 'checkbox')
            .setScale(0.6)
            .setInteractive()
            .setOrigin(0.5, 0.5);

        const checkmark = this.add.image(x, y, 'checkmark')
            .setScale(0.5)
            .setOrigin(0.5, 0.5)
            .setVisible(initialState);

        const checkbox: Checkbox = {
            bg: checkboxBg,
            mark: checkmark,
            checked: initialState,
            callback: callback
        };

        checkboxBg.on('pointerdown', () => this.toggleCheckbox(checkbox));
        checkboxBg.on('pointerover', () => checkboxBg.setTint(0xdddddd));
        checkboxBg.on('pointerout', () => checkboxBg.clearTint());

        return checkbox;
    }

    private toggleCheckbox(checkbox: Checkbox): void {
        checkbox.checked = !checkbox.checked;
        checkbox.mark.setVisible(checkbox.checked);
        checkbox.callback(checkbox.checked);
    }

    private updateMechanicsCheckboxes(): void {
        this.checkboxes.forEach(checkbox => {
            if (checkbox.mechanicKey) {
                const shouldBeChecked = this.config.mechanics[checkbox.mechanicKey as keyof typeof this.config.mechanics] || false;
                checkbox.checked = shouldBeChecked;
                checkbox.mark.setVisible(shouldBeChecked);
            }
        });
    }

    private createNumberInput(x: number, y: number, initialValue: number, id: string, callback: (value: number) => void): void {
        const boxWidth = 37;
        const boxHeight = 25;
        const cornerRadius = 5;

        const inputBg = this.add.graphics();
        inputBg.fillStyle(0x1a202c, 1);
        inputBg.lineStyle(2, 0x4a5568, 1);
        inputBg.fillRoundedRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, cornerRadius);

        const numberText = this.add.text(x, y, initialValue.toString(), {
            fontSize: '14px',
            color: '#e2e8f0',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        const minusBtn = this.add.text(x - 30, y, '-', {
            fontSize: '20px',
            color: '#fc8181',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        const plusBtn = this.add.text(x + 30, y, '+', {
            fontSize: '20px', 
            color: '#68d391',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        const updateValue = (delta: number) => {
            const currentValue = parseInt(numberText.text);
            const newValue = Math.max(1, Math.min(99, currentValue + delta));
            numberText.setText(newValue.toString());
            callback(newValue);
        };

        minusBtn.on('pointerdown', () => updateValue(-1));
        plusBtn.on('pointerdown', () => updateValue(1));

        [minusBtn, plusBtn].forEach(btn => {
            btn.on('pointerover', () => btn.setScale(1.2));
            btn.on('pointerout', () => btn.setScale(1));
        });
    }

    private createMapPreviews(): void {
        const startX = 440;
        const y = 220;
        const spacing = 140;

        this.add.text(startX + spacing, y - 50, 'SELECT MAP', {
            fontSize: '16px',
            color: '#cbd5e0',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const maps = [
            { key: 'level1_map', name: 'Meadows' },
            { key: 'level2_map', name: 'Snowy Plains' },
            { key: 'level3_map', name: 'Night Yard' }
        ];

        maps.forEach((map, index) => {
            const mapImage = this.add.image(startX + index * spacing, y, map.key)
                .setScale(0.12)
                .setInteractive({ useHandCursor: true });

            this.add.text(mapImage.x, mapImage.y + 50, map.name, {
                fontSize: '12px',
                color: '#e2e8f0',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0);

            mapImage.on('pointerover', () => {
                mapImage.setScale(0.14);
                mapImage.setTint(0xdddddd);
            });

            mapImage.on('pointerout', () => {
                mapImage.setScale(0.12);
                mapImage.clearTint();
            });

            mapImage.on('pointerdown', () => {
                this.config.map = map.key;
                if (this.chosenMapText) {
                    this.chosenMapText.destroy();
                }
                this.chosenMapText = this.add.text(580, 305, `✓ ${map.name}`, {
                    fontSize: '14px',
                    color: '#48bb78',
                    fontFamily: 'Arial',
                    fontStyle: 'bold'
                }).setOrigin(0.5);
            });
        });
    }

    private cleanupHTML(): void {
        if (this.levelNameInput) {
            this.levelNameInput.remove();
            this.levelNameInput = undefined;
        }
    }

    shutdown(): void {
        this.cleanupHTML();
    }
}