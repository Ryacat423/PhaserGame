import Phaser from 'phaser';
export class Level4UI extends Phaser.Scene {
    private stormWarning?: Phaser.GameObjects.Text;
    private stormWarningTween?: Phaser.Tweens.Tween;
    private lightningCounter?: Phaser.GameObjects.Text;
    private nextStrikeTimer?: Phaser.GameObjects.Text;
    
    private stormIntensity: number = 1;
    private lightningStrikes: number = 0;
    private timeToNextStrike: number = 8;
    private isWarningActive: boolean = false;
    
    private baseY: number = 90;
    
    constructor() {
        super({ key: 'Level4UI' });
    }

    create() {
        this.adjustPositionForCombinedMechanics();
        this.setupStormUI();
        this.setupEventListeners();
        this.startStormTimer();
    }

    private adjustPositionForCombinedMechanics(): void {
        const level2UIActive = this.scene.manager.isActive('Level2UI');
        const level3UIActive = this.scene.manager.isActive('Level3UI');
        
        if (level2UIActive && level3UIActive) {
            this.baseY = 130;
        } else if (level2UIActive || level3UIActive) {
            this.baseY = 90;
        } else {
            this.baseY = 60;
        }
    }

    private setupStormUI(): void {
        this.add.text(20, this.baseY, 'STORM INTENSITY:', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 1
        }).setDepth(102).setScrollFactor(0);

        this.lightningCounter = this.add.text(20, this.baseY + 20, `Lightning Strikes: ${this.lightningStrikes}`, {
            fontSize: '12px',
            color: '#ffff88',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 1
        }).setDepth(102).setScrollFactor(0);

        this.nextStrikeTimer = this.add.text(20, this.baseY + 35, `Next Strike: ${this.timeToNextStrike}s`, {
            fontSize: '12px',
            color: '#88ffff',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 1
        }).setDepth(102).setScrollFactor(0);

        this.createStormIntensityBar();
    }

    private createStormIntensityBar(): void {
        const barX = 150;
        const barY = this.baseY;
        const barWidth = 100;
        const barHeight = 12;

        const bg = this.add.graphics();
        bg.fillStyle(0x333333, 0.8);
        bg.fillRoundedRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 2);
        bg.setDepth(102).setScrollFactor(0);

        const fill = this.add.graphics();
        fill.fillStyle(0xff6600, 0.9);
        fill.fillRoundedRect(barX, barY, barWidth * (this.stormIntensity / 5), barHeight, 1);
        fill.setDepth(103).setScrollFactor(0);

        this.add.text(barX + barWidth + 10, barY - 2, `Level ${this.stormIntensity}`, {
            fontSize: '12px',
            color: '#ff6600',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 1
        }).setDepth(102).setScrollFactor(0);
    }

    private setupEventListeners(): void {
        this.events.on('lightningWarning', () => {
            this.showLightningWarning();
        });

        this.events.on('lightningStrike', () => {
            this.onLightningStrike();
        });

        const resetStorm = () => {
            if (this.scene.isActive('Level4UI')) {
                this.resetStormTracking();
            }
        };

        this.game.events.on('levelStarted', resetStorm);
        this.game.events.on('levelReset', resetStorm);
    }

    private startStormTimer(): void {
        this.time.addEvent({
            delay: 1000,
            callback: this.updateStormTimer,
            callbackScope: this,
            loop: true
        });
    }

    private updateStormTimer(): void {
        if (this.timeToNextStrike > 0) {
            this.timeToNextStrike -= 1;
            if (this.nextStrikeTimer) {
                this.nextStrikeTimer.setText(`Next Strike: ${this.timeToNextStrike}s`);
                
                if (this.timeToNextStrike <= 2) {
                    this.nextStrikeTimer.setColor('#ff4444');
                } else if (this.timeToNextStrike <= 4) {
                    this.nextStrikeTimer.setColor('#ffaa44');
                } else {
                    this.nextStrikeTimer.setColor('#88ffff');
                }
            }
        } else {
            this.timeToNextStrike = 8;
        }
    }

    private showLightningWarning(): void {
        if (this.isWarningActive) return;
        
        this.isWarningActive = true;
        
        if (this.stormWarning) {
            this.destroyStormWarning();
        }

        this.stormWarning = this.add.text(
            this.scale.width / 2, 
            this.baseY + 60, 
            '⚡ LIGHTNING INCOMING! TAKE COVER! ⚡', 
            {
                fontSize: '18px',
                fontFamily: 'Arial Black',
                color: '#ffff00',
                stroke: '#ff0000',
                strokeThickness: 3,
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 2,
                    fill: true
                }
            }
        ).setOrigin(0.5).setDepth(110).setScrollFactor(0);

        this.stormWarningTween = this.tweens.add({
            targets: this.stormWarning,
            scale: { from: 1, to: 1.2 },
            alpha: { from: 1, to: 0.7 },
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.time.delayedCall(2000, () => {
            this.hideWarning();
        });
    }

    private hideWarning(): void {
        if (!this.isWarningActive) return;
        
        this.isWarningActive = false;
        this.destroyStormWarning();
    }

    private destroyStormWarning(): void {
        if (this.stormWarningTween) {
            this.stormWarningTween.destroy();
            this.stormWarningTween = undefined;
        }

        if (this.stormWarning) {
            this.tweens.add({
                targets: this.stormWarning,
                scale: 0,
                alpha: 0,
                duration: 300,
                ease: 'Back.easeIn',
                onComplete: () => {
                    if (this.stormWarning) {
                        this.stormWarning.destroy();
                        this.stormWarning = undefined;
                    }
                }
            });
        }
    }

    private onLightningStrike(): void {
        this.lightningStrikes++;
        
        if (this.lightningCounter) {
            this.lightningCounter.setText(`Lightning Strikes: ${this.lightningStrikes}`);
        }
        if (this.lightningStrikes % 3 === 0 && this.stormIntensity < 5) {
            this.stormIntensity++;
            this.updateStormIntensity();
        }

        this.timeToNextStrike = 8;

        this.hideWarning();
    }

    private updateStormIntensity(): void {
        const flash = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0xffff00,
            0.3
        ).setDepth(200).setScrollFactor(0);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        const intensityMsg = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            `STORM INTENSITY INCREASED TO LEVEL ${this.stormIntensity}!`,
            {
                fontSize: '24px',
                fontFamily: 'Arial Black',
                color: '#ff6600',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5).setDepth(201).setScrollFactor(0);

        this.tweens.add({
            targets: intensityMsg,
            y: intensityMsg.y - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => intensityMsg.destroy()
        });
    }

    private resetStormTracking(): void {
        this.lightningStrikes = 0;
        this.stormIntensity = 1;
        this.timeToNextStrike = 8;
        this.isWarningActive = false;
        
        if (this.lightningCounter) {
            this.lightningCounter.setText(`Lightning Strikes: ${this.lightningStrikes}`);
        }
        
        if (this.nextStrikeTimer) {
            this.nextStrikeTimer.setText(`Next Strike: ${this.timeToNextStrike}s`);
            this.nextStrikeTimer.setColor('#88ffff');
        }
        
        this.destroyStormWarning();
    }

    public triggerLightningWarning(): void {
        this.showLightningWarning();
    }

    public triggerLightningStrike(): void {
        this.onLightningStrike();
    }

    public getStormIntensity(): number {
        return this.stormIntensity;
    }

    public getLightningStrikes(): number {
        return this.lightningStrikes;
    }
}