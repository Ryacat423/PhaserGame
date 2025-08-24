export type ObstacleType = 'tree' | 'rock';

export interface ObstacleConfig {
    type: ObstacleType;
    texture: string;
    scale?: { min: number; max: number } | number;
    rotation?: { min: number; max: number } | number;
    hitbox?: {
        width?: number;
        height?: number;
        offsetX?: number;
        offsetY?: number;
    };
    depth?: number;
}

export class Obstacle extends Phaser.Physics.Arcade.Sprite {
    private obstacleType: ObstacleType;
    
    constructor(scene: Phaser.Scene, x: number, y: number, config: ObstacleConfig) {
        super(scene, x, y, config.texture);
        
        this.obstacleType = config.type;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        if (typeof config.scale === 'number') {
            this.setScale(config.scale);
        } else if (config.scale) {
            this.setScale(Phaser.Math.FloatBetween(config.scale.min, config.scale.max));
        }
        
        if (typeof config.rotation === 'number') {
            this.setAngle(config.rotation);
        } else if (config.rotation) {
            this.setAngle(Phaser.Math.Between(config.rotation.min, config.rotation.max));
        }

        this.setDepth(config.depth || 10);

        this.setImmovable(true);
        
        if (config.hitbox) {
            if (config.hitbox.width && config.hitbox.height) {
                this.body?.setSize(config.hitbox.width, config.hitbox.height);
                this.body?.setOffset(config.hitbox.offsetX || 0, config.hitbox.offsetY || 0);
            } else {
                this.setPercentageHitbox(config.hitbox);
            }
        } else {
            this.setDefaultHitbox();
        }
    }
    
    private setPercentageHitbox(hitbox: any): void {
        const width = hitbox.widthPercent ? this.width * hitbox.widthPercent : this.width;
        const height = hitbox.heightPercent ? this.height * hitbox.heightPercent : this.height;
        const offsetX = hitbox.offsetXPercent ? this.width * hitbox.offsetXPercent : (hitbox.offsetX || 0);
        const offsetY = hitbox.offsetYPercent ? this.height * hitbox.offsetYPercent : (hitbox.offsetY || 0);
        
        this.body?.setSize(width, height);
        this.body?.setOffset(offsetX, offsetY);
    }
    
    private setDefaultHitbox(): void {
        switch (this.obstacleType) {
            case 'tree':
                this.body?.setSize(this.width * 0.3, this.height * 0.2);
                this.body?.setOffset(this.width * 0.35, this.height * 0.8);
                break;
            case 'rock':
                this.body?.setSize(this.width * 0.8, this.height * 0.8);
                this.body?.setOffset(this.width * 0.1, this.height * 0.1);
                break;
            default:
                this.body?.setSize(this.width * 0.8, this.height * 0.8);
                this.body?.setOffset(this.width * 0.1, this.height * 0.1);
        }
    }
    
    public getObstacleType(): ObstacleType {
        return this.obstacleType;
    }

    public static getConfig(type: ObstacleType): ObstacleConfig {
        const configs: Record<ObstacleType, ObstacleConfig> = {
            tree: {
                type: 'tree',
                texture: 'tree',
                scale: { min: 0.13, max: 0.23 },
                rotation: { min: -15, max: 15 },
                depth: 5
            },
            rock: {
                type: 'rock',
                texture: 'rock',
                scale: { min: 0.2, max: 0.4 },
                rotation: { min: 0, max: 360 },
                depth: 5
            }
        };
        
        return configs[type];
    }
}