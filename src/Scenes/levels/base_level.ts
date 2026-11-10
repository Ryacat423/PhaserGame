import Phaser from 'phaser';
import { groundDepth, sortOnce } from '../../utils/depth';
import { attachTouchControls } from '../../components/ui/TouchControls';
import { onGameEvent, onSceneEvent } from '../../utils/events';
import { addSceneSound } from '../../utils/sound';
import { UIManager } from '../../components/ui/UIManager';
import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { LevelLayout } from "../../config/layouts";
import { Dog, DogState } from "../../objects/Dog";
import { GameMap } from "../../objects/GameMap";
import { ItemSystem } from "../../objects/ItemSystem";
import { Player } from "../../objects/Player";

export abstract class BaseLevel extends Phaser.Scene {
    protected player!: Player;
    protected dogs: Dog[] = [];
    private solids: Phaser.Types.Physics.Arcade.ArcadeColliderType[] = [];
    protected gameMap!: GameMap;
    protected itemSystem!: ItemSystem;
    protected gameTheme!: Phaser.Sound.BaseSound;
    protected background!: Phaser.GameObjects.Image;

    constructor(key: string = 'level-custom') {
        super({ key });
    }

    protected abstract getThemeAudioKey(): string;
    protected abstract getBackgroundTextureKey(): string;

    /**
     * The level's hand-placed layout (src/config/layouts.ts). The adventure levels provide one and
     * everything below is built from it; custom levels generate their own and override the
     * get*Config / spawn methods instead.
     */
    protected getLayout(): LevelLayout | null {
        return null;
    }

    private requireLayout(): LevelLayout {
        const layout = this.getLayout();
        if (!layout) throw new Error(`${this.scene.key} needs getLayout() or its own spawn/config overrides`);
        return layout;
    }

    protected getPlayerSpawnPosition(): { x: number, y: number } {
        return this.requireLayout().player;
    }

    protected getDogSpawnPositions(): { x: number, y: number, behavior: DogState }[] {
        return this.requireLayout().dogs.map(d => ({ x: d.x, y: d.y, behavior: d.behavior === 'SLEEP' ? Dog.SLEEP : Dog.ROAM }));
    }

    protected getLevelConfig(_backgroundWidth: number, _backgroundHeight: number): LevelConfig {
        const layout = this.requireLayout();
        return {
            playerSpawn: layout.player,
            dogSpawn: layout.dogs[0] ?? layout.player,
            manualObstacles: layout.obstacles.map(o => ({ ...o, rotation: 0 })),
            randomObstacleZones: [],
            boxes: layout.boxes,
            foodCount: layout.food.length,
            mapTexture: this.getBackgroundTextureKey()
        };
    }

    protected getItemConfig(backgroundWidth: number, backgroundHeight: number): ItemSpawnConfig {
        const layout = this.requireLayout();
        return {
            foodCount: layout.food.length,
            poisonCount: layout.poison.length,
            batteryCount: layout.batteries?.length ?? 0,
            foodPositions: layout.food,
            poisonPositions: layout.poison,
            batteryPositions: layout.batteries,
            minItemDistance: 0,
            minObstacleDistance: 0,
            minBoxDistance: 0,
            minPlayerDistance: 0,
            mapWidth: backgroundWidth,
            mapHeight: backgroundHeight,
            playerSpawn: layout.player,
            dogSpawns: layout.dogs
        };
    }

    protected createStaticElements(): void {
        const house = this.getLayout()?.house;
        if (house) this.createHouse(house.x, house.y, house.flip ?? false);
    }
    
    protected preloadLevelAssets(): void {}
    
    protected createLevelSpecificElements(): void {}
    
    protected setupLevelSpecificUI(): void {}
    
    protected cleanupLevelSpecific(): void {}
    
    protected getLevelSpecificUIScenes(): string[] { return []; }
    
    protected updateLevelSpecific(time: number, delta: number): void {}

    preload(): void {
        UIManager.preloadGameplayAssets(this);
        this.load.audio(this.getThemeAudioKey(), this.getThemeAudioPath());
        this.preloadLevelAssets();
    }

