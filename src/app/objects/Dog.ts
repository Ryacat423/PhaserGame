import { Player } from "./Player";

export type DogState = 'SLEEP' | 'CHASE' | 'ROAM' | 'IDLE' | 'RETURN_HOME';

export class Dog extends Phaser.Physics.Arcade.Sprite {
    public static readonly SLEEP: DogState = 'SLEEP';
    public static readonly CHASE: DogState = 'CHASE';
    public static readonly ROAM: DogState = 'ROAM';
    public static readonly IDLE: DogState = 'IDLE';
    public static readonly RETURN_HOME: DogState = 'RETURN_HOME';

    private currentState: DogState;
    private previousState: DogState;
    private player: Player;
    private stateTimer: number;
    private moveDirection: Phaser.Math.Vector2;
    private detectionRadius = 100;
    private chaseSpeed = 50;
    private roamSpeed = 30;
    private returnHomeSpeed = 40;
    private roamDuration = 15000;
    private sleepDuration = 3000;
    private maxRoamDistance = 500;

    private chaseDuration = 5000;
    private chaseTimer: number = 0;

    private spawnPoint: Phaser.Math.Vector2;
    private roamStartPoint: Phaser.Math.Vector2;

    private bark!: Phaser.Sound.BaseSound;    
    private meow!: Phaser.Sound.BaseSound;
    
    private isBarking: boolean = false;
    private hasPlayedMeow: boolean = false;

    private primaryBehavior: 'SLEEPER' | 'ROAMER';

    constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
        super(scene, x, y, 'dog');
        this.player = player;
        this.currentState = Dog.SLEEP;
        this.previousState = Dog.SLEEP;
        this.stateTimer = 0;
        this.moveDirection = new Phaser.Math.Vector2();
        
        this.spawnPoint = new Phaser.Math.Vector2(x, y);
        this.roamStartPoint = new Phaser.Math.Vector2(x, y);

        this.primaryBehavior = 'SLEEPER';
        
        scene.add.existing(this as Phaser.GameObjects.GameObject);
        scene.physics.add.existing(this as Phaser.GameObjects.GameObject);
        this.setScale(0.09);
        this.setCollideWorldBounds(true);

        this.bark = scene.sound.add('bark');
        this.meow = scene.sound.add('meow');

        this.setState(Dog.SLEEP);
        this.updateMoveDirection();

