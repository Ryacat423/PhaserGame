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
        scene.load.image('btn-info', 'assets/global/ui/button-help.png');
        scene.load.image('btn-close', 'assets/global/ui/close.png');
        scene.load.image('btn-next', 'assets/global/ui/next.png');

        // Sounds
        scene.load.audio('theme', 'assets/global/audio/welcome_bg.mp3');
        scene.load.audio('click', 'assets/global/audio/ui_click.ogg');
        scene.load.audio('bark', 'assets/global/audio/dog_bark.mp3');
        scene.load.audio('meow', 'assets/global/audio/meow.mp3');
        
        // Global Sprites
        scene.load.spritesheet('dog', 'assets/sprites/dog_sprite.png', {
            frameWidth: 1005,
            frameHeight: 950
        });

        scene.load.spritesheet('cat', 'assets/sprites/cat_sprite.png', {
            frameWidth: 480,
            frameHeight: 480
        });
    }

    createAnimations(): void {
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
            frameRate: 12,
            repeat: -1
        });
    }

    initSounds(): void {
        this.theme = this.scene.sound.add('theme');
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
