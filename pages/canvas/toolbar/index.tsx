import Draggable from 'react-draggable';
import clsx from 'clsx';
import { useCanvasConfig } from '../context';
import { ColorSizePopover } from './color-size-popover';
import { EraserPopover } from './eraser-popover';
import s from './index.module.css';

export function CanvasFloatingToolbar() {
  const { undo, redo, config, getMostRecentCanvas } =
    useCanvasConfig('canvasState');
  if (config.canvasState !== 'normal') {
    return null;
  }
  const defaultPosition = (() => {
    const target = getMostRecentCanvas();
    if (!target) {
      return { x: 0, y: 0 };
    }
    const { x, y } = target.mainCanvas?.getBoundingClientRect() || {};
    return { x: x || 0, y: y || 0 };
  })();
  return (
    <Draggable
      defaultPosition={defaultPosition}
      cancel={`.${s['toolbar-non-draggable']}`}>
      <div className={clsx(s.toolbar, s['floating-toolbar'])}>
        <span className={s['toolbar-draggable-icon']}>拖动</span>
        <div className={s['toolbar-non-draggable']}>
          <ColorSizePopover type="pen" text="笔刷" />
          <ColorSizePopover type="stroke" text="笔锋" />
          <ColorSizePopover type="chalk" text="粉笔" />
          <EraserPopover />
          <div onClick={() => undo()} className={s['toolbar-item']}>
            撤销
          </div>
          <div onClick={() => redo()} className={s['toolbar-item']}>
            重做
          </div>
          <div
            onClick={() => (config.canvasState = 'locked')}
            className={s['toolbar-item']}>
            完成
          </div>
        </div>
      </div>
    </Draggable>
  );
}

export function CanvasFixedToolbar() {
  const { config } = useCanvasConfig('canvasState');
  return (
    <div style={{ position: 'absolute', top: 0 }} className={s.toolbar}>
      <div className={s['toolbar-non-draggable']}>
        <div
          onClick={() => (config.canvasState = 'normal')}
          className={s['toolbar-item']}>
          开始
          <br />
          绘制
        </div>
        {config.canvasState === 'hidden' ? (
          <div
            onClick={() => (config.canvasState = 'locked')}
            className={s['toolbar-item']}>
            显示
          </div>
        ) : (
          <div
            onClick={() => (config.canvasState = 'hidden')}
            className={s['toolbar-item']}>
            隐藏
          </div>
        )}
      </div>
    </div>
  );
}
