import { state, StateVar } from 'lit-shared-state';

// create custom decorator with options already applied
export function statePersist(prefix = '') {
  return state({
    // init will be true on FIRST assignment
    store(stateVar: StateVar, val: string, init: boolean) {
      const key = `${prefix}${stateVar.key}`;
      if (init && localStorage.getItem(key) !== null) {
        // we are initializing but we already have a stored state
        // will call stateVar.notifyObservers automatically
        stateVar.value = this.load(stateVar);
      } else {
        localStorage.setItem(key, JSON.stringify(val));
        stateVar.notifyObservers();
      }
    },
    // load from local storage, fall back to undefined
    load(stateVar: StateVar) {
      const key = `${prefix}${stateVar.key}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : undefined;
    },
  });
}
