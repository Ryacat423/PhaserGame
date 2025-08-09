import { Obstacle } from "../objects/Obstacle";
import { ManualObstacleData, RandomObstacleZone, LevelConfig } from "../interfaces/game.interfaces";
import { Scene } from "phaser";
import { Player } from "./Player";

export class GameMap {
    private scene: Scene;
    private player: Player;
    private obstacles: Obstacle[] = [];

    constructor(scene: Scene, player: Player) {
        this.scene = scene;
        this.player = player;
    }

    public setup(levelConfig: LevelConfig): void {
        this.setupManualObstacles(levelConfig.manualObstacles);
        this.setupRandomObstacles(levelConfig.randomObstacleZones);
        this.scene.physics.add.collider(this.player, this.obstacles);
    }

    private setupManualObstacles(manualObstacles: ManualObstacleData[]): void {
        manualObstacles.forEach(obstacleData => {
            this.createManualObstacle(obstacleData);
        });
    }

    private createManualObstacle(obstacleData: ManualObstacleData): void {
        const config = Obstacle.getConfig(obstacleData.type);
        if (obstacleData.scale !== undefined) {
            config.scale = obstacleData.scale;
        }
        if (obstacleData.rotation !== undefined) {
            config.rotation = obstacleData.rotation;
        }
        if (obstacleData.depth !== undefined) {
            config.depth = obstacleData.depth;
        }
        if (obstacleData.hitbox !== undefined) {
            config.hitbox = obstacleData.hitbox;
        }

        const obstacle = new Obstacle(this.scene, obstacleData.x, obstacleData.y, config);
        this.obstacles.push(obstacle);
    }

    private setupRandomObstacles(randomObstacleZones: RandomObstacleZone[]): void {
        randomObstacleZones.forEach(zoneConfig => {
            this.placeRandomObstacles(zoneConfig);
        });
    }

    private placeRandomObstacles(zoneConfig: RandomObstacleZone): void {
        const placedPositions: { x: number, y: number }[] = [];
        let attempts = 0;
        const maxAttempts = zoneConfig.count * 10;

        for (let i = 0; i < zoneConfig.count && attempts < maxAttempts; attempts++) {
            const x = zoneConfig.zone.x + Math.random() * zoneConfig.zone.width;
            const y = zoneConfig.zone.y + Math.random() * zoneConfig.zone.height;

            const tooCloseToObstacle = placedPositions.some(pos =>
                Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2) < zoneConfig.minDistance
            );

            const tooCloseToSpawn = Math.sqrt((500 - x) ** 2 + (300 - y) ** 2) < 100 || Math.sqrt((300 - x) ** 2 + (300 - y) ** 2) < 100;
            const tooCloseToManualObstacle = this.obstacles.some(obstacle =>
                Math.sqrt((obstacle.x - x) ** 2 + (obstacle.y - y) ** 2) < zoneConfig.minDistance
            );

            if (!tooCloseToObstacle && !tooCloseToSpawn && !tooCloseToManualObstacle) {
                const config = Obstacle.getConfig(zoneConfig.type);
                const obstacle = new Obstacle(this.scene, x, y, config);
                this.obstacles.push(obstacle);
                placedPositions.push({ x, y });
                i++;
            }
        }
    }    
    
    public getObstacles(): Obstacle[] {
        return this.obstacles;
    }
}
