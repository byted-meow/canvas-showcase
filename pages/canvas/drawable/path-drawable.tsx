import { CanvasConfigType } from '../context/config';
import { CanvasDescriptor } from '../context/descriptor';
import { RawDrawable, TrackedDrawEvent } from './raw-drawable';

export type PathDrawableConfig = Pick<
  CanvasConfigType,
  'color' | 'eraserWidth' | 'lineWidth' | 'type'
>;

export class PathDrawable extends RawDrawable {
  config: PathDrawableConfig;

  constructor(desc: CanvasDescriptor, config: PathDrawableConfig) {
    super(desc);
    this.config = { ...config };
  }

  draw(events?: TrackedDrawEvent[]) {
    const { ctx, config } = this;
    if (!ctx) {
      return;
    }
    const { lineWidth, eraserWidth, color, type } = config;
    ctx.globalCompositeOperation =
      type === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineWidth = type === 'eraser' ? eraserWidth : lineWidth;
    ctx.strokeStyle = color;
    ctx.beginPath();
    (events ?? this.getEvents()).forEach(e => {
      ctx.lineTo(Math.round(e.left), Math.round(e.top));
    });
    ctx.stroke();
  }
}
