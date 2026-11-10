import Phaser from 'phaser';
import '@fontsource/lilita-one/latin-400.css';
import '@fontsource/fredoka/latin-600.css';

/**
 * The game's fonts, self-hosted (no requests to a font service).
 *  - display: Lilita One, a heavy rounded face that matches the lettering on the wooden signs
 *    and buttons in the art. Titles, buttons, numbers, warnings.
 *  - body: Fredoka SemiBold, rounded but easy to read small. Dialogue, labels, hints.
 */
export const FONTS = {
    display: '"Lilita One", "Arial Black", sans-serif',
    body: '"Fredoka", Arial, sans-serif'
} as const;

/** Resolves once both fonts can be drawn, or after a short timeout so the game still starts. */
export function loadFonts(): Promise<void> {
    const ready = Promise.all([
        document.fonts.load('32px "Lilita One"'),
        document.fonts.load('600 16px "Fredoka"')
    ]).then(() => undefined);
    const timeout = new Promise<void>(resolve => setTimeout(resolve, 2500));
    return Promise.race([ready, timeout]).catch(() => undefined);
}

/**
 * Text created without a fontFamily uses the body font instead of Phaser's default (Courier).
 */
export function useGameFontsByDefault(): void {
    const factory = Phaser.GameObjects.GameObjectFactory.prototype as unknown as {
        text: (x: number, y: number, text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle) => Phaser.GameObjects.Text;
    };
    const original = factory.text;
    factory.text = function (x, y, text, style = {}) {
        return original.call(this, x, y, text, { fontFamily: FONTS.body, ...style });
    };
}
