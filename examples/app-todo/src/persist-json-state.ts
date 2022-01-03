import { StateVar, state } from 'lit-shared-state';
/**
 * persists any json-serializable state in localStorage
 */
export function statePersist(
  prefix: string = '',
  stateDecorator: any = state
): any {
  const opts = {
    // save to local storage and sync in-memory value
    store(stateVar: StateVar, v: unknown) {
      const key = `${prefix}.${stateVar.key}`;
      // store state in local storage, don't forget to notify
      if (v === undefined) {
        localStorage.removeItem(key);
        stateVar.value = undefined;
      } else {
        const serialized = JSON.stringify(v);
        localStorage.setItem(key, serialized);
        stateVar.value = v;
      }
    },
    // load from in-memory value
    load(stateVar: StateVar): unknown {
      return stateVar.value;
    },
    // initialize in-memory value from local storage
    init(stateVar: StateVar, value?: unknown): unknown {
      // this actually leads to a call of the load method above
      // returns initial value by default
      const key = `${prefix}.${stateVar.key}`;
      const stored = localStorage.getItem(key);
      try {
        return stored ? JSON.parse(stored) : value;
      } catch (e) {
        console.warn(e);
        return value;
      }
    },
  };
  return function (optionsOrTarget: Object, propertyKey: string) {
    if (!propertyKey) {
      return stateDecorator({ ...opts, ...optionsOrTarget });
    }
    return stateDecorator(opts)(optionsOrTarget, propertyKey);
  };
}
