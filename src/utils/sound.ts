import Phaser from 'phaser';

/**
 * Adds a sound that is destroyed when `scene` shuts down.
 *
 * Phaser's sound manager is shared by the whole game, so sounds made with `scene.sound.add`
 * outlive the scene that created them, and `sound.stopAll()` stops them without freeing them.
 * Every level restart used to add another full set of sounds.
 */
export function addSceneSound(
  scene: Phaser.Scene,
  key: string,
  config?: Phaser.Types.Sound.SoundConfig
): ReturnType<Phaser.Scene['sound']['add']> {
  const sound = scene.sound.add(key, config);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => sound.destroy());
  return sound;
}
