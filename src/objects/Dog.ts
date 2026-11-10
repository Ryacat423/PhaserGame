import Phaser from 'phaser';
import { Player } from "./Player";

export type DogState = 'SLEEP' | 'CHASE' | 'ROAM' | 'RETURN_HOME' | 'PATROL' | 'ALERT' | 'SEARCH';

export class Dog extends Phaser.Physics.Arcade.Sprite {
    public static readonly SLEEP: DogState = 'SLEEP';
    public static readonly CHASE: DogState = 'CHASE';
    public static readonly ROAM: DogState = 'ROAM';
    public static readonly RETURN_HOME: DogState = 'RETURN_HOME';
    public static readonly PATROL: DogState = 'PATROL';
    public static readonly ALERT: DogState = 'ALERT';
    public static readonly SEARCH: DogState = 'SEARCH';

    private currentState: DogState;
    private player: Player;
    private moveDirection: Phaser.Math.Vector2;
    
    private detectionRadius = 140;
    private alertRadius = 200;
    private hearingRadius = 180;

    private chaseSpeed = 75;
    private roamSpeed = 50;
    private returnHomeSpeed = 50;
    private patrolSpeed = 40;
    private alertSpeed = 60;
    private maxRoamDistance = 500;
    
    private lastKnownPlayerPos: Phaser.Math.Vector2 | null = null;
    private searchTimer: number = 0;
    private maxSearchTime: number = 3000;
    private alertLevel: number = 0;
    private maxAlertLevel: number = 100;
    
    private patrolPoints: Phaser.Math.Vector2[] = [];
    private currentPatrolIndex: number = 0;
    private patrolWaitTime: number = 0;
    
    private spawnPoint: Phaser.Math.Vector2;

    private bark!: Phaser.Sound.BaseSound;    
    private meow!: Phaser.Sound.BaseSound;
    private growl!: Phaser.Sound.BaseSound;
    private sniff!: Phaser.Sound.BaseSound;
    
    private isPlayerHidden: boolean = false;
    private isBarking: boolean = false;
    private behaviorType: 'SLEEPER' | 'ROAMER' | 'GUARDIAN';
    
    private directionChangeTimer: number = 0;
    private directionChangeCooldown: number = 1500;
    private isDestroyed: boolean = false;
    
    private visionCone?: Phaser.GameObjects.Graphics;
    private visionAngle: number = 60;
    private showVisionCone: boolean = false;
    
    private nearbyDogs: Dog[] = [];
    private packCommunicationRadius: number = 250;

    constructor(scene: Phaser.Scene, x: number, y: number, player: Player, initialState: DogState = Dog.SLEEP) {
        super(scene, x, y, 'dog');
        
        this.player = player;
        this.currentState = initialState;
        this.moveDirection = new Phaser.Math.Vector2();
        
        this.spawnPoint = new Phaser.Math.Vector2(x, y);
        
        if (initialState === Dog.SLEEP) {
            this.behaviorType = 'SLEEPER';
        } else if (initialState === Dog.PATROL) {
            this.behaviorType = 'GUARDIAN';
            this.setupPatrolRoute();
        } else {
            this.behaviorType = 'ROAMER';
        }
        
        this.setupPhysics(scene);
        this.setupAudio(scene);
        this.setupEventListeners(scene);
        this.setupVisionCone(scene);
        this.setDepth(3);
        
        if (this.currentState === Dog.ROAM) {
            this.generateNewDirection();
        }
    }

