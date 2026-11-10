/**
 * Input from the on-screen touch controls. TouchControls writes it; Player reads it next to
 * the keyboard, so movement code doesn't care where input came from.
 */
export const touchInput = {
  /** Joystick direction, each axis -1..1, length at most 1. */
  x: 0,
  y: 0,
  jump: false,
  sprint: false,

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.jump = false;
    this.sprint = false;
  }
};

/**
 * True on phones and tablets. Uses the primary pointer, so a laptop with a touchscreen and a
 * trackpad keeps the keyboard layout without on-screen controls.
 */
export function prefersTouchControls(): boolean {
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
}
