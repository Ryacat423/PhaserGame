import { CUSTOM_BASE, customItemSpots, customObstacles } from '../../config/layouts';
import { storage } from '../../utils/storage';
import { Mechanics } from "../../components/config/mechanic.config";
import { ItemSpawnConfig, LevelConfig } from "../../interfaces/game.interfaces";
import { Dog, DogState } from "../../objects/Dog";
import { BaseLevel } from "./base_level";

export class LevelCustom extends BaseLevel {
    private customConfig: any;
    private activeMechanicsInstances: Array<{type: string, instance: any}> = [];
    private activeMechanicsTypes: string[] = [];
    private primaryMechanicType: string = 'none';

    constructor() {
        super('level-custom');
    }

    init(data: any): void {
        if (data && data.map && data.mechanics && data.spawnables) {
            this.customConfig = data;
        } else if (data && data.config) {
            this.customConfig = data.config;
        } else {
            const savedConfig = storage.getItem('customLevelConfig');
            if (savedConfig) {
                try {
                    this.customConfig = JSON.parse(savedConfig);
                } catch (e) {
                    this.customConfig = this.getDefaultConfig();
                }
            } else {
                console.warn('⚠ No custom config found, using defaults');
                this.customConfig = this.getDefaultConfig();
            }
        }

        this.activeMechanicsTypes = Object.keys(this.customConfig.mechanics)
            .filter(key => this.customConfig.mechanics[key] && key !== 'none');

        this.primaryMechanicType = this.activeMechanicsTypes.length > 0 
            ? this.activeMechanicsTypes[0] 
            : 'none';
        
        console.log('📋 Config loaded:', {
            map: this.customConfig.map,
            mechanics: this.activeMechanicsTypes,
            primary: this.primaryMechanicType,
            spawnables: this.customConfig.spawnables
        });
    }

    private getDefaultConfig(): any {
        return {
            map: 'level1_map',
            mechanics: { 
                snow: false, 
                night: false, 
                lightning: false,
                none: true 
            },
            spawnables: { 
                foods: 10, 
                poison: 5, 
                dog: 3,
                batteries: 0
            }
        };
    }

    protected override preloadLevelAssets(): void {
        const themeConfig = Mechanics.getThemeConfig(this.primaryMechanicType);
        this.load.audio(themeConfig.audioKey, themeConfig.audioPath);
        
        this.activeMechanicsTypes.forEach(mechanicType => {
            const tempMechanics = Mechanics.createMechanics(mechanicType, this, null);
            tempMechanics?.preload();
        });
    }

    protected getThemeAudioKey(): string {
        return Mechanics.getThemeConfig(this.primaryMechanicType).audioKey;
    }

    protected override getThemeAudioPath(): string {
        return Mechanics.getThemeConfig(this.primaryMechanicType).audioPath;
    }

    protected override getThemeVolume(): number {
        return Mechanics.getThemeConfig(this.primaryMechanicType).volume;
    }

    protected getBackgroundTextureKey(): string {
        return this.customConfig.map;
    }

    protected override getPlayerSpawnPosition(): { x: number, y: number } {
        return CUSTOM_BASE.player;
    }

    protected override getDogSpawnPositions(): { x: number, y: number, behavior: DogState }[] {
        return CUSTOM_BASE.dogs
            .slice(0, this.customConfig.spawnables.dog)
            .map(d => ({ x: d.x, y: d.y, behavior: d.behavior === 'SLEEP' ? Dog.SLEEP : Dog.ROAM }));
    }

    protected override getLevelSpecificUIScenes(): string[] {
        const uiScenes: string[] = [];
        
        this.activeMechanicsTypes.forEach(mechanicType => {
            const config = Mechanics.getThemeConfig(mechanicType);
            uiScenes.push(...config.uiScenes);
        });
        
        return uiScenes;
    }

