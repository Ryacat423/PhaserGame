interface SoundCollection {
    click?: Phaser.Sound.BaseSound;
}

export class UIManager {
    private theme!: Phaser.Sound.BaseSound;
    private meow!: Phaser.Sound.BaseSound;
    private scene: Phaser.Scene;
    private sounds: SoundCollection = {};

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    static preloadAssets(scene: Phaser.Scene): void {
        // UI images
        //  General
        scene.load.image('btn-info', 'assets/global/ui/button-help.png');
        scene.load.image('btn-close', 'assets/global/ui/close.png');
        scene.load.image('btn-next', 'assets/global/ui/next.png');
        
        //  Gameplay UI
        scene.load.image('btn-home', 'assets/global/ui/home.png');
        scene.load.image('btn-reset', 'assets/global/ui/reset.png');
        scene.load.image('btn-settings', 'assets/global/ui/settings.png');
        scene.load.image('btn-pause', 'assets/global/ui/pause.png');
        
        // Game Images
        scene.load.image('box-open', 'assets/global/bg/box_open.png');
        scene.load.image('box-cat', 'assets/global/bg/box.png');
        scene.load.image('tree', 'assets/global/bg/tree.png');
        scene.load.image('bush', 'assets/scene/levels/2/bush_snow.png');
        scene.load.image('bush-green', 'assets/global/bg/bush.png');
        scene.load.image('battery', 'assets/scene/levels/3/battery.png');
        
        //Food Images
        scene.load.image('food1', 'assets/global/food/fish.png');
        scene.load.image('food2', 'assets/global/food/tuna.png');
        scene.load.image('food3', 'assets/global/food/sushi.png');
        scene.load.image('food4', 'assets/global/food/pack.png');
        scene.load.image('food5', 'assets/global/food/bowl.png');

        scene.load.image('poison1', 'assets/global/food/poison.png');
        scene.load.image('poison2', 'assets/global/food/mushroom.png');
        scene.load.image('poison3', 'assets/global/food/poison_apple.png');

        scene.load.image('battery', 'assets/scene/levels/3/battery.png');

        // Maps
        scene.load.image('level1_map', 'assets/scene/levels/1/map.png');
        scene.load.image('level2_map', 'assets/scene/levels/2/map.png');
        scene.load.image('level3_map', 'assets/scene/levels/3/map.png');

        // Sounds
        scene.load.audio('theme', 'assets/global/audio/welcome_bg.mp3');
        scene.load.audio('game_theme', 'assets/global/audio/lvl-1-theme.mp3');
        scene.load.audio('click', 'assets/global/audio/ui_click.ogg');
        scene.load.audio('bark', 'assets/global/audio/dog_bark.mp3');
        scene.load.audio('meow', 'assets/global/audio/meow.mp3');
        scene.load.audio('bark-once', 'assets/global/audio/bark_once.wav');
        scene.load.audio('footsteps', 'assets/global/audio/footsteps.wav');
        scene.load.audio('eat', 'assets/global/audio/eat_v1.wav');
        scene.load.audio('meow_2', 'assets/global/audio/meow_2.wav');
        scene.load.audio('slow', 'assets/global/audio/slow.mp3');
        scene.load.audio('hurt', 'assets/global/audio/hurt.wav');
        scene.load.audio('lvl-complete', 'assets/global/audio/lvl-complete.wav');
        
        // Global Sprites
        scene.load.spritesheet('dog', 'assets/sprites/dog_sprite.png', {
            frameWidth: 1005,
            frameHeight: 950
        });

        scene.load.spritesheet('cat', 'assets/sprites/cat_sprite.png', {
            frameWidth: 480,
            frameHeight: 480
        });

        scene.load.spritesheet('snow', 'assets/sprites/snow.png', {
            frameWidth: 1000,
            frameHeight: 600
        });

        scene.load.spritesheet('fire', 'assets/sprites/bonfire.png', {
            frameWidth: 392,
            frameHeight: 626
        });
    }

    createAnimations(): void {
        if (!this.scene.anims.exists('cat_idle')) {
            this.scene.anims.create({
                key: 'dog_idle',
                frames: this.scene.anims.generateFrameNumbers('dog', { start: 40, end: 60 }),
                frameRate: 24,
                repeat: -1
            });
    
            this.scene.anims.create({
                key: 'dog_sleep',
                frames: this.scene.anims.generateFrameNumbers('dog', { start: 16, end: 39 }),
                frameRate: 24,
                repeat: -1
            });
    
            this.scene.anims.create({
                key: 'dog_run',
                frames: this.scene.anims.generateFrameNumbers('dog', { start: 0, end: 12 }),
                frameRate: 24,
                repeat: -1
            })
    
            this.scene.anims.create({
                key: 'cat_idle',
                frames: this.scene.anims.generateFrameNumbers('cat', { start: 0, end: 19 }),
                frameRate: 6,
                repeat: -1
            });
    
            this.scene.anims.create({
                key: 'cat_walk',
                frames: this.scene.anims.generateFrameNumbers('cat', { start: 33, end: 47 }),
                frameRate: 24,
                repeat: -1
            });

            this.scene.anims.create({
                key: 'cat_hide',
                frames: this.scene.anims.generateFrameNumbers('cat', {start: 55, end: 82 }),
                frameRate: 18,
                repeat: -1
            });

            this.scene.anims.create({
                key: 'blow',
                frames: this.scene.anims.generateFrameNumbers('snow', {start: 0, end: 100}),
                frameRate: 64,
                repeat: -1
            });

            this.scene.anims.create({
                key: 'sway',
                frames: this.scene.anims.generateFrameNumbers('fire', {start: 0, end: 105}),
                frameRate: 64,
                repeat: -1
            });
        }
    }

    initSounds(): void {
        this.theme = this.scene.sound.add('theme', {loop: true});
        this.meow = this.scene.sound.add('meow');
        this.sounds.click = this.scene.sound.add('click', { volume: 0.3 });

        if (!this.theme.isPlaying) {
            this.theme.play();
        }
    }

    stopTheme(): void {
        this.theme.destroy();
    }

    playClickSound(): void {
        this.sounds.click?.play();
    }

    playDogSleep(x: number, y: number, scale: number, depth: number): void {
        this.scene.add.sprite(x, y, 'dog').play('dog_sleep').setScale(scale).setDepth(depth);
    }

    playDogIdle(x: number, y: number, scale: number, depth: number): void {
        this.scene.add.sprite(x, y, 'dog').play('dog_idle').setScale(scale).setDepth(depth);
    }

    playCatIdle(x: number, y: number, scale: number, depth: number): void {
        this.scene.add.sprite(x, y, 'cat').play('cat_idle').setScale(scale).setDepth(depth);
    }

    static globalSettings = {
        soundEnabled: true,
        musicVolume: 0.5,
        sfxVolume: 0.3
    };
}
