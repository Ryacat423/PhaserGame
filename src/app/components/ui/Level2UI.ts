export class Level2UI extends Phaser.Scene {
    private coldnessBar!: Phaser.GameObjects.Graphics;
    private coldnessBarBg!: Phaser.GameObjects.Graphics;
    private coldnessIcon!: Phaser.GameObjects.Image;
    private coldnessText!: Phaser.GameObjects.Text;
    private coldStatusText?: Phaser.GameObjects.Text;
    private coldStatusTween?: Phaser.Tweens.Tween;
    
    private maxColdness: number = 100;
    private currentColdness: number = 0;
    private coldnessRate: number = 3;
    private warmthRate: number = 3;
    private isCold: boolean = false;

    private isNearFire: boolean = false;
    
    private coldnessBarWidth: number = 150;
    private coldnessBarHeight: number = 20;
    private coldnessBarX: number = 125;
    private coldnessBarY: number = 17;

    private almostCold!: Phaser.Sound.BaseSound;
    private freeze!: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'Level2UI' });
    }

    preload() {
        this.load.image('snowflake_icon', 'assets/scene/levels/2/snowflake.png');

        this.load.audio('almostFreeze', 'assets/global/audio/almost_cold.mp3');
        this.load.audio('freeze', 'assets/global/audio/freezing.mp3');
    }

    create() {
        this.almostCold = this.sound.add('almostFreeze').setVolume(1);
        this.freeze = this.sound.add('freeze').setVolume(1);

        this.setupColdnessBar();
        this.setupEventListeners();
        this.startColdnessSystem();
    }

    private setupColdnessBar(): void {
        this.coldnessBarBg = this.add.graphics()
            .setDepth(102);
        this.coldnessBarBg.fillStyle(0x333333, 0.8);
        this.coldnessBarBg.fillRoundedRect(
            this.coldnessBarX - 2, 
            this.coldnessBarY - 2, 
            this.coldnessBarWidth + 4, 
            this.coldnessBarHeight + 4, 
            3
        );

        this.coldnessBar = this.add.graphics()
            .setDepth(103);

        this.coldnessIcon = this.add.image(this.coldnessBarX - 10, this.coldnessBarY + 5, 'snowflake_icon')
            .setScale(0.04)
            .setDepth(102);

        this.coldnessText = this.add.text(
            this.coldnessBarX + this.coldnessBarWidth + 10, 
            this.coldnessBarY + 2, 
            '0%', {
                fontSize: '14px',
                color: '#87CEEB',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 1
            }
        ).setDepth(102);

        this.updateColdnessBar();
    }

    private setupEventListeners(): void {
        const resetColdness = () => {
            if (this.scene.isActive('Level2UI')) {
                this.resetColdness();
            }
        };
        this.events.on('playerNearFire', (isNear: boolean) => {
            this.isNearFire = isNear;
        });

        this.events.on('playerOnFire', () => {
            this.handleFireDamage();
        });
        this.game.events.on('levelStarted', resetColdness);
        this.game.events.on('levelReset', resetColdness);
    }

    private startColdnessSystem(): void {
        this.time.addEvent({
            delay: 100,
            callback: this.updateColdness,
            callbackScope: this,
            loop: true
        });
    }

    private updateColdness(): void {
        const deltaTime = 0.1;

        if (this.isNearFire) {
            this.currentColdness = Math.max(0, this.currentColdness - this.warmthRate * deltaTime);
            if (this.isCold && this.currentColdness < 30) {
                this.removeColdStatus();
            }
        } else {
            this.currentColdness = Math.min(this.maxColdness, this.currentColdness + this.coldnessRate * deltaTime);
            if (!this.isCold && this.currentColdness >= this.maxColdness) {
                this.applyColdStatus();
            }
        }

        this.updateColdnessBar();
    }

    private updateColdnessBar(): void {
        this.coldnessBar.clear();
        
        const fillPercentage = this.currentColdness / this.maxColdness;
        const fillWidth = this.coldnessBarWidth * fillPercentage;
        
        let barColor: number;
        if (fillPercentage < 0.3) {
            barColor = 0x87CEEB;
        } else if (fillPercentage < 0.6) {
            barColor = 0x4682B4;
            this.almostCold.play();
        } else if (fillPercentage < 0.9) {
            barColor = 0x1E90FF;
            this.freeze.play();
        } else {
            barColor = 0x0000FF;
        }

        this.coldnessBar.fillStyle(barColor, 0.9);
        this.coldnessBar.fillRoundedRect(
            this.coldnessBarX, 
            this.coldnessBarY, 
            fillWidth, 
            this.coldnessBarHeight, 
            2
        );

        const percentage = Math.floor(fillPercentage * 100);
        this.coldnessText.setText(`${percentage}%`);
        if (percentage >= 90) {
            this.coldnessText.setColor('#FF4444');
        } else if (percentage >= 60) {
            this.coldnessText.setColor('#FFAA44');
        } else {
            this.coldnessText.setColor('#87CEEB');
        }
    }

    private applyColdStatus(): void {
        if (this.isCold) return;
        
        this.isCold = true;
        this.createColdStatusText();
        
        const player = this.getPlayer();
        if (player && typeof player.applyCold === 'function') {
            player.applyCold();
        }
        
        this.tweens.add({
            targets: this.coldnessBar,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private removeColdStatus(): void {
        if (!this.isCold) return;
        
        this.isCold = false;
        
        this.destroyColdStatusText();
        const player = this.getPlayer();
        if (player && typeof player.cureCold === 'function') {
            player.cureCold();
        }
        
        this.tweens.killTweensOf(this.coldnessBar);
        this.coldnessBar.setAlpha(1);
    }

    private createColdStatusText(): void {
        if (this.coldStatusText) {
            this.destroyColdStatusText();
        }
        
        this.coldStatusText = this.add.text(200, 32, 'FREEZING!', {
            fontSize: '16px',
            fontFamily: 'Arial Black, Arial',
            color: '#87CEEB',
            stroke: '#000080',
            strokeThickness: 2,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 1,
                fill: true
            }
        }).setDepth(102).setOrigin(0.5, 0);
        this.coldStatusTween = this.tweens.add({
            targets: this.coldStatusText,
            scale: 1.1,
            alpha: 0.8,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private destroyColdStatusText(): void {
        if (this.coldStatusTween) {
            this.coldStatusTween.destroy();
            this.coldStatusTween = undefined;
        }

        if (this.coldStatusText) {
            this.tweens.add({
                targets: this.coldStatusText,
                scale: 0,
                alpha: 0,
                duration: 300,
                ease: 'Back.easeIn',
                onComplete: () => {
                    if (this.coldStatusText) {
                        this.coldStatusText.destroy();
                        this.coldStatusText = undefined;
                    }
                }
            });
        }
    }

    private handleFireDamage(): void {
        const uiScene = this.scene.get('UIScene');
        if (uiScene && typeof (uiScene as any).loseLife === 'function') {
            (uiScene as any).loseLife();
        }
        
        this.currentColdness = 0;
        if (this.isCold) {
            this.removeColdStatus();
        }
        this.updateColdnessBar();
    }

    private resetColdness(): void {
        this.currentColdness = 0;
        this.isNearFire = false;
        
        if (this.isCold) {
            this.removeColdStatus();
        }
        
        this.updateColdnessBar();
    }

    private getPlayer(): any {
        const level2Scene = this.scene.get('level2');
        if (level2Scene && (level2Scene as any).player) {
            return (level2Scene as any).player;
        }
        return null;
    }

    public setPlayerNearFire(isNear: boolean): void {
        this.isNearFire = isNear;
    }

    public triggerFireDamage(): void {
        this.handleFireDamage();
    }

    public getCurrentColdness(): number {
        return this.currentColdness;
    }

    public getIsCold(): boolean {
        return this.isCold;
    }
}