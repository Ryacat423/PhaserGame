// Create this file as: components/config/level.config.ts

import { LevelConfig, ItemSpawnConfig } from "../../interfaces/game.interfaces";
import { DogState } from "../../objects/Dog";

export class LevelConfiguration {
    /**
     * Generate random dog spawn positions based on count
     */
    static generateDogSpawns(count: number): Array<{ x: number, y: number, behavior: 'SLEEP' | 'ROAM' }> {
        const spawns: Array<{ x: number, y: number, behavior: 'SLEEP' | 'ROAM' }> = [];
        const behaviors: Array<'SLEEP' | 'ROAM'> = ['SLEEP', 'ROAM'];
        
        // Predefined spawn areas to avoid clustering
        const spawnAreas = [
            { x: 200, y: 200 },
            { x: 800, y: 400 },
            { x: 500, y: 500 },
            { x: 300, y: 400 },
            { x: 700, y: 200 },
            { x: 400, y: 300 },
            { x: 600, y: 450 },
            { x: 250, y: 350 },
            { x: 750, y: 300 },
            { x: 450, y: 450 }
        ];
        
        for (let i = 0; i < Math.min(count, spawnAreas.length); i++) {
            spawns.push({
                ...spawnAreas[i],
                behavior: behaviors[i % behaviors.length]
            });
        }
        
        return spawns;
    }

    /**
     * Create level config based on custom settings
     */
    static createLevelConfig(customConfig: any, width: number, height: number): LevelConfig {
        const mapConfigs: { [key: string]: any } = {
            'level1_map': {
                manualObstacles: [
                    { type: 'tree', x: 300, y: 150, scale: 0.2 },
                    { type: 'tree', x: 500, y: 250, scale: 0.15 },
                    { type: 'bush', x: 700, y: 150, scale: 0.20 }
                ],
                randomZones: [
                    { zone: { x: 0, y: 0, width: width, height: 100 }, type: 'tree', count: 8, minDistance: 60 },
                    { zone: { x: 0, y: height - 100, width: width, height: 100 }, type: 'bush', count: 8, minDistance: 60 }
                ]
            },
            'level2_map': {
                manualObstacles: [
                    { type: 'bushsnow', x: 300, y: 150, scale: 0.1 }
                ],
                randomZones: [
                    { zone: { x: 0, y: 0, width: width, height: 100 }, type: 'bushsnow', count: 4, minDistance: 200 }
                ]
            },
            'level3_map': {
                manualObstacles: [
                    { type: 'tree', x: 300, y: 150, scale: 0.2 }
                ],
                randomZones: [
                    { zone: { x: 300, y: 200, width: 200, height: 200 }, type: 'tree', count: 3, minDistance: 80 }
                ]
            }
        };

        const mapConfig = mapConfigs[customConfig.map] || mapConfigs['level1_map'];

        return {
            playerSpawn: { x: 300, y: 100 },
            dogSpawn: { x: 200, y: 200 },
            manualObstacles: mapConfig.manualObstacles,
            randomObstacleZones: mapConfig.randomZones,
            boxes: [
                { x: 150, y: 300 },
                { x: 450, y: 200 },
                { x: 750, y: 350 },
                { x: 650, y: 150 }
            ],
            foodCount: customConfig.spawnables.foods,
            mapTexture: customConfig.map,
            backgroundMusic: this.getMusicForMap(customConfig.map)
        };
    }

    /**
     * Create item spawn config based on custom settings
     */
    static createItemConfig(
        customConfig: any, 
        width: number, 
        height: number, 
        dogSpawns: Array<{ x: number, y: number, behavior: DogState }>
    ): ItemSpawnConfig {
        const config: ItemSpawnConfig = {
            foodCount: customConfig.spawnables.foods,
            poisonCount: customConfig.spawnables.poison,
            minItemDistance: 70,
            minObstacleDistance: 45,
            minBoxDistance: 70,
            minPlayerDistance: 100,
            mapWidth: width,
            mapHeight: height,
            playerSpawn: { x: 300, y: 100 },
            dogSpawns: dogSpawns.map(spawn => ({ x: spawn.x, y: spawn.y }))
        };

        // Add batteries if present
        if (customConfig.spawnables.batteries && customConfig.spawnables.batteries > 0) {
            config.batteryCount = customConfig.spawnables.batteries;
        }

        return config;
    }

    /**
     * Get music key for map
     */
    private static getMusicForMap(mapKey: string): string {
        const musicMap: { [key: string]: string } = {
            'level1_map': 'level1_theme',
            'level2_map': 'level2_theme',
            'level3_map': 'level3_theme'
        };
        return musicMap[mapKey] || 'level1_theme';
    }
}