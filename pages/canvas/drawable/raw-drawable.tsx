import { CanvasDescriptor } from '../context/descriptor';
import { Drawable } from './drawable';

export type TrackedDrawEvent = {
  top: number;
  left: number;
  force: number;
  time: number; // high res timer (ms)
};

export type RawDrawableSerialized = {
  name: string;
  value: TrackedDrawEvent[];
};

export class RawDrawable extends Drawable {
  static start(desc: CanvasDescriptor, touch: Touch) {
    const instance = new RawDrawable(desc);
    instance.track(touch);
    return instance;
  }

  #events: TrackedDrawEvent[] = [];

  #startTime: number | null = null;

  #endTime: number | null = null;

  #cache: TrackedDrawEvent[] | null = null;

  get duration() {
    if (this.#startTime == null) {
      return 0;
    }
    if (this.#endTime == null) {
      return performance.now() - this.#startTime;
    }
    return this.#endTime - this.#startTime;
  }

  track(touch: Touch) {
    if (this.#startTime === null) {
      this.#startTime = performance.now();
    }

    const { clientX, clientY, force } = touch;
    const { ctx } = this;
    if (!ctx) {
      return;
    }
    const { canvas } = ctx;

    const { clientWidth, clientHeight } = canvas;
    const { top, left, width, height } = canvas.getBoundingClientRect();
    const scaleX = clientWidth / width;
    const scaleY = clientHeight / height;

    this.#events.push({
      left: (clientX - left) * scaleX,
      top: (clientY - top) * scaleY,
      force,
      time: performance.now() - this.#startTime,
    });
  }

  commit(next?: TrackedDrawEvent[]) {
    this.#cache = next ?? this.#events;
    this.#endTime = performance.now();
  }

  draw() {
    throw new Error(`I don't know how to draw`);
  }

  serialize(): string {
    return JSON.stringify({
      name: this.constructor.name,
      value: JSON.stringify(this.#cache),
    });
  }

  deserialize(v: string) {
    const { value } = JSON.parse(v) as RawDrawableSerialized;
    this.#cache = value;
  }

  getEvents() {
    return this.#cache || this.#events;
  }

  getRawEvents() {
    return this.#events;
  }

  getCache() {
    return this.#cache;
  }
}
