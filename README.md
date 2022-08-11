# Lit Shared State

[![Coverage Status](https://coveralls.io/repos/github/sijakret/lit-shared-state/badge.svg?branch=main)](https://coveralls.io/github/sijakret/lit-shared-state?branch=main)

*A reactive shared state management solution for [LitElement](https://lit.dev/docs/components/overview/) instances*

> Note: requires lit@^2 + typescript for decorators

[Documentation and Samples](https://sijakret.github.io/lit-shared-state)

## Highlights
lit-shared state was built to be..
* **reactive** - state can be shared and will update across compontents
* **simple** - extremely minimal api surface, not much doc required :)
* **performant** - only relevent parts of state trigger rerenders when changed
* **transactional** - updates can be batched
* **flexible** - supports favorite patterns of both mobx (reactivity) and redux (directed data flow)
* **tiny** - less than 300 lines of commented typescript (~3.4KB minified, ~1.4KB gzipped), no deps (except for `lit` of course)

## Installation

```bash
npm install lit-shared-state
```

## Usage

Please head over to our small [documentation with live samples](https://sijakret.github.io/lit-shared-state)

```ts
import { LitElement, html } from "lit";
// this is all you need
import { state, use } from "lit-shared-state";

@state()
class State {
  // one line to declare anything as state
  // any subsequent change will redraw
  // all components that depend on it
  reactiveState: number = 1;
  // ..
}
const globalState = new State();

class CompA extends LitElement {
  // one line to pull in a slice of state
  @use() state = globalState;

  render() {
    return html`<button @click=${() => this.state.reactiveState++}>
        ${this.state.reactiveState}
    </button>`;
  }
}

class CompB extends LitElement {
  // use state in multiple components
  @use() state = globalState;

  render() {
    return html`<div> I am in sync:
        ${this.state.reactiveState}
    </div>`;
  }
}

// manipulating state from anywhere will
// lead to update for all LitElements that depend on it
globalState.reactiveState += 41;
```
## How does it compare

### [lit-element-state](https://github.com/gitaarik/lit-state)
This project is heavily inspired by https://github.com/gitaarik/lit-state. And has a very similar feature set and scope.
The main difference is that we ..
* .. provide a typescript implementation
* .. rely on a less intrusive [lit@2](https://www.npmjs.com/package/lit) [ReactiveController](https://lit.dev/docs/composition/controllers/) pattern
* .. provide state locking
* .. provide unit-tested code with 100% coverage 