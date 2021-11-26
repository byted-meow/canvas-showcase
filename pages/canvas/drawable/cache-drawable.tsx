import { CanvasDescriptor } from '../context/descriptor';
import { Drawable } from './drawable';

const BUFFER_SIZE = 2;
const MIN_THRESHOLD = 2;

export class CacheDrawable extends Drawable {
  desc: CanvasDescriptor;

  constructor(desc: CanvasDescriptor) {
    super(desc);
    this.desc = desc;
  }

  draw() {
    const { ctx, desc } = this;
    if (!desc.rasterizedLength || !ctx) {
      return;
    }
    const { mainCanvas, cacheCanvas } = desc;
    if (!mainCanvas || !cacheCanvas) {
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(
      cacheCanvas,
      0,
      0,
      mainCanvas.clientWidth,
      mainCanvas.clientHeight,
    );
  }

  update() {
    const { desc } = this;
    if (
      desc.committedDrawable.length >=
      desc.rasterizedLength + BUFFER_SIZE + MIN_THRESHOLD
    ) {
      const before = desc.rasterizedLength;
      const after = desc.committedDrawable.length - BUFFER_SIZE; // after > before
      const toRasterize = desc.committedDrawable.slice(before, after);
      toRasterize.forEach(path => {
        path.draw();
      });
      const canvas = desc.mainCanvas!;
      const cacheCanvas = desc.cacheCanvas!;
      const cacheContext = cacheCanvas.getContext('2d')!;
      cacheContext.imageSmoothingEnabled = true;
      cacheContext.imageSmoothingQuality = 'high';
      cacheContext.clearRect(0, 0, cacheCanvas.width, cacheCanvas.height);
      cacheContext.drawImage(
        canvas,
        0,
        0,
        cacheCanvas.width,
        cacheCanvas.height,
      );
      desc.rasterizedLength = after;
    }
  }
}
