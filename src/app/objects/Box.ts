import { Player } from "./Player";

export class Box extends Phaser.Physics.Arcade.Sprite {
    private player: Player;
    private isPlayerNearby: boolean = false;
    private isPlayerHiding: boolean = false;
    private hideKey: Phaser.Input.Keyboard.Key;
    private interactionRadius: number = 60;

    public onPlayerHide: Phaser.Events.EventEmitter;
    public onPlayerShow: Phaser.Events.EventEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
        super(scene, x, y, 'box-cat');
        
        this.player = player;
        this.onPlayerHide = new Phaser.Events.EventEmitter();
        this.onPlayerShow = new Phaser.Events.EventEmitter();

        scene.add.existing(this);
        
        this.setScale(0.15);
        this.setDepth(1);
        this.setOrigin(0.5, 0.5);

        scene.physics.add.existing(this);
        
        if (this.body && this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setImmovable(true);
        }

        this.hideKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        scene.physics.add.collider(this.player, this);
    }

    public override update(): void {
        this.checkPlayerProximity();
        this.handleHideInput();
    }

    private checkPlayerProximity(): void {
        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.player.x, this.player.y
        );

        const wasNearby = this.isPlayerNearby;
        this.isPlayerNearby = distance <= this.interactionRadius;

        if (this.isPlayerNearby && !wasNearby) {
            this.scene.events.emit('playerNearBox', true);
        } else if (!this.isPlayerNearby && wasNearby) {
            this.scene.events.emit('playerNearBox', false);
            if (this.isPlayerHiding) {
                this.stopHiding();
            }
        }
    }

    public getIsPlayerHiding(): boolean {
        return this.isPlayerHiding;
    }

    public getIsPlayerNearby(): boolean {
        return this.isPlayerNearby;
    }

    public toggleHiding(): void {
        if (this.isPlayerNearby) {
            if (this.isPlayerHiding) {
                this.stopHiding();
            } else {
                this.startHiding();
            }
        }
    }
    
    private handleHideInput(): void {
        if (this.isPlayerNearby && Phaser.Input.Keyboard.JustDown(this.hideKey)) {
            if (this.isPlayerHiding) {
                this.stopHiding();
            } else {
                this.startHiding();
            }
        }
    }

    private startHiding(): void {
        if (!this.isPlayerNearby || this.isPlayerHiding) return;

        this.isPlayerHiding = true;

        this.player.setDepth(-1);
        this.player.setAlpha(0.3);
    
        this.player.setPosition(this.x, this.y + 20);
    
        if (this.player.body && this.player.body instanceof Phaser.Physics.Arcade.Body) {
            this.player.body.setImmovable(true);
            this.player.body.setEnable(false);
        }
        this.player.setVelocity(0, 0);
        this.player.setHiding(true);
    
        if (this.player.anims.exists('cat_hide')) {
            this.player.play('cat_hide');
        } else {
            this.player.play('cat_idle');
        }

        this.onPlayerHide.emit('playerHidden', this.player);
        this.scene.events.emit('playerHidden', this.player);

        console.log('Player is now hiding behind the box!');
    }

    private stopHiding(): void {
        if (!this.isPlayerHiding) return;

        this.isPlayerHiding = false;
        this.player.setDepth(2);
        this.player.setAlpha(1);
        
        if (this.player.body && this.player.body instanceof Phaser.Physics.Arcade.Body) {
            this.player.body.setImmovable(false);
            this.player.body.setEnable(true);
        }
        
        this.player.setHiding(false);
        this.onPlayerShow.emit('playerVisible', this.player);
        this.scene.events.emit('playerVisible', this.player);

        console.log('Player is no longer hiding!');
    }

    public forceStopHiding(): void {
        if (this.isPlayerHiding) {
            this.stopHiding();
        }
    }
}