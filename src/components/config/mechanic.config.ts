import Phaser from 'phaser';
// Create this file as: components/config/mechanic.config.ts

import { SnowMechanic } from "../../mechanics/snow.mechanics";
import { NightMechanics } from "../../mechanics/night.mechanic";

interface MechanicTheme {
    audioKey: string;
    audioPath: string;
    volume: number;
    uiScenes: string[];
}

export class Mechanics {
    /**
     * Get theme configuration for a mechanic type
     */
    static getThemeConfig(mechanicType: string): MechanicTheme {
        const configs: { [key: string]: MechanicTheme } = {
            'snow': {
                audioKey: 'level2_theme',
                audioPath: 'assets/global/audio/lvl-2-theme.mp3',
                volume: 0.6,
                uiScenes: ['Level2UI']
            },
            'night': {
                audioKey: 'level3_theme',
                audioPath: 'assets/global/audio/night-theme.mp3',
                volume: 0.2,
                uiScenes: ['Level3UI']
            },
            'lightning': {
                audioKey: 'level4_theme',
                audioPath: 'assets/global/audio/rain_theme.mp3',
                volume: 1.0,
                uiScenes: []
            },
            'none': {
                audioKey: 'level1_theme',
                audioPath: 'assets/global/audio/gameplay.ogg',
                volume: 0.8,
                uiScenes: []
            }
        };

        return configs[mechanicType] || configs['none'];
    }

    /**
     * Create mechanics instance based on type
     */
    static createMechanics(
        mechanicType: string, 
        scene: Phaser.Scene, 
        player?: any, 
        background?: Phaser.GameObjects.Image
    ): any {
        switch (mechanicType) {
            case 'snow':
                return new SnowMechanic(scene, player);
                
            case 'night':
                if (!player || !background) {
                    console.error('Night mechanics requires player and background');
                    return null;
                }
                return new NightMechanics(scene, player, background);
                
            case 'lightning':
                // Lightning is handled directly in Level4Scene
                // Return a simple object with necessary methods
                return this.createLightningMechanic(scene, player);
                
            case 'none':
            default:
                return null;
        }
    }

    /**
     * Create lightning mechanic wrapper
     */
    private static createLightningMechanic(scene: Phaser.Scene, player: any): any {
        let lightningWarning: Phaser.GameObjects.Graphics;
        let lightningSprite: Phaser.GameObjects.Sprite;
        let lightningTimer: Phaser.Time.TimerEvent;
        let warningTimer: Phaser.Time.TimerEvent;
        let isLightningActive = false;
        let lightningDamageDealt = false;
        let warningPosition = { x: 0, y: 0 };
        
        const WARNING_DURATION = 2000;
        const LIGHTNING_INTERVAL = 8000;
        const WARNING_RADIUS = 60;
        const STRIKE_RADIUS = 50;
        const LIGHTNING_DAMAGE = 3;

        let warningSound: Phaser.Sound.BaseSound;
        let lightningStrike: Phaser.Sound.BaseSound;
        let rain: Phaser.Sound.BaseSound;

        return {
            preload: () => {
                scene.load.audio('rain', 'assets/global/audio/rain.wav');
                scene.load.audio('lightning_charge', 'assets/global/audio/lightning_start.mp3');
                scene.load.audio('lightning_strike', 'assets/global/audio/lightning_strike.mp3');
            },

            create: () => {
                // Setup sounds
                warningSound = scene.sound.add('lightning_charge');
                lightningStrike = scene.sound.add('lightning_strike');
                rain = scene.sound.add('rain', { loop: true }).setVolume(0.1);
                rain.play();

                // Create rain particles
                const gfx = scene.add.graphics();
                gfx.fillStyle(0xffffff, 1);
                gfx.fillRect(0, 0, 2, 10);
                gfx.generateTexture('raindrop', 2, 10);
                gfx.destroy();

                const particles = scene.add.particles(0, 0, 'raindrop', {
                    x: { min: 0, max: scene.scale.width },
                    y: 0,
                    lifespan: 1200,
                    speedY: { min: 500, max: 800 },
                    scale: { min: 0.5, max: 1 },
                    quantity: 4,
                    alpha: { start: 1, end: 0 },
                    angle: { min: 80, max: 100 },
                    blendMode: 'NORMAL'
                });
                particles.setDepth(20);

                const overlay = scene.add.rectangle(
                    scene.cameras.main.centerX,
                    scene.cameras.main.centerY,
                    scene.scale.width,
                    scene.scale.height,
                    0x000033,
                    0.3
                );
                overlay.setScrollFactor(0).setDepth(50);

                // Setup lightning graphics
                lightningWarning = scene.add.graphics();
                lightningWarning.setDepth(15);
                lightningWarning.setVisible(false);

                lightningSprite = scene.add.sprite(0, 0, 'lightning').setScale(0.8);
                lightningSprite.setDepth(25);
                lightningSprite.setVisible(false);
                lightningSprite.setOrigin(0.5, 0);

                // Start lightning cycle
                const triggerWarning = () => {
                    if (isLightningActive || !player || !player.active) return;

                    isLightningActive = true;
                    lightningDamageDealt = false;
                    warningPosition.x = player.x;
                    warningPosition.y = player.y;

                    lightningWarning.clear();
                    lightningWarning.setVisible(true);

                    const updateWarning = () => {
                        if (!isLightningActive) return;
                        lightningWarning.clear();
                        lightningWarning.fillStyle(0xff0000, 0.3);
                        lightningWarning.fillCircle(warningPosition.x, warningPosition.y, WARNING_RADIUS);
                    };

                    updateWarning();
                    scene.tweens.add({
                        targets: lightningWarning,
                        alpha: { from: 0.3, to: 0.7 },
                        duration: 300,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });

                    warningSound.play();

                    warningTimer = scene.time.delayedCall(WARNING_DURATION, () => {
                        // Strike
                        lightningWarning.setVisible(false);
                        scene.tweens.killTweensOf(lightningWarning);

                        lightningSprite.setPosition(warningPosition.x, warningPosition.y - 300);
                        lightningSprite.setVisible(true);
                        lightningSprite.play('strike');
                        lightningStrike.play();

                        scene.cameras.main.flash(200, 255, 255, 255, false);

                        if (!lightningDamageDealt) {
                            const distance = Phaser.Math.Distance.Between(
                                player.x, player.y,
                                warningPosition.x, warningPosition.y
                            );

                            if (distance <= STRIKE_RADIUS) {
                                lightningDamageDealt = true;
                                for (let i = 0; i < LIGHTNING_DAMAGE; i++) {
                                    player.takeDamage();
                                }
                                const uiScene = scene.scene.get('UIScene') as any;
                                if (uiScene && uiScene.loseLife) {
                                    uiScene.loseLife(LIGHTNING_DAMAGE);
                                }
                            }
                        }

                        lightningSprite.once('animationcomplete', () => {
                            lightningSprite.setVisible(false);
                            isLightningActive = false;
                        });
                    });
                };

                lightningTimer = scene.time.addEvent({
                    delay: LIGHTNING_INTERVAL,
                    callback: triggerWarning,
                    loop: true
                });

                scene.time.delayedCall(3000, triggerWarning);
            },

            destroy: () => {
                if (lightningTimer) lightningTimer.destroy();
                if (warningTimer) warningTimer.destroy();
                if (rain) {
                    rain.stop();
                    rain.destroy();
                }
                if (warningSound) warningSound.destroy();
                if (lightningStrike) lightningStrike.destroy();
                scene.tweens.killTweensOf(lightningWarning);
            }
        };
    }
}