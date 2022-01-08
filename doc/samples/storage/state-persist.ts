import { ReadonlyStateVar, StateOptions, StateVar } from 'lit-shared-state';

// reusable set/get/init options that (de-)serialize JSON
export const persist: StateOptions = {
  // save to local storage
  set(stateVar: StateVar, v: string) {
    // store state in local storage, don't forget to notify
    localStorage.setItem(stateVar.key, JSON.stringify(v));
    stateVar.notifyObservers();
  },
  // load from local storage, fall back to undefined
  get(stateVar: ReadonlyStateVar) {
    const stored = localStorage.getItem(stateVar.key);
    return stored ? JSON.parse(stored) : undefined;
  },
  // initialize from local storage
  init(stateVar: ReadonlyStateVar, valueInit?: unknown) {
    // this actually leads to a call of the load method above
    // falls back to initializer value
    return stateVar.options.get(stateVar) || valueInit;
  },
};
