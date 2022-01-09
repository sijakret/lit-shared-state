import { expect } from '@esm-bundle/chai';
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fixture } from '@open-wc/testing';
import {
  options,
  state,
  StateVar,
  use,
  keep,
  locked,
  log,
  transaction,
  ReadonlyStateVar,
} from '../src/lit-shared-state';

it('nested states should work', async () => {
  let rootUpdated = 0;

  @state()
  class SubSubState {
    subNumber = 1;
  }

  @state()
  class SubState {
    subNumber = 1;
    subsub = new SubSubState();
    subsub2?: SubSubState;
    subarray = [new SubSubState()];
  }
  @state({
    observers: [
      () => {
        rootUpdated++;
      },
    ],
  })
  class RootState {
    number: number = 1;
    sub: SubState = new SubState();
  }

  const rootState = new RootState();
  expect(rootUpdated).to.equal(0);
  rootState.sub.subNumber = 2;
  expect(rootUpdated).to.equal(1);
  rootState.sub.subsub.subNumber = 3;
  expect(rootUpdated).to.equal(2);
  rootState.sub.subsub = new SubSubState();
  expect(rootUpdated).to.equal(3);
  rootState.sub.subsub.subNumber = -1;
  expect(rootUpdated).to.equal(4);
  rootState.sub.subarray[0].subNumber++;
  expect(rootUpdated).to.equal(5);
  rootState.sub.subarray = [new SubSubState(), new SubSubState()];
  expect(rootUpdated).to.equal(6);
  rootState.sub.subarray[1].subNumber++;
  expect(rootUpdated).to.equal(7);
});

