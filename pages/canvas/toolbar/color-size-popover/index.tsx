import { CirclePicker, HuePicker } from 'react-color';
import Tippy from '@tippyjs/react';
import React, { useRef } from 'react';
import clsx from 'clsx';
import { useCanvasConfig } from '../../context';

import s from '../index.module.css';
import { BrushType } from '../../context/config';

type Instance = Parameters<
  NonNullable<React.ComponentProps<typeof Tippy>['onCreate']>
>[0];

interface ColorSizePopoverProps {
  type: BrushType;
  text: string;
}

export function ColorSizePopover(props: ColorSizePopoverProps) {
  const { type, text } = props;
  const { config } = useCanvasConfig();
  const instanceRef = useRef<Instance | null>(null);
  const updateColor = (next: string) => {
    config.color = next;
  };
  return (
    <Tippy
      trigger={config.type === type ? 'click' : 'manual'}
      interactive={true}
      onCreate={instance => (instanceRef.current = instance)}
      onDestroy={() => (instanceRef.current = null)}
      onClickOutside={instance => instance.hide()}
      content={
        <div
          className={s['popover-content']}
          onMouseLeave={() => instanceRef.current?.hide()}>
          <div className={s['item-wrapper']}>
            <CirclePicker
              color={config.color}
              onChange={(e: any) => updateColor(e.hex)}
              onChangeComplete={(c: any) => updateColor(c.hex)}
            />
          </div>
          <div className={s['item-wrapper']}>
            <HuePicker
              width={240}
              color={config.color}
              onChange={(e: any) => updateColor(e.hex)}
              onChangeComplete={(c: any) => updateColor(c.hex)}
            />
          </div>
          <div className={s['item-wrapper']}>
            <input
              type="range"
              min={1}
              max={100}
              value={config.lineWidth}
              onChange={e => (config.lineWidth = Number(e.target.value))}
            />
            <span>{config.lineWidth}</span>
          </div>
        </div>
      }>
      <div
        onClick={() => (config.type = type)}
        className={clsx(s['toolbar-item'], config.type === type && s.active)}>
        {text}
      </div>
    </Tippy>
  );
}
