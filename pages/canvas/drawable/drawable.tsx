import { CanvasDescriptor } from '../context/descriptor';

/* eslint-disable @typescript-eslint/method-signature-style */
export interface Drawable {
  serialize?(): string;
  deserialize?(v: string): void;
}
/* eslint-enable @typescript-eslint/method-signature-style */
export abstract class Drawable {
  #desc: CanvasDescriptor;

  get ctx(): CanvasRenderingContext2D | null {
    return this.#desc.mainCanvas?.getContext('2d') || null;
  }

  constructor(desc: CanvasDescriptor) {
    this.#desc = desc;
  }
  abstract draw(): void;
}
