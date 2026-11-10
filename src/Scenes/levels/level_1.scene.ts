import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { Dog, DogState } from "../../objects/Dog";
import { BaseLevel } from "./base_level";

export class Level1Scene extends BaseLevel {
    private isLevelCompleted: boolean = false;

    constructor() {
        super('level1');
    }

    protected override preloadLevelAssets(): void {
        this.load.audio('level1_theme', 'assets/global/audio/gameplay.mp3');
    }

    protected getThemeAudioKey(): string {
        return 'level1_theme';
    }

    protected override getThemeAudioPath(): string {
        return 'assets/global/audio/gameplay.mp3';
    }

    protected getBackgroundTextureKey(): string {
        return 'level1_map';
    }

    protected getPlayerSpawnPosition(): { x: number, y: number } {
        return { x: 180, y: 120 };
    }

    protected getDogSpawnPositions(): { x: number, y: number, behavior: DogState }[] {
        return [
            { x: 250, y: 340, behavior: Dog.SLEEP },  
            { x: 500, y: 200, behavior: Dog.ROAM },  
            { x: 750, y: 350, behavior: Dog.SLEEP },
            { x: 600, y: 450, behavior: Dog.ROAM },  
            { x: 350, y: 500, behavior: Dog.SLEEP } 
        ];
    }

    protected override createLevelSpecificElements(): void {
        this.game.events.on('levelCompleted', () => {
            this.isLevelCompleted = true;
        });
    }

    protected override createStaticElements(): void {
        this.createHouse(220, 320, true, 0.3);
    }

    protected getLevelConfig(backgroundWidth: number, backgroundHeight: number): LevelConfig {
        return {
            playerSpawn: { x: 180, y: 120 },
            dogSpawn: { x: 250, y: 300 },
            manualObstacles: [
                { type: 'tree', x: 120, y: 55, scale: 0.18 },
                { type: 'tree', x: 380, y: 65, scale: 0.2 },
                { type: 'tree', x: 640, y: 60, scale: 0.19 },
                { type: 'tree', x: 880, y: 70, scale: 0.2 },
      
                { type: 'bushsnow', x: 400, y: 280, scale: 0.15 },
                { type: 'tree', x: 550, y: 320, scale: 0.18 },
                { type: 'bushsnow', x: 700, y: 240, scale: 0.15 },
                
                { type: 'tree', x: 200, y: 480, scale: 0.19 },
                { type: 'bushsnow', x: 450, y: 520, scale: 0.15 },
                { type: 'tree', x: 750, y: 500, scale: 0.18 }
            ],
            randomObstacleZones: [
                { zone: { x: 0, y: backgroundHeight - 80, width: backgroundWidth, height: 80 }, 
                  type: 'bushsnow', count: 6, minDistance: 100 }
            ],
            boxes: [ 
                { x: 620, y: 280 }, 
                { x: 850, y: 450 },   
                { x: 450, y: 380 }  
            ],
            foodCount: 5,
            mapTexture: 'level1_map',
            backgroundMusic: 'level1_theme'
        };
    }

    protected getItemConfig(backgroundWidth: number, backgroundHeight: number): ItemSpawnConfig {
        return {
            foodCount: 5,         
            poisonCount: 5,      
            minItemDistance: 80,   
            minObstacleDistance: 45,
            minBoxDistance: 70,
            minPlayerDistance: 120, 
            mapWidth: backgroundWidth,
            mapHeight: backgroundHeight,
            playerSpawn: { x: 180, y: 120 },
            dogSpawns: [
                { x: 250, y: 300 },
                { x: 500, y: 200 },
                { x: 750, y: 350 },
                { x: 600, y: 450 },
                { x: 350, y: 500 }
            ]
        };
    }

    protected override cleanupLevelSpecific(): void {
        this.isLevelCompleted = false;
    }
}