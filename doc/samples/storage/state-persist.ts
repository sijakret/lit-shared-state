import { state, StateVar } from 'lit-shared-state';

// reusable decorator with options already applied
export const statePersist = state({
  // save to local storage
  store(stateVar: StateVar, v: string) {
    // store state in local storage, don't forget to notify
    localStorage.setItem(stateVar.key, JSON.stringify(v));
    stateVar.notifyObservers();
  },
  // load from local storage, fall back to undefined
  load(stateVar: StateVar) {
    const stored = localStorage.getItem(stateVar.key);
    return stored ? JSON.parse(stored) : undefined;
  },
  // initialize from local storage
  init(stateVar: StateVar) {
    // this actually leads to a call of the load method above
    return stateVar.options.load(stateVar);
  },
});
