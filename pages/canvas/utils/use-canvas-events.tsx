import { useEffect } from 'react';
import { CanvasDescriptor } from '../context/descriptor';
import { ChalkDrawable } from '../drawable/chalk-drawable';
import { PathDrawable } from '../drawable/path-drawable';
import { PathWithStrokeDrawable } from '../drawable/path-with-stroke-drawable';
import { mouseToTouchInit } from './mouse-to-touch';

type TouchEventHandler = (e: TouchEvent) => void;
type TouchAdapter = {
  touchStart: TouchEventHandler;
  touchMove: TouchEventHandler;
  touchEnd: TouchEventHandler;
  touchCancel: TouchEventHandler;
};

function mouseToTouchAdapter(getEventHandler: () => TouchAdapter) {
  return (e: PointerEvent) => {
    const isTouch = e.pointerType === 'touch';
    if (isTouch) {
      // 触控事件由 touch 系列事件解决
      return;
    }
    const { touchStart, touchMove, touchEnd, touchCancel } = getEventHandler();
    const touchInit = mouseToTouchInit(e);
    const init: TouchEventInit = {
      touches: [new Touch(touchInit)],
      changedTouches: [new Touch(touchInit)],
    };

    const typeMap = {
      pointerdown: ['touchstart', touchStart],
      pointermove: ['touchmove', touchMove],
      pointerup: ['touchend', touchEnd],
      pointercancel: ['touchcancel', touchCancel],
    } as const;
    const { type } = e;
    if (!(type in typeMap)) {
      return;
    }
    const next = typeMap[type as keyof typeof typeMap];
    const [newEvent, eventHandler] = next;
    const touchEvent = new TouchEvent(newEvent, init);
    Reflect.set(touchEvent, 'isMouse', !isTouch);
    eventHandler(touchEvent);
  };
}

export function useCanvasEvents(desc: CanvasDescriptor) {
  useEffect(() => {
    const canvas = desc.mainCanvas!;
    const { acceptedTouches } = desc;

    let adapter: TouchAdapter;
    const mouseEventHandler = mouseToTouchAdapter(() => adapter);

    const touchStart = (event: TouchEvent & { isMouse?: boolean }) => {
      const { config } = desc;
      const touches = event.changedTouches;
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const accepted =
          // eslint-disable-next-line no-nested-ternary
          config.type === 'chalk'
            ? new ChalkDrawable(desc, config)
            : config.type === 'stroke'
            ? new PathWithStrokeDrawable(desc, config)
            : new PathDrawable(desc, config);
        acceptedTouches.set(touch.identifier ?? Infinity, accepted);
        accepted.track(touch);
        desc.draw?.();
      }
      if (event.isMouse) {
        document.addEventListener('pointermove', mouseEventHandler);
        document.addEventListener('pointerup', mouseEventHandler);
      } else if (acceptedTouches.size === 1) {
        document.addEventListener('touchmove', touchMove);
        document.addEventListener('touchend', touchEnd);
        document.addEventListener('touchleave', touchCancel);
        document.addEventListener('touchcancel', touchCancel);
      }
    };

    const removeListenerIfClear = () => {
      if (acceptedTouches.size === 0) {
        document.removeEventListener('pointermove', mouseEventHandler);
        document.removeEventListener('pointerup', mouseEventHandler);

        document.removeEventListener('touchmove', touchMove);
        document.removeEventListener('touchend', touchEnd);
        document.removeEventListener('touchleave', touchCancel);
        document.removeEventListener('touchcancel', touchCancel);
      }
    };

    const touchMove = (event: TouchEvent) => {
      const touches = event.changedTouches;

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const id = touch.identifier ?? Infinity;
        const accepted = acceptedTouches.get(id);

        if (accepted) {
          accepted.track(touch);
        } else {
          // not accepted
        }
      }
      desc.draw?.();
    };

    const touchEnd = (event: TouchEvent) => {
      const touches = event.changedTouches;

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const id = touch.identifier ?? Infinity;
        const accepted = acceptedTouches.get(id);

        if (accepted) {
          accepted.commit();
          desc.committedDrawable.push(accepted);
          acceptedTouches.delete(id);
        } else {
          // not accepted
        }
      }
      desc.draw?.();
      removeListenerIfClear();
    };

    const touchCancel = (event: Event) => {
      const touches = (event as TouchEvent).changedTouches ?? [];

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const id = touch.identifier ?? Infinity;
        const accepted = acceptedTouches.get(id);

        if (accepted) {
          acceptedTouches.delete(id);
        } else {
          // not accepted
        }
      }
      removeListenerIfClear();
    };

    adapter = { touchStart, touchMove, touchEnd, touchCancel };

    const mouseMove = (e: MouseEvent) => {
      desc.mouseOverEvent = e;
      desc.draw?.();
    };
    const mouseOut = () => {
      desc.mouseOverEvent = undefined;
      desc.draw?.();
    };

    canvas.addEventListener('touchstart', touchStart);
    canvas.addEventListener('pointermove', mouseMove);
    canvas.addEventListener('pointerout', mouseOut);
    canvas.addEventListener('pointerdown', mouseEventHandler);
    desc.draw?.();
    return () => {
      canvas.removeEventListener('touchstart', touchStart);
      canvas.removeEventListener('pointermove', mouseMove);
      canvas.removeEventListener('pointerout', mouseOut);
      canvas.removeEventListener('pointerdown', mouseEventHandler);
    };
  }, [desc]);
}
