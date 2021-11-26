import Color from 'tinycolor2';

import { CacheDrawable } from '../drawable/cache-drawable';
import { ClearDrawable } from '../drawable/clear-drawable';
import { Drawable } from '../drawable/drawable';
import { PathDrawable } from '../drawable/path-drawable';
import { RawDrawable } from '../drawable/raw-drawable';
import { mouseToTouchInit } from '../utils/mouse-to-touch';
import { CanvasConfigType, defaultCanvasConfig } from './config';

export class CanvasDescriptor {
  #committed: RawDrawable[] = [];

  id: string;

  config: CanvasConfigType;

  mainCanvas: (HTMLCanvasElement & { cacheCanvas?: HTMLCanvasElement }) | null =
    null;

  get cacheCanvas(): HTMLCanvasElement | null {
    const { mainCanvas } = this;
    if (!mainCanvas) {
      return null;
    }
    const cacheCanvas =
      mainCanvas.cacheCanvas || document.createElement('canvas');

    if (
      cacheCanvas.height !== mainCanvas.height ||
      cacheCanvas.width !== mainCanvas.width
    ) {
      this.rasterizedLength = 0;
      cacheCanvas.height = mainCanvas.height;
      cacheCanvas.width = mainCanvas.width;
    }

    mainCanvas.cacheCanvas = cacheCanvas;
    return cacheCanvas;
  }

  committedDrawable: Drawable[];

  acceptedTouches: Map<number, RawDrawable> = new Map();

  mouseOverEvent?: MouseEvent;

  rasterizedLength: number = 0;

  afterUndoLength: number | undefined = undefined;

  onCommittedUpdated?: (target: CanvasDescriptor) => void;

  activeAnimationFrame: number | undefined;

  scheduledUpdate: boolean = false;

  constructor(id: string, config?: CanvasConfigType) {
    this.id = id;
    this.config = config ?? defaultCanvasConfig;

    // eslint-disable-next-line consistent-this, @typescript-eslint/no-this-alias
    const desc = this;
    this.committedDrawable = new Proxy(this.#committed, {
      get(t, p, r) {
        // get 的时候，骗对方说已经撤销的步骤不存在
        if (p === 'length' && desc.afterUndoLength != null) {
          return desc.afterUndoLength;
        }
        return Reflect.get(t, p, r);
      },
      set(t, p, v, r) {
        if (p !== 'length') {
          desc.onCommittedUpdated?.(desc);
          desc.afterUndoLength = undefined;
        }
        return Reflect.set(t, p, v, r);
      },
    });
  }

  draw() {
    const pendingDrawable = [...this.acceptedTouches.values()];
    const canvas = this.mainCanvas;

    if (!canvas || canvas.height === 0 || canvas.width === 0) {
      // 画布不存在，不用绘制了
      return false;
    }

    if (this.activeAnimationFrame) {
      // 跳过这次绘制
      this.scheduledUpdate = true;
      return false;
    }
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return false;
    }

    this.activeAnimationFrame = requestAnimationFrame(() => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // clear canvas
      new ClearDrawable(this).draw();
      // cache canvas
      const cache = new CacheDrawable(this);
      cache.draw();
      cache.update();
      // draw committed
      this.committedDrawable.slice(this.rasterizedLength).forEach(path => {
        path.draw();
      });
      // draw pending
      [...pendingDrawable].forEach(path => {
        path.draw();
      });
      // draw indicator
      const indicatorPath: RawDrawable[] = [...(pendingDrawable as any)];
      if (!indicatorPath.length && this.mouseOverEvent) {
        const touch = new Touch(mouseToTouchInit(this.mouseOverEvent));
        const mouse = RawDrawable.start(this, touch);
        mouse.commit();
        indicatorPath.push(mouse);
      }
      const { type, lineWidth, eraserWidth, color } = this.config;
      indicatorPath.forEach(path => {
        const mouseIndicator = new PathDrawable(this, {
          color:
            type === 'eraser'
              ? Color('#000000').setAlpha(0.4).toHex8String()
              : color,
          lineWidth: type === 'eraser' ? eraserWidth : lineWidth,
          eraserWidth,
          type: 'pen',
        });
        mouseIndicator.commit(path.getEvents().slice(-1));
        mouseIndicator.draw();
      });
      this.activeAnimationFrame = undefined;
      if (this.scheduledUpdate) {
        // 有跳过的绘制，重新执行
        this.scheduledUpdate = false;
        this.draw();
      }
    });
    return true;
  }

  undo() {
    if (this.afterUndoLength == null) {
      this.afterUndoLength = this.#committed.length;
    }
    if (this.afterUndoLength <= 0) {
      return false;
    }
    this.afterUndoLength -= 1;
    if (this.rasterizedLength > this.afterUndoLength) {
      this.rasterizedLength = 0;
    }
    return true;
  }

  redo() {
    if (
      this.afterUndoLength == null ||
      this.afterUndoLength >= this.#committed.length
    ) {
      return false;
    }
    this.afterUndoLength += 1;
    return true;
  }

  clear() {
    if (this.committedDrawable.slice(-1)[0] instanceof ClearDrawable) {
      return false;
    }
    this.committedDrawable.push(new ClearDrawable(this));
    return true;
  }
}
