import Phaser from 'phaser';
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
        scene.load.image('lock_warning', 'assets/global/ui/lock_warning.png');
        scene.load.image('save_btn', 'assets/global/ui/save_btn.png');
        scene.load.image('adventure_btn', 'assets/global/ui/adventure_mode_btn.png');
        scene.load.image('delete_btn', 'assets/global/ui/delete_btn.png');
        scene.load.image('custom_mode_btn', 'assets/global/ui/custom_mode_btn.png');
        scene.load.image('level_custom', 'assets/scene/levels/level_custom.png');
        scene.load.image('game-complete', 'assets/global/ui/lvl-complete.png');
        scene.load.image('game-over', 'assets/global/ui/game-over.png');
        scene.load.image('game-home', 'assets/global/ui/home-btn.png');
        scene.load.image('game-replay', 'assets/global/ui/replay-btn.png');
        scene.load.image('game-next', 'assets/global/ui/nxt-button.png');
        
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
        scene.load.image('level4_map', 'assets/scene/levels/5/map.png');

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
        scene.load.audio('night-ambience', 'assets/global/audio/night-ambience.mp3');
        scene.load.audio('owl-hoot', 'assets/global/audio/owl-hoot.mp3');
        scene.load.audio('firewood', 'assets/global/audio/firewood.mp3');
        scene.load.audio('cat_burned', 'assets/global/audio/cat_burned.mp3');
        scene.load.audio('burned', 'assets/global/audio/burn.mp3');

        scene.load.audio('level1_theme', 'assets/global/audio/gameplay.ogg');
        scene.load.audio('level2_theme', 'assets/global/audio/lvl-2-theme.mp3');
        scene.load.audio('level3_theme', 'assets/global/audio/night-theme.mp3');
        scene.load.audio('level4_theme', 'assets/global/audio/rain_theme.mp3');

        //Video
        scene.load.video('pool', 'assets/scene/levels/5/pool.mp4');
        
        // Global Sprites
        
        scene.load.spritesheet('cat_idle', 'assets/sprites/cat_idle.png', {
            frameWidth: 125,
            frameHeight: 150
        });

        scene.load.spritesheet('dog', 'assets/sprites/dog_sprite.png', {
            frameWidth: 1005,
            frameHeight: 950
        });

        scene.load.spritesheet('cat', 'assets/sprites/cat_sprite2.png', {
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

        scene.load.spritesheet('lightning', 'assets/sprites/lightning.png', {
            frameWidth: 270,
            frameHeight: 480
        });
    }

    createAnimations(): void {
        const anims = this.scene.game.anims;
        
        if (!anims.exists('dog_idle')) {
            anims.create({
                key: 'dog_idle',
                frames: anims.generateFrameNumbers('dog', { start: 40, end: 60 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!anims.exists('dog_sleep')) {
            anims.create({
                key: 'dog_sleep',
                frames: anims.generateFrameNumbers('dog', { start: 16, end: 39 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!anims.exists('dog_run')) {
            anims.create({
                key: 'dog_run',
                frames: anims.generateFrameNumbers('dog', { start: 0, end: 12 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!anims.exists('cat_idle')) {
            anims.create({
                key: 'cat_idle',
                frames: anims.generateFrameNumbers('cat', { start: 0, end: 19 }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!anims.exists('cat_walk')) {
            anims.create({
                key: 'cat_walk',
                frames: anims.generateFrameNumbers('cat', { start: 33, end: 47 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!anims.exists('cat_hide')) {
            anims.create({
                key: 'cat_hide',
                frames: anims.generateFrameNumbers('cat', {start: 55, end: 82 }),
                frameRate: 18,
                repeat: -1
            });
        }

        if (!anims.exists('cat_jump')) {
            anims.create({
                key: 'cat_jump',
                frames: anims.generateFrameNumbers('cat', {start: 88, end: 101}),
                frameRate: 40
            });
        }

        if (!anims.exists('blow')) {
            anims.create({
                key: 'blow',
                frames: anims.generateFrameNumbers('snow', {start: 0, end: 100}),
                frameRate: 64,
                repeat: -1
            });
        }

        if (!anims.exists('sway')) {
            anims.create({
                key: 'sway',
                frames: anims.generateFrameNumbers('fire', {start: 0, end: 105}),
                frameRate: 64,
                repeat: -1
            });
        }

        if (!anims.exists('strike')) {
            anims.create({
                key: 'strike',
                frames: anims.generateFrameNumbers('lightning', {start:0, end: 22 }),
                frameRate: 20
            });
        }

        if(!anims.exists('idle')){
            anims.create({
                key: 'idle',
                frames: anims.generateFrameNumbers('cat_idle', {
                    frames: [1, 1, 1, 2, 2, 3, 3, 3]
                }),
                frameRate: 12,
                repeat: -1
            });
    
            anims.create({
                key: 'blink',
                frames: anims.generateFrameNumbers('cat_idle', {
                    frames: [4, 5, 6, 7, 8, 5, 4]
                }),
                frameRate: 12,
                repeat: 0
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
