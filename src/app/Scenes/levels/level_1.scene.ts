import { Player } from "../../objects/Player";

export class Level1Scene extends Phaser.Scene {
    private player!: Player;
    private currentLevel: number = 1;

    // Define spawn points for each of the 4 levels (in world coordinates for isometric)
    private spawnPoints = {
        1: { x: 300, y: 200 },   // Top-left grass area
        2: { x: 700, y: 200 },   // Top-right grass area  
        3: { x: 300, y: 400 },   // Bottom-left grass area
        4: { x: 700, y: 400 }    // Bottom-right grass area
    };

    constructor(level: number = 1) {
        super({ key: `lvl-${level}` });
        this.currentLevel = level;
    }

    preload(): void {
        // Load the tileset image
        this.load.image('tiles', 'assets/maps/tileset/tiles.png');
        
        // Load the tilemap JSON
        this.load.tilemapTiledJSON('map', 'assets/maps/tilemap/tutorial_map.json');
        
        // Load player sprite/spritesheet
        this.load.image('cat', 'assets/sprites/cat.png');
    }

    create(): void {
        // Create the tilemap
        const map = this.make.tilemap({ key: 'map' });

        // Add the tileset to the map
        const tileset: any = map.addTilesetImage('tiles', 'tiles');

        // Create the layers (order matters for isometric display)
        const groundLayer: any = map.createLayer('ground', tileset, 0, 0);
        const flowersLayer = map.createLayer('flowers', tileset, 0, 0);
        const rocksLayer = map.createLayer('rocks', tileset, 0, 0);

        // Calculate the actual rendered size of the isometric map
        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;

        // For isometric maps, we need to account for the diamond shape
        // The actual playable area might be larger than the initial canvas
        const isoWidth = (map.width + map.height) * (map.tileWidth / 2);
        const isoHeight = (map.width + map.height) * (map.tileHeight / 2);

        // Set physics world bounds to cover the entire isometric area
        this.physics.world.setBounds(
            -isoWidth / 2, 
            -isoHeight / 4, 
            isoWidth, 
            isoHeight
        );

        // Set collision for specific tile types
        // Allow movement on grass (ID 2) and paths (ID 6, 13, etc.)
        if (groundLayer) {
            // Set collision on border tiles (ID 3, 1) and walls
            groundLayer.setCollisionByExclusion([0, 2, 6, 9, 13, 17, 18, 5]); 
        }
        
        // Set collision for flower borders
        if (flowersLayer) {
            flowersLayer.setCollision([26, 20]); // Border flower tiles
        }

        // Set collision for rocks
        if (rocksLayer) {
            rocksLayer.setCollision([1]); // Rock tiles
        }

        // Get spawn point for current level
        const spawnPoint = this.spawnPoints[this.currentLevel as keyof typeof this.spawnPoints] || this.spawnPoints[1];
        
        // Instantiate the player at the spawn point
        this.player = new Player(this, spawnPoint.x, spawnPoint.y);

        // IMPORTANT: Disable world bounds collision for the player so they can move freely
        this.player.setCollideWorldBounds(false);

        // Set up camera to follow the player
        this.cameras.main.startFollow(this.player);
        
        // Set camera bounds to be larger to accommodate isometric view
        this.cameras.main.setBounds(
            -isoWidth / 2, 
            -isoHeight / 4, 
            isoWidth, 
            isoHeight
        );
        
        // Smooth camera movement
        this.cameras.main.setLerp(0.08, 0.08);

        // Set up collision between player and layers with proper tile checking
        if (groundLayer) {
            this.physics.add.collider(this.player, groundLayer);
        }
        
        if (flowersLayer) {
            this.physics.add.collider(this.player, flowersLayer);
        }
        
        if (rocksLayer) {
            this.physics.add.collider(this.player, rocksLayer);
        }

        // Add level transition logic (optional)
        this.setupLevelTransitions();

        // Center the camera on the map initially
        this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2);
    }

    override update(): void {
        this.player.update();
    }

    // Optional: Set up areas for level transitions
    private setupLevelTransitions(): void {
        // Add keyboard input for manual level switching (for testing)
        const keys: any = this.input.keyboard?.addKeys('ONE,TWO,THREE,FOUR');
        
        if (keys) {
            keys.ONE.on('down', () => this.switchToLevel(1));
            keys.TWO.on('down', () => this.switchToLevel(2));
            keys.THREE.on('down', () => this.switchToLevel(3));
            keys.FOUR.on('down', () => this.switchToLevel(4));
        }
    }

    private switchToLevel(level: number): void {
        if (level >= 1 && level <= 4) {
            const spawnPoint = this.spawnPoints[level as keyof typeof this.spawnPoints];
            this.player.setPosition(spawnPoint.x, spawnPoint.y);
            this.currentLevel = level;
        }
    }
}