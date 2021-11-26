import { Drawable } from './drawable';

export class ClearDrawable extends Drawable {
  draw() {
    const { ctx } = this;
    if (!ctx) {
      return;
    }
    const { canvas } = ctx;
    const { clientWidth, clientHeight } = canvas;
    ctx.clearRect(0, 0, clientWidth, clientHeight);
  }
}
