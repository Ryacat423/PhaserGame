import { Food } from "./Food";
import { Poison } from "./Poison";
import { Player } from "./Player";
import { GameMap } from "./GameMap";
import { ItemSpawnConfig } from "../interfaces/game.interfaces";

export class ItemSystem {
    private scene: Phaser.Scene;
    private player: Player;
    private gameMap: GameMap;
    private foods: Food[] = [];
    private poisons: Poison[] = [];
    private eatSound: Phaser.Sound.BaseSound;
    private poisonSound!: Phaser.Sound.BaseSound;
    private lvlComplete!: Phaser.Sound.BaseSound;

    private totalFoodCount: number = 0; 
    
    constructor(scene: Phaser.Scene, player: Player, gameMap: GameMap) {
        this.scene = scene;
        this.player = player;
        this.gameMap = gameMap;
        
        this.eatSound = scene.sound.add('eat', { volume: 0.5 });
        this.poisonSound = scene.sound.add('slow', { volume: 1}); 
        this.lvlComplete = scene.sound.add('lvl-complete').setVolume(0.8);
    }

    public spawnItems(config: ItemSpawnConfig): void {
        this.clearAllItems();
        
        const foodTextures = ['food1', 'food2', 'food3', 'food4', 'food5'];
        const poisonTextures = ['poison1', 'poison2', 'poison3'];
        
        const occupiedPositions: { x: number, y: number }[] = [];

        occupiedPositions.push(config.playerSpawn);
        occupiedPositions.push(...config.dogSpawns);
        this.totalFoodCount = config.foodCount;

        for (let i = 0; i < config.foodCount; i++) {
            const position = this.findValidSpawnPosition(config, occupiedPositions);
            if (position) {
                const texture = Phaser.Utils.Array.GetRandom(foodTextures);
                const food = new Food(this.scene, position.x, position.y, texture);
                this.foods.push(food);
                occupiedPositions.push(position);
                this.scene.physics.add.overlap(this.player, food, (_, f) => this.collectFood(f as Food));
            }
        }

        for (let i = 0; i < config.poisonCount; i++) {
            const position = this.findValidSpawnPosition(config, occupiedPositions);
            if (position) {
                const texture = Phaser.Utils.Array.GetRandom(poisonTextures);
                const poison = new Poison(this.scene, position.x, position.y, texture);
                this.poisons.push(poison);
                occupiedPositions.push(position);

                this.scene.physics.add.overlap(this.player, poison, (_, p) => this.collectPoison(p as Poison));
            }
        }
    }


    private findValidSpawnPosition(config: ItemSpawnConfig, occupiedPositions: { x: number, y: number }[]): { x: number, y: number } | null {
        const maxAttempts = 100;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const x = Phaser.Math.Between(100, config.mapWidth - 100);
            const y = Phaser.Math.Between(100, config.mapHeight - 100);

            if (this.isValidSpawnPosition(x, y, config, occupiedPositions)) {
                return { x, y };
            }
            
            attempts++;
        }

        console.warn('Could not find valid spawn position after maximum attempts');
        return null;
    }

    private isValidSpawnPosition(x: number, y: number, config: ItemSpawnConfig, occupiedPositions: { x: number, y: number }[]): boolean {
        if (Phaser.Math.Distance.Between(config.playerSpawn.x, config.playerSpawn.y, x, y) < config.minPlayerDistance) {
            return false;
        }

        for (const dogSpawn of config.dogSpawns) {
            if (Phaser.Math.Distance.Between(dogSpawn.x, dogSpawn.y, x, y) < config.minPlayerDistance) {
                return false;
            }
        }

        for (const pos of occupiedPositions) {
            if (Phaser.Math.Distance.Between(pos.x, pos.y, x, y) < config.minItemDistance) {
                return false;
            }
        }

        if (this.isTooCloseToObstacles(x, y, config.minObstacleDistance)) {
            return false;
        }

        if (this.isTooCloseToBoxes(x, y, config.minBoxDistance)) {
            return false;
        }

        return true;
    }

    private isTooCloseToObstacles(x: number, y: number, minDistance: number): boolean {
        return this.gameMap.getObstacles().some(obstacle =>
            Phaser.Math.Distance.Between(obstacle.x, obstacle.y, x, y) < minDistance
        );
    }

    private isTooCloseToBoxes(x: number, y: number, minDistance: number): boolean {
        return this.gameMap.getBoxes().some(box =>
            Phaser.Math.Distance.Between(box.x, box.y, x, y) < minDistance
        );
    }

    private collectFood(food: Food): void {
        Phaser.Utils.Array.Remove(this.foods, food);
        this.eatSound.play();
        food.destroy();

        const collected = this.totalFoodCount - this.foods.length;
        this.scene.game.events.emit('foodCollected', collected, this.totalFoodCount);

        if(this.foods.length === 0) {
            this.lvlComplete.play();
            this.scene.game.events.emit('levelCompleted');
            alert('round completed!');
        }
    }

    private collectPoison(poison: Poison): void {
        Phaser.Utils.Array.Remove(this.poisons, poison);
        this.poisonSound.play();
        this.player.applyPoison();
        poison.destroy();
    }

    public clearAllItems(): void {
        this.foods.forEach(food => food.destroy());
        this.poisons.forEach(poison => poison.destroy());
        this.foods = [];
        this.poisons = [];
    }

    public getFoods(): Food[] {
        return this.foods;
    }

    public getPoisons(): Poison[] {
        return this.poisons;
    }

    public getRemainingFoodCount(): number {
        return this.foods.length;
    }

    public getTotalFoodCount(): number {
        return this.totalFoodCount;
    }

    public getCollectedFoodCount(): number {
        return this.totalFoodCount - this.foods.length;
    }

    public getRemainingPoisonCount(): number {
        return this.poisons.length;
    }

    public getAllItems(): (Food | Poison)[] {
        return [...this.foods, ...this.poisons];
    }
}