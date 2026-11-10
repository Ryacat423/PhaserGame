import Phaser from 'phaser';
import { SHEETS, SheetKey, sheetScale } from '../../config/sprites';
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

    /**
     * Everything the menus need: buttons, the welcome theme, and the sprites shown on menu screens.
     * Loaded before the welcome screen appears, so keep it small.
     */
    static preloadMenuAssets(scene: Phaser.Scene): void {
        scene.load.image('btn-info', 'assets/global/ui/button-help.webp');
        scene.load.image('btn-close', 'assets/global/ui/close.webp');
        scene.load.image('btn-next', 'assets/global/ui/next.webp');
        scene.load.image('btn-home', 'assets/global/ui/home.webp');
        scene.load.image('btn-reset', 'assets/global/ui/reset.webp');
        scene.load.image('btn-settings', 'assets/global/ui/settings.webp');
        scene.load.image('btn-pause', 'assets/global/ui/pause.webp');
        scene.load.image('lock_warning', 'assets/global/ui/lock_warning.webp');
        scene.load.image('save_btn', 'assets/global/ui/save_btn.webp');
        scene.load.image('adventure_btn', 'assets/global/ui/adventure_mode_btn.webp');
        scene.load.image('delete_btn', 'assets/global/ui/delete_btn.webp');
        scene.load.image('custom_mode_btn', 'assets/global/ui/custom_mode_btn.webp');
        scene.load.image('level_custom', 'assets/scene/levels/level_custom.webp');
        scene.load.image('game-complete', 'assets/global/ui/lvl-complete.webp');
        scene.load.image('game-over', 'assets/global/ui/game-over.webp');
        scene.load.image('game-home', 'assets/global/ui/home-btn.webp');
        scene.load.image('game-replay', 'assets/global/ui/replay-btn.webp');
        scene.load.image('game-next', 'assets/global/ui/nxt-button.webp');

        scene.load.audio('theme', 'assets/global/audio/welcome_bg.mp3');
        scene.load.audio('click', 'assets/global/audio/ui_click.ogg');
        scene.load.audio('meow', 'assets/global/audio/meow.mp3');

        UIManager.loadSheet(scene, 'cat_idle', 'assets/sprites/cat_idle.webp');
        UIManager.loadSheet(scene, 'dog', 'assets/sprites/dog_sprite.webp');
        UIManager.loadSheet(scene, 'cat', 'assets/sprites/cat_sprite2.webp');
    }

    /**
     * Everything levels need. The welcome screen starts this in the background once it's shown,
     * and level scenes also call it in preload, so a level opened early still gets its assets.
     * Phaser skips keys that are already loaded.
     */
    static preloadGameplayAssets(scene: Phaser.Scene): void {
        UIManager.preloadMenuAssets(scene);

        scene.load.image('box-open', 'assets/global/bg/box_open.webp');
        scene.load.image('box-cat', 'assets/global/bg/box.webp');
        scene.load.image('tree', 'assets/global/bg/tree.webp');
        scene.load.image('bush', 'assets/scene/levels/2/bush_snow.webp');
        scene.load.image('bush-green', 'assets/global/bg/bush.webp');
        scene.load.image('battery', 'assets/scene/levels/3/battery.webp');

        scene.load.image('food1', 'assets/global/food/fish.webp');
        scene.load.image('food2', 'assets/global/food/tuna.webp');
        scene.load.image('food3', 'assets/global/food/sushi.webp');
        scene.load.image('food4', 'assets/global/food/pack.webp');
        scene.load.image('food5', 'assets/global/food/bowl.webp');
        scene.load.image('poison1', 'assets/global/food/poison.webp');
        scene.load.image('poison2', 'assets/global/food/mushroom.webp');
        scene.load.image('poison3', 'assets/global/food/poison_apple.webp');

        scene.load.image('level1_map', 'assets/scene/levels/1/map.webp');
        scene.load.image('level2_map', 'assets/scene/levels/2/map.webp');
        scene.load.image('level3_map', 'assets/scene/levels/3/map.webp');
        scene.load.image('level4_map', 'assets/scene/levels/5/map.webp');

        scene.load.audio('game_theme', 'assets/global/audio/lvl-1-theme.mp3');
        scene.load.audio('bark', 'assets/global/audio/dog_bark.mp3');
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

        scene.load.video('pool', 'assets/scene/levels/5/pool.mp4');

        UIManager.loadSheet(scene, 'snow', 'assets/sprites/snow.webp');
        UIManager.loadSheet(scene, 'fire', 'assets/sprites/bonfire.webp');
        UIManager.loadSheet(scene, 'lightning', 'assets/sprites/lightning.webp');
    }

    private static loadSheet(scene: Phaser.Scene, key: SheetKey, url: string): void {
        const { frameWidth, frameHeight } = SHEETS[key];
        scene.load.spritesheet(key, url, { frameWidth, frameHeight });
    }

    createAnimations(): void {
        UIManager.createAnimations(this.scene);
    }

    /** Creates every animation whose texture is loaded. Safe to call repeatedly. */
    static createAnimations(scene: Phaser.Scene): void {
        const anims = scene.game.anims;
        const textures = scene.textures;
        
        if (!anims.exists('dog_idle') && textures.exists('dog')) {
            anims.create({
                key: 'dog_idle',
                frames: anims.generateFrameNumbers('dog', { start: 40, end: 60 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!anims.exists('dog_sleep') && textures.exists('dog')) {
            anims.create({
                key: 'dog_sleep',
                frames: anims.generateFrameNumbers('dog', { start: 16, end: 39 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!anims.exists('dog_run') && textures.exists('dog')) {
            anims.create({
                key: 'dog_run',
                frames: anims.generateFrameNumbers('dog', { start: 0, end: 12 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!anims.exists('cat_idle') && textures.exists('cat')) {
            anims.create({
                key: 'cat_idle',
                frames: anims.generateFrameNumbers('cat', { start: 0, end: 19 }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!anims.exists('cat_walk') && textures.exists('cat')) {
            anims.create({
                key: 'cat_walk',
                frames: anims.generateFrameNumbers('cat', { start: 33, end: 47 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!anims.exists('cat_hide') && textures.exists('cat')) {
            anims.create({
                key: 'cat_hide',
                frames: anims.generateFrameNumbers('cat', {start: 55, end: 82 }),
                frameRate: 18,
                repeat: -1
            });
        }

        if (!anims.exists('cat_jump') && textures.exists('cat')) {
            anims.create({
                key: 'cat_jump',
                frames: anims.generateFrameNumbers('cat', {start: 88, end: 101}),
                frameRate: 40
            });
        }

        if (!anims.exists('blow') && textures.exists('snow')) {
            anims.create({
                key: 'blow',
                frames: anims.generateFrameNumbers('snow', {start: 0, end: 100}),
                frameRate: 64,
                repeat: -1
            });
        }

        if (!anims.exists('sway') && textures.exists('fire')) {
            anims.create({
                key: 'sway',
                frames: anims.generateFrameNumbers('fire', {start: 0, end: 105}),
                frameRate: 64,
                repeat: -1
            });
        }

        if (!anims.exists('strike') && textures.exists('lightning')) {
            anims.create({
                key: 'strike',
                frames: anims.generateFrameNumbers('lightning', {start:0, end: 22 }),
                frameRate: 20
            });
        }

        if (!anims.exists('idle') && textures.exists('cat_idle')) {
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
        this.scene.add.sprite(x, y, 'dog').play('dog_sleep').setScale(sheetScale('dog', scale)).setDepth(depth);
    }

    playDogIdle(x: number, y: number, scale: number, depth: number): void {
        this.scene.add.sprite(x, y, 'dog').play('dog_idle').setScale(sheetScale('dog', scale)).setDepth(depth);
    }

    playCatIdle(x: number, y: number, scale: number, depth: number): void {
        this.scene.add.sprite(x, y, 'cat').play('cat_idle').setScale(sheetScale('cat', scale)).setDepth(depth);
    }

    static globalSettings = {
        soundEnabled: true,
        musicVolume: 0.5,
        sfxVolume: 0.3
    };
}