it('custom observers should work', async () => {
  let fromObserver = 0;

  @state()
  class State {
    @options({
      notifyOnInit: true,
      observers: [
        (changed: Set<StateVar<number>>) => {
          fromObserver = Array.from(changed.values())[0].value as number;
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
  // @state()
  // class LockedState {
  //   @options({
  //     observers: [
  //       ({ value }) => {
  //         fromObserver = value as number;
  //       },
  //     ],
  //   })
  //   myNumber: number = 1;
  // }
  // const myLockedState = new LockedState();
  // expect(fromObserver).to.equal(2);
  // expect(() => {
  //   myLockedState.myNumber = 2;
  // }).to.throw();
});

it('computed getters should work', async () => {
  @state()
  class State {
    myNumber: number = 1;
    get computed() {
      return this.myNumber * 2;
    }
  }
  const myState = new State();

  @customElement('c0-a')
  // @ts-ignore
  class A extends LitElement {
    @use() state = myState;

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
  @state()
  class State {
    myString = 'test-1';
    flag = false;
  }
  const myState = new State();

  @customElement('c2-a')
  // @ts-ignore
  class A extends LitElement {
    @use() state = myState;

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
    @use() state = myState;
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

  const loadStore = {
    set({ key }: StateVar, val: number) {
      custom = val;
      storedName = key;
    },
    get({ key }: StateVar) {
      loadedName = key;
      return custom;
    },
    init() {
      return 4;
    },
  };
  expect(storedName).to.equal(``);
  expect(loadedName).to.equal(``);

  @state(loadStore)
  class State {
    myNumber: number = 4;
  }
  const myState = new State();

  // no read access should have happened yet
  expect(loadedName).to.equal(``, 'no read should happen');
  expect(storedName).to.equal(``, 'no store should happen');
  myState.myNumber = 3;
  expect(storedName).to.equal(`myNumber`);

  @customElement('c4-a')
  // @ts-ignore
  class A extends LitElement {
    @use() state = myState;

    render() {
      return html`${this.state.myNumber}`;
    }
  }

  const el = (await fixture('<c4-a></c4-a>')) as LitElement;

  // read access should have happened by now
  expect(loadedName).to.equal(`myNumber`);

  expect(el.renderRoot.textContent).to.equal(`3`);
  expect(custom).to.equal(3);
});

it('basic update cycle with objects work', async () => {
  type Data = {
    array: {
      name: string;
      id: number;
    }[];
  };
  const data = {
    array: [
      {
        name: 'test',
        id: 0,
      },
    ],
  };
  @state()
  class State {
    data: Data = data;
    test() {}
  }
  const myState = new State();

  expect(myState.data).to.equal(data);

  @customElement('c-obj')
  // @ts-ignore
  class A extends LitElement {
    @use() state = myState;

    render() {
      return html`${this.state.data?.array.map(
        (d) => html`<div>${d.id}:${d.name}</div>`
      )}`;
    }
  }

  const el = (await fixture('<c-obj></c-obj>')) as LitElement;
  await el.updateComplete;

  expect(el.renderRoot.textContent).to.equal(`0:test`);
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
  @state()
  class State {
    myUsedState: number = 1;
    myUnusedState: number = 1;
  }
  const myState = new State();
  let numRenderCalls = 0;

  @customElement('c5-a')
  // @ts-ignore
  class A extends LitElement {
    @use() state = myState;

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

it('optional props should throw ithout @keep()', async () => {
  @state()
  class State {
    @keep() empty?: number;
    empty2?: number;
  }
  const myState = new State();

  expect(() => {
    myState.empty = 1;
  }).to.not.throw();

  expect(() => {
    myState.empty2 = 1;
  }).to.throw();

  {
    @state({ noSeal: true })
    class State {
      empty?: number;
    }
    const myState = new State();

    expect(() => {
      myState.empty = 1;
    }).to.not.throw();
  }
});

it('locking should work', async () => {
  const { state, options, unlock } = locked();

  @state()
  class State {
    // any write access to these should fail!
    myNumber: number = 2;
    @options({ lock: null }) uninitialized?: number | undefined = undefined;
    @keep() empty?: string;

    @unlock()
    works() {
      this.myNumber++;
    }
  }
  const myState = new State();

  expect(() => {
    @state()
    class State {
      myNumber: number = 2;
    }
    new State();
  }, 'initializer allowed on locked state').to.not.throw();

  // access to empty state should be locked right away
  expect(() => {
    myState.empty = 'boom';
  }).to.throw();

  // any access should NOT be locked (local override)
  expect(() => {
    myState.uninitialized = 1;
  }).to.not.throw();

  // any access should be locked
  expect(() => {
    myState.myNumber = 1;
  }).to.throw();

  // unless in unlocked context
  unlock(() => {
    myState.myNumber = 1;
  });

  // unless in unlocked context
  unlock(() => {
    myState.empty = 'asd';
  });
  expect(myState.empty).to.equal('asd');

  @customElement('c1-lock')
  // @ts-ignore
  class A extends LitElement {
    // check use with options
    @use() state = myState;

    accessLockedState() {
      // writing should not be
      this.state.myNumber = 1;
    }

    @unlock
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
  @state()
  class State {
    @options({ ...log }) myNumber: number = 1;
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

it('transaction should batch mutations', async () => {
  let numObserverCalls = 0;
  let lastcallArg = new Set<ReadonlyStateVar>();

  @state()
  class ChildState {
    c = 1;
  }
  @state({
    observers: [
      (arg) => {
        numObserverCalls++;
        lastcallArg = arg;
      },
    ],
  })
  class State {
    a: number = 1;
    b: number = 1;
    child = new ChildState();

    nonTransactional() {
      this.a++;
      this.b++;
      this.child.c++;
    }

    @transaction()
    transactional() {
      this.nonTransactional();
    }
  }
  const myState = new State();
  expect(numObserverCalls).to.equal(0);

  // produces many update calls
  myState.nonTransactional();
  expect(numObserverCalls).to.equal(3);
  expect(myState.a).to.equal(2);
  expect(myState.a).to.equal(myState.b);
  expect(myState.b).to.equal(myState.child.c);

  // produces exacly one update call
  myState.transactional();
  expect(numObserverCalls).to.equal(4);
  expect(myState.a).to.equal(3);
  expect(myState.a).to.equal(myState.b);
  expect(myState.b).to.equal(myState.child.c);
  expect(lastcallArg.size).to.equal(3);
});
