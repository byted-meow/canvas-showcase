// 算法：https://codepen.io/mmoustafa/pen/gmEdk
// 仅用于演示一种笔迹样式的绘制

import Color from 'tinycolor2';
import { CanvasDescriptor } from '../context/descriptor';
import { RawDrawable, TrackedDrawEvent } from './raw-drawable';

export type ChalkDrawableConfig = {
  lineWidth: number;
  color: string;
};

// 随机数生成器
/* eslint-disable no-bitwise, no-multi-assign, no-param-reassign */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* eslint-enable */

export class ChalkDrawable extends RawDrawable {
  config: ChalkDrawableConfig;

  seed: number;

  constructor(desc: CanvasDescriptor, config: ChalkDrawableConfig) {
    super(desc);
    this.config = { ...config };
    this.seed = Number(`${Math.random()}`.slice(2));
  }

  draw(events?: TrackedDrawEvent[]) {
    const { ctx, config } = this;
    const { lineWidth, color } = config;

    if (!ctx) {
      return;
    }

    const { clientWidth, clientHeight, width, height } = ctx.canvas;
    const offscreen = new OffscreenCanvas(width, height);
    const offscreenCtx = offscreen.getContext('2d')!;
    offscreenCtx.scale(width / clientWidth, height / clientHeight);

    const originalColor = Color(color);

    offscreenCtx.fillStyle = originalColor.setAlpha(0.5).toHex8String();
    offscreenCtx.strokeStyle = originalColor.setAlpha(0.5).toHex8String();
    offscreenCtx.lineWidth = lineWidth;
    offscreenCtx.lineCap = 'round';

    let xLast: number | null = null;
    let yLast: number | null = null;

    const random = mulberry32(this.seed);

    function drawPoint(x: number, y: number) {
      if (xLast == null || yLast == null) {
        xLast = x;
        yLast = y;
      }
      offscreenCtx.strokeStyle = originalColor
        .setAlpha(0.4 + random() * 0.2)
        .toHex8String();
      offscreenCtx.beginPath();
      offscreenCtx.moveTo(xLast, yLast);
      offscreenCtx.lineTo(x, y);
      offscreenCtx.stroke();

      const length = Math.round(
        Math.sqrt(Math.pow(x - xLast, 2) + Math.pow(y - yLast, 2)) /
          (5 / lineWidth),
      );
      const xUnit = (x - xLast) / length;
      const yUnit = (y - yLast) / length;
      for (let i = 0; i < length; i++) {
        const xCurrent = xLast + i * xUnit;
        const yCurrent = yLast + i * yUnit;
        const xRandom = xCurrent + (random() - 0.5) * lineWidth * 1.2;
        const yRandom = yCurrent + (random() - 0.5) * lineWidth * 1.2;
        offscreenCtx.clearRect(
          xRandom,
          yRandom,
          random() * 2 + 2,
          random() + 1,
        );
      }

      xLast = x;
      yLast = y;
    }

    (events ?? this.getEvents()).forEach(e => {
      drawPoint(e.left, e.top);
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(offscreen, 0, 0, clientWidth, clientHeight);
  }
}
