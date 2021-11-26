import { PathDrawable } from './path-drawable';

export class LineDrawable extends PathDrawable {
  draw() {
    const events = this.getEvents();
    if (this.getCache()) {
      super.draw();
      return;
    }
    if (events.length < 2) {
      return;
    }
    const [start] = events;
    const [end] = events.slice(-1);
    super.draw([start, end]);
  }

  commit() {
    const events = this.getEvents();
    const [start] = events;
    const [end] = events.slice(-1);
    super.commit([start, end]);
  }
}
