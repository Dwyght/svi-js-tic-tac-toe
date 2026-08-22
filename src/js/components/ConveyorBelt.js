import { resolveTarget } from "../utils/dom.js";

const SUSHI_PLATE_SOURCES = Object.freeze([
  "./src/assets/images/loading-sushis/conveyer_belt_1.png",
  "./src/assets/images/loading-sushis/conveyer_belt_2.png",
  "./src/assets/images/loading-sushis/conveyer_belt_3.png",
  "./src/assets/images/loading-sushis/conveyer_belt_4.png",
  "./src/assets/images/loading-sushis/conveyer_belt_5.png",
  "./src/assets/images/loading-sushis/conveyer_belt_6.png",
  "./src/assets/images/loading-sushis/conveyer_belt_7.png",
  "./src/assets/images/loading-sushis/conveyer_belt_8.png",
  "./src/assets/images/loading-sushis/conveyer_belt_9.png",
  "./src/assets/images/loading-sushis/conveyer_belt_10.png",
  "./src/assets/images/loading-sushis/conveyer_belt_11.png",
]);

const MINIMUM_GAP = 28;
const MAXIMUM_GAP = 76;
const MINIMUM_PLATE_SIZE = 72;
const PIXELS_PER_SECOND = 90;
const MINIMUM_DURATION = 12;
const TRACK_LINE_STEP = 68;

export class ConveyorBelt {
  constructor() {
    this.initializeElements();
    this.setAttributes();
    this.appendElements();
    this.handleViewportResize = this.handleViewportResize.bind(this);
    window.addEventListener("resize", this.handleViewportResize);
  }

  initializeElements() {
    this.element = document.createElement("div");
    this.strip = document.createElement("div");
    this.resizeAnimationFrame = null;
  }

  setAttributes() {
    this.element.classList.add("conveyor-belt", "hidden");
    this.element.setAttribute("aria-hidden", "true");
    this.element.style.setProperty(
      "--conveyor-line-step",
      `${TRACK_LINE_STEP}px`,
    );
    this.element.style.setProperty(
      "--conveyor-line-duration",
      `${TRACK_LINE_STEP / PIXELS_PER_SECOND}s`,
    );
    this.strip.classList.add("conveyor-belt-strip");
  }

  appendElements() {
    this.element.append(this.strip);
  }

  getRandomInteger(minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  }

  getShuffledSources() {
    const shuffledSources = [...SUSHI_PLATE_SOURCES];

    for (
      let currentIndex = shuffledSources.length - 1;
      currentIndex > 0;
      currentIndex--
    ) {
      const randomIndex = this.getRandomInteger(0, currentIndex);
      [shuffledSources[currentIndex], shuffledSources[randomIndex]] = [
        shuffledSources[randomIndex],
        shuffledSources[currentIndex],
      ];
    }

    return shuffledSources;
  }

  createPlateSequenceData() {
    const minimumSequenceWidth =
      Math.max(window.innerWidth, window.screen.width) + MAXIMUM_GAP;
    const minimumPlateSpan = MINIMUM_PLATE_SIZE + MINIMUM_GAP;
    const plateCount = Math.max(
      SUSHI_PLATE_SOURCES.length,
      Math.ceil(minimumSequenceWidth / minimumPlateSpan),
    );
    const plateSequenceData = [];

    while (plateSequenceData.length < plateCount) {
      for (const source of this.getShuffledSources()) {
        if (plateSequenceData.length === plateCount) {
          break;
        }

        plateSequenceData.push({
          source,
          gap: this.getRandomInteger(MINIMUM_GAP, MAXIMUM_GAP),
        });
      }
    }

    return plateSequenceData;
  }

  createPlateSequence(plateSequenceData) {
    const sequence = document.createElement("div");
    sequence.classList.add("conveyor-belt-sequence");

    for (const { source, gap } of plateSequenceData) {
      const plate = document.createElement("img");
      plate.classList.add("conveyor-belt-plate");
      plate.src = source;
      plate.alt = "Sushi plate";
      plate.draggable = false;
      plate.style.marginInlineEnd = `${gap}px`;
      sequence.append(plate);
    }

    return sequence;
  }

  generate() {
    const plateSequenceData = this.createPlateSequenceData();
    const firstSequence = this.createPlateSequence(plateSequenceData);
    const secondSequence = this.createPlateSequence(plateSequenceData);
    this.strip.replaceChildren(firstSequence, secondSequence);

    return firstSequence;
  }

  restartAnimation(firstSequence = this.strip.firstElementChild) {
    if (!firstSequence) {
      return;
    }

    this.element.classList.remove("conveyor-belt-active");
    const sequenceWidth = firstSequence.getBoundingClientRect().width;
    const duration = Math.max(
      MINIMUM_DURATION,
      sequenceWidth / PIXELS_PER_SECOND,
    );
    this.strip.style.setProperty("--conveyor-duration", `${duration}s`);
    void this.strip.offsetWidth;
    this.element.classList.add("conveyor-belt-active");
  }

  handleViewportResize() {
    if (!this.element.classList.contains("conveyor-belt-active")) {
      return;
    }

    if (this.resizeAnimationFrame) {
      cancelAnimationFrame(this.resizeAnimationFrame);
    }

    this.resizeAnimationFrame = requestAnimationFrame(() => {
      this.resizeAnimationFrame = null;
      this.restartAnimation();
    });
  }

  start() {
    this.element.classList.remove("conveyor-belt-active");
    const firstSequence = this.generate();
    this.element.classList.remove("hidden");
    this.restartAnimation(firstSequence);
  }

  stop() {
    if (this.resizeAnimationFrame) {
      cancelAnimationFrame(this.resizeAnimationFrame);
      this.resizeAnimationFrame = null;
    }

    this.element.classList.remove("conveyor-belt-active");
    this.element.classList.add("hidden");
  }

  render(target) {
    const parent = resolveTarget(target);

    if (parent) {
      parent.append(this.element);
    } else {
      console.error("ConveyorBelt target not found.");
    }
  }
}
