import Phaser from 'phaser';
import { sheetScale } from '../config/sprites';
import { sortOnce } from '../utils/depth';
import { Player } from "./Player";

/**
 * A cardboard box the cat can hide in.
 *
 * The box keeps its own texture and physics body the whole time; the hiding cat is a separate
 * sprite drawn on top. It used to swap its own texture to the cat sheet, which resized and moved
 * its physics body while the cat was inside, and the cat was parked inside the box's body. When
 * the cat came out, its body overlapped the box by more than Arcade physics can push apart, so for
 * a moment it could walk straight through the box.
 */
export class Box extends Phaser.Physics.Arcade.Sprite {
    private static readonly BOX_SCALE = 0.3;
    /** Solid part of the box texture (237x187): the front faces, not the lid. */
    private static readonly BODY = { x: 10, y: 60, width: 216, height: 118 };

    private player: Player;
    private isPlayerNearby: boolean = false;
    private isPlayerHiding: boolean = false;
    private hideKey: Phaser.Input.Keyboard.Key;
    private interactionRadius: number = 60;
    private isDestroyed: boolean = false;
    private hiddenCat?: Phaser.GameObjects.Sprite;
    /** Which side of the box the cat climbed in from, so it climbs out the same way. */
    private entrySide = new Phaser.Math.Vector2(0, 1);

    public onPlayerHide: Phaser.Events.EventEmitter;
    public onPlayerShow: Phaser.Events.EventEmitter;

    constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
        super(scene, x, y, 'box-cat');

        this.player = player;
        this.onPlayerHide = new Phaser.Events.EventEmitter();
        this.onPlayerShow = new Phaser.Events.EventEmitter();

        scene.add.existing(this);
        this.setScale(Box.BOX_SCALE);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
        body.setSize(Box.BODY.width, Box.BODY.height, false);
        body.setOffset(Box.BODY.x, Box.BODY.y);
        sortOnce(this);

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
        if (this.isPlayerHiding) {
            this.stopHidingSilently();
        }
        this.isDestroyed = true;

        this.onPlayerHide.removeAllListeners();
        this.onPlayerShow.removeAllListeners();

        if (this.scene && this.scene.events) {
            this.scene.events.off('beforeSceneRestart', this.cleanup, this);
            this.scene.events.off('shutdown', this.cleanup, this);
        }
    }

    private checkPlayerProximity(): void {
        if (this.isDestroyed || this.isPlayerHiding) return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
        const wasNearby = this.isPlayerNearby;
        this.isPlayerNearby = distance <= this.interactionRadius;

        if (this.isPlayerNearby && !wasNearby) {
            this.emitSafely('playerNearBox', true);
        } else if (!this.isPlayerNearby && wasNearby) {
            this.emitSafely('playerNearBox', false);
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
        if (this.isDestroyed || !this.isPlayerNearby) return;
        if (this.isPlayerHiding) {
            this.stopHiding();
        } else {
            this.startHiding();
        }
    }

    private handleHideInput(): void {
        if (this.isDestroyed) return;
        if (Phaser.Input.Keyboard.JustDown(this.hideKey)) {
            this.toggleHiding();
        }
    }

    private startHiding(): void {
        if (this.isDestroyed || !this.isPlayerNearby || this.isPlayerHiding) return;

        this.isPlayerHiding = true;
        this.entrySide.set(this.player.x - this.x, this.player.y - this.y);
        if (this.entrySide.lengthSq() < 1) this.entrySide.set(0, 1);
        this.entrySide.normalize();

        this.player.setVelocity(0, 0);
        (this.player.body as Phaser.Physics.Arcade.Body | null)?.setEnable(false);
        this.player.setVisible(false);
        this.player.setHiding(true);

        // The cat peeking out of the box, in the box's place.
        this.hiddenCat = this.scene.add.sprite(this.x, this.y, 'cat', 0)
            .setOrigin(0.46, 0.75)
            .setScale(sheetScale('cat', Box.BOX_SCALE))
            .setDepth(this.depth);
        if (this.scene.anims.exists('cat_hide')) {
            this.hiddenCat.play('cat_hide');
        }
        this.setVisible(false);

        this.onPlayerHide.emit('playerHidden', this.player);
        this.emitSafely('playerHidden', this.player);
    }

    private stopHiding(): void {
        if (this.isDestroyed || !this.isPlayerHiding) return;

        this.releasePlayer();

        this.onPlayerShow.emit('playerVisible', this.player);
        this.emitSafely('playerVisible', this.player);
    }

    private stopHidingSilently(): void {
        if (!this.isPlayerHiding) return;
        this.releasePlayer();
    }

    /** Puts the cat back just outside the box, clear of its body, then turns its physics back on. */
    private releasePlayer(): void {
        this.isPlayerHiding = false;
        this.hiddenCat?.destroy();
        this.hiddenCat = undefined;
        this.setVisible(true);

        const exit = this.findExitPoint();
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body | null;
        playerBody?.setEnable(true);
        playerBody?.reset(exit.x, exit.y);
        this.player.setPosition(exit.x, exit.y);
        this.player.setVisible(true);
        this.player.setAlpha(1);
        this.player.setHiding(false);
    }

    /**
     * The first spot around the box, starting from the side the cat came in, where the cat's body
     * fits without touching the box or anything else solid.
     */
    private findExitPoint(): Phaser.Math.Vector2 {
        const box = this.body as Phaser.Physics.Arcade.Body;
        const pb = this.player.body as Phaser.Physics.Arcade.Body;
        // Offset from the cat's body centre to its sprite position, to place the body exactly.
        const toSpriteX = this.player.x - pb.center.x;
        const toSpriteY = this.player.y - pb.center.y;
        const gap = 4;

        const sides = [
            this.entrySide.clone(),
            new Phaser.Math.Vector2(0, 1),
            new Phaser.Math.Vector2(0, -1),
            new Phaser.Math.Vector2(-1, 0),
            new Phaser.Math.Vector2(1, 0)
        ];
        const candidates = sides.map((side) => {
            const reachX = box.halfWidth + pb.halfWidth + gap;
            const reachY = box.halfHeight + pb.halfHeight + gap;
            const t = Math.min(
                side.x !== 0 ? reachX / Math.abs(side.x) : Infinity,
                side.y !== 0 ? reachY / Math.abs(side.y) : Infinity
            );
            return new Phaser.Math.Vector2(box.center.x + side.x * t, box.center.y + side.y * t);
        });

        const world = this.scene.physics.world.bounds;
        const free = candidates.find((c) => {
            const left = c.x - pb.halfWidth;
            const top = c.y - pb.halfHeight;
            const inWorld = left >= world.left && top >= world.top &&
                left + pb.width <= world.right && top + pb.height <= world.bottom;
            if (!inWorld) return false;
            // Solid things are immovable (obstacles, boxes, houses) or static (snowmen).
            return !this.scene.physics.overlapRect(left, top, pb.width, pb.height, true, true)
                .some((b) => b !== pb && b !== box && b.immovable);
        }) ?? candidates[0];

        return new Phaser.Math.Vector2(free.x + toSpriteX, free.y + toSpriteY);
    }

    public forceStopHiding(): void {
        if (this.isDestroyed) return;
        if (this.isPlayerHiding) {
            this.stopHiding();
        }
    }
}
