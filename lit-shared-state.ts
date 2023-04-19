import {
  PropertyDeclaration,
  ReactiveController,
  ReactiveControllerHost,
} from 'lit';

/**
 * Options for creating a state object.
 * Apply for all properties in a state via @state(options)
 * or for individual properties via @options(options) decorator.
 */
export interface StateOptions<T = any> {
  /**
   * overrides logic to store state
   * runs everytime stateVar is asigned a new value.
   *
   * Is allowed to set stateVar.value
   *
   * IMPORTANT: if you do NOT set stateVar.value you need to call
   * stateVar.notifyObservers() to indicate data has updated.
   */
  set?: (stateVar: StateVar<T>, value: T | undefined) => void;
  /**
   * Overrides logic to load state.
   * Runs everytime stateVar is ready anywhere.
   * method needs to return current value!
   */
  get?: (stateVar: ReadonlyStateVar<T>) => T | undefined;
  /**
   * Overrides logic to initialize state.
   * Method needs to return initial value value!
   * @param value: default initialization value
   */
  init?: ((stateVar: ReadonlyStateVar<T>, value?: T) => T | undefined) | null;
  /**
   * All observers will be called everytime the value of state var changes.
   */
  observers?: ((changed: Set<ReadonlyStateVar<T>>) => void)[];
  /**
   * If true observers will already be notified on init.
   */
  notifyOnInit?: boolean;
  /**
   * Used internally to provide a lock for avariable.
   */
  lock?: Lock | null;
  /**
   * If true state objects will not be sealed automatically.
   */
  noSeal?: boolean;
}

export function state<T extends { new (...args: any[]): any }>(
  stateOptions?: StateOptions
) {
  return function (constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        __parents.set(this, []);
        Object.keys(this).forEach((propKey) => {
          const desc = Object.getOwnPropertyDescriptor(this, propKey);
          if (desc?.writable) {
            defineState(constructor, this, propKey, stateOptions, desc.value);
          }
        });
        const optional = __optionals.get(constructor.prototype);
        if (optional) {
          for (const propKey of optional) {
            if (!Object.getOwnPropertyDescriptor(this, propKey)) {
              defineState(constructor, this, propKey, stateOptions);
            }
          }
        }
        // make sure no new properties are added
        !stateOptions?.noSeal && Object.seal(this);
      }
    };
  };
}

/**
 * helper to update parent/child relationships iof state vars
 */
function updateAncestory<T>(stateVar: StateVar<T>, value: T, propKey: string) {
  if (stateVar.value instanceof Object && __parents.has(stateVar.value)) {
    // remove parent
    __parents.set(
      stateVar.value,
      (__parents.get(stateVar.value) as Ancestor[]).filter(
        ({ parent }) => parent != stateVar
      )
    );
  }
  if (value instanceof Object && __parents.has(value)) {
    __parents.get(value)?.push({ parent: stateVar as StateVar, propKey });
  }
  if (value instanceof Array) {
    for (const v of value) {
      if (v instanceof Object && __parents.has(v)) {
        __parents.get(v)?.push({ parent: stateVar as StateVar, propKey });
      }
    }
  }
}

/**
 * helper to define state properties
 */
function defineState<T>(
  constructor: any,
  object: any,
  propKey: string,
  stateOptions?: StateOptions,
  value?: T
) {
  const options = defaultOptions(
    chainOptions(constructor, propKey, stateOptions)
  );
  const stateVar = new StateVar(object, propKey, options, value);
  // ancestory tracking
  updateAncestory(stateVar, value, propKey);

  // derfine prop
  Object.defineProperty(object, propKey, {
    enumerable: true,
    set(value: any) {
      if (stateVar.options.lock && stateVar.options.lock.symbol !== __lock) {
        throw new AccessError(stateVar.key);
      }
      // ancestory tracking
      updateAncestory(stateVar, value, propKey);
      stateVar.options.set(stateVar, value);
    },
    get() {
      __currentController && stateVar.observers.add(__currentController);
      return stateVar?.options.get(stateVar);
    },
  });
}

/**
 * Instance of a tracked state field.
 */
export class StateVar<T = unknown> {
  public observers = new Set<StateController>();

  constructor(
    public parent: Object,
    public key: string,
    public options: Required<StateOptions<T>>,
    public _value?: T
  ) {
    if (this.options.init) {
      this._value = this.options.init(this, _value);
      options.notifyOnInit && this.notifyObservers(this.key, undefined);
    }
  }

  get value(): T | undefined {
    return this._value;
  }
  set value(value: T | undefined) {
    const old = this._value;
    this._value = value;
    this.notifyObservers(this.key, old);
  }

