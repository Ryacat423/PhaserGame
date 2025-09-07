import { Mechanics } from "./mechanic.config";

export class LevelConfiguration {
    static createLevelConfig(customConfig: any, backgroundWidth: number, backgroundHeight: number) {
        const mapConfigs = {
            level1_map: {
                obstacles: [
                    { type: 'tree', x: 300, y: 150, scale: 0.2 },
                    { type: 'tree', x: 500, y: 250, scale: 0.15 },
                    { type: 'tree', x: 700, y: 150, scale: 0.20 }
                ],
                zones: [
                    { zone: { x: 0, y: 0, width: backgroundWidth, height: 100 }, type: 'tree', count: 6, minDistance: 60 },
                    { zone: { x: 0, y: backgroundHeight - 100, width: backgroundWidth, height: 100 }, type: 'tree', count: 6, minDistance: 60 }
                ]
            },
            level2_map: {
                obstacles: [{ type: 'bush', x: 300, y: 150, scale: 0.1 }],
                zones: [{ zone: { x: 0, y: 0, width: backgroundWidth, height: 100 }, type: 'bush', count: 4, minDistance: 200 }]
            },
            level3_map: {
                obstacles: [{ type: 'tree', x: 300, y: 150, scale: 0.2 }],
                zones: [{ zone: { x: 300, y: 200, width: 200, height: 200 }, type: 'tree', count: 3, minDistance: 80 }]
            }
        };

        const mapConfig = mapConfigs[customConfig.map as keyof typeof mapConfigs] || mapConfigs.level1_map;
        const mechanicsType = Object.keys(customConfig.mechanics).find(key => customConfig.mechanics[key]) || 'none';
        const themeConfig = Mechanics.getThemeConfig(mechanicsType);

        return {
            playerSpawn: { x: 300, y: 100 },
            dogSpawn: { x: 200, y: 200 },
            manualObstacles: mapConfig.obstacles,
            randomObstacleZones: mapConfig.zones,
            boxes: [
                { x: 150, y: 300 },
                { x: 450, y: 200 },
                { x: 750, y: 350 },
                { x: 650, y: 150 }
            ],
            foodCount: customConfig.spawnables.foods,
            mapTexture: customConfig.map,
            backgroundMusic: themeConfig.audioKey
        };
    }

    static createItemConfig(customConfig: any, backgroundWidth: number, backgroundHeight: number, dogSpawns: any[]) {
        const mechanicsType = Object.keys(customConfig.mechanics).find(key => customConfig.mechanics[key]) || 'none';
        
        const config: any = {
            foodCount: customConfig.spawnables.foods,
            poisonCount: customConfig.spawnables.poison,
            minItemDistance: 70,
            minObstacleDistance: 45,
            minBoxDistance: 70,
            minPlayerDistance: 100,
            mapWidth: backgroundWidth,
            mapHeight: backgroundHeight,
            playerSpawn: { x: 300, y: 100 },
            dogSpawns: dogSpawns.map(dog => ({ x: dog.x, y: dog.y }))
        };

        if (mechanicsType === 'night') {
            config.batteryCount = 8;
        }

        return config;
    }

    static generateDogSpawns(dogCount: number) {
        const spawnAreas = [
            { x: 200, y: 200 },
            { x: 800, y: 400 },
            { x: 500, y: 500 },
            { x: 650, y: 250 },
            { x: 350, y: 350 },
            { x: 750, y: 150 },
            { x: 150, y: 450 },
            { x: 600, y: 300 }
        ];
        
        const behaviors = ['SLEEP', 'ROAM'];
        const positions = [];
        
        for (let i = 0; i < Math.min(dogCount, spawnAreas.length); i++) {
            positions.push({
                x: spawnAreas[i].x,
                y: spawnAreas[i].y,
                behavior: behaviors[i % behaviors.length]
            });
        }
        
        return positions;
    }
}
