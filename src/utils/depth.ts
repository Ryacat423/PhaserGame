import Phaser from 'phaser';

/**
 * Top-down draw order. Everything standing on the ground (cat, dogs, boxes, bushes, food, houses)
 * gets a depth from where its feet are, so whatever is lower on screen is drawn in front.
 * Before this, depths were fixed per type (dogs always above boxes, bushes always above
 * everything), so walking behind something looked like walking through it.
 *
 * The band stays between WORLD_DEPTH and WORLD_DEPTH + 1, under effects such as the night
 * darkness (20), lightning (15/25) and the HUD scenes.
 */
export const WORLD_DEPTH = 2;

/** Ground objects never go below this y-range; 1000 px of map maps to one depth unit. */
const PX_PER_DEPTH = 1000;

type Sortable = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Depth &
  Phaser.GameObjects.Components.Transform & { body?: unknown };

/** The y of an object's feet: the bottom of its physics body, or of its sprite. */
function feetY(obj: Sortable): number {
  const body = obj.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | undefined;
  if (body && 'bottom' in body) return body.bottom;
  const bounds = (obj as unknown as Phaser.GameObjects.Components.GetBounds).getBounds?.();
  return bounds ? bounds.bottom : obj.y;
}

export function groundDepth(y: number): number {
  return WORLD_DEPTH + Math.max(0, Math.min(y, PX_PER_DEPTH - 1)) / PX_PER_DEPTH;
}

/** Sets an object's depth from its feet. Call once for things that don't move. */
export function sortOnce(obj: Sortable): void {
  obj.setDepth(groundDepth(feetY(obj)));
}

/** Keeps an object's depth matched to its feet every frame, until it's destroyed. */
export function sortEveryFrame(obj: Sortable): void {
  const scene = obj.scene;
  const update = () => {
    if (obj.active) obj.setDepth(groundDepth(feetY(obj)));
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, update);
  obj.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.POST_UPDATE, update));
  update();
}
