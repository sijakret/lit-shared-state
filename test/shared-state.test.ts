import { expect } from '@esm-bundle/chai';
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fixture } from '@open-wc/testing';
import {
  lockedState,
  unlockState,
  log,
  state,
  StateVar,
  lockedEmptyState,
} from '../src/lit-shared-state';

it('custom observers should work', async () => {
  let fromObserver = 0;
  class State {
    @state<number>({
      observers: [
        ({ value }) => {
          fromObserver = value as number;
        },
      ],
    })
    myNumber: number = 1;
  }
  const myState = new State();

  expect(fromObserver).to.equal(1);
  myState.myNumber = 2;
  expect(fromObserver).to.equal(2);

  // passing options to locked state should also work
  class LockedState {
    @lockedState<number>({
      observers: [
        ({ value }) => {
          fromObserver = value as number;
        },
      ],
    })
    myNumber: number = 1;
  }
  const myLockedState = new LockedState();
  expect(fromObserver).to.equal(1);
  expect(() => {
    myLockedState.myNumber = 2;
  }).to.throw();
});

it('initializer should be called when acessing unassigned var', async () => {
  let isInitialized = false;
  let defaultValue = undefined;
  class State {
    @state({
      init(_var, value) {
        defaultValue = value;
        return 1;
      },
    })
    myNumber: number = 5;

    @state({
      init(_var) {
        isInitialized = true;
        return 1;
      },
    })
    empty?: number;
  }
  const myState = new State();
  // accesses empty before init, this should call init in getter
  expect(myState.empty).to.equal(1);
  expect(isInitialized).to.equal(true);
  // should initialize
  expect(myState.myNumber).to.equal(1);
  expect(defaultValue).to.equal(5);
});

it('basic update cycle with objects work', async () => {
  type Data = {
    array: {
      name: string;
      id: number;
    }[];
  };
  class State {
    @state data?: Data;
  }
  const myState = new State();

  @customElement('c-obj')
  // @ts-ignore
  class A extends LitElement {
    @state state = myState;

    render() {
      return html`${this.state.data?.array.map(
        (d) => html`<div>${d.id}:${d.name}</div>`
      )}`;
    }
  }

  const el = (await fixture('<c-obj></c-obj>')) as LitElement;
  expect(el.renderRoot.textContent).to.equal(``);
  myState.data = {
    array: [
      { id: 0, name: 'jane' },
      { id: 1, name: 'john' },
    ],
  };
  await el.updateComplete;
  expect(el.renderRoot.textContent).to.equal(`0:jane1:john`);
  myState.data = {
    array: [
      { id: 0, name: 'jane' },
      { id: 1, name: 'john' },
      { id: 2, name: 'tom' },
    ],
  };
  await el.updateComplete;
  expect(el.renderRoot.textContent).to.equal(`0:jane1:john2:tom`);
});

it('render calls should be lazy', async () => {
  class State {
    @state() myUsedState: number = 1;
    @state myUnusedState: number = 1;
  }
  const myState = new State();
  let numRenderCalls = 0;

  @customElement('c5-a')
  // @ts-ignore
  class A extends LitElement {
    @state() state = myState;

    render() {
      numRenderCalls++;
      return html`${this.state.myUsedState}`;
    }
  }

  const el = (await fixture('<c5-a></c5-a>')) as LitElement;
  expect(el.renderRoot.textContent).to.equal(`${myState.myUsedState}`);
  expect(numRenderCalls).to.equal(1);
  myState.myUsedState++;
  await el.updateComplete;
  expect(numRenderCalls).to.equal(2);
  myState.myUnusedState++;
  await el.updateComplete;
  expect(numRenderCalls).to.equal(2);
  myState.myUnusedState++;
  await el.updateComplete;
  expect(numRenderCalls).to.equal(2);
  // subsequent updates should only generate one render call
  myState.myUsedState++;
  myState.myUsedState++;
  myState.myUsedState++;
  await el.updateComplete;
  expect(numRenderCalls).to.equal(3);
  myState.myUsedState--;
  await el.updateComplete;
  expect(numRenderCalls).to.equal(4);

  // by default if a comparison === by reference is true no update will run
  myState.myUsedState = myState.myUsedState;
  await el.updateComplete;
  expect(numRenderCalls).to.equal(4);
});

