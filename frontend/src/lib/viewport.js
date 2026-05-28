/**
 * Keep two CSS variables on <html> in sync with the visual viewport:
 *
 *   --app-vh             height of the area NOT covered by the on-screen
 *                        keyboard or browser chrome (px).
 *   --app-keyboard-inset distance from the bottom of the layout viewport to
 *                        the bottom of the visible area (px). Equals the
 *                        keyboard height when one is showing on iOS Safari.
 *
 * Consumers (dialogs/sheets) use these to size and re-anchor themselves so
 * focused inputs are never hidden behind the keyboard.
 */
export function installViewportTracker() {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  const update = () => {
    const vv = window.visualViewport;
    if (vv) {
      const inset = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop
      );
      root.style.setProperty("--app-vh", `${Math.round(vv.height)}px`);
      root.style.setProperty("--app-keyboard-inset", `${Math.round(inset)}px`);
    } else {
      root.style.setProperty("--app-vh", `${window.innerHeight}px`);
      root.style.setProperty("--app-keyboard-inset", "0px");
    }
  };

  update();

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
  }
  window.addEventListener("resize", update);
  window.addEventListener("orientationchange", update);
}
