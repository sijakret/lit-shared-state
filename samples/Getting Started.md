## Getting started

Install the package using npm

```bash
npm install lit-shared-state
```

> lit-shared-state currently assumes you have a typescript project with decorator support

At its core `lit-shared-state` provides three main decorators ```@state()```, ```@use()```, ```@options()``` decorator which can be used to annotate state in state classes and also to indicate use of such state in a `LitElement` subclass.

* ```@state(options?: StateOptions)``` (Class Decorator) - [API](api/modules.html#state)
  * defines state which can be shared and will update across compontents
* ```@use()``` (Property Decorator) - [API](api/modules.html#use)
  * indicates usage of a state object in a LitElement-derived class
* ```@options(options: StateOptions)``` (Property Decorator) - [API](api/modules.html#options)
  * can override options per state property (rarely needed)

Since we are relying on decorators, your state has to be defined as a `class`.

```ts
import { state, use } from 'lit-shared-state';

@state()
class MyState {
    id = 'string'
    data1 = 'string'
    data2 = {
        object: true
    }
}
const myState = new MyState();

// you can use the state in as many components as you want
class Component extends LitElement {
  // one line to pull in a slice of global state
  @use() state = myState;
 
  // you can use the state in your render logic
  // your component will re-render everytime
  render() {
    return html`<button @click=${this.click}>
      Click me ${this.state.count}
    </button>`;
  }
}
```