    create(): void {
        // Phaser reuses the scene object on restart, so per-run lists are reset here. Without
        // this, every restart kept the previous run's destroyed dogs (and their colliders).
        this.solids = [];
        this.dogs = [];
        UIManager.createAnimations(this);
        this.setupUI();
        this.setupAudio();
        this.createBackground();
        this.createPlayer();
        this.createStaticElements();
        this.createDogs();
        this.setupGameMap();
        this.setupItemSystem();
        this.createLevelSpecificElements();
        this.setupCamera();
        this.setupEventListeners();
        this.setupLevelSpecificUI();
        this.notifyUISceneStarted();
    }

    private setupUI(): void {
        if (!this.scene.isActive('UIScene')) {
            this.scene.launch('UIScene');
        }
        attachTouchControls(this);

        this.getLevelSpecificUIScenes().forEach(sceneKey => {
            if (!this.scene.isActive(sceneKey)) {
                this.scene.launch(sceneKey);
            }
        });
    }

    private setupAudio(): void {
        if (this.gameTheme && this.gameTheme.isPlaying) {
            this.gameTheme.stop();
        }
        
        this.gameTheme = addSceneSound(this, this.getThemeAudioKey(), { 
            loop: true 
        }).setVolume(this.getThemeVolume());
        this.gameTheme.play({ loop: true });
    }

    private createBackground(): void {
        this.background = this.add.image(0, 0, this.getBackgroundTextureKey())
            .setOrigin(0)
            .setDepth(0);
    }

    private createPlayer(): void {
        const spawn = this.getPlayerSpawnPosition();
        this.player = new Player(this, spawn.x, spawn.y);
        this.add.existing(this.player);
    }

    private createDogs(): void {
        const dogSpawns = this.getDogSpawnPositions();
        
        dogSpawns.forEach(spawn => {
            const dog = new Dog(this, spawn.x, spawn.y, this.player, spawn.behavior);
            this.add.existing(dog);
            this.dogs.push(dog);
        });
        for (let i = 0; i < this.dogs.length; i++) {
            for (let j = i + 1; j < this.dogs.length; j++) {
                this.physics.add.collider(this.dogs[i], this.dogs[j]);
            }
        }
        this.dogs.forEach(dog => {
            this.physics.add.collider(this.player, dog, () => dog.onCollideWithPlayer());
            this.solids.forEach(solid => this.physics.add.collider(dog, solid));
        });
    }

    /** Makes `obj` block the cat and every dog. Safe to call before or after the dogs exist. */
    public addSolid(obj: Phaser.Types.Physics.Arcade.ArcadeColliderType): void {
        this.solids.push(obj);
        this.physics.add.collider(this.player, obj);
        this.dogs.forEach(dog => this.physics.add.collider(dog, obj));
    }

    /**
     * A snowman or other prop whose bottom part is solid. `origin` matches how the image is
     * placed; `foot` is the solid part as fractions of the texture [left, top, width, height].
     */
    public addSolidProp(image: Phaser.GameObjects.Image, foot: [number, number, number, number]): void {
        const b = image.getBounds();
        const body = this.physics.add.staticBody(
            b.x + b.width * foot[0], b.y + b.height * foot[1], b.width * foot[2], b.height * foot[3]
        );
        image.setDepth(groundDepth(body.bottom));
        this.addSolid(body as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType);
    }

    private setupGameMap(): void {
        this.gameMap = new GameMap(this, this.player);
        const levelConfig = this.getLevelConfig(this.background.width, this.background.height);
        this.gameMap.setup(levelConfig);
        this.gameMap.setupDogColliders(this.dogs);
    }

    private setupItemSystem(): void {
        this.itemSystem = new ItemSystem(this, this.player, this.gameMap);
        const itemConfig = this.getItemConfig(this.background.width, this.background.height);
        this.itemSystem.spawnItems(itemConfig);
    }

    protected setupCamera(): void {
        const mainCam = this.cameras.main;
        mainCam.setBounds(0, 0, this.background.width, this.background.height);
        // ?overview shows the whole map, for designing layouts.
        if (import.meta.env.DEV && new URLSearchParams(location.search).has('overview')) {
            mainCam.setZoom(1).centerOn(this.background.width / 2, this.background.height / 2);
            return;
        }
        mainCam.startFollow(this.player);
        mainCam.setZoom(1.5);
    }

