import { NightMechanics } from "../../mechanics/night.mechanic";
import { SnowMechanic } from "../../mechanics/snow.mechanics";

export class Mechanics {
    static createMechanics(type: string, scene: Phaser.Scene, player: any, background?: Phaser.GameObjects.Image): any {
        switch (type) {
            case 'snow':
                return new SnowMechanic(scene, player);
            case 'night':
                return new NightMechanics(scene, player, background!);
            default:
                return null;
        }
    }

    static getThemeConfig(mechanicsType: string) {
        const configs = {
            snow: {
                audioKey: 'level2_theme',
                audioPath: 'assets/global/audio/lvl-2-theme.mp3',
                volume: 0.6,
                uiScenes: ['Level2UI']
            },
            night: {
                audioKey: 'level3_theme',
                audioPath: 'assets/global/audio/night-theme.mp3',
                volume: 0.2,
                uiScenes: ['Level3UI']
            },
            none: {
                audioKey: 'level1_theme',
                audioPath: 'assets/global/audio/gameplay.ogg',
                volume: 0.8,
                uiScenes: []
            }
        };

        return configs[mechanicsType as keyof typeof configs] || configs.none;
    }
}
