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

export interface Checkbox {
    bg: Phaser.GameObjects.Image;
    mark: Phaser.GameObjects.Image;
    checked: boolean;
    callback: (checked: boolean) => void;
    mechanicKey?: string;
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

export interface BoxPosition {
    x: number;
    y: number;
}

export interface ItemSpawnConfig {
    foodCount: number;
    poisonCount: number;
    batteryCount?: number;
    minItemDistance: number;
    minObstacleDistance: number;
    minBoxDistance: number;
    minPlayerDistance: number;
    mapWidth: number;
    mapHeight: number;
    playerSpawn: { x: number, y: number };
    dogSpawns: { x: number, y: number }[];
}

export interface LevelConfig {
    playerSpawn: SpawnPoint;
    dogSpawn: SpawnPoint;
    manualObstacles: ManualObstacleData[];
    randomObstacleZones: RandomObstacleZone[];
    boxes?: BoxPosition[];
    foodCount: number;
    mapTexture: string;
    backgroundMusic?: string;
}