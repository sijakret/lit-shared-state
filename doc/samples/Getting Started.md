## Getting started

Install the package using npm

```bash
npm install lit-shared-state
```

> lit-shared-state currently assumes you have a typescript project with decorator support

At its core `lit-shared-state` provides a ```@state``` decorator which can be used to annotate state in state classes and also to indicate use of such state in a `LitElement` subclass.

* ```@state``` can be shared and will update across compontents
* ```@state``` is lazy: only relevant slices of state lead to updates
* ```@state``` knows if it is applied to declare or use state
* ```@state``` state can be used with and without arguments (```@state``` and ```@state()```)

Since we are relying on decorators, your state has to be defined as a `class`.

```ts
import { state } from 'lit-shared-state';

// decorator only works in classes!
class MyState {
    @state id = 'string'
    @state data1 = 'string'
    @state data2 = {
        object: true
    }
}
const myState = new MyState();

// you can use the state in as many components as you want
class Component extends LitElement {
  // one line to pull in a slice of global state
  @state state = myState;
 
  // you can use the state in your render logic
  // your component will re-render everytime
  render() {
    return html`<button @click=${this.click}>
      Click me ${this.state.count}
    </button>`;
  }
}
```

