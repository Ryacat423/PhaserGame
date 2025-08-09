export class InformationScene extends Phaser.Scene {
    constructor() {
        super({key: 'information'})
    }

    back!: Phaser.GameObjects.Image;
    arrow!: Phaser.GameObjects.Image;
    isArrowFlipped: number = 0;

    cat!: Phaser.GameObjects.Sprite;
    dog!: Phaser.GameObjects.Sprite;

    information_cards: Phaser.GameObjects.Image[] = [];
    currentCardIndex: number = 0;
    currentCard?: Phaser.GameObjects.Image;

    click!: Phaser.Sound.BaseSound;

    meow!: Phaser.Sound.BaseSound;
    bark!: Phaser.Sound.BaseSound;

    preload(): void {
        this.load.image('cat_info', 'assets/scene/information/cat_frame.png');
        this.load.image('dog_info', 'assets/scene/information/dog_frame.png');
        this.load.image('information_bg', 'assets/scene/information/bg3.jpg');
    }

    create(): void  {
        this.click = this.sound.add('click');
        this.meow = this.sound.add('meow');
        this.bark = this.sound.add('bark-once');

        this.add.image(0, 0, 'information_bg')
            .setOrigin(0, 0)
            .setDisplaySize(this.scale.width, this.scale.height);

        this.back = this.add.image(100, 100, 'btn-next')
            .setScale(.09)
            .setFlipX(true);

        this.arrow = this.add.image(820, 300, 'btn-next')
            .setScale(.09)
            .setInteractive();

        this.showCard(this.currentCardIndex);

        this.back   
            .setInteractive()
            .on('pointerdown', () => {
                this.click.play();
                this.scene.stop();
                this.scene.start('welcome');
            });

        this.arrow.on('pointerdown', () => {
            if (this.currentCard) {
                this.click.play();
                this.currentCard.destroy();
            }

            this.isArrowFlipped = this.isArrowFlipped === 0 ? 1 : 0;
            this.arrow.setFlipX(this.isArrowFlipped === 1);

            this.currentCardIndex = this.currentCardIndex === 0 ? 1 : 0;
            this.showCard(this.currentCardIndex);
        });
    }

    showCard(index: number): void {
        const key = index === 0 ? 'cat_info' : 'dog_info';

        if (this.currentCard) this.currentCard.destroy();
        if (this.cat) this.cat.destroy();
        if (this.dog) this.dog.destroy();

        this.currentCard = this.add.image(500, 300, key)
            .setScale(1.3);

        if (index === 0) {
            this.cat = this.add.sprite(340, 240, 'cat')
                .setScale(.4)
                .play('cat_walk')
                .setInteractive();

            this.cat.on('pointerdown', () => {
                this.meow.play();
            });
            
        } else {
            this.dog = this.add.sprite(340, 240, 'dog')
                .setScale(.2)
                .play('dog_idle')
                .setInteractive();
            this.dog.on('pointerdown', () => {
                this.bark.play();
            });
        }
    }
}