  /**
   * notifies all LitElement observers and all explicitly passed observers
   */
  notifyObservers(name: PropertyKey, oldValue: unknown) {
    // litElements
    for (const observer of this.observers.keys()) {
      observer.update(name, this._value, oldValue);
    }
    // custom observers
    for (const observer of this.options.observers) {
      __currentTransaction
        ? __currentTransaction.deferr(observer, this)
        : observer(new Set([this]));
    }
    // parent states
    const parents = __parents.get(this.parent) as Ancestor[];
    for (const { parent } of parents) {
      parent.notifyObservers(name, oldValue);
    }
  }
}

/**
 * Method Decorator, also takes callback
 *
 * Annotated methods will only lead to one invocation of dependant observers.
 *
 * ```typescript
 * const {transaction} = locked();
 *
 * class Actions {
 *
 *   @transaction()
 *   complexMutation() {
 *      // all of these state mutations will only lead to one invocation
 *      // for each observer
 *      state.count *= 2;
 *      state.array = [...state.array, state.count];
 *      // ...
 *   }
 * }
 *
 * // also possible
 * transaction(() => {
 *   state.count *= 2;
 *   state.array = [...state.array, state.count];
 * })
 *
 * ```
 */
export function transaction(
  target?: Object | (() => any),
  propertyKey?: string,
  descriptor?: PropertyDescriptor
): any {
  // decorator
  if (!(target instanceof Function)) {
    if (propertyKey && descriptor) {
      let old = descriptor.value;
      descriptor.value = function (...args: any[]) {
        return transaction(() => old.apply(this, args));
      };
    } else {
      return transaction;
    }
  } else {
    // callback
    Transaction.execute(target as () => any);
  }
}

let __currentTransaction: Transaction | undefined = undefined;
class Transaction {
  deferred = new Map<(arg?: any) => void, Set<any>>();

  static execute(callback: () => void) {
    const popped = __currentTransaction;
    const transaction = (__currentTransaction = new Transaction());
    callback();
    transaction.runDeferred();
    __currentTransaction = popped;
  }

  deferr(callback: (arg?: any) => void, arg: any) {
    let cb = this.deferred.get(callback);
    cb = cb || new Set();
    cb.add(arg);
    this.deferred.set(callback, cb);
  }

  protected runDeferred() {
    for (const [callback, args] of this.deferred.entries()) {
      callback(args);
    }
  }
}

/**
 * Read only version of StateVar where value shall not be mutated.
 */
export abstract class ReadonlyStateVar<T = unknown> extends StateVar<T> {
  public abstract get value(): T | undefined;
  protected abstract set value(_value: T | undefined);
}

/**
 * helper to create default options
 */
function defaultOptions({
  observers = [],
  notifyOnInit = false,
  noSeal = false,
  lock = null,
  init = function init<V>(_stateVar: ReadonlyStateVar<V>, v: V) {
    return v;
  },
  set = function set<V>(stateVar: StateVar<V>, v: V) {
    if (stateVar.value !== v) {
      stateVar.value = v;
    }
  },
  get = function get<V>(stateVar: ReadonlyStateVar<V>) {
    return stateVar.value;
  },
}: StateOptions = {}): Required<StateOptions> {
  return { lock, set, get, init, observers, notifyOnInit, noSeal };
}

/**
 * Property Decorator
 *
 * Used to pull state into a LitElement.
 *
 * ```typescript
 * @state()
 * class MyState {
 *   count = 1
 *   // ..
 * }
 * const myState = new MyState()
 * // ..
 * class Component extends LitElement {
 *    @use state = myState;
 *    // ..
 *    render() { return html`${this.state.count}` }
 * }
 * ```
 */
export function use() {
  return function (_target: Object, propertyKey: string): any {
    const symbol = Symbol(propertyKey);
    const controllerSymbol = Symbol(propertyKey);
    return {
      set: function (state: any) {
        this[controllerSymbol] = new StateController(
          this as unknown as ReactiveControllerHost,
          propertyKey
        );
        this[symbol] = state;
      },
      get: function () {
        // when we access a statevar through controller
        // we set it as the current one
        __currentController = this[controllerSymbol];
        const state = this[symbol];
        return state;
      },
    };
  };
}

/**
 * Property Decorator
 *
 * optional state properties need to be annotated with this for proper tracking.
 *
 * ```typescript
 * @state()
 * class MyState {
 *   @keep() count?:number; // <- @keep() is important here
 *   otherCount:number = 1; // @keep() is not needed here
 * }
 * ```
 */
export function keep() {
  return function (target: Object, propKey: string): void {
    const set = __optionals.get(target) || new Set<string>();
    set.add(propKey);
    __optionals.set(target, set);
  };
}
const __optionals = new WeakMap<Object, Set<string>>();

/**
 * Property Decorator
 *
 * Applies options per field.
 *
 * @param options custom options for per state field
 *
 * ```typescript
 * const options = {
 *   notifyOnInit: true
 *   // ..
 * }
 * @state(options) // inherited by all state vars
 * class MyState {
 *   // overrides options from @state(..)
 *   @options({ notifyOnInit: false}) count = 1
 *   // ..
 * }
 * ```
 */
