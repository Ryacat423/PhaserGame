import { Checkbox } from "../../interfaces/game.interfaces";
import Swal from "sweetalert2";

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
        const saved = localStorage.getItem('customLevels');
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
        localStorage.setItem('customLevels', JSON.stringify(this.savedLevels));
    }

    preload(): void {
        this.load.image('custom_bg', 'assets/scene/levels/4/background.jpg');
        this.load.image('panel', 'assets/global/ui/panel.png');
        this.load.image('checkbox', 'assets/scene/levels/4/checkbox.png');
        this.load.image('checkmark', 'assets/scene/levels/4/checkmark.png');
        this.load.image('create_btn', 'assets/scene/levels/4/create_btn.png');
        this.load.image('save_btn', 'assets/scene/levels/4/save_btn.png');
        this.load.image('delete_btn', 'assets/scene/levels/4/delete_btn.png');
    }

    create(): void {
        this.add.image(0, 0, 'custom_bg')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        const panel = this.add.image(350, 70, 'panel')
            .setOrigin(0, 0)
            .setScale(0.9);

        this.back = this.add.image(50, 50, 'btn-next')
            .setScale(.09)
            .setInteractive()
            .setFlipX(true)
            .once('pointerdown', () => {
                this.cleanupHTML();
                this.scene.stop();
                this.scene.start('levels');
            });

        this.createSaveSlots();
        this.createLevelNameField();
        this.createMapPreviews();
        this.createCheckboxes();
        this.createSpawnableInputs();
        this.createActionButtons();
    }

    private createSaveSlots(): void {
        const startX = 100;
        const startY = 150;
        const slotHeight = 120;

        for (let i = 0; i < this.maxSlots; i++) {
            const container = this.add.container(startX, startY + i * slotHeight);
            
            const bg = this.add.rectangle(0, 0, 200, 100, 0x444444, 0.8)
                .setStrokeStyle(2, 0xffffff)
                .setInteractive();
            
            const slotText = this.add.text(0, -30, `Slot ${i + 1}`, {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            let contentText: Phaser.GameObjects.Text;
            
            if (i < this.savedLevels.length) {
                const level = this.savedLevels[i];
                contentText = this.add.text(0, 0, level.name, {
                    fontSize: '14px',
                    color: '#00ff00',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                
                const dateText = this.add.text(0, 20, 
                    new Date(level.dateCreated).toLocaleDateString(), {
                    fontSize: '10px',
                    color: '#aaaaaa',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                
                container.add([bg, slotText, contentText, dateText]);
            } else {
                contentText = this.add.text(0, 0, 'Empty', {
                    fontSize: '14px',
                    color: '#888888',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                
                container.add([bg, slotText, contentText]);
            }

            bg.on('pointerdown', () => {
                this.selectSlot(i);
            });

            bg.on('pointerover', () => {
                bg.setFillStyle(0x666666, 0.9);
            });

            bg.on('pointerout', () => {
                bg.setFillStyle(this.selectedSlot === i ? 0x668866 : 0x444444, 0.8);
            });

            this.levelSlots.push(container);
        }
    }

    private selectSlot(index: number): void {
        this.selectedSlot = index;
        
        this.levelSlots.forEach((container, i) => {
            const bg = container.list[0] as Phaser.GameObjects.Rectangle;
            bg.setFillStyle(i === index ? 0x668866 : 0x444444, 0.8);
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
            this.chosenMapText.setText(`Chosen map: ${mapNames[this.config.map] || 'Unknown'}`);
        }
    }

    private createLevelNameField(): void {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter level name...';
        input.maxLength = 20;
        input.style.position = 'absolute';
        input.style.left = '380px';
        input.style.top = '90px';
        input.style.width = '200px';
        input.style.padding = '5px';
        input.style.fontSize = '14px';
        input.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        input.style.border = '2px solid #8B4513';
        input.style.borderRadius = '5px';
        
        document.body.appendChild(input);
        this.levelNameInput = input;
    }

    private createActionButtons(): void {
        const saveBtn = this.add.image(880, 450, 'save_btn')
            .setScale(0.25)
            .setInteractive()
            .on('pointerdown', () => {
                this.saveCurrentLevel();
            });

        this.createMap = this.add.image(880, 500, 'create_btn')
            .setScale(0.3)
            .setInteractive()
            .on('pointerdown', () => {
                this.playLevel();
            });

        const deleteBtn = this.add.image(880, 550, 'delete_btn')
            .setScale(0.25)
            .setInteractive()
            .on('pointerdown', () => {
                this.deleteSelectedLevel();
            });

        [saveBtn, this.createMap, deleteBtn].forEach(btn => {
            btn.on('pointerover', () => btn.setScale(btn.scaleX * 1.1));
            btn.on('pointerout', () => btn.setScale(btn.scaleX / 1.1));
        });
    }

    private saveCurrentLevel(): void {
        const levelName = this.levelNameInput?.value || `Level ${Date.now()}`;
        
        if (this.selectedSlot === -1) {
            Swal.fire({
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
        
        Swal.fire({
            title: 'Level Saved!',
            text: `${levelName} saved to Slot ${this.selectedSlot + 1}`,
            icon: 'success',
            timer: 1500
        });
    }

    private updateSlotDisplay(index: number): void {
        if (index >= this.levelSlots.length || index >= this.savedLevels.length) return;
        
        const container = this.levelSlots[index];
        const level = this.savedLevels[index];
        
        container.removeAll(true);
        
        const bg = this.add.rectangle(0, 0, 200, 100, 0x444444, 0.8)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();
        
        const slotText = this.add.text(0, -30, `Slot ${index + 1}`, {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        const contentText = this.add.text(0, 0, level.name, {
            fontSize: '14px',
            color: '#00ff00',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        const dateText = this.add.text(0, 20, 
            new Date(level.dateCreated).toLocaleDateString(), {
            fontSize: '10px',
            color: '#aaaaaa',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        
        container.add([bg, slotText, contentText, dateText]);
        
        bg.on('pointerdown', () => this.selectSlot(index));
        bg.on('pointerover', () => bg.setFillStyle(0x666666, 0.9));
        bg.on('pointerout', () => {
            bg.setFillStyle(this.selectedSlot === index ? 0x668866 : 0x444444, 0.8);
        });
    }

    private deleteSelectedLevel(): void {
        if (this.selectedSlot === -1 || this.selectedSlot >= this.savedLevels.length) {
            Swal.fire({
                title: 'No Level Selected',
                text: 'Please select a saved level to delete',
                icon: 'warning'
            });
            return;
        }

        Swal.fire({
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
                this.scene.restart();
            }
        });
    }

    private playLevel(): void {
        // Store the config for the custom level
        localStorage.setItem('customLevelConfig', JSON.stringify(this.config));

        const activeMechanics = Object.keys(this.config.mechanics)
            .filter(key => this.config.mechanics[key as keyof typeof this.config.mechanics] && key !== 'none');

        let mechanicsText = activeMechanics.length > 0 ? activeMechanics.join(', ') : 'none';

        Swal.fire({
            title: 'Play Custom Level',
            html: `
                <p><strong>Map:</strong> ${this.getMapDisplayName()}</p>
                <p><strong>Mechanics:</strong> ${mechanicsText}</p>
                <p><strong>Foods:</strong> ${this.config.spawnables.foods}</p>
                <p><strong>Poison:</strong> ${this.config.spawnables.poison}</p>
                <p><strong>Dogs:</strong> ${this.config.spawnables.dog}</p>
                ${this.config.spawnables.batteries ? `<p><strong>Batteries:</strong> ${this.config.spawnables.batteries}</p>` : ''}
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Play!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.cleanupHTML();
                this.scene.stop();
                this.scene.start('level-custom', this.config);
            }
        });
    }

    private getMapDisplayName(): string {
        const mapNames: { [key: string]: string } = {
            'level1_map': 'Meadows',
            'level2_map': 'Snowy Plains', 
            'level3_map': 'Night Yard'
        };
        return mapNames[this.config.map] || 'Unknown';
    }

    private createCheckboxes(): void {
        this.checkboxes = [];
        const mechanicsStartX = 475;
        const mechanicsStartY = 383;
        const spacing = 35;
        
        // Add title for mechanics section
        this.add.text(mechanicsStartX, mechanicsStartY - 30, 'MECHANICS:', {
            fontSize: '14px',
            color: '#ffffff',
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
                        // If "none" is checked, uncheck all others
                        if (checked) {
                            Object.keys(this.config.mechanics).forEach(key => {
                                this.config.mechanics[key as keyof typeof this.config.mechanics] = false;
                            });
                            this.config.mechanics.none = true;
                        }
                    } else {
                        // If any other mechanic is checked, uncheck "none"
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
                color: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5);
        });
    }

    private updateBatterySpawnable(): void {
        // Set battery count based on night mechanic
        if (this.config.mechanics.night) {
            this.config.spawnables.batteries = 5;
        } else {
            this.config.spawnables.batteries = 0;
        }
    }

    private createSpawnableInputs(): void {
        const inputStartX = 650;
        const inputStartY = 383;
        const spacing = 35;

        // Add title for spawnables section
        this.add.text(inputStartX - 50, inputStartY - 30, 'SPAWNS:', {
            fontSize: '14px',
            color: '#ffffff',
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
                color: '#ffffff',
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

        checkboxBg.on('pointerdown', () => {
            this.toggleCheckbox(checkbox);
        });

        checkboxBg.on('pointerover', () => {
            checkboxBg.setTint(0xdddddd);
        });

        checkboxBg.on('pointerout', () => {
            checkboxBg.clearTint();
        });

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
        inputBg.fillStyle(0x6d4730, 1);
        inputBg.lineStyle(2, 0x8B4513, 1);
        inputBg.fillRoundedRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, cornerRadius);

        const numberText = this.add.text(x, y, initialValue.toString(), {
            fontSize: '14px',
            color: '#F5DEB3',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        const minusBtn = this.add.text(x - 30, y, '-', {
            fontSize: '20px',
            color: '#ff6666',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive();

        const plusBtn = this.add.text(x + 30, y, '+', {
            fontSize: '20px', 
            color: '#66ff66',
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
        const startX = 450;
        const y = 230;
        const spacing = 150;

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
                color: '#f0f0ef',
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
                this.chosenMapText = this.add.text(650, 150, `Chosen: ${map.name}`, {
                    fontSize: '16px',
                    color: '#F5DEB3',
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
}