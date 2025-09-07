export class NightMechanics {
    private scene: Phaser.Scene;
    private player: any;
    private background: Phaser.GameObjects.Image;
    
    private sounds: { [key: string]: Phaser.Sound.BaseSound } = {};
    private darkness!: Phaser.GameObjects.Graphics;
    private lightMask!: Phaser.GameObjects.Graphics;
    private flashlightRadius: number = 100;
    private batteryDrainTimer!: Phaser.Time.TimerEvent;
    private currentBattery: number = 80;
    private readonly maxBattery: number = 100;
    private readonly batteryDrainRate: number = 3;

    private ambience!: Phaser.Sound.BaseSound;
    private owlHoot!: Phaser.Sound.BaseSound;

    constructor(scene: Phaser.Scene, player: any, background: Phaser.GameObjects.Image) {
        this.scene = scene;
        this.player = player;
        this.background = background;
    }

    preload(): void {
        if (!this.scene.cache.audio.has('night-ambience')) {
            this.scene.load.audio('owl-hoot', 'assets/global/audio/owl-hoot.mp3');
            this.scene.load.audio('night-ambience', 'assets/global/audio/night-ambience.mp3');
        }
    }

    create(): void {
        this.setupAmbience();
        this.createFlashlightSystem();
        this.setupBatterySystem();
        this.setupEventListeners();
    }

    private setupAmbience(): void {
        this.ambience = this.scene.sound.add('night-ambience', { loop: true, volume: 1 });
        this.owlHoot = this.scene.sound.add('owl-hoot', { loop: true, volume: 1 });
        
        this.ambience.play();
        this.scene.time.addEvent({
            delay: 5000,
            callback: () => this.owlHoot.play(),
            loop: true
        });
    }

    private createFlashlightSystem(): void {
        this.lightMask = this.scene.add.graphics();
        this.darkness = this.scene.add.graphics();
        this.darkness.fillStyle(0x000000, 1);
        this.darkness.fillRect(0, 0, this.background.width, this.background.height);
        this.darkness.setDepth(20);

        const mask = this.lightMask.createGeometryMask();
        mask.invertAlpha = true;
        this.darkness.setMask(mask);
    }

    private setupBatterySystem(): void {
        this.batteryDrainTimer = this.scene.time.addEvent({
            delay: 2000,
            callback: this.drainBattery,
            callbackScope: this,
            loop: true
        });
        this.updateBatteryUI();
    }

    private setupEventListeners(): void {
        this.scene.events.on('batteryCollected', (chargeAmount: number) => {
            this.currentBattery = Math.min(this.maxBattery, this.currentBattery + chargeAmount);
            this.updateBatteryUI();
            this.updateFlashlightRadius();
            
            const ui = this.scene.scene.get('Level3UI');
            if (ui && ui.scene.isActive()) {
                ui.events.emit('batteryCollected', chargeAmount);
            }
        });
    }

    private drainBattery(): void {
        if (this.currentBattery > 0) {
            this.currentBattery = Math.max(0, this.currentBattery - this.batteryDrainRate);
            this.updateBatteryUI();
            this.updateFlashlightRadius();
        }
    }

    private updateBatteryUI(): void {
        const ui = this.scene.scene.get('Level3UI');
        if (ui && ui.scene.isActive()) {
            ui.events.emit('batteryLevelChanged', {
                current: this.currentBattery,
                max: this.maxBattery
            });
        }
    }

    private updateFlashlightRadius(): void {
        const percentage = this.currentBattery / this.maxBattery;
        
        if (percentage <= 0) this.flashlightRadius = 0;
        else if (percentage <= 0.1) this.flashlightRadius = 30;
        else if (percentage <= 0.3) this.flashlightRadius = 60;
        else this.flashlightRadius = 100;
    }

    update(): void {
        this.updateFlashlightMask();
    }

    private updateFlashlightMask(): void {
        if (!this.lightMask || !this.player) return;
        
        this.lightMask.clear();
        
        if (this.currentBattery > 0) {
            let alpha = 0.09;
            if (this.currentBattery <= 10) {
                alpha = Phaser.Math.FloatBetween(0.05, 0.15);
            }

            this.lightMask.fillStyle(0xffffff, alpha);
            this.lightMask.fillCircle(this.player.x, this.player.y, this.flashlightRadius * 0.95);

            this.lightMask.fillStyle(0xffffff, 0.2);
            this.lightMask.fillCircle(this.player.x, this.player.y, this.flashlightRadius);
        }
    }

    getCurrentBattery(): number {
        return this.currentBattery;
    }

    getMaxBattery(): number {
        return this.maxBattery;
    }

    destroy(): void {
        if (this.batteryDrainTimer) this.batteryDrainTimer.destroy();
        if (this.lightMask) this.lightMask.destroy();
        if (this.darkness) this.darkness.destroy();
        
        if(this.owlHoot) this.owlHoot.destroy();
        if(this.ambience) this.ambience.destroy();
        
        this.currentBattery = 80;
        this.flashlightRadius = 100;
    }
}