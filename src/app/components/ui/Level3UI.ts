export class Level3UI extends Phaser.Scene {
    private batteryBar!: Phaser.GameObjects.Graphics;
    private batteryBarBg!: Phaser.GameObjects.Graphics;
    private batteryIcon!: Phaser.GameObjects.Graphics;
    private batteryText!: Phaser.GameObjects.Text;
    private lowBatteryWarning?: Phaser.GameObjects.Text;
    private lowBatteryTween?: Phaser.Tweens.Tween;
    
    private maxBattery: number = 100;
    private currentBattery: number = 80;
    
    private batteryBarWidth: number = 150;
    private batteryBarHeight: number = 20;
    private batteryBarX: number = 125;
    private batteryBarY: number = 47;

    private lowBatterySound!: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'Level3UI' });
    }

    preload() {
        this.load.audio('lowBatteryWarning', 'assets/global/audio/battery_low.mp3');
    }

    create() {
        this.lowBatterySound = this.sound.add('lowBatteryWarning').setVolume(0.8);

        this.setupBatteryBar();
        this.setupEventListeners();
    }

    private setupBatteryBar(): void {
        this.batteryBarBg = this.add.graphics()
            .setDepth(102)
            .setScrollFactor(0);
        this.batteryBarBg.fillStyle(0x333333, 0.9);
        this.batteryBarBg.fillRoundedRect(
            this.batteryBarX - 2, 
            this.batteryBarY - 2, 
            this.batteryBarWidth + 4, 
            this.batteryBarHeight + 4, 
            3
        );

        this.batteryBar = this.add.graphics()
            .setDepth(103)
            .setScrollFactor(0);

        this.batteryIcon = this.add.graphics()
            .setDepth(102)
            .setScrollFactor(0);
        this.batteryIcon.fillStyle(0xFFD700);
        this.batteryIcon.fillRect(this.batteryBarX - 18, this.batteryBarY + 2, 12, 16);
        this.batteryIcon.fillStyle(0xFFD700);
        this.batteryIcon.fillRect(this.batteryBarX - 16, this.batteryBarY - 1, 8, 3);
        this.batteryText = this.add.text(
            this.batteryBarX + this.batteryBarWidth + 10, 
            this.batteryBarY + 2, 
            '80%', {
                fontSize: '14px',
                color: '#FFD700',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 1
            }
        ).setDepth(102).setScrollFactor(0);

        this.add.text(
            this.batteryBarX, 
            this.batteryBarY + 30, 
            'Find batteries to recharge flashlight', {
                fontSize: '12px',
                color: '#ffffff',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 1
            }
        ).setDepth(102).setScrollFactor(0).setAlpha(0.8);

        this.updateBatteryBar();
    }

    private setupEventListeners(): void {
        const resetBatteries = () => {
            if (this.scene.isActive('Level2UI')) {
                this.resetBattery();
            }
        };
        this.events.on('batteryCollected', (chargeAmount: number) => {
            this.chargeBattery(chargeAmount);
        });

        this.events.on('batteryLevelChanged', (data: any) => {
            this.currentBattery = data.current;
            this.updateBatteryBar();
        });

        this.game.events.on('levelStarted', resetBatteries);
        this.game.events.on('levelReset', resetBatteries);
    }

    private updateBatteryBar(): void {
        this.batteryBar.clear();
        
        const fillPercentage = this.currentBattery / this.maxBattery;
        const fillWidth = this.batteryBarWidth * fillPercentage;
        let barColor: number;
        if (fillPercentage > 0.6) {
            barColor = 0x00FF00;
        } else if (fillPercentage > 0.3) {
            barColor = 0xFFFF00;
        } else if (fillPercentage > 0.15) {
            barColor = 0xFF8800;
        } else {
            barColor = 0xFF0000;
        }

        this.batteryBar.fillStyle(barColor, 0.9);
        this.batteryBar.fillRoundedRect(
            this.batteryBarX, 
            this.batteryBarY, 
            fillWidth, 
            this.batteryBarHeight, 
            2
        );
        const percentage = Math.floor(fillPercentage * 100);
        this.batteryText.setText(`${percentage}%`);

        if (percentage <= 10) {
            this.batteryText.setColor('#FF0000');
        } else if (percentage <= 30) {
            this.batteryText.setColor('#FF8800');
        } else {
            this.batteryText.setColor('#FFD700');
        }

        if (percentage <= 20 && percentage > 0 && !this.lowBatteryWarning) {
            this.showLowBatteryWarning();
        } else if (percentage > 20 && this.lowBatteryWarning) {
            this.hideLowBatteryWarning();
        }
    }

    private showLowBatteryWarning(): void {
        if (this.lowBatteryWarning) return;
        
        this.lowBatteryWarning = this.add.text(200, 52, 'LOW BATTERY!', {
            fontSize: '16px',
            fontFamily: 'Arial Black, Arial',
            color: '#FF8800',
            stroke: '#000000',
            strokeThickness: 2,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 1,
                fill: true
            }
        }).setDepth(102).setOrigin(0.5, 0).setScrollFactor(0);

        this.lowBatteryTween = this.tweens.add({
            targets: this.lowBatteryWarning,
            scale: 1.1,
            alpha: 0.7,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        if (!this.lowBatterySound.isPlaying) {
            this.lowBatterySound.play();
        }
    }

    private hideLowBatteryWarning(): void {
        if (this.lowBatteryTween) {
            this.lowBatteryTween.destroy();
            this.lowBatteryTween = undefined;
        }

        if (this.lowBatteryWarning) {
            this.tweens.add({
                targets: this.lowBatteryWarning,
                scale: 0,
                alpha: 0,
                duration: 300,
                ease: 'Back.easeIn',
                onComplete: () => {
                    if (this.lowBatteryWarning) {
                        this.lowBatteryWarning.destroy();
                        this.lowBatteryWarning = undefined;
                    }
                }
            });
        }
    }

    public chargeBattery(chargeAmount: number): void {
        this.currentBattery = Math.min(this.maxBattery, this.currentBattery + chargeAmount);
        if (this.currentBattery > 20) {
            this.hideLowBatteryWarning();
        }
        
        this.updateBatteryBar();
        this.tweens.add({
            targets: this.batteryBar,
            scaleY: 1.3,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
        this.tweens.add({
            targets: this.batteryIcon,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 2,
            ease: 'Power2'
        });
    }

    private resetBattery(): void {
        this.currentBattery = 80;
        
        this.hideLowBatteryWarning();
        this.updateBatteryBar();
    }

    public getCurrentBattery(): number {
        return this.currentBattery;
    }
}