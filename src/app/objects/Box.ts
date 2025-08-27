import { Player } from "./Player";

export class Box extends Phaser.Physics.Arcade.Sprite {
    private player: Player;
    private isPlayerNearby: boolean = false;
    private isPlayerHiding: boolean = false;
    private hideKey: Phaser.Input.Keyboard.Key;
    private interactionRadius: number = 60;
    private isDestroyed: boolean = false;
    private originalTexture: string = 'box-cat';
    private hideTexture: string = 'cat';

    public onPlayerHide: Phaser.Events.EventEmitter;
    public onPlayerShow: Phaser.Events.EventEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
        super(scene, x, y, 'box-cat');
        
        this.player = player;
        this.onPlayerHide = new Phaser.Events.EventEmitter();
        this.onPlayerShow = new Phaser.Events.EventEmitter();

        scene.add.existing(this);
        
        this.setScale(0.3);
        this.setDepth(1);
        this.setOrigin(0.5, 0.5);

        scene.physics.add.existing(this);
        
        if (this.body && this.body instanceof Phaser.Physics.Arcade.Body) {
            this.body.setImmovable(true);
        }

        this.hideKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        scene.physics.add.collider(this.player, this);

        scene.events.on('beforeSceneRestart', this.cleanup, this);
        scene.events.on('shutdown', this.cleanup, this);
    }

    public override update(): void {
        if (this.isDestroyed) return; 
        
        this.checkPlayerProximity();
        this.handleHideInput();
    }

    private cleanup(): void {
        this.isDestroyed = true;
        
        if (this.isPlayerHiding) {
            this.stopHidingSilently();
        }

        this.onPlayerHide.removeAllListeners();
        this.onPlayerShow.removeAllListeners();

        if (this.scene && this.scene.events) {
            this.scene.events.off('beforeSceneRestart', this.cleanup, this);
            this.scene.events.off('shutdown', this.cleanup, this);
        }
    }

    private checkPlayerProximity(): void {
        if (this.isDestroyed) return;

        const distance = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.player.x, this.player.y
        );

        const wasNearby = this.isPlayerNearby;
        this.isPlayerNearby = distance <= this.interactionRadius;

        if (this.isPlayerNearby && !wasNearby) {
            this.emitSafely('playerNearBox', true);
        } else if (!this.isPlayerNearby && wasNearby) {
            this.emitSafely('playerNearBox', false);
            if (this.isPlayerHiding) {
                this.stopHiding();
            }
        }
    }

    private emitSafely(event: string, ...args: any[]): void {
        if (!this.isDestroyed && this.scene && this.scene.events) {
            this.scene.events.emit(event, ...args);
        }
    }

    public getIsPlayerHiding(): boolean {
        return this.isPlayerHiding;
    }

    public getIsPlayerNearby(): boolean {
        return this.isPlayerNearby;
    }

    public toggleHiding(): void {
        if (this.isDestroyed) return;
        
        if (this.isPlayerNearby) {
            if (this.isPlayerHiding) {
                this.stopHiding();
            } else {
                this.startHiding();
            }
        }
    }
    
    private handleHideInput(): void {
        if (this.isDestroyed) return;

        if (this.isPlayerNearby && Phaser.Input.Keyboard.JustDown(this.hideKey)) {
            if (this.isPlayerHiding) {
                this.stopHiding();
            } else {
                this.startHiding();
            }
        }
    }

    private startHiding(): void {
        if (this.isDestroyed || !this.isPlayerNearby || this.isPlayerHiding) return;

        this.isPlayerHiding = true;
        this.player.setVisible(false);
        this.player.setDepth(-1);

        this.player.setPosition(this.x, this.y + 20);
    
        if (this.player.body && this.player.body instanceof Phaser.Physics.Arcade.Body) {
            this.player.body.setImmovable(true);
            this.player.body.setEnable(false);
        }
        this.player.setVelocity(0, 0);
        this.player.setHiding(true);

        const originalX = this.x;
        const originalY = this.y;

        this.setTexture(this.hideTexture, 0);
        this.setPosition(originalX, originalY);
        this.setOrigin(0.46, 0.75);
        if (this.scene.anims.exists('cat_hide')) {
            this.play('cat_hide');
        }

        this.onPlayerHide.emit('playerHidden', this.player);
        this.emitSafely('playerHidden', this.player);
    }

    private stopHiding(): void {
        if (this.isDestroyed || !this.isPlayerHiding) return;

        this.isPlayerHiding = false;
        const currentX = this.x;
        const currentY = this.y;

        this.player.setVisible(true);
        this.player.setDepth(3);
        this.player.setAlpha(1);
        
        if (this.player.body && this.player.body instanceof Phaser.Physics.Arcade.Body) {
            this.player.body.setImmovable(false);
            this.player.body.setEnable(true);
        }
        
        this.player.setHiding(false);
        this.setTexture(this.originalTexture, 0);
        this.stop();
        
        this.setOrigin(0.5, 0.5);
        this.setPosition(currentX, currentY);
        
        this.onPlayerShow.emit('playerVisible', this.player);
        this.emitSafely('playerVisible', this.player);
    }

    private stopHidingSilently(): void {
        if (!this.isPlayerHiding) return;

        this.isPlayerHiding = false;
        
        this.player.setVisible(true);
        this.player.setDepth(3);
        this.player.setAlpha(1);
        
        if (this.player.body && this.player.body instanceof Phaser.Physics.Arcade.Body) {
            this.player.body.setImmovable(false);
            this.player.body.setEnable(true);
        }
        
        this.player.setHiding(false);
        this.setTexture(this.originalTexture, 0);
        this.stop();
    }

    public forceStopHiding(): void {
        if (this.isDestroyed) return;
        
        if (this.isPlayerHiding) {
            this.stopHiding();
        }
    }
}