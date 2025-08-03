import { Player } from "./Player";

export type DogState = 'SLEEP' | 'CHASE' | 'ROAM' | 'IDLE';

export class Dog extends Phaser.Physics.Arcade.Sprite {
    private static readonly SLEEP: DogState = 'SLEEP';
    private static readonly CHASE: DogState = 'CHASE';
    private static readonly ROAM: DogState = 'ROAM';
    private static readonly IDLE: DogState = 'IDLE';

    private currentState: DogState;
    private player: Player;
    private stateTimer: number;
    private moveDirection: Phaser.Math.Vector2;
    private detectionRadius = 100;
    private chaseSpeed = 50;
    private roamSpeed = 50;
    private roamDuration = 2000;
    private sleepDuration = 5000;

    private bark!: Phaser.Sound.BaseSound;
    private isBarking: boolean = false;

    private meow!: Phaser.Sound.BaseSound;

    constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
        super(scene, x, y, 'dog');
        this.player = player;
        this.currentState = Dog.SLEEP;
        this.stateTimer = 0;
        this.moveDirection = new Phaser.Math.Vector2();
        scene.add.existing(this as Phaser.GameObjects.GameObject);
        scene.physics.add.existing(this as Phaser.GameObjects.GameObject);
        this.setScale(0.09);
        this.setCollideWorldBounds(true);

        this.bark = scene.sound.add('bark');
        this.meow = scene.sound.add('meow');

        this.setState(Dog.SLEEP);
        this.updateMoveDirection();
    }

    private getRandomState(): DogState {
        const states: DogState[] = [Dog.SLEEP, Dog.CHASE, Dog.ROAM];
        return states[Math.floor(Math.random() * states.length)];
    }

    public override setState(newState: DogState): this {
        if (this.currentState === newState) return this;

        this.currentState = newState;
        this.stateTimer = 0;

        switch (this.currentState) {
            case Dog.SLEEP:
                if (this.anims.currentAnim?.key !== 'dog_sleep') {
                    this.play('dog_sleep');
                    this.setVelocity(0, 0);
                }
                break;
            case Dog.CHASE:
                this.play('dog_run');
                this.isBarking = true; 
                this.bark.play(); 
                break;
            case Dog.ROAM:
                this.play('dog_run');
                this.updateMoveDirection();
                break;
            case Dog.IDLE:
                this.play('dog_idle');
                this.setVelocity(0, 0);
                break;
        }
        return this;
    }

    private updateMoveDirection(): void {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.moveDirection.set(Math.cos(angle), Math.sin(angle)).normalize();
    }

    private shouldChasePlayer(): boolean {
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
        return distance < this.detectionRadius;
    }

    override update(_time: number, delta: number): void {
        this.stateTimer += delta;

        if (this.shouldChasePlayer()) {
            this.setState(Dog.CHASE);
        }

        switch (this.currentState) {
            case Dog.SLEEP:
                if (this.anims.currentAnim?.key !== 'dog_sleep') {
                    this.play('dog_sleep');
                    this.setVelocity(0, 0);
                }

                if (this.stateTimer >= this.sleepDuration) {
                    this.setState(Dog.ROAM);
                }
                break;

            case Dog.CHASE:
                if (!this.shouldChasePlayer()) {
                    this.setState(Dog.ROAM);
                } else {
                    this.scene.physics.moveToObject(this as Phaser.GameObjects.GameObject, this.player as Phaser.GameObjects.GameObject, this.chaseSpeed);
                    this.setFlipX(this.player.x < this.x);

                    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
                    if (distanceToPlayer < 10) { 
                        this.setState(Dog.IDLE);
                        this.bark.stop();
                        this.triggerGameOverForCat();
                    }
                }
                break;

            case Dog.IDLE:
                if (this.anims.currentAnim?.key !== 'dog_idle') {
                    this.play('dog_idle');
                    this.setVelocity(0, 0);
                }
                if (this.stateTimer >= 2000) { 
                    this.setState(Dog.ROAM);
                }
                break;

            case Dog.ROAM:
                if (this.stateTimer >= this.roamDuration) {
                    if (Math.random() > 0.7) {
                        this.setState(Dog.SLEEP);
                    } else {
                        this.updateMoveDirection();
                        this.stateTimer = 0;
                    }
                } else {
                    this.setVelocity(
                        this.moveDirection.x * this.roamSpeed,
                        this.moveDirection.y * this.roamSpeed
                    );
                    this.setFlipX(this.moveDirection.x < 0);
                }
                break;
        }
    }

    private triggerGameOverForCat(): void {
        this.meow.play();
    }
}
