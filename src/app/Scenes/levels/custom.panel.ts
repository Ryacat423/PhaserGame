import { Checkbox } from "../../interfaces/game.interfaces";
import Swal from "sweetalert2";

export class CustomPanel extends Phaser.Scene {
    back!: Phaser.GameObjects.Image;
    checkboxes!: Checkbox[];

    createMap!: Phaser.GameObjects.Image;

    savedGame: any[] = [];
    mapKey: any;

    chosenMapText?: Phaser.GameObjects.Text;
    
    private config = {
        map: 'key',
        mechanics: {
            snow: false,
            night: false,
            none: true
        },
        spawnables: {
            foods: 10,
            poison: 5,
            dog: 3
        }
    };

    constructor(){
        super({key: 'custom_panel'});
    }

    preload(): void {
        this.load.image('custom_bg', 'assets/scene/levels/4/background.jpg');
        this.load.image('panel', 'assets/global/ui/panel.png');
        this.load.image('checkbox', 'assets/scene/levels/4/checkbox.png');
        this.load.image('checkmark', 'assets/scene/levels/4/checkmark.png');
        this.load.image('create_btn', 'assets/scene/levels/4/create_btn.png');
    }

    create(): void {
        this.add.image(0, 0, 'custom_bg')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        const panel = this.add.image(250, 70, 'panel')
            .setOrigin(0, 0)
            .setScale(1);

        this.back = this.add.image(100, 70, 'btn-next')
            .setScale(.09)
            .setInteractive()
            .setFlipX(true)
            .once('pointerdown', () => {
                this.scene.stop();
                this.scene.start('welcome');
            });

        this.createMap = this.add.image(880, 500, 'create_btn')
            .setScale(.3)
            .setInteractive()
            .once('pointerdown', () => {
                localStorage.setItem('lvl', JSON.stringify(this.config));
                setTimeout(()=> {
                    Swal.fire({
                        title: 'Level Created',
                        text: 'Your custom level is ready!',
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonText: 'Play',
                        cancelButtonText: 'Close'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            this.scene.stop();
                            this.scene.start('level-custom', this.config);
                        }
                    });
                }, 1000);
            });

        this.createCheckboxes();
        this.createSpawnableInputs();
        this.createMapPreviews();
    }

    private createCheckboxes(): void {
        this.checkboxes = [];
        const mechanicsStartX = 375;
        const mechanicsStartY = 383;
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
        const inputStartX = 570;
        const inputStartY = 383;
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

        this.createNumberInput(
            inputStartX, 
            inputStartY + spacing * 2, 
            this.config.spawnables.dog,
            'dog-input',
            (value: number) => {
                this.config.spawnables.dog = value;
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
                        } else if (id === 'dog-input') {
                            this.config.spawnables.dog = parsedValue;
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
        const startX = 417;
        const y = 209;
        const spacing = 198;

        const maps = [
            { key: 'level1_map', name: 'Meadows' },
            { key: 'level2_map', name: 'Snowy Plains' },
            { key: 'level3_map', name: 'Night Yard' }
        ];

        maps.forEach((map, index) => {
            const mapImage = this.add.image(startX + index * spacing, y, map.key)
                .setScale(0.15)
                .setInteractive({ useHandCursor: true });

            this.add.text(mapImage.x, mapImage.y + 60, map.name, {
                fontSize: '14px',
                color: '#f0f0efff',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0);

            mapImage.on('pointerover', () => {
                mapImage.setScale(0.17);
                mapImage.setTint(0xdddddd);
            });

            mapImage.on('pointerout', () => {
                mapImage.setScale(0.15);
                mapImage.clearTint();
            });

            mapImage.on('pointerdown', () => {
                this.tweens.add({
                    targets: mapImage,
                    scale: 0.22,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        this.config.map = map.key;
                        if (this.chosenMapText) {
                            this.chosenMapText.destroy();
                        }
                        this.chosenMapText = this.add.text(700, 120, `Chosen map: ${map.name}`, {
                            fontSize: '20px',
                            color: '#F5DEB3',
                            fontFamily: 'Arial',
                            fontStyle: 'bold'
                        }).setOrigin(0.5, 0.5);
                    }
                });
            });
        });
    }

}