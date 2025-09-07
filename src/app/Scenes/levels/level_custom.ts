import { LevelConfiguration } from "../../components/config/level.config";
import { Mechanics } from "../../components/config/mechanic.config";
import { ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { Dog, DogState } from "../../objects/Dog";
import { BaseLevel } from "./base_level";

export class LevelCustom extends BaseLevel {
    private customConfig: any;
    private activeMechanics: any = null;
    private mechanicsType: string = 'none';

    constructor() {
        super('level-custom');
        this.loadCustomConfig();
    }

    private loadCustomConfig(): void {
        const savedConfig = localStorage.getItem('lvl');
        if (savedConfig) {
            this.customConfig = JSON.parse(savedConfig);
        } else {
            this.customConfig = {
                map: 'level1_map',
                mechanics: { snow: false, night: false, none: true },
                spawnables: { foods: 10, poison: 5, dog: 3 }
            };
        }

        this.mechanicsType = Object.keys(this.customConfig.mechanics)
            .find(key => this.customConfig.mechanics[key]) || 'none';
    }

    protected override preloadLevelAssets(): void {
        const themeConfig = Mechanics.getThemeConfig(this.mechanicsType);
        this.load.audio(themeConfig.audioKey, themeConfig.audioPath);
        
        if (this.mechanicsType !== 'none') {
            const tempMechanics = Mechanics.createMechanics(this.mechanicsType, this, null);
            tempMechanics?.preload();
        }
    }

    protected getThemeAudioKey(): string {
        return Mechanics.getThemeConfig(this.mechanicsType).audioKey;
    }

    protected override getThemeAudioPath(): string {
        return Mechanics.getThemeConfig(this.mechanicsType).audioPath;
    }

    protected override getThemeVolume(): number {
        return Mechanics.getThemeConfig(this.mechanicsType).volume;
    }

    protected getBackgroundTextureKey(): string {
        return this.customConfig.map;
    }

    protected getPlayerSpawnPosition(): { x: number, y: number } {
        return { x: 300, y: 100 };
    }

    protected getDogSpawnPositions(): { x: number, y: number, behavior: DogState }[] {
        const spawns = LevelConfiguration.generateDogSpawns(this.customConfig.spawnables.dog);
        return spawns.map(spawn => ({
            x: spawn.x,
            y: spawn.y,
            behavior: spawn.behavior === 'SLEEP' ? Dog.SLEEP : Dog.ROAM
        }));
    }

    protected override getLevelSpecificUIScenes(): string[] {
        return Mechanics.getThemeConfig(this.mechanicsType).uiScenes;
    }

    protected override createLevelSpecificElements(): void {
        if (this.mechanicsType !== 'none') {
            this.activeMechanics = Mechanics.createMechanics(
                this.mechanicsType, 
                this, 
                this.player, 
                this.background
            );
            this.activeMechanics?.create();
        }
    }

    protected override createStaticElements(): void {
        const staticElementsMap = {
            'level1_map': () => this.createHouse(180, 200, true, 0.3),
            'level2_map': () => this.createHouse(480, 500, true, 0.3),
            'level3_map': () => {}
        };
        
        const createElements = staticElementsMap[this.customConfig.map as keyof typeof staticElementsMap];
        createElements?.();
    }

    protected getLevelConfig(backgroundWidth: number, backgroundHeight: number): any {
        return LevelConfiguration.createLevelConfig(this.customConfig, backgroundWidth, backgroundHeight);
    }

    protected getItemConfig(backgroundWidth: number, backgroundHeight: number): ItemSpawnConfig {
        const dogSpawns = this.getDogSpawnPositions();
        return LevelConfiguration.createItemConfig(this.customConfig, backgroundWidth, backgroundHeight, dogSpawns);
    }

    protected override cleanupLevelSpecific(): void {
        this.activeMechanics?.destroy();
        this.activeMechanics = null;
    }

    protected override cleanupBeforeExit(): void {
        super.cleanupBeforeExit();
        this.activeMechanics?.destroy();
        this.activeMechanics = null;
    }

    protected override updateLevelSpecific(time: number, delta: number): void {
        this.activeMechanics?.update?.(time, delta);
    }

    public getCurrentBattery(): number {
        return this.activeMechanics?.getCurrentBattery?.() || 0;
    }

    public getMaxBattery(): number {
        return this.activeMechanics?.getMaxBattery?.() || 100;
    }

    public getCustomConfig(): any {
        return this.customConfig;
    }

    public getMechanicsType(): string {
        return this.mechanicsType;
    }
}