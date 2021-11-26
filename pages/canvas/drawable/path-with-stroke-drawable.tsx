/* eslint-disable max-statements */
import { BrushType } from '../context/config';
import { CanvasDescriptor } from '../context/descriptor';
import { RawDrawable, TrackedDrawEvent } from './raw-drawable';

export type PathDrawableConfig = {
  lineWidth: number;
  color: string;
  type: BrushType;
};

const smoothLine = (array: TrackedDrawEvent[], duration: number) => {
  if (array.length < 2) {
    return array;
  }
  const [start, ...original] = array;
  const smoothed = [start];

  for (
    let targetTime = Math.min(duration - start.time, 350);
    targetTime >= 0;

  ) {
    const testee = original[0];
    if (!testee) {
      return smoothed;
    }
    // 如果 testee.time 大于等于 targetTime，直接接受它
    // 如果 testee.time + 5 >= targetTime，也接受它
    if (duration - testee.time + 5 >= targetTime) {
      smoothed.push(testee);
      original.shift();
    }
    // 不能接受了，在其中插入一个点
    else {
      const current = smoothed[smoothed.length - 1];
      // 拟合一次函数先，设函数为 y = ax + b，两个点为 (c - 时间, d) , (m - 时间2, n)
      const c = duration - current.time;
      const m = duration - testee.time;
      const result = { time: duration - targetTime } as TrackedDrawEvent;
      const solve = (key: Exclude<keyof TrackedDrawEvent, 'time'>) => {
        const d = current[key];
        const n = testee[key];
        const a = (n - d) / (m - c);
        const b = n - m * a;
        const res = (duration - result.time) * a + b;
        result[key] = res;
      };
      solve('force');
      solve('left');
      solve('top');
      smoothed.push(result);
    }
    targetTime = duration - smoothed[smoothed.length - 1].time - 10;
  }

  return smoothed;
};

export class PathWithStrokeDrawable extends RawDrawable {
  config: PathDrawableConfig;

  constructor(desc: CanvasDescriptor, config: PathDrawableConfig) {
    super(desc);
    this.config = { ...config };
  }

  draw(events?: TrackedDrawEvent[]) {
    const division = 350;
    const { ctx, config } = this;

    if (!ctx) {
      return;
    }

    const { clientWidth, clientHeight, width, height } = ctx.canvas;
    const offscreen = new OffscreenCanvas(width, height);
    const offscreenCtx = offscreen.getContext('2d')!;
    offscreenCtx.scale(width / clientWidth, height / clientHeight);
    offscreenCtx.lineCap = 'round';

    const { lineWidth, color, type } = config;
    ctx.globalCompositeOperation =
      type === 'eraser' ? 'destination-out' : 'source-over';

    offscreenCtx.lineWidth = lineWidth;
    offscreenCtx.strokeStyle = color;
    offscreenCtx.beginPath();

    const points = events ?? this.getEvents();

    const { duration } = this;

    let i = 0;

    for (i = 0; i < points.length; i++) {
      const e = points[i];
      if (duration - e.time < division) {
        break;
      }
      offscreenCtx.lineTo(e.left, e.top);
    }
    if (i !== 0) {
      offscreenCtx.stroke();
    }

    // 平滑剩下的点，stroke 性能很差，所以拆成两部分

    let smooth = points.slice(i ? i - 1 : i);

    if (smooth.length < 20) {
      smooth = smoothLine(smooth, duration);
    }
    offscreenCtx.miterLimit = 1;
    smooth.forEach(e => {
      if (duration - e.time > division) {
        return;
      }
      offscreenCtx.lineWidth =
        lineWidth *
        (0.4 +
          Math.sin((((duration - e.time) / division) * Math.PI) / 2) * 0.6);
      offscreenCtx.lineTo(e.left, e.top);
      offscreenCtx.stroke();
    });

    ctx.drawImage(offscreen, 0, 0, clientWidth, clientHeight);
  }
}
/* eslint-enable max-statements */
