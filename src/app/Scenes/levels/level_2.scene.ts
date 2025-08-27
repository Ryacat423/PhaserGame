import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { Dog } from "../../objects/Dog";
import { GameMap } from "../../objects/GameMap";
import { ItemSystem } from "../../objects/ItemSystem";
import { Player } from "../../objects/Player";

export class Level2Scene extends Phaser.Scene {
    private player!: Player;
    private dogs: Dog[] = [];
    private gameMap!: GameMap;
    private itemSystem!: ItemSystem;
    private gameTheme!: Phaser.Sound.BaseSound;

    private isFireInvincible: boolean = false;
    private fireSprite!: Phaser.GameObjects.Sprite;
    private fireProximityZone!: Phaser.Physics.Arcade.Sprite;
    private fireCollisionZone!: Phaser.Physics.Arcade.Sprite;
    private fireCheckTimer!: Phaser.Time.TimerEvent;

    private firewoodSound!: Phaser.Sound.BaseSound;
    private catBurnedSound!: Phaser.Sound.BaseSound;
    private burnedSound!: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'level2' });
    }

    preload(): void {
        this.load.image('level2_map', 'assets/scene/levels/2/map.png');
        this.load.image('snowman', 'assets/scene/levels/2/snowman.png');

        this.load.audio('level2_theme', 'assets/global/audio/lvl-2-theme.mp3');

        this.load.audio('firewood', 'assets/global/audio/firewood.mp3');
        this.load.audio('cat_burned', 'assets/global/audio/cat_burned.mp3');
        this.load.audio('burned', 'assets/global/audio/burn.mp3');
    }

    create(): void {
        this.resetFireMechanics();

        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene');
        }
        
        if (!this.scene.isActive('Level2UI')) {
            this.scene.launch('Level2UI');
        }

        if (this.gameTheme && this.gameTheme.isPlaying) {
            this.gameTheme.stop();
        }
        
        this.gameTheme = this.sound.add('level2_theme', { loop: true }).setVolume(0.6);
        this.gameTheme.play({loop: true});

        this.firewoodSound = this.sound.add('firewood', { volume: 0.8 });
        this.catBurnedSound = this.sound.add('cat_burned', { volume: 0.7 });
        this.burnedSound = this.sound.add('burned', { volume: 0.9 });

        const background = this.add.image(0, 0, 'level2_map')
            .setOrigin(0)
            .setDepth(0);

        this.add.sprite(0,0,'snow')
            .setOrigin(0)
            .play('blow')
            .setDepth(0);

        this.add.image(0, 30, 'snowman')
            .setOrigin(0)
            .setDepth(0);

        this.add.image(850, 450, 'snowman')
            .setOrigin(0)
            .setFlipX(true)
            .setDepth(0);
        
        const house = this.physics.add
            .image(480, 500, 'dog_house')
            .setDepth(0)
            .setFlipX(true)
            .setScale(0.3)
            .setImmovable(true)
            .setSize(200, 190)
            .setOffset(120, 120);

        this.player = new Player(this, 300, 100);
        this.add.existing(this.player);

        house.body?.setAllowGravity(false);
        this.physics.add.collider(this.player, house);
        this.fireSprite = this.add.sprite(500, 150, 'fire')
            .play('sway')
            .setScale(.1);
        this.setupFireMechanics();
        
        const dog1 = new Dog(this, 200, 200, this.player, Dog.SLEEP);
        const dog2 = new Dog(this, 800, 400, this.player, Dog.ROAM);
        const dog3 = new Dog(this, 500, 500, this.player, Dog.SLEEP); 
        
        this.add.existing(dog1);
        this.add.existing(dog2);
        this.add.existing(dog3);

        this.physics.add.collider(dog1, dog2);
        this.physics.add.collider(dog1, dog3);
        this.physics.add.collider(dog2, dog3);
        
        this.dogs.push(dog1, dog2, dog3);
        this.dogs.forEach(dog => {
            this.physics.add.collider(this.player, dog, () => dog.onCollideWithPlayer());
        });

        this.gameMap = new GameMap(this, this.player);

        const levelConfig: LevelConfig = {
            playerSpawn: { x: 100, y: 100 },
            dogSpawn: { x: 200, y: 200 },
            manualObstacles: [
                { type: 'bush', x: 300, y: 150, scale: 0.1 }

            ],
            randomObstacleZones: [
                { zone: { x: 0, y: 0, width: background.width, height: 100 }, type: 'bush', count: 4, minDistance: 200 }
            ],
            boxes: [
                { x: 150, y: 300 },
                { x: 750, y: 450 },
                { x: 650, y: 150 }
            ],
            foodCount: 12, 
            mapTexture: 'level2_map',
            backgroundMusic: 'level2_theme'
        };

        this.gameMap.setup(levelConfig);
        this.gameMap.setupDogColliders(this.dogs);

        this.itemSystem = new ItemSystem(this, this.player, this.gameMap);
        
        const itemConfig: ItemSpawnConfig = {
            foodCount: 15,
            poisonCount: 6,
            minItemDistance: 70,
            minObstacleDistance: 45,
            minBoxDistance: 60,
            minPlayerDistance: 100,
            mapWidth: background.width,
            mapHeight: background.height,
            playerSpawn: { x: 100, y: 100 },
            dogSpawns: [
                { x: 200, y: 200 },
                { x: 800, y: 400 },
                { x: 400, y: 500 }
            ]
        };
        
        this.itemSystem.spawnItems(itemConfig)
        this.setupBoxEventListeners();

        const mainCam = this.cameras.main;
        mainCam.setBounds(0, 0, background.width, background.height);
        mainCam.startFollow(this.player);
        mainCam.setZoom(1.5);

        this.events.on('beforeSceneRestart', () => {
            this.cleanupBeforeRestart();
        });

        this.game.events.on('returnToWelcome', () => {
            this.cleanupBeforeExit();
            this.scene.stop('UIScene');
            this.scene.stop('Level2UI');
            this.scene.start('welcome');
        });
        
        this.events.once('shutdown', () => {
            this.cleanupBeforeExit();
        });
        this.notifyUISceneStarted();
    }

    private resetFireMechanics(): void {
        this.isFireInvincible = false;
        if (this.fireProximityZone) {
            this.fireProximityZone.destroy();
        }
        if (this.fireCollisionZone) {
            this.fireCollisionZone.destroy();
        }
        if (this.fireCheckTimer) {
            this.fireCheckTimer.destroy();
        }
    }

    private setupFireMechanics(): void {
        this.fireProximityZone = this.physics.add.sprite(500, 150, '')
            .setSize(120, 120)
            .setVisible(false);

        (this.fireProximityZone.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        this.fireCollisionZone = this.physics.add.sprite(500, 150, '')
            .setSize(40, 40)
            .setVisible(false);
        
        (this.fireCollisionZone.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        this.physics.add.overlap(this.player, this.fireProximityZone, () => {
            this.handleFireProximity(true);
        });
        this.physics.add.overlap(this.player, this.fireCollisionZone, () => {
            this.handleFireCollision();
        });
        this.fireCheckTimer = this.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.player || !this.fireSprite) return;
                
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    this.fireSprite.x, this.fireSprite.y
                );
                
                if (distance > 60) {
                    this.handleFireProximity(false);
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    private handleFireProximity(isNear: boolean): void {
        const level2UI = this.scene.get('Level2UI');
        if (level2UI && typeof (level2UI as any).setPlayerNearFire === 'function') {
            (level2UI as any).setPlayerNearFire(isNear);
            if (isNear && this.firewoodSound && !this.firewoodSound.isPlaying) {
                this.firewoodSound.play();
            }
        }
    }

    private handleFireCollision(): void {
        if (this.isFireInvincible) {
            return;
        }

        this.isFireInvincible = true;
        const level2UI = this.scene.get('Level2UI');
        if (level2UI && typeof (level2UI as any).triggerFireDamage === 'function') {
            (level2UI as any).triggerFireDamage();
        }
        if (this.burnedSound) {
            this.burnedSound.play();
        }
        this.time.delayedCall(200, () => {
            if (this.catBurnedSound) {
                this.catBurnedSound.play();
            }
        });

        this.cameras.main.shake(200, 0.01);

        const damageText = this.add.text(this.player.x, this.player.y - 30, 'OUCH!', {
            fontSize: '16px',
            color: '#ff4444',
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(10);

        this.tweens.add({
            targets: damageText,
            y: damageText.y - 40,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });

        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            yoyo: true,
            repeat: 5,
            duration: 100
        });

        this.time.delayedCall(1000, () => {
            this.isFireInvincible = false;
        });
    }

    private notifyUISceneStarted(): void {
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.scene.isActive()) {
            uiScene.events.emit('sceneStarted');
        }
        this.game.events.emit('levelStarted');
    }

    private setupBoxEventListeners(): void {
        this.events.on('playerNearBox', (isNear: boolean) => {
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.scene.isActive()) {
                uiScene.events.emit('playerNearBox', isNear);
            }
        });
        
        this.events.on('hideButtonPressed', () => {
            this.handleHideAction();
        });
    }

    private handleHideAction(): void {
        const nearbyBox = this.gameMap.getBoxes().find(box => box.getIsPlayerNearby());
        if (nearbyBox && nearbyBox.getIsPlayerHiding()) {
            nearbyBox.forceStopHiding();
        }
    }

    private cleanupBeforeRestart(): void {
        this.resetFireMechanics();
        
        this.gameMap.getBoxes().forEach(box => {
            if (typeof box.forceStopHiding === 'function') {
                box.forceStopHiding();
            }
        });
        this.dogs.forEach(dog => {
            dog.stopBark();
        });
        
        if (this.itemSystem) {
            this.itemSystem.clearAllItems();
        }
    }

    private cleanupBeforeExit(): void {
        this.resetFireMechanics();
        
        if (this.gameTheme?.isPlaying) {
            this.gameTheme.stop();
        }
        if (this.gameTheme) {
            this.gameTheme.destroy();
        }
        if (this.firewoodSound) {
            this.firewoodSound.stop();
            this.firewoodSound.destroy();
        }
        if (this.catBurnedSound) {
            this.catBurnedSound.stop();
            this.catBurnedSound.destroy();
        }
        if (this.burnedSound) {
            this.burnedSound.stop();
            this.burnedSound.destroy();
        }
        
        this.dogs.forEach(dog => {
            dog.stopBark();
        });
        this.tweens.getTweens().forEach(tween => tween.stop());
        
        if (this.itemSystem) {
            this.itemSystem.clearAllItems();
        }
        
        this.gameMap.getBoxes().forEach(box => {
            if (typeof box.forceStopHiding === 'function') {
                box.forceStopHiding();
            }
        });
        
        this.children.removeAll();
        this.sound.stopAll();
    }

    public getDogs(): Dog[] {
        return this.dogs;
    }
    
    public destroyDogs(): void {
        this.dogs.forEach(dog => dog.destroy());
        this.dogs = [];
    }

    public getItemSystem(): ItemSystem {
        return this.itemSystem;
    }

    override update(time: number, delta: number): void {
        this.player.update(time, delta);
        this.dogs.forEach(dog => dog.update(time, delta));
        this.gameMap.update();
    }
}