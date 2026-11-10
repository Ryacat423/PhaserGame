import { LEVEL_1, LevelLayout } from '../../config/layouts';
import { BaseLevel } from "./base_level";

/** Meadow: the basic sneaking level. Everything it needs comes from BaseLevel and its layout. */
export class Level1Scene extends BaseLevel {
    constructor() {
        super('level1');
    }

    protected override getLayout(): LevelLayout {
        return LEVEL_1;
    }

    protected override preloadLevelAssets(): void {
        this.load.audio('level1_theme', 'assets/global/audio/gameplay.mp3');
    }

    protected getThemeAudioKey(): string {
        return 'level1_theme';
    }

    protected override getThemeAudioPath(): string {
        return 'assets/global/audio/gameplay.mp3';
    }

    protected getBackgroundTextureKey(): string {
        return 'level1_map';
    }
}
