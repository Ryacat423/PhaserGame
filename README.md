# Sneaky Mingming

A top-down stealth game built with Phaser 3 and TypeScript. Mingming the cat sneaks
around sleeping and roaming dogs to collect food, hiding in boxes when they wake. Four
levels add their own mechanics (snow and a campfire, a night level with a flashlight
battery, a lightning storm), and a custom mode lets you combine mechanics into your own levels.

Plays with a keyboard (WASD to move, Shift to run, F to jump, Space to hide) or with
on-screen controls on phones and tablets.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check, then build to dist/
npm run preview    # serve the production build
```

## Project layout

- `src/main.ts` — game config and scene list
- `src/Scenes/` — menus, story, tutorial, and levels (`levels/base_level.ts` holds shared level logic)
- `src/objects/` — player, dogs, boxes, food, obstacles
- `src/mechanics/`, `src/components/config/` — snow, night and lightning mechanics for custom levels
- `src/components/ui/` — HUD scenes (`GameUI`, per-level UIs, `TouchControls`)
- `src/config/sprites.ts` — spritesheet frame sizes and the scale helpers that go with them
- `src/utils/` — scene-scoped sounds and event listeners, safe storage, lazy dialogs
- `public/assets/` — images (WebP) and audio (MP3)

## Assets

`scripts/optimize-assets.mjs` repacked the spritesheets, converted images to WebP and re-encoded
audio. It was run once; the original files are in git history. If you change a sheet's frame size,
update `src/config/sprites.ts` to match. `scripts/asset-report.mjs` lists every asset with its
size and whether the code references it.

Menu assets load before the first screen. Level assets load in the background once the menu is up.

## Deploying

The game is deployed on Vercel as a static site (`vercel.json`) at https://play.ryacat.com. The portfolio
at ryacat.com embeds it in a sandboxed iframe. The `frame-ancestors` header only allows ryacat.com (and
localhost, for development) to embed it, so other sites can't frame the game.

## Credits

The code and game design are by Ramil Yacat. The artwork, music and sound effects come from free game-asset
sites and are not my own work. This is a free, non-commercial student project; the assets are not sold or
distributed separately from the game.

<!-- TODO: list each asset pack with its creator, source link and license. -->

If you created an asset used here and want a different credit or for it to be removed, open an issue on this
repository.
