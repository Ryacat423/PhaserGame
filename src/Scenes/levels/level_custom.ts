import { storage } from '../../utils/storage';
import { LevelConfiguration } from "../../components/config/level.config";
import { Mechanics } from "../../components/config/mechanic.config";
import { ItemSpawnConfig } from "../../interfaces/game.interfaces";
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
        const staticElementsMap = {
            'level1_map': () => this.createHouse(180, 200, true, 0.3),
            'level2_map': () => this.createHouse(480, 500, true, 0.3),
            'level3_map': () => {}
        };
        
        const createElements = staticElementsMap[this.customConfig.map as keyof typeof staticElementsMap];
        if (createElements) {
            createElements();
        }
    }

    protected getLevelConfig(backgroundWidth: number, backgroundHeight: number): any {
        return LevelConfiguration.createLevelConfig(this.customConfig, backgroundWidth, backgroundHeight);
    }

    protected override getItemConfig(backgroundWidth: number, backgroundHeight: number): ItemSpawnConfig {
        const dogSpawns = this.getDogSpawnPositions();
        
        const config: ItemSpawnConfig = {
            foodCount: this.customConfig.spawnables.foods,
            poisonCount: this.customConfig.spawnables.poison,
            minItemDistance: 70,
            minObstacleDistance: 45,
            minBoxDistance: 70,
            minPlayerDistance: 100,
            mapWidth: backgroundWidth,
            mapHeight: backgroundHeight,
            playerSpawn: this.getPlayerSpawnPosition(),
            dogSpawns: dogSpawns.map(spawn => ({ x: spawn.x, y: spawn.y }))
        };
        
        if (this.hasMechanic('night') && this.customConfig.spawnables.batteries) {
            config.batteryCount = this.customConfig.spawnables.batteries;
            console.log(`🔋 Spawning ${config.batteryCount} batteries (night mode)`);
        }
        
        return config;
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