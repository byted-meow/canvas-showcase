import clsx from 'clsx';
import React, { ReactNode, useImperativeHandle, useRef } from 'react';
import { useCanvasConfig } from './context';
import { CanvasDescriptor } from './context/descriptor';
import './index.css';
import { useCanvasDpr } from './utils/use-canvas-dpr';
import { useCanvasEvents } from './utils/use-canvas-events';
import { useDimensionDetector } from './utils/use-dimension-detector';
import { useRegisterCanvas } from './utils/use-register-canvas';

export interface CanvasProps {
  children?: ReactNode;
  canvasId: string;
  containerProps?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >;
  canvasWrapperProps?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >;
  childContainerProps?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >;
  resetOnDestroy?: boolean;
}

type CanvasRef = {
  getCanvasDescriptor: () => CanvasDescriptor;
  getCanvasData: () => string;
};

export const Canvas = React.forwardRef<CanvasRef, CanvasProps>(function Canvas(
  props,
  ref,
) {
  const { children, canvasId, resetOnDestroy } = props;
  const { containerProps, canvasWrapperProps, childContainerProps } = props;
  const { desc, mainRef } = useRegisterCanvas(canvasId, resetOnDestroy);

  const containerRef = useRef<HTMLDivElement>(null!);
  const { dimension } = useDimensionDetector(containerRef);
  const { config, contextProps } = useCanvasConfig('canvasState');
  const { width, height } = useCanvasDpr({
    dimension,
    desc,
    dimensionLimit: contextProps.dimensionLimit,
  });

  useCanvasEvents(desc);
  const { canvasState } = config;

  useImperativeHandle(
    ref,
    () => ({
      getCanvasDescriptor() {
        return desc;
      },
      getCanvasData() {
        return desc.mainCanvas?.toDataURL() || 'data:image/png;base64,';
      },
    }),
    [desc],
  );

  return (
    <div
      ref={containerRef}
      {...containerProps}
      className={clsx('canvas-layout-container', containerProps?.className)}>
      <div
        {...canvasWrapperProps}
        className={clsx(
          'canvas-absolute-wrapper',
          canvasWrapperProps?.className,
        )}>
        <div style={{ ...dimension }} className="canvas-inner-wrapper">
          <canvas
            width={width}
            height={height}
            ref={mainRef}
            style={{
              ...dimension,
              visibility: canvasState === 'hidden' ? 'hidden' : undefined,
              pointerEvents: canvasState !== 'normal' ? 'none' : undefined,
            }}
            className="main-canvas"></canvas>
        </div>
      </div>
      <div
        {...childContainerProps}
        className={clsx(
          'canvas-child-container',
          `canvas-state-${canvasState}`,
          childContainerProps?.className,
        )}>
        {children}
      </div>
    </div>
  );
});

export const useCanvasRef = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  return ref;
};
