import { ObstacleType } from '../objects/Obstacle';

export interface ManualObstacleData {
    type: ObstacleType;
    x: number;
    y: number;
    scale?: number;
    rotation?: number;
    hitbox?: {
        width?: number;
        height?: number;
        offsetX?: number;
        offsetY?: number;
    };
    depth?: number;
}

export interface RandomObstacleZone {
    zone: { x: number; y: number; width: number; height: number };
    type: ObstacleType;
    count: number;
    minDistance: number;
}

export interface SpawnPoint {
    x: number;
    y: number;
}

export interface LevelConfig {
    playerSpawn: SpawnPoint;
    dogSpawn: SpawnPoint;
    manualObstacles: ManualObstacleData[];
    randomObstacleZones: RandomObstacleZone[];
    foodCount: number;
    mapTexture: string;
    backgroundMusic?: string;
}