it('computed getters should work', async () => {
  class State {
    @state myNumber: number = 1;
    get computed() {
      return this.myNumber * 2;
    }
  }
  const myState = new State();

  @customElement('c0-a')
  // @ts-ignore
  class A extends LitElement {
    @state state = myState;

    render() {
      return html`${this.state.computed}`;
    }
  }

  const el = (await fixture('<c0-a></c0-a>')) as LitElement;
  expect(el.renderRoot.textContent).to.equal(`${myState.myNumber * 2}`);
  myState.myNumber++;
  await el.updateComplete;
  expect(myState.myNumber).to.equal(2);
  expect(el.renderRoot.textContent).to.equal(`${myState.myNumber * 2}`);
});

it('update across components should work', async () => {
  class State {
    @state myString = 'test-1';
    @state flag = false;
  }
  const myState = new State();

  @customElement('c2-a')
  // @ts-ignore
  class A extends LitElement {
    @state() state = myState;

    createRenderRoot() {
      return this;
    }
    render() {
      return html`${this.state.myString}`;
    }
  }

  @customElement('c2-b')
  // @ts-ignore
  class B extends LitElement {
    @state() state = myState;
    createRenderRoot() {
      return this;
    }
    render() {
      return html`<div
        clicker
        @click=${() => (this.state.flag = !!(this.state.myString = 'test-2'))}
      >
        ${this.state.flag ? this.state.myString : ''}
      </div>`;
    }
  }

  const el = (await fixture(
    '<div><c2-a></c2-a>,<c2-b></c2-b></div>'
  )) as LitElement;
  const ela = el.querySelector('c2-a') as LitElement;
  const elb = el.querySelector('c2-b') as LitElement;
  await ela.updateComplete;
  await elb.updateComplete;
  expect(el.innerText).to.equal(`test-1,`);
  (el.querySelector('[clicker]') as HTMLElement).click();
  expect(myState.myString).to.equal('test-2');
  await ela.updateComplete;
  await elb.updateComplete;
  expect(el.innerText).to.equal(`test-2,\ntest-2`);
});

it('custom store and load should work', async () => {
  let custom: number = 3;
  let storedName = '',
    loadedName = '';

  const customState = state({
    store({ key }: StateVar, val: number) {
      custom = val;
      storedName = key;
    },
    load({ key }: StateVar) {
      loadedName = key;
      return custom;
    },
    init() {
      return 4;
    },
  });
  expect(storedName).to.equal(``);
  expect(loadedName).to.equal(``);
  class State {
    @customState myNumber: number = 4;
  }
  const myState = new State();

  // no read access should have happened yet
  expect(storedName).to.equal(`myNumber`);
  expect(loadedName).to.equal(``);

  @customElement('c4-a')
  // @ts-ignore
  class A extends LitElement {
    @state state = myState;

    render() {
      return html`${this.state.myNumber}`;
    }
  }

  const el = (await fixture('<c4-a></c4-a>')) as LitElement;

  // read access should have happened by now
  expect(storedName).to.equal(`myNumber`);
  expect(loadedName).to.equal(`myNumber`);

  expect(el.renderRoot.textContent).to.equal(`4`);
  expect(custom).to.equal(4);
});

