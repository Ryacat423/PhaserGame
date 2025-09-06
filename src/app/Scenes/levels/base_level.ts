import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { Dog, DogState } from "../../objects/Dog";
import { GameMap } from "../../objects/GameMap";
import { ItemSystem } from "../../objects/ItemSystem";
import { Player } from "../../objects/Player";

export abstract class BaseLevel extends Phaser.Scene {
    protected player!: Player;
    protected dogs: Dog[] = [];
    protected gameMap!: GameMap;
    protected itemSystem!: ItemSystem;
    protected gameTheme!: Phaser.Sound.BaseSound;
    protected background!: Phaser.GameObjects.Image;

    constructor(key: string) {
        super({ key });
    }

    protected abstract getThemeAudioKey(): string;
    protected abstract getLevelConfig(backgroundWidth: number, backgroundHeight: number): LevelConfig;
    protected abstract getItemConfig(backgroundWidth: number, backgroundHeight: number): ItemSpawnConfig;
    protected abstract getBackgroundTextureKey(): string;
    protected abstract getPlayerSpawnPosition(): { x: number, y: number };
    protected abstract getDogSpawnPositions(): { x: number, y: number, behavior: DogState }[];

    
    protected createStaticElements(): void {}
    
    protected preloadLevelAssets(): void {}
    
    protected createLevelSpecificElements(): void {}
    
    protected setupLevelSpecificUI(): void {}
    
    protected cleanupLevelSpecific(): void {}
    
    protected getLevelSpecificUIScenes(): string[] { return []; }
    
    protected updateLevelSpecific(time: number, delta: number): void {}

    preload(): void {
        this.load.audio(this.getThemeAudioKey(), this.getThemeAudioPath());
        this.preloadLevelAssets();
    }

    create(): void {
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
        
        this.gameTheme = this.sound.add(this.getThemeAudioKey(), { 
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
        });
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

    private setupCamera(): void {
        const mainCam = this.cameras.main;
        mainCam.setBounds(0, 0, this.background.width, this.background.height);
        mainCam.startFollow(this.player);
        mainCam.setZoom(1.5);
    }

    private setupEventListeners(): void {
        this.setupBoxEventListeners();
        this.setupSceneEventListeners();
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

    private setupSceneEventListeners(): void {
        this.events.on('beforeSceneRestart', () => {
            this.cleanupBeforeRestart();
        });

        this.game.events.on('returnToWelcome', () => {
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
        if (nearbyBox && nearbyBox.getIsPlayerHiding()) {
            nearbyBox.forceStopHiding();
        }
    }

    private notifyUISceneStarted(): void {
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.scene.isActive()) {
            uiScene.events.emit('sceneStarted');
        }
        this.game.events.emit('levelStarted');
    }

    private cleanupBeforeRestart(): void {
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
        return `assets/global/audio/${this.getThemeAudioKey()}.ogg`;
    }

    protected createHouse(x: number, y: number, flipX: boolean = false, scale: number = 0.3): Phaser.Physics.Arcade.Image {
        const house = this.physics.add
            .image(x, y, 'dog_house')
            .setDepth(0)
            .setFlipX(flipX)
            .setScale(scale)
            .setImmovable(true)
            .setSize(200, 190)
            .setOffset(120, 120);
        
        house.body?.setAllowGravity(false);
        this.physics.add.collider(this.player, house);
        
        return house;
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