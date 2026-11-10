import Phaser from 'phaser';

type Handler = (...args: any[]) => void;

/**
 * Listens on the game-wide emitter until `scene` shuts down.
 *
 * `game.events` outlives every scene, so a listener added in `create()` without a matching
 * `off` stays attached after the scene stops: every visit to a level added another
 * 'returnToWelcome' handler, and one Home press then ran all of them.
 */
export function onGameEvent(scene: Phaser.Scene, event: string, fn: Handler, context?: unknown): void {
  scene.game.events.on(event, fn, context);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.game.events.off(event, fn, context));
}

/**
 * Listens on a scene's own emitter until it shuts down.
 *
 * A scene keeps its emitter across stop/start, so listeners added in `create()` pile up
 * one set per restart unless they're removed.
 */
export function onSceneEvent(scene: Phaser.Scene, event: string, fn: Handler, context?: unknown): void {
  scene.events.on(event, fn, context);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(event, fn, context));
}
