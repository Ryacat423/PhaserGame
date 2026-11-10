import { TUTORIAL, LevelLayout } from '../config/layouts';
import { BaseLevel } from './levels/base_level';

/**
 * Practice level. It used to be a separate copy of the level code with random trees and food,
 * and a roaming dog that started next to the cat. Note: no menu opens this scene yet.
 */
export class TutorialScene extends BaseLevel {
    constructor() {
        super('tutorial');
    }

    protected override getLayout(): LevelLayout {
        return TUTORIAL;
    }

    protected getThemeAudioKey(): string {
        return 'game_theme';
    }

    protected override getThemeAudioPath(): string {
        return 'assets/global/audio/lvl-1-theme.mp3';
    }

    protected getBackgroundTextureKey(): string {
        return 'game_tutorial_map';
    }

    protected override preloadLevelAssets(): void {
        this.load.image('game_tutorial_map', 'assets/scene/tutorial/tutorial_map.webp');
    }

    protected override createLevelSpecificElements(): void {
        // Pink marks the dog that roams, so you can tell it apart from the sleeper.
        this.dogs.find((_, i) => TUTORIAL.dogs[i]?.behavior === 'ROAM')?.setTint(0xffcccc);
    }
}
