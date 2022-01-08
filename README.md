# Lit Shared State


*The easiest way to share global state between [LitElement](https://lit.dev/docs/components/overview/) instances*

> Note: requires lit@2.x

## Highlights
lit-shared state was built to be..
* **..reactive** - state can be shared and will update across compontents
* **..simple** - extremely minimal api surface, not much doc required :)
* **..performant** - lazy: only relevant slices of state lead to updates
* **..flexible** - supports favorite patterns of both mobx (reactivity) and redux (directed data flow)
* **..tiny** - less than 300 lines of commented typescript (~2.7KB minified, ~1.2KB gzipped), no deps (except for `lit` of course)

## Installation

```bash
npm install lit-shared-state
```

## Usage

Please head over to our small [documentation with live samples](http://todo)

```ts
import { LitElement, html } from "lit";
// this is all you need
import { state } from "lit-shared-state";

class State {
  // one line to declare anything as state
  // any subsequent change will redraw
  // all components that depend on it
  @state reactiveState: number = 1;
  // ..
}
const globalState = new State();

class CompA extends LitElement {
  // one line to pull in a slice of state
  @state state = globalState;

  render() {
    return html`<button @click=${() => this.state.reactiveState++}>
        ${this.state.reactiveState}
    </button>`;
  }
}

class CompB extends LitElement {
  // use state in multiple components
  @state state = globalState;

  render() {
    return html`<div> I am in sync:
        ${this.state.reactiveState}
    </div>`;
  }
}

// manipulating state from anywhere wills
// lead to update for all LitElements that depend on it
globalState.reactiveState += 41;
```

## Gotchas

### Updating nested objects
Updating nested properties in `@state`-annotated properties will not trigger a rerender (behavior is the same as in `LitElement`).

```ts
class State {
  @state object: { a: 'a', b: 'b' };
  @state array: ['a', 'b'];
}
const myState = new State();

// these will not trigger updates:
myState.object.c = 'c';
myState.array.push('c');

// instead use explicit assignment (+ spread operators) like this:
myState.object = { ...myState.object, c: 'c' };
myState.array = [ ...myState.object, 'c' ];
```
### Pre-sliced state
Due to the way our dependency tracking works you always need to access `this.[myState].[myField]` directly in your render code path.
Instead we recommend you use getters.

```ts
class State {
  @state field: { data: string } = {
      data: 'value'
  } 
}
const myState = new State();

// wrong:
class BrokenComp extends LitElement {
    @state myState = myState;
    field: { data: string }
    constructor() {
        super();
        // wrong: this.field will not track updates
        this.field = myState.field;
    }

    render() {
        // will not work, you need to go throug this.myState
        return html`${this.field}`;
    }
}

// correct
class WorkingComp extends LitElement {
    @state myState = myState;
    
    // key is to go through this.myState everytime you read from it
    get field() {
        return this.myState.field;
    }

    render() {
        // this will work since it leads to live access via this.myState
        return html`${this.field}`;
    }
}
```


## How does it compare

### [lit-element-state](https://github.com/gitaarik/lit-state)
This project is heavily inspired by https://github.com/gitaarik/lit-state. And has a very similar feature set and scope.
The main difference is that we ..
* .. provide typescript implementation
* .. rely a less intrusive [lit](https://www.npmjs.com/package/lit) 2.x [ReactiveController](https://lit.dev/docs/composition/controllers/) pattern
* .. provide unit-tested code with 100% coverage 