        this.body?.setSize(500, 400);
        this.body?.setOffset(300, 500);
    }

    public setPrimaryBehavior(behavior: 'SLEEPER' | 'ROAMER'): void {
        this.primaryBehavior = behavior;
    }

    public override setState(newState: DogState): this {
        if (this.currentState === newState) return this;

        if (this.currentState !== Dog.CHASE && this.currentState !== Dog.IDLE) {
            this.previousState = this.currentState;
        }

        if (this.currentState === Dog.IDLE) {
            this.hasPlayedMeow = false;
        }

        this.currentState = newState;
        this.stateTimer = 0;

        switch (this.currentState) {
            case Dog.SLEEP:
                this.play('dog_sleep');
                this.setVelocity(0, 0);
                break;
            case Dog.CHASE:
                this.play('dog_run');
                this.isBarking = true; 
                this.playBark();
                break;
            case Dog.ROAM:
                this.play('dog_run');
                this.roamStartPoint.set(this.x, this.y);
                this.updateMoveDirection();
                break;
            case Dog.RETURN_HOME:
                this.play('dog_run');
                break;
            case Dog.IDLE:
                this.play('dog_idle');
                this.setVelocity(0, 0);
                this.hasPlayedMeow = false;
                break;
        }
        return this;
    }

    private updateMoveDirection(): void {
        const distanceFromRoamStart = Phaser.Math.Distance.Between(
            this.x, this.y, 
            this.roamStartPoint.x, this.roamStartPoint.y
        );

        let angle: number;
        
        if (distanceFromRoamStart > this.maxRoamDistance * 0.8) {
            const angleToRoamStart = Phaser.Math.Angle.Between(
                this.x, this.y,
                this.roamStartPoint.x, this.roamStartPoint.y
            );
            angle = angleToRoamStart + Phaser.Math.FloatBetween(-Math.PI/3, Math.PI/3);
        } else {
            angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        }
        
        this.moveDirection.set(Math.cos(angle), Math.sin(angle)).normalize();
    }

    private shouldChasePlayer(): boolean {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
        return distance < this.detectionRadius;
    }

    private isAtSpawnPoint(): boolean {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.spawnPoint.x, this.spawnPoint.y);
        return distance < 20;
    }

    private shouldReturnHome(): boolean {
        const distanceFromSpawn = Phaser.Math.Distance.Between(
            this.x, this.y, 
            this.spawnPoint.x, this.spawnPoint.y
        );
        return distanceFromSpawn > this.maxRoamDistance;
    }

    private getNextStateAfterChase(): DogState {
        if (this.shouldReturnHome()) {
            return Dog.RETURN_HOME;
        }
        switch (this.previousState) {
            case Dog.ROAM:
                return Dog.ROAM;
            case Dog.SLEEP:
                return Dog.SLEEP;
            case Dog.RETURN_HOME:
                return Dog.RETURN_HOME;
            default:
                return this.primaryBehavior === 'ROAMER' ? Dog.ROAM : Dog.SLEEP;
        }
    }

    private getNextStateAfterIdle(): DogState {
        if (this.shouldReturnHome()) {
            return Dog.RETURN_HOME;
        }

        return this.getNextStateAfterChase();
    }

    private checkPlayerInteraction(): void {
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);

        if (distanceToPlayer < 30 && this.currentState === Dog.IDLE && !this.hasPlayedMeow) {
            this.meow.play();
            this.hasPlayedMeow = true;
        }
    }

    public playBark(): void {
        this.bark.play();
    }

    public stopBark(): void {
        this.bark.stop();
    }

    override update(_time: number, delta: number): void {
        this.stateTimer += delta;
        this.checkPlayerInteraction();

        if (this.shouldChasePlayer() && this.currentState !== Dog.CHASE) {
            this.setState(Dog.CHASE);
        }

        switch (this.currentState) {
            case Dog.SLEEP:
                if (this.anims.currentAnim?.key !== 'dog_sleep') {
                    this.play('dog_sleep');
                    this.setVelocity(0, 0);
                }

                if (this.stateTimer >= this.sleepDuration) {
                    if (this.primaryBehavior === 'SLEEPER' && Math.random() > 0.3) {
                        this.stateTimer = 0;
                    } else {
                        this.setState(Dog.ROAM);
                    }
                }
                break;

            case Dog.CHASE:
                this.chaseTimer += delta; // Increment the chase timer

                if (!this.shouldChasePlayer() || this.chaseTimer >= this.chaseDuration) {
                    this.setState(this.getNextStateAfterChase());
                    this.chaseTimer = 0; // Reset the chase timer
                } else {
                    this.scene.physics.moveToObject(this as Phaser.GameObjects.GameObject, this.player as Phaser.GameObjects.GameObject, this.chaseSpeed);
                    this.setFlipX(this.player.x < this.x);

                    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
                    if (distanceToPlayer < 15) { 
                        this.setState(Dog.IDLE);
                        this.stopBark();
                    }
                }
                break;

            case Dog.IDLE:
                if (this.anims.currentAnim?.key !== 'dog_idle') {
                    this.play('dog_idle');
                    this.setVelocity(0, 0);
                }
                if (this.stateTimer >= 2000) { 
                    this.setState(this.getNextStateAfterIdle());
                }
                break;

            case Dog.ROAM:
                if (this.shouldReturnHome()) {
                    this.setState(Dog.RETURN_HOME);
                    break;
                }

                if (this.stateTimer >= this.roamDuration) {
                    const continueRoaming = this.primaryBehavior === 'ROAMER' ? 0.7 : 0.3;
                    
                    if (Math.random() < continueRoaming) {
                        this.updateMoveDirection();
                        this.stateTimer = 0;
                    } else {
                        if (this.primaryBehavior === 'SLEEPER' && !this.shouldReturnHome() && Math.random() > 0.5) {
                            this.setState(Dog.SLEEP);
                        } else {
                            this.setState(Dog.RETURN_HOME);
                        }
                    }
                } else {
                    this.setVelocity(
                        this.moveDirection.x * this.roamSpeed,
                        this.moveDirection.y * this.roamSpeed
                    );
                    this.setFlipX(this.moveDirection.x < 0);
                    if (this.stateTimer % 1000 < delta) {
                        this.updateMoveDirection();
                    }
                }
                break;

            case Dog.RETURN_HOME:
                if (this.isAtSpawnPoint()) {
                    if (this.primaryBehavior === 'SLEEPER') {
                        this.setState(Dog.SLEEP);
                    } else {
                        this.setState(Math.random() > 0.6 ? Dog.SLEEP : Dog.ROAM);
                    }
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
                break;
        }
    }
}