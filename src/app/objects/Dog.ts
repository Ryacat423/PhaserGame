import { Player } from "./Player";

export type DogState = 'SLEEP' | 'CHASE' | 'ROAM' | 'RETURN_HOME';

export class Dog extends Phaser.Physics.Arcade.Sprite {
    public static readonly SLEEP: DogState = 'SLEEP';
    public static readonly CHASE: DogState = 'CHASE';
    public static readonly ROAM: DogState = 'ROAM';
    public static readonly RETURN_HOME: DogState = 'RETURN_HOME';

    private currentState: DogState;
    private player: Player;
    private moveDirection: Phaser.Math.Vector2;
    
    private detectionRadius = 200;
    private chaseSpeed = 60;
    private roamSpeed = 40;
    private returnHomeSpeed = 50;
    private maxRoamDistance = 500;
    
    private spawnPoint: Phaser.Math.Vector2;

    private bark!: Phaser.Sound.BaseSound;    
    private meow!: Phaser.Sound.BaseSound;
    
    private isPlayerHidden: boolean = false;
    private isBarking: boolean = false;
    private behaviorType: 'SLEEPER' | 'ROAMER';
    
    private directionChangeTimer: number = 0;
    private directionChangeCooldown: number = 1500;

    constructor(scene: Phaser.Scene, x: number, y: number, player: Player, initialState: DogState = Dog.SLEEP) {
        super(scene, x, y, 'dog');
        
        this.player = player;
        this.currentState = initialState;
        this.moveDirection = new Phaser.Math.Vector2();
        
        this.spawnPoint = new Phaser.Math.Vector2(x, y);
        
        this.behaviorType = initialState === Dog.SLEEP ? 'SLEEPER' : 'ROAMER';
        
        this.setupPhysics(scene);
        this.setupAudio(scene);
        this.setupEventListeners(scene);
        this.setDepth(3);
        
        if (this.currentState === Dog.ROAM) {
            this.generateNewDirection();
        }
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
        console.log(`Playing initial animation for state: ${this.currentState}`);
        
        switch (this.currentState) {
            case Dog.SLEEP:
                this.play('dog_sleep', true);
                this.setVelocity(0, 0);
                break;
            case Dog.ROAM:
                this.play('dog_run', true);
                break;
            default:
                this.play('dog_idle', true);
                break;
        }
    }

    private setupAudio(scene: Phaser.Scene): void {
        this.bark = scene.sound.add('bark', { volume: 0.6 });
        this.meow = scene.sound.add('meow', { volume: 0.4 });
    }

    private setupEventListeners(scene: Phaser.Scene): void {
        scene.events.on('playerHidden', () => this.onPlayerHidden());
        scene.events.on('playerVisible', () => this.onPlayerVisible());
    }

    public onCollideWithPlayer(): void {
        if (this.currentState === Dog.CHASE) {
            if (!this.player.getIsInvulnerable()) {
                this.player.takeDamage();
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
        this.isPlayerHidden = false;
        if (this.shouldChasePlayer() && this.currentState !== Dog.CHASE) {
            this.setState(Dog.CHASE);
        }
    }

    public override setState(newState: DogState): this {
        if (this.currentState === newState) return this;
        this.cleanupCurrentState();
        const previousState = this.currentState;
        this.currentState = newState;
        this.initializeNewState();
        return this;
    }

    private cleanupCurrentState(): void {
        switch (this.currentState) {
            case Dog.CHASE:
                this.stopBark();
                break;
        }
    }

    private initializeNewState(): void {
        console.log(`Dog initializing state: ${this.currentState}`);
        
        switch (this.currentState) {
            case Dog.SLEEP:
                console.log('Playing dog_sleep animation');
                this.play('dog_sleep', true);
                this.setVelocity(0, 0);
                break;
                
            case Dog.CHASE:
                console.log('Playing dog_run animation for chase');
                this.play('dog_run', true);
                this.startBark();
                break;
                
            case Dog.ROAM:
                console.log('Playing dog_run animation for roam');
                this.play('dog_run', true);
                this.generateNewDirection();
                break;
                
            case Dog.RETURN_HOME:
                console.log('Playing dog_run animation for return home');
                this.play('dog_run', true);
                break;
        }
    }

    private generateNewDirection(): void {
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
        if (this.isPlayerHidden) return false;
        
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
        return distance < this.detectionRadius;
    }

    private isAtSpawnPoint(): boolean {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.spawnPoint.x, this.spawnPoint.y);
        return distance < 30;
    }

    private startBark(): void {
        if (!this.isBarking) {
            this.isBarking = true;
            this.bark.play();
        }
    }

    public stopBark(): void {
        if (this.isBarking) {
            this.isBarking = false;
            this.bark.stop();
        }
    }

    public playBark(): void {
        this.startBark();
    }

    override update(_time: number, delta: number): void {
        if (!this.body || !this.active) return;
        if (this.shouldChasePlayer() && this.currentState !== Dog.CHASE) {
            this.setState(Dog.CHASE);
            return;
        }
        this.handleCurrentState(delta);
    }

    private handleCurrentState(delta: number): void {
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
        if (!this.body || !this.active) return;
        
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
            this.scene.physics.moveToObject(
                this as Phaser.GameObjects.GameObject, 
                this.player as Phaser.GameObjects.GameObject, 
                this.chaseSpeed
            );
            this.setFlipX(this.player.x < this.x);
        }
    }

    private handleRoamState(delta: number): void {
        if (!this.body || !this.active) return;
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
        if (!this.body || !this.active) return;
        
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
        this.stopBark();
        if (this.bark) this.bark.destroy();
        if (this.meow) this.meow.destroy();
        super.destroy(fromScene);
    }

    public getCurrentState(): DogState {
        return this.currentState;
    }

    public getBehaviorType(): 'SLEEPER' | 'ROAMER' {
        return this.behaviorType;
    }

    public isChasing(): boolean {
        return this.currentState === Dog.CHASE;
    }
}