export function options(options: StateOptions) {
  return function (target: Object, propKey: string): void {
    chainOptions(target.constructor, propKey, {}, options);
  };
}

/**
 * Generator function
 *
 * Generates a isolated set of decorators (state, options, unlock).
 * State defined with @state() can only be modified using @unlock().
 *
 * ```typescript
 * const {state,unlock} = locked();
 *
 * @state() // inherited by all state vars
 * class MyState {
 *   // assignments to state can ONLY be done from unlocked context
 *   count = 1
 *   // ..
 * }
 * const myState = new myState();
 *
 * myState.count++; // <- this will throw an instance of AccessError
 * unlock(() => myState.count++ ); // this will increment myState.count
 *
 * // unlock can also be used as a method decorator
 * class Actions {
 *   @unlock()
 *   increment() {
 *     myState.count++; // <- this will also work
 *   }
 * }
 * ```
 */
export function locked() {
  const lock = key();
  return {
    state: function lockedState(stateOptions: StateOptions = {}) {
      return state({ lock, ...stateOptions });
    },
    options: function lockedOptions(stateOptions: StateOptions = {}) {
      return options({ lock, ...stateOptions });
    },
    unlock: function unlockState(
      target?: Object | (() => any),
      propertyKey?: string,
      descriptor?: PropertyDescriptor
    ): any {
      // decorator
      if (!(target instanceof Function)) {
        if (propertyKey && descriptor) {
          let old = descriptor.value;
          descriptor.value = function (...args: any[]) {
            return lock(() => old.apply(this, args));
          };
        } else {
          return unlockState;
        }
      } else {
        // callback
        lock(target as () => any);
      }
    },
  };
}

/**
 * helper to merge options
 */
function chainOptions(
  object: Object,
  propKey: string,
  optionsBefore: StateOptions = {},
  optionsAfter: StateOptions = {}
) {
  let t = __options.get(object);
  if (!t) {
    t = new Map<string, Object>();
    __options.set(object, t);
  }
  const o = { ...optionsBefore, ...(t.get(propKey) || {}), ...optionsAfter };
  t.set(propKey, o);
  return o;
}

/**
 * Simplistic state controller that enqueus updates in an LitElement
 */
class StateController implements ReactiveController {
  constructor(
    private host: ReactiveControllerHost,
    private propertyKey: string
  ) {
    host.addController(this);
  }
  update(name: PropertyKey, value: unknown, oldValue: unknown) {
    const poppedController = __currentController;
    // controller will be added as dep to all state vars that are accessed moving forward
    __currentController = this;
    (
      this.host.requestUpdate as (
        name?: PropertyKey,
        oldValue?: unknown,
        options?: PropertyDeclaration
      ) => unknown
    )(`${this.propertyKey}.${String(name)}`, oldValue, {
      hasChanged: (_value: unknown, _oldValue: unknown) => {
        return value !== oldValue && (oldValue === oldValue || value === value);
      },
    });
    this.host.updateComplete.then(() => {
      // pop from controller stack
      __currentController = poppedController;
    });
  }
  hostConnected() {
    this.host.updateComplete.then(() => {
      // pop from controller stack after initial render
      __currentController = undefined;
    });
  }
}

/**
 * helper that returns a key that can be used to lock a state
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
 * Thrown when accessing locked state from a locked.
 */
export class AccessError extends Error {
  constructor(name: string) {
    super(`Access to '${name}' is locked. Needs unlocked context for access!`);
  }
}

/**
 * Logs access to state vars.
 *
 * Pass via @options(log) when declaring state.
 *
 * ```typescript
 * class State {
 *   @state({...log, ..more options.. }) myField = 'test';
 * }
 * ```
 */
const style1 = `background: #e53e3e; border: 1px solid black; border-radius: 4px; color: #000000;`;
const style2 = `background: #55ad67; border: 1px solid black; border-radius: 4px; color: #000000;`;
export const log: StateOptions = {
  set<V>(stateVar: StateVar<V>, v: V) {
    console.log(`%c STORE ${stateVar.key} `, style1, stateVar.value, `=>`, v);
    return defaultOptions().set(stateVar, v);
  },
  get<V>(stateVar: StateVar<V>) {
    console.log(`%c LOAD  ${stateVar.key} `, style2, stateVar.value);
    return defaultOptions().get(stateVar);
  },
};

/**
 * tracks options per object
 */
const __options = new WeakMap<Object, Map<string, StateOptions>>();

/**
 * all states pointing to their parents
 */
const __parents = new WeakMap<Object, Ancestor[]>();
type Ancestor = {
  propKey: string;
  parent: StateVar;
};

/**
 * used during dependency tracking
 */
let __currentController: StateController | undefined;

/**
 * current lock
 */
type Lock = ((callback: () => any) => any) & { symbol: Symbol };
let __lock: symbol | null = null;