    private setupEventListeners(): void {
        this.setupBoxEventListeners();
        this.setupSceneEventListeners();
    }

    private setupBoxEventListeners(): void {
        onSceneEvent(this, 'playerNearBox', (isNear: boolean) => {
            const uiScene = this.scene.get('UIScene');
            if (uiScene && uiScene.scene.isActive()) {
                uiScene.events.emit('playerNearBox', isNear);
            }
        });
        
        onSceneEvent(this, 'hideButtonPressed', () => {
            this.handleHideAction();
        });
    }

    private setupSceneEventListeners(): void {
        onSceneEvent(this, 'beforeSceneRestart', () => {
            this.cleanupBeforeRestart();
        });

        onGameEvent(this, 'returnToWelcome', () => {
            this.cleanupBeforeExit();
            this.stopLevelSpecificUIScenes();
            this.scene.stop('UIScene');
            this.scene.start('welcome');
        });
        
        this.events.once('shutdown', () => {
            this.cleanupBeforeExit();
        });
    }

    private handleHideAction(): void {
        const nearbyBox = this.gameMap.getBoxes().find(box => box.getIsPlayerNearby());
        nearbyBox?.toggleHiding();
    }

    private notifyUISceneStarted(): void {
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.scene.isActive()) {
            uiScene.events.emit('sceneStarted');
        }
        this.game.events.emit('levelStarted');
    }

    private cleanupBeforeRestart(): void {
        this.stopAllDogBarking();
        this.gameMap?.getBoxes()?.forEach(box => {
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

        this.cleanupLevelSpecific();
    }

    protected cleanupBeforeExit(): void {
        this.stopAllDogBarking();
        if (this.gameTheme?.isPlaying) {
            this.gameTheme.stop();
        }
        if (this.gameTheme) {
            this.gameTheme.destroy();
        }
        
        this.dogs.forEach(dog => {
            dog.stopBark();
        });
        this.tweens.getTweens().forEach(tween => tween.stop());
        
        if (this.itemSystem) {
            this.itemSystem.clearAllItems();
        }
        
        this.gameMap?.getBoxes()?.forEach(box => {
            if (typeof box.forceStopHiding === 'function') {
                box.forceStopHiding();
            }
        });

        this.cleanupLevelSpecific();
        this.children.removeAll();
        this.sound.stopAll();
    }

    private stopLevelSpecificUIScenes(): void {
        this.getLevelSpecificUIScenes().forEach(sceneKey => {
            this.scene.stop(sceneKey);
        });
    }

    protected getThemeVolume(): number {
        return 0.8;
    }

    protected getThemeAudioPath(): string {
        return `assets/global/audio/${this.getThemeAudioKey()}.mp3`;
    }

    protected createHouse(x: number, y: number, flipX: boolean = false, scale: number = 0.3): Phaser.Physics.Arcade.Image {
        // Footprint of the 435x391 texture: the walls and doorway, not the roof.
        const house = this.physics.add
            .image(x, y, 'dog_house')
            .setFlipX(flipX)
            .setScale(scale)
            .setImmovable(true)
            .setSize(300, 120)
            .setOffset(flipX ? 63 : 72, 195);

        house.body?.setAllowGravity(false);
        sortOnce(house);
        this.addSolid(house);

        return house;
    }

    public isPlayerCold(): boolean {
        return this.player.getIsCold();
    }

    public getDogs(): Dog[] {
        return this.dogs;
    }

    protected stopAllDogBarking(): void {
        this.dogs.forEach(dog => {
            if (dog && typeof dog.stopBark === 'function') {
                dog.stopBark();
            }
        });
    }
    
    public destroyDogs(): void {
        this.dogs.forEach(dog => dog.destroy());
        this.dogs = [];
    }

    public getItemSystem(): ItemSystem {
        return this.itemSystem;
    }

    public getPlayer(): Player {
        return this.player;
    }

    override update(time: number, delta: number): void {
        if (this.player && this.player.active) {
            this.player.update(time, delta);
        }

        this.dogs.forEach(dog => {
            if (dog && dog.active) {
                dog.update(time, delta);
            }
        });

        if (this.gameMap) {
            this.gameMap.update();
        }

        this.updateLevelSpecific(time, delta);
    }
}