    protected override createLevelSpecificElements(): void {
        if (this.activeMechanicsTypes.length === 0) {
            return;
        }
          
        this.activeMechanicsTypes.forEach(mechanicType => {
            try {
                const mechanic = Mechanics.createMechanics(
                    mechanicType, 
                    this, 
                    this.player, 
                    this.background
                );
                
                if (mechanic) {
                    mechanic.create();
                    this.activeMechanicsInstances.push({
                        type: mechanicType,
                        instance: mechanic
                    });
                } else {
                    console.warn(`⚠ Failed to create ${mechanicType} mechanic`);
                }
            } catch (error) {
                console.error(`✗ Error creating ${mechanicType} mechanic:`, error);
            }
        });
    }

    protected override createStaticElements(): void {
        if (this.customConfig.map !== 'level3_map') {
            const { x, y, flip } = CUSTOM_BASE.house;
            this.createHouse(x, y, flip);
        }
    }

    protected override getLevelConfig(_backgroundWidth: number, _backgroundHeight: number): LevelConfig {
        return {
            playerSpawn: CUSTOM_BASE.player,
            dogSpawn: CUSTOM_BASE.dogs[0],
            manualObstacles: customObstacles(this.customConfig.map).map(o => ({ ...o, rotation: 0 })),
            randomObstacleZones: [],
            boxes: CUSTOM_BASE.boxes,
            foodCount: this.customConfig.spawnables.foods,
            mapTexture: this.customConfig.map
        };
    }

    /**
     * Item spots come from a designed list for the map, used in order: food first, then poison,
     * then batteries. Counts beyond the list fall back to spaced-out random placement.
     */
    protected override getItemConfig(backgroundWidth: number, backgroundHeight: number): ItemSpawnConfig {
        const { foods, poison, batteries } = this.customConfig.spawnables;
        const batteryCount = this.hasMechanic('night') ? (batteries ?? 0) : 0;
        const spots = customItemSpots(this.customConfig.map, this.hasMechanic('snow'));
        const take = (from: number, count: number) => spots.slice(from, from + count);

        return {
            foodCount: foods,
            poisonCount: poison,
            batteryCount,
            foodPositions: take(0, foods),
            poisonPositions: take(foods, poison),
            batteryPositions: take(foods + poison, batteryCount),
            minItemDistance: 70,
            minObstacleDistance: 45,
            minBoxDistance: 70,
            minPlayerDistance: 100,
            mapWidth: backgroundWidth,
            mapHeight: backgroundHeight,
            playerSpawn: this.getPlayerSpawnPosition(),
            dogSpawns: this.getDogSpawnPositions().map(spawn => ({ x: spawn.x, y: spawn.y }))
        };
    }

    protected override cleanupLevelSpecific(): void {
        console.log('🧹 Cleaning up mechanics...');
        this.activeMechanicsInstances.forEach(item => {
            try {
                item.instance?.destroy();
                console.log(`✓ Destroyed ${item.type} mechanic`);
            } catch (error) {
                console.error(`✗ Error destroying ${item.type} mechanic:`, error);
            }
        });
        this.activeMechanicsInstances = [];
    }

    protected override cleanupBeforeExit(): void {
        super.cleanupBeforeExit();
        this.activeMechanicsInstances.forEach(item => {
            item.instance?.destroy();
        });
        this.activeMechanicsInstances = [];
    }

    protected override updateLevelSpecific(time: number, delta: number): void {
        this.activeMechanicsInstances.forEach(item => {
            try {
                item.instance?.update?.(time, delta);
            } catch (error) {
                console.error(`Error updating ${item.type} mechanic:`, error);
            }
        });
    }

    public getCurrentBattery(): number {
        const nightMechanic = this.activeMechanicsInstances.find(
            item => item.type === 'night'
        );
        return nightMechanic?.instance?.getCurrentBattery?.() || 0;
    }

    public getMaxBattery(): number {
        const nightMechanic = this.activeMechanicsInstances.find(
            item => item.type === 'night'
        );
        return nightMechanic?.instance?.getMaxBattery?.() || 100;
    }

    public hasMechanic(mechanicType: string): boolean {
        return this.activeMechanicsTypes.includes(mechanicType);
    }

    public getActiveMechanics(): string[] {
        return [...this.activeMechanicsTypes];
    }

    public getCustomConfig(): any {
        return this.customConfig;
    }

    public getMechanicsType(): string {
        return this.primaryMechanicType;
    }
}