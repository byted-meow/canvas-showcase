export function mouseToTouchInit(e: MouseEvent): TouchInit {
  const { clientX, clientY, pageX, pageY, target, screenX, screenY } = e;
  return {
    clientX,
    clientY,
    pageX,
    pageY,
    force: 1,
    radiusX: 0,
    radiusY: 0,
    identifier: Infinity,
    target: target!,
    rotationAngle: 0,
    screenX,
    screenY,
  };
}
