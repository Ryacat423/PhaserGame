import { Checkbox } from "../../interfaces/game.interfaces";

export class CustomPanel extends Phaser.Scene {
    back!: Phaser.GameObjects.Image;
    checkboxes!: Checkbox[];

    createMap!: Phaser.GameObjects.Image;
    
    private config = {
        mechanics: {
            snow: false,
            night: false,
            none: true
        },
        spawnables: {
            foods: 10,
            poison: 5
        }
    };

    constructor(){
        super({key: 'custom_panel'});
    }

    preload(): void {
        this.load.image('custom_bg', 'assets/scene/levels/4/background.jpg');
        this.load.image('panel', 'assets/scene/levels/4/panel.png');
        this.load.image('checkbox', 'assets/scene/levels/4/checkbox.png');
        this.load.image('checkmark', 'assets/scene/levels/4/checkmark.png');
        this.load.image('create_btn', 'assets/scene/levels/4/create_btn.png');
    }

    create(): void {
        this.add.image(0, 0, 'custom_bg')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        const panel = this.add.image(150, 70, 'panel')
            .setOrigin(0, 0)
            .setScale(.8);

        this.back = this.add.image(100, 70, 'btn-next')
            .setScale(.09)
            .setInteractive()
            .setFlipX(true)
            .once('pointerdown', () => {
                this.scene.stop();
                this.scene.start('welcome');
            });

        this.createMap = this.add.image(700, 450, 'create_btn')
            .setScale(.3)

        this.createCheckboxes();
        this.createSpawnableInputs();
        this.createMapPreviews();
    }

    private createCheckboxes(): void {
        this.checkboxes = [];
        const mechanicsStartX = 250;
        const mechanicsStartY = 400;
        const spacing = 45;
        
        const mechanics = [
            { key: 'snow', label: 'SNOW', y: mechanicsStartY },
            { key: 'night', label: 'NIGHT', y: mechanicsStartY + spacing },
            { key: 'none', label: 'NONE', y: mechanicsStartY + spacing * 2 }
        ];

        mechanics.forEach((mechanic) => {
            const checkbox = this.createCheckbox(
                mechanicsStartX, 
                mechanic.y, 
                this.config.mechanics[mechanic.key as keyof typeof this.config.mechanics],
                (checked: boolean) => {
                    if (checked) {
                        Object.keys(this.config.mechanics).forEach(key => {
                            this.config.mechanics[key as keyof typeof this.config.mechanics] = false;
                        });
                        this.config.mechanics[mechanic.key as keyof typeof this.config.mechanics] = true;
                        this.updateMechanicsCheckboxes();
                    }
                }
            );
            
            checkbox.mechanicKey = mechanic.key;
            this.checkboxes.push(checkbox);
        });
    }

    private createSpawnableInputs(): void {
        const inputStartX = 460;
        const inputStartY = 400;
        const spacing = 45;

        this.createNumberInput(
            inputStartX, 
            inputStartY, 
            this.config.spawnables.foods,
            'foods-input',
            (value: number) => {
                this.config.spawnables.foods = value;
            }
        );

        this.createNumberInput(
            inputStartX, 
            inputStartY + spacing, 
            this.config.spawnables.poison,
            'poison-input',
            (value: number) => {
                this.config.spawnables.poison = value;
            }
        );
    }

    private createCheckbox(x: number, y: number, initialState: boolean, callback: (checked: boolean) => void): Checkbox {
        const checkboxBg = this.add.image(x, y, 'checkbox')
            .setScale(0.8)
            .setInteractive()
            .setOrigin(0.5, 0.5);

        const checkmark = this.add.image(x, y, 'checkmark')
            .setScale(0.6)
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
                const shouldBeChecked = this.config.mechanics[checkbox.mechanicKey as keyof typeof this.config.mechanics];
                checkbox.checked = shouldBeChecked;
                checkbox.mark.setVisible(shouldBeChecked);
            }
        });
    }

    private createNumberInput(x: number, y: number, initialValue: number, id: string, callback: (value: number) => void): void {
        const boxWidth = 37;
        const boxHeight = 35;
        const cornerRadius = 8;

        const inputBg = this.add.graphics();
        inputBg.fillStyle(0x6d4730, 1);
        inputBg.lineStyle(2, 0x6d4730, 1);
        inputBg.fillRoundedRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, cornerRadius);
        inputBg.strokeRoundedRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, cornerRadius);

        const numberText = this.add.text(x, y, initialValue.toString(), {
            fontSize: '18px',
            color: '#F5DEB3',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5);

        const interactiveArea = this.add.rectangle(x, y, boxWidth, boxHeight, 0x000000, 0)
            .setInteractive()
            .on('pointerdown', () => {
                const newValue = prompt(`Enter ${id.replace('-input', '')} count:`, initialValue.toString());
                if (newValue !== null) {
                    const parsedValue = parseInt(newValue);
                    if (!isNaN(parsedValue) && parsedValue >= 1) {
                        callback(parsedValue);
                        numberText.setText(parsedValue.toString());
                        if (id === 'foods-input') {
                            this.config.spawnables.foods = parsedValue;
                        } else if (id === 'poison-input') {
                            this.config.spawnables.poison = parsedValue;
                        }
                    }
                }
            })
            .on('pointerover', () => {
                inputBg.clear();
                inputBg.fillStyle(0xFFFAF0, 1);
                inputBg.lineStyle(2, 0xD2691E, 1);
                inputBg.fillRoundedRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, cornerRadius);
                inputBg.strokeRoundedRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, cornerRadius);
                numberText.setColor('#D2691E');
            })
            .on('pointerout', () => {
                inputBg.clear();
                inputBg.fillStyle(0xF5DEB3, 1);
                inputBg.lineStyle(2, 0x8B4513, 1);
                inputBg.fillRoundedRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, cornerRadius);
                inputBg.strokeRoundedRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight, cornerRadius);
                numberText.setColor('#8B4513');
            });
    }

    private createMapPreviews(): void {
        const startX = 300;
        const y = 200;
        const spacing = 230;

        const maps = [
            { key: 'level1_map', name: 'Meadows' },
            { key: 'level2_map', name: 'Snowy Plains' },
            { key: 'level3_map', name: 'Night Yard' }
        ];

        maps.forEach((map, index) => {
            const mapImage = this.add.image(startX + index * spacing, y, map.key)
                .setScale(0.2)
                .setInteractive({ useHandCursor: true });

            this.add.text(mapImage.x, mapImage.y + 60, map.name, {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0);

            mapImage.on('pointerover', () => {
                mapImage.setScale(0.22);
                mapImage.setTint(0xdddddd);
            });

            mapImage.on('pointerout', () => {
                mapImage.setScale(0.2);
                mapImage.clearTint();
            });

            mapImage.on('pointerdown', () => {
                this.tweens.add({
                    targets: mapImage,
                    scale: 0.22,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        console.log(`Selected ${map.name}`);
                    }
                });
            });
        });
    }

}