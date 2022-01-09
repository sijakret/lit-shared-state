import { keep, locked } from 'lit-shared-state';
import { plainToClass, instanceToPlain, Type } from 'class-transformer';
import 'reflect-metadata'; // needed for @Type decorator

export abstract class HistoryStateInterface<T> {
  history: string[] = [];
  pos: number = 0;
  abstract add(checkpoint: T): void;
  abstract setPosition(pos: number): void;
  abstract reset(): void;
}

export function makeHistory<T>(
  onTravel: (state?: string) => void,
  STORAGE_KEY = 'history'
): HistoryStateInterface<T> {
  let travelling = false;
  /**
   * decorate the locked realm with the json persistence
   * and export state decorator + unlocker
   * these are specific to the todo list state only!
   */
  const { state, unlock } = locked();

  @state({ observers: [serialize] })
  class HistoryState<T> {
    // all recorded states (in serialized form)
    // initial state is empty
    history: string[] = [''];
    // current history position
    pos: number = 0;

    @unlock()
    add(checkpoint: T) {
      if (!travelling) {
        // make sure to clone states
        const serialized = JSON.stringify(instanceToPlain(checkpoint));
        this.history = [...this.history.slice(0, this.pos + 1), serialized];
        this.pos = this.history.length - 1;
      }
    }

    @unlock()
    setPosition(pos: number) {
      this.pos = Math.max(Math.min(this.history.length - 1, pos), 0);
      travelling = true;
      onTravel(this.history[this.pos]);
      travelling = false;
    }

    @unlock()
    reset(init: T) {
      this.pos = 0;
      this.history = [];
      this.add(init);
      this.setPosition(0);
    }
  }

  let historyState: HistoryState<T> | undefined = undefined;

  function serialize() {
    if (historyState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historyState));
    }
  }

  unlock(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      historyState = plainToClass(HistoryState, JSON.parse(stored));
    }
  });

  historyState = historyState || new HistoryState<T>();

  return historyState as HistoryStateInterface<T>;
}
