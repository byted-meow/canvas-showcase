import Tippy from '@tippyjs/react';
import React, { useRef } from 'react';
import clsx from 'clsx';
import { useCanvasConfig } from '../../context';

import s from '../index.module.css';

type Instance = Parameters<
  NonNullable<React.ComponentProps<typeof Tippy>['onCreate']>
>[0];

export function EraserPopover() {
  const { config, clear } = useCanvasConfig();
  const instanceRef = useRef<Instance | null>(null);
  return (
    <Tippy
      trigger={config.type === 'eraser' ? 'click' : 'manual'}
      interactive={true}
      onCreate={instance => (instanceRef.current = instance)}
      onDestroy={() => (instanceRef.current = null)}
      onClickOutside={instance => instance.hide()}
      content={
        <div
          className={s['popover-content']}
          onMouseLeave={() => instanceRef.current?.hide()}>
          <div onClick={() => clear()} className={s['item-wrapper']}>
            清空画布
          </div>
          <div className={s['item-wrapper']}>
            <input
              type="range"
              min={1}
              max={100}
              value={config.eraserWidth}
              onChange={e => (config.eraserWidth = Number(e.target.value))}
            />
            <span>{config.eraserWidth}</span>
          </div>
        </div>
      }>
      <div
        onClick={() => (config.type = 'eraser')}
        className={clsx(
          s['toolbar-item'],
          config.type === 'eraser' && s.active,
        )}>
        橡皮
      </div>
    </Tippy>
  );
}