it('real-life nested state update cycle should work', async () => {
  class NestedState {
    @state myNestedString = '-nested';
    @state mySecondNestedString = '-nested-second';
  }
  class State {
    @state() myNumber: number = 1;
    @state() nested = [new NestedState()];
  }
  const myState = new State();

  let numRenderedB = 0;
  @customElement('c3-b')
  // @ts-ignore
  class B extends LitElement {
    @state() state = myState;

    render() {
      numRenderedB++;
      return html`${this.state.nested[0].mySecondNestedString}`;
    }
  }

  let numRenderedA = 0;
  @customElement('c3-a')
  // @ts-ignore
  class A extends LitElement {
    @state() state = myState;

    render() {
      numRenderedA++;
      return html`${this.state.myNumber}${this.state.nested.map(
        (n) => n.myNestedString
      )}`;
    }
  }

  @customElement('c3-host')
  // @ts-ignore
  class Host extends LitElement {
    @state() state = myState; // not using any of it

    render() {
      return html`<c3-a></c3-a><c3-b></c3-b>`;
    }
  }

  const el = (await fixture('<c3-host></c3-host>')) as LitElement;
  const a = el.renderRoot.querySelector('c3-a') as LitElement;
  const b = el.renderRoot.querySelector('c3-b') as LitElement;
  await a.updateComplete;
  await b.updateComplete;
  await el.updateComplete;
  expect(numRenderedB).to.equal(1);
  expect(numRenderedA).to.equal(1);
  expect(a.renderRoot.textContent).to.equal(
    `${myState.myNumber}${myState.nested[0].myNestedString}`
  );
  // multiple updates should not mess with controller stack..
  myState.myNumber++;
  myState.nested[0].myNestedString = `${myState.nested[0].myNestedString}-modified`;
  myState.myNumber++;
  await el.updateComplete;
  expect(a.renderRoot.textContent).to.equal(`3-nested-modified`);
  expect(b.renderRoot.textContent).to.equal(`-nested-second`);
  expect(numRenderedA).to.equal(2);
  expect(numRenderedB).to.equal(1);

  // changing state only used in B should not cause rerender in A
  myState.nested[0].mySecondNestedString = 'second-changed';
  await el.updateComplete;
  expect(a.renderRoot.textContent).to.equal(`3-nested-modified`); // should not have chaned
  expect(b.renderRoot.textContent).to.equal(`second-changed`); // should have changed
  expect(numRenderedB).to.equal(2);
  expect(numRenderedA).to.equal(2);

  const nestedOther = new NestedState();
  myState.nested = [...myState.nested, nestedOther];
  await el.updateComplete;
  expect(a.renderRoot.textContent).to.equal(`3-nested-modified-nested`);
  expect(numRenderedB).to.equal(3);
  expect(numRenderedA).to.equal(3);

  nestedOther.myNestedString = '-nested-second-modified';
  await el.updateComplete;
  expect(a.renderRoot.textContent).to.equal(
    `3-nested-modified-nested-second-modified`
  );
  expect(numRenderedB).to.equal(3);
  expect(numRenderedA).to.equal(4);
});

it('locking should work', async () => {
  class State {
    // check use without options
    @lockedState() myNumber: number = 2;
    // any write access to this should fail!
    @lockedState() uninitialized?: number | undefined = undefined;

    @lockedEmptyState empty?: string;

    @unlockState works() {
      this.myNumber++;
    }
  }
  const myState = new State();

  expect(() => {
    class State {
      @lockedEmptyState() myNumber: number = 2;
    }
    new State();
  }).to.throw();

  // access to empty state should be locked right away
  expect(() => {
    myState.empty = 'boom';
  }).to.throw();

  // any access should be locked
  expect(() => {
    myState.uninitialized = 1;
  }).to.throw();

  // any access should be locked
  expect(() => {
    myState.myNumber = 1;
  }).to.throw();

  // unless in unlocked context
  unlockState(() => {
    myState.myNumber = 1;
  });

  @customElement('c1-lock')
  // @ts-ignore
  class A extends LitElement {
    // check use with options
    @lockedState() state = myState;

    accessLockedState() {
      // writing should not be
      this.state.myNumber = 1;
    }

    @unlockState
    accessLockedStateSuccessfully() {
      // writing should not be
      this.state.myNumber = 1;
    }

    render() {
      // reading should be possible
      return html`${this.state.myNumber}`;
    }
  }

  const el = (await fixture('<c1-lock></c1-lock>')) as A;
  expect(el.renderRoot.textContent).to.equal(`${myState.myNumber}`);
  expect(() => {
    el.accessLockedState();
  }).to.throw();

  expect(() => {
    el.accessLockedStateSuccessfully();
  }).to.not.throw();
  await el.updateComplete;
  expect(el.renderRoot.textContent).to.equal(`1`);

  myState.works();
  await el.updateComplete;
  expect(el.renderRoot.textContent).to.equal(`2`);
});

it('access logging should work', async () => {
  class State {
    @state({ ...log }) myNumber: number = 1;
  }
  const myState = new State();

  let numLogs = 0;
  const l = console.log;
  console.log = function () {
    numLogs++;
  };
  expect(numLogs).to.equal(0);
  myState.myNumber * 0;
  expect(numLogs).to.equal(1);
  myState.myNumber = 0;
  expect(numLogs).to.equal(2);
  console.log = l;
});
