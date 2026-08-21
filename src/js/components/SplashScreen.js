import { resolveTarget } from "../utils/dom.js";

const SPLASH_EXIT_ANIMATION = "splash-screen-fade-out";
const SPLASH_EXIT_FALLBACK_MS = 700;

export class SplashScreen {
  constructor({ onStart }) {
    this.onStart = onStart;
    this.isStartRequested = false;

    this.initializeElements();
    this.setAttributes();
    this.appendElements();
    this.bindEvents();
  }

  initializeElements() {
    this.element = document.createElement("button");
    this.artImage = document.createElement("img");
    this.content = document.createElement("span");
    this.titleImage = document.createElement("img");
    this.prompt = document.createElement("span");
  }

  setAttributes() {
    this.element.type = "button";
    this.element.classList.add("splash-screen");
    this.element.setAttribute("aria-label", "Start Tic Tac Toe");
    this.element.hidden = true;

    this.artImage.classList.add("splash-screen-art");
    this.artImage.src = "./src/assets/images/splash_art.png";
    this.artImage.alt = "";
    this.artImage.decoding = "async";
    this.artImage.fetchPriority = "high";
    this.artImage.draggable = false;

    this.content.classList.add("splash-screen-content");

    this.titleImage.classList.add("splash-screen-title");
    this.titleImage.src = "./src/assets/images/splash_text.png";
    this.titleImage.alt = "Tic Tac Toe";
    this.titleImage.decoding = "async";
    this.titleImage.fetchPriority = "high";
    this.titleImage.draggable = false;

    this.prompt.classList.add("splash-screen-prompt");
    this.prompt.textContent = "PRESS ANYWHERE TO START";
  }

  appendElements() {
    this.content.append(this.titleImage, this.prompt);
    this.element.append(this.artImage, this.content);
  }

  bindEvents() {
    this.element.addEventListener("click", () => {
      this.requestStart();
    });
  }

  requestStart() {
    if (this.isStartRequested) {
      return;
    }

    this.isStartRequested = true;
    this.element.disabled = true;
    this.onStart();
  }

  open() {
    this.isStartRequested = false;
    this.element.disabled = false;
    this.element.classList.remove("splash-screen-exiting");
    this.element.hidden = false;
    this.element.focus({ preventScroll: true });
  }

  async close() {
    if (!this.element.isConnected || this.element.hidden) {
      return;
    }

    this.element.classList.add("splash-screen-exiting");

    const exitAnimation = this.element
      .getAnimations()
      .find(
        (animation) =>
          animation.animationName === SPLASH_EXIT_ANIMATION,
      );

    if (exitAnimation) {
      await Promise.race([
        exitAnimation.finished.catch(() => undefined),
        new Promise((resolve) => {
          setTimeout(resolve, SPLASH_EXIT_FALLBACK_MS);
        }),
      ]);
    }

    this.element.remove();
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.element);
    } else {
      console.error("SplashScreen target not found.");
    }
  }
}