    private setupPatrolRoute(): void {
        const radius = 150;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            this.patrolPoints.push(new Phaser.Math.Vector2(
                this.spawnPoint.x + Math.cos(angle) * radius,
                this.spawnPoint.y + Math.sin(angle) * radius
            ));
        }
    }

    private setupVisionCone(scene: Phaser.Scene): void {
        this.visionCone = scene.add.graphics();
        this.visionCone.setDepth(1);
        this.visionCone.setAlpha(0.2);
    }

    private updateVisionCone(): void {
        if (!this.visionCone || !this.showVisionCone) return;
        
        this.visionCone.clear();
        
        const facingAngle = this.flipX ? Math.PI : 0;
        const coneLength = this.detectionRadius;
        
        this.visionCone.fillStyle(0xffff00, 0.2);
        this.visionCone.beginPath();
        this.visionCone.moveTo(this.x, this.y);
        
        const angleRad = Phaser.Math.DegToRad(this.visionAngle / 2);
        this.visionCone.lineTo(
            this.x + Math.cos(facingAngle - angleRad) * coneLength,
            this.y + Math.sin(facingAngle - angleRad) * coneLength
        );
        this.visionCone.arc(
            this.x, this.y, coneLength,
            facingAngle - angleRad,
            facingAngle + angleRad
        );
        this.visionCone.closePath();
        this.visionCone.fill();
    }

    private setupPhysics(scene: Phaser.Scene): void {
        scene.add.existing(this as Phaser.GameObjects.GameObject);
        scene.physics.add.existing(this as Phaser.GameObjects.GameObject);
        
        this.setScale(0.09);
        this.setDepth(2);
        this.setCollideWorldBounds(true);
        
        this.body?.setSize(400, 300);
        this.body?.setOffset(350, 550);
    
        if (this.body && this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setBounce(0.1, 0.1);
        }

        this.playInitialAnimation();
    }
    
    private playInitialAnimation(): void {
        if (this.isDestroyed || !this.scene || !this.anims) return;
        
        switch (this.currentState) {
            case Dog.SLEEP:
                this.safePlayAnimation('dog_sleep', true);
                this.setVelocity(0, 0);
                break;
            case Dog.ROAM:
            case Dog.PATROL:
                this.safePlayAnimation('dog_run', true);
                break;
            default:
                this.safePlayAnimation('dog_idle', true);
                break;
        }
    }

    private safePlayAnimation(key: string, repeat: boolean = false): void {
        if (this.isDestroyed || !this.scene || !this.anims) return;
        
        try {
            if (this.scene.anims && this.scene.anims.exists(key)) {
                this.play(key, repeat);
            } else {
                if (this.scene.anims && this.scene.anims.exists('dog_idle')) {
                    this.play('dog_idle', repeat);
                }
            }
        } catch (error) {
            console.error(`Error playing animation '${key}':`, error);
        }
    }

    private setupAudio(scene: Phaser.Scene): void {
        try {
            this.bark = scene.sound.add('bark', { volume: 0.6 });
            this.meow = scene.sound.add('meow', { volume: 0.4 });
        } catch (error) {
            console.warn('Could not setup audio for dog:', error);
        }
    }

    private setupEventListeners(scene: Phaser.Scene): void {
        if (!scene.events) return;
        
        scene.events.on('playerHidden', () => this.onPlayerHidden());
        scene.events.on('playerVisible', () => this.onPlayerVisible());
        
        scene.events.once('shutdown', () => {
            this.isDestroyed = true;
        });
    }

    public onCollideWithPlayer(): void {
        if (this.isDestroyed) return;
        
        if (this.currentState === Dog.CHASE) {
            if (!this.player.getIsInvulnerable()) {
                this.player.takeDamage();
                const uiScene = this.scene.scene.get('UIScene');
                if (uiScene && uiScene.scene.isActive()) {
                    uiScene.events.emit('playerHitByDog');
                }
            }
            
            this.stopBark();
            if (this.behaviorType === 'SLEEPER') {
                this.setState(Dog.RETURN_HOME);
            } else {
                this.setState(Dog.ROAM);
            }
        }
    }

    private onPlayerHidden(): void {
        if (this.isDestroyed) return;
        
        this.isPlayerHidden = true;
        if (this.currentState === Dog.CHASE) {
            if (this.behaviorType === 'SLEEPER') {
                this.setState(Dog.RETURN_HOME);
            } else {
                this.setState(Dog.ROAM);
            }
        }
    }

    private onPlayerVisible(): void {
        if (this.isDestroyed) return;
        
        this.isPlayerHidden = false;
        if (this.shouldChasePlayer() && this.currentState !== Dog.CHASE) {
            this.setState(Dog.CHASE);
        }
    }

    public override setState(newState: DogState): this {
        if (this.isDestroyed || this.currentState === newState) return this;
        
        this.cleanupCurrentState();
        const previousState = this.currentState;
        this.currentState = newState;
        this.initializeNewState();
        return this;
    }

    private cleanupCurrentState(): void {
        if (this.isDestroyed) return;
        
        switch (this.currentState) {
            case Dog.CHASE:
                this.stopBark();
                break;
        }
    }

    private initializeNewState(): void {
        if (this.isDestroyed) return;
        switch (this.currentState) {
            case Dog.SLEEP:
                this.safePlayAnimation('dog_sleep', true);
                this.setVelocity(0, 0);
                break;
                
            case Dog.CHASE:
                this.safePlayAnimation('dog_run', true);
                this.startBark();
                break;
                
            case Dog.ROAM:
                this.safePlayAnimation('dog_run', true);
                this.generateNewDirection();
                break;
                
            case Dog.RETURN_HOME:
                this.safePlayAnimation('dog_run', true);
                break;
        }
    }

    private generateNewDirection(): void {
        if (this.isDestroyed) return;
        
        const distanceFromSpawn = Phaser.Math.Distance.Between(
            this.x, this.y, this.spawnPoint.x, this.spawnPoint.y
        );

        let angle: number;
        if (distanceFromSpawn > this.maxRoamDistance * 0.8) {
            const angleToSpawn = Phaser.Math.Angle.Between(
                this.x, this.y, this.spawnPoint.x, this.spawnPoint.y
            );
            angle = angleToSpawn + Phaser.Math.FloatBetween(-Math.PI/4, Math.PI/4);
        } else {
            angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        }
        
        this.moveDirection.set(Math.cos(angle), Math.sin(angle)).normalize();
        this.directionChangeTimer = 0;
    }

    private shouldChasePlayer(): boolean {
        if (this.isDestroyed || this.isPlayerHidden) return false;
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
        return distance < this.detectionRadius;
    }

    private isAtSpawnPoint(): boolean {
        if (this.isDestroyed) return true;
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.spawnPoint.x, this.spawnPoint.y);
        return distance < 30;
    }

    private startBark(): void {
        if (this.isDestroyed || !this.bark) return;
        
        if (!this.isBarking) {
            this.isBarking = true;
            try {
                this.bark.play();
            } catch (error) {
                console.warn('Could not play bark sound:', error);
            }
        }
    }

    public stopBark(): void {
        if (this.isDestroyed || !this.bark) return;
        
        if (this.isBarking) {
            this.isBarking = false;
            try {
                this.bark.stop();
            } catch (error) {
                console.warn('Could not stop bark sound:', error);
            }
        }
    }

    public playBark(): void {
        this.startBark();
    }

    override update(_time: number, delta: number): void {
        if (this.isDestroyed || !this.body || !this.active) return;
        
        if (this.shouldChasePlayer() && this.currentState !== Dog.CHASE) {
            this.setState(Dog.CHASE);
            return;
        }
        this.handleCurrentState(delta);
    }

    private handleCurrentState(delta: number): void {
        if (this.isDestroyed) return;
        
        switch (this.currentState) {
            case Dog.SLEEP:
                break;
            case Dog.CHASE:
                this.handleChaseState();
                break;
            case Dog.ROAM:
                this.handleRoamState(delta);
                break;
            case Dog.RETURN_HOME:
                this.handleReturnHomeState();
                break;
        }
    }

    private handleChaseState(): void {
        if (this.isDestroyed || !this.body || !this.active) return;
        
        if (this.isPlayerHidden) {
            if (this.behaviorType === 'SLEEPER') {
                this.setState(Dog.RETURN_HOME);
            } else {
                this.setState(Dog.ROAM);
            }
        } else if (!this.shouldChasePlayer()) {
            if (this.behaviorType === 'SLEEPER') {
                this.setState(Dog.RETURN_HOME);
            } else {
                this.setState(Dog.ROAM);
            }
        } else {
            if (this.scene && this.scene.physics) {
                this.scene.physics.moveToObject(
                    this as Phaser.GameObjects.GameObject, 
                    this.player as Phaser.GameObjects.GameObject, 
                    this.chaseSpeed
                );
            }
            this.setFlipX(this.player.x < this.x);
        }
    }

    private handleRoamState(delta: number): void {
        if (this.isDestroyed || !this.body || !this.active) return;
        
        this.setVelocity(
            this.moveDirection.x * this.roamSpeed,
            this.moveDirection.y * this.roamSpeed
        );
        this.setFlipX(this.moveDirection.x < 0);
        this.directionChangeTimer += delta;
        if (this.directionChangeTimer > this.directionChangeCooldown) {
            this.generateNewDirection();
        }
    }

    private handleReturnHomeState(): void {
        if (this.isDestroyed || !this.body || !this.active) return;
        
        if (this.isAtSpawnPoint()) {
            this.setState(Dog.SLEEP);
        } else {
            const directionToSpawn = new Phaser.Math.Vector2(
                this.spawnPoint.x - this.x,
                this.spawnPoint.y - this.y
            ).normalize();

            this.setVelocity(
                directionToSpawn.x * this.returnHomeSpeed,
                directionToSpawn.y * this.returnHomeSpeed
            );
            this.setFlipX(directionToSpawn.x < 0);
        }
    }

    public override destroy(fromScene?: boolean): void {
        this.isDestroyed = true;
        this.stopBark();
        
        if (this.bark) {
            try {
                this.bark.destroy();
            } catch (error) {
                console.warn('Error destroying bark sound:', error);
            }
        }
        if (this.meow) {
            try {
                this.meow.destroy();
            } catch (error) {
                console.warn('Error destroying meow sound:', error);
            }
        }
        
        super.destroy(fromScene);
    }

    public getCurrentState(): DogState {
        return this.currentState;
    }

    public getBehaviorType(): any {
        return this.behaviorType;
    }

    public isChasing(): boolean {
        return this.currentState === Dog.CHASE;
    }
}