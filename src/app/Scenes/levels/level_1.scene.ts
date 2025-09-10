import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { Dog, DogState } from "../../objects/Dog";
import { BaseLevel } from "./base_level";

export class Level1Scene extends BaseLevel {
    constructor() {
        super('level1');
    }

    protected override preloadLevelAssets(): void {
        this.load.audio('level1_theme', 'assets/global/audio/gameplay.ogg');
    }

    protected getThemeAudioKey(): string {
        return 'level1_theme';
    }

    protected override getThemeAudioPath(): string {
        return 'assets/global/audio/gameplay.ogg';
    }

    protected getBackgroundTextureKey(): string {
        return 'level1_map';
    }

    protected getPlayerSpawnPosition(): { x: number, y: number } {
        return { x: 300, y: 100 };
    }

    protected getDogSpawnPositions(): { x: number, y: number, behavior: DogState }[] {
        return [
            { x: 200, y: 200, behavior: Dog.SLEEP },
            { x: 800, y: 400, behavior: Dog.ROAM },
            { x: 500, y: 500, behavior: Dog.SLEEP }
        ];
    }

    protected override createStaticElements(): void {
        this.createHouse(180, 200, true, 0.3);
    }

    protected getLevelConfig(backgroundWidth: number, backgroundHeight: number): LevelConfig {
        return {
            playerSpawn: { x: 100, y: 100 },
            dogSpawn: { x: 200, y: 200 },
            manualObstacles: [
                { type: 'tree', x: 300, y: 150, scale: 0.2 },
                { type: 'tree', x: 500, y: 250, scale: 0.15 },
                { type: 'bush', x: 700, y: 150, scale: 0.20 },
            ],
            randomObstacleZones: [
                { zone: { x: 0, y: 0, width: backgroundWidth, height: 100 }, type: 'tree', count: 8, minDistance: 60 },
                { zone: { x: 0, y: backgroundHeight - 100, width: backgroundWidth, height: 100 }, type: 'bush', count: 8, minDistance: 60 },
            ],
            boxes: [
                { x: 150, y: 300 },
                { x: 450, y: 200 },
                { x: 750, y: 350 },
                { x: 650, y: 150 }
            ],
            foodCount: 12,
            mapTexture: 'level1_map',
            backgroundMusic: 'level1_theme'
        };
    }

    protected getItemConfig(backgroundWidth: number, backgroundHeight: number): ItemSpawnConfig {
        return {
            foodCount: 10,
            poisonCount: 6,
            minItemDistance: 70,
            minObstacleDistance: 45,
            minBoxDistance: 70,
            minPlayerDistance: 100,
            mapWidth: backgroundWidth,
            mapHeight: backgroundHeight,
            playerSpawn: { x: 100, y: 100 },
            dogSpawns: [
                { x: 200, y: 200 },
                { x: 800, y: 400 },
                { x: 400, y: 500 }
            ]
        };
    }
}