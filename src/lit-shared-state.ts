import { LitElement, ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Options for creating a state object
 */
export interface StateOptions<T = unknown> {
  /**
   * override logic to store state
   */
  store?: (stateVar: StateVar<T>, value: T | undefined) => void;
  /**
   * override logic to load state
   */
  load?: (stateVar: StateVar<T>) => T | undefined;
  /**
   * override logic to initialize state
   * @param value: default initialization value
   */
  init?: ((stateVar: StateVar<T>, value?: T) => T | undefined) | null;
  /**
   * all observers will be called everytime the value of state var changes
   */
  observers?: ((stateVar: StateVar<T>) => void)[];
  /**
   * used internally to provide a lock for avariable
   */
  lock?: Lock | null;
  /**
   * used internally for @lockedEmptyState decorators
   */
  empty?: boolean;
}

type Lock = ((callback: () => any) => any) & { symbol: Symbol };

/**
 * Property Decorator
 * Used to declare state variables in state Objects
 * and to use them in LitElement components
 *
 * ```typescript
 * class State {
 *   @ state field = 'value';
 * }
 * const myState = new State();
 *
 * //..
 * class Comp extends LitElement{
 *   @ state state = myState;
 *
 *   render() {
 *     //use this.state.field..
 *   }
 * }
 * ```
 */
export function state<
  V,
  T extends LitElement | Object | StateOptions<V> = StateOptions<V>
>(target?: T, propertyKey?: string): any {
  /**
   * declares state variables in state object
   */
  function declareStateVar(opts?: StateOptions<V>) {
    return function (_target: Object, propertyKey: string): any {
      const initialized = Symbol('initializing');
      return {
        set: function (value: V | undefined) {
          const stateVar = ensureStateVar(this, propertyKey, opts);
          if (!this[initialized] && stateVar.options.init) {
            value = stateVar.options.init(stateVar, value);
          }
          const { options } = stateVar;
          if (options.lock && options.lock.symbol !== __lock) {
            if (this[initialized] || options.empty) {
              // initialization is allowed
              throw new AccessError(propertyKey);
            }
          }
          this[initialized] = true;
          options.store(stateVar, value);
        },
        get: function () {
          const stateVar = ensureStateVar(this, propertyKey, opts);
          if (!this[initialized] && stateVar.options.init) {
            // drive-by init
            stateVar.value = stateVar.options.init(stateVar);
          }
          this[initialized] = true;
          // track access
          if (stateVar && __currentController) {
            stateVar.observers.add(__currentController);
          }
          return stateVar.options.load(stateVar);
        },
      };
    };
  }

  /**
   * declares usage of state variables in LitElement classes
   */
  function useState(/*options?: UseStateOptions*/) {
    return function (_target: Object, propertyKey: string): any {
      const symbol = Symbol(propertyKey);
      const controllerSymbol = Symbol(propertyKey);
      return {
        set: function (state: StateVar) {
          this[controllerSymbol] = new StateController(
            this as unknown as ReactiveControllerHost
            /*, state */
          );
          this[symbol] = state;
        },
        get: function () {
          __currentController = this[controllerSymbol];
          const state = this[symbol];
          return state;
        },
      };
    };
  }
  function invoker(options?: StateOptions<V>) {
    return function (target: Object, propertyKey: string) {
      return target instanceof LitElement
        ? useState(/*options as UseStateOptions*/)(target, propertyKey) // use store in LitElement class
        : //  propertyKey ?
          declareStateVar(options as StateOptions<V>)(target, propertyKey);
      // : declareState((options as any) || target); // declare store
    };
  }
  return target && propertyKey
    ? invoker()(target, propertyKey) // property decorator w/o options
    : invoker(target as StateOptions<V>); // property decorator with options
}

/**
 * Simplistic state controller that enqueus updates in an LitElement
 */
class StateController implements ReactiveController {
  constructor(private host: ReactiveControllerHost /*, state: StateVar*/) {
    host.addController(this);
  }
  update() {
    const poppedController = __currentController;
    __currentController = this;
    this.host.requestUpdate();
    this.host.updateComplete.then(() => {
      __currentController = poppedController;
    });
  }
  hostConnected() {
    this.host.updateComplete.then(() => {
      __currentController = undefined;
    });
  }
}

/**
 * Main class that wraps a state variable
 */
export class StateVar<T = unknown> {
  public observers = new Set<StateController>();
  public options: Required<StateOptions<T>>;
  constructor(
    public key: string,
    options?: StateOptions<T>,
    public _value?: T
  ) {
    this.options = defaultOptions(options as StateOptions) as Required<
      StateOptions<T>
    >;
  }

  set value(v: T | undefined) {
    this._value = v;
    this.notifyObservers();
  }
  get value(): T | undefined {
    return this._value;
  }

  /**
   * notifies all LitElement observers and all explicitly passed observers
   */
  notifyObservers() {
    for (const observer of this.observers.keys()) {
      observer.update();
    }
    for (const observer of this.options.observers) {
      observer(this);
    }
  }
}

/**
 * default load and store logic
 */
function store<V>(stateVar: StateVar<V>, v: V) {
  if (stateVar.value !== v) {
    stateVar.value = v;
  }
}
function load<V>(stateVar: StateVar<V>) {
  return stateVar.value;
}

let __defaultOptions: Required<StateOptions> = {
  init: null,
  store,
  load,
  empty: false,
  observers: [],
  lock: null,
};

/**
 * helper to create default options
 */
function defaultOptions({
  init = __defaultOptions.init,
  store = __defaultOptions.store,
  load = __defaultOptions.load,
  lock = __defaultOptions.lock,
  observers = __defaultOptions.observers,
  empty = __defaultOptions.empty,
}: StateOptions = {}): Required<StateOptions> {
  return { empty, observers, init, store, load, lock };
}

/**
 * helper to create a state var in global states object
 */
function ensureStateVar<V>(
  instance: Object,
  propertyKey: string,
  options?: StateOptions<V>
): StateVar<V> {
  const instanceStates = __states.get(instance) || new Map<string, StateVar>();
  if (instanceStates.has(propertyKey)) {
    return instanceStates.get(propertyKey) as StateVar<V>;
  }
  const stateVar = new StateVar<V>(propertyKey, options);
  instanceStates.set(propertyKey, stateVar as StateVar<unknown>);
  __states.set(instance, instanceStates);
  return stateVar;
}

/**
 * Generates an isolated set of decorators
 * for defining, locking and unlocking state
 *
 * ```typescript
 * const {
 *   lockedState,
 *   lockedEmptyState
 *   unlockState,
 * } = makeLockedState();
 *
 * // use as decorators
 * class State {
 *   @lockedState field = 'test';
 * }
 * const myState = new State();
 * unlockState(() => { myState.field = 'changed' });
 * ```
 */
export function makeLockedState(stateDecorator = state) {
  const _key = key();
  function generate(empty: boolean) {
    return function <V>(options?: StateOptions | Object, propertyKey?: string) {
      if (propertyKey) {
        return stateDecorator<V, LitElement | Object>({ lock: _key, empty })(
          options,
          propertyKey
        );
      }
      return stateDecorator<V, LitElement | Object>({
        ...options,
        lock: _key,
        empty,
      });
    };
  }

  return {
    state: generate(false),
    emptyState: generate(true),
    unlockState: function (
      target?: Object | (() => any),
      propertyKey?: string,
      descriptor?: PropertyDescriptor
    ) {
      // decorator
      if (propertyKey && descriptor) {
        let old = descriptor.value;
        descriptor.value = function (...args: any[]) {
          return _key(() => old.apply(this, args));
        };
      } else {
        // callback
        _key(target as () => any);
      }
    },
  };
}

const globalUnlocked = makeLockedState();

/**
 * Property Decorator
 * Same as `@state` decorator but creates locked states
 * that cannot be modified from within LitElements
 */
export const lockedState = globalUnlocked.state;

/**
 * Property Decorator
 * Same as `@state` decorator but creates locked states
 * that cannot be modified from within LitElements and
 * is expected to not be initialized
 */
export const lockedEmptyState = globalUnlocked.emptyState;

/**
 * Method Decorator/callback
 * * Annotate class methods with `@unlockState` to explicitly
 *   allow write access to state from within class methods
 * * Use with callback `unlockState(() => myState.field = 'value')`
 *   to allow write access to state from anywhwere
 */
export const unlockState = globalUnlocked.unlockState;

/**
 * returns a key that can be used to lock a state
 */
function key() {
  const symbol = Symbol();
  const key = function (callback: () => {}) {
    const l = __lock;
    __lock = symbol;
    const result = callback();
    __lock = l;
    return result;
  } as Lock;
  key.symbol = symbol;
  return key;
}

/**
 * logs access to state vars
 * pass via options when declaring state
 *
 * ```typescript
 * class State {
 *   @state({...log}) myField = 'test';
 * }
 * ```
 */
const style1 = `background: #e53e3e; border: 1px solid black; border-radius: 4px; color: #000000;`;
const style2 = `background: #55ad67; border: 1px solid black; border-radius: 4px; color: #000000;`;
export const log: StateOptions = {
  store<V>(stateVar: StateVar<V>, v: V) {
    console.log(`%c STORE ${stateVar.key} `, style1, stateVar.value, `=>`, v);
    return store(stateVar, v);
  },
  load<V>(stateVar: StateVar<V>) {
    console.log(`%c LOAD  ${stateVar.key} `, style2, stateVar.value);
    return load(stateVar);
  },
};

/**
 * thrown when trying to access locked state
 */
export class AccessError extends Error {
  constructor(name: string) {
    super(`Access to '${name}' is locked. Needs unlocked context for access!`);
  }
}

/**
 * internal module state
 */

//used during dependency tracking
let __currentController: StateController | undefined;

// tracks all states
const __states = new WeakMap<Object, Map<string, StateVar>>();

// current lock
let __lock: symbol | null = null;
