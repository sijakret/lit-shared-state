## Observing State

If you want to observe changes to a state variable you can pass a custom callbacks to the ```@state``` decorator.

```ts
import { state } from 'lit-shared-state';

function observer(changed:Set<ReadonlyStateVar>) {
    for(let {key, value} of changed) {
        console.log('new value:', value, 'for', key);
    }
}

@state({ observers: [observer] })
class State {
    // observer will aready be invoked for initial set
    myNumber: number = 1;
}
```

> **Note:** You should only use observers if you really need them.
> If you need derived date, a side effect-free getter (i.e. computed value)
> is always preferrable since it avoids deep state mutations stacks.

## Batching Mutations

If you have a method that sets multiple parts of your state,
by default, every assignment will trigger an invocation of
all observers on parents in your state tree.

Consider the following piece of code:

```ts
function observer(changed:Set<ReadonlyStateVar>) {
    // ...
}

@state()
class SubState {

    propB: number = 1;
}
@state({ observers: [observer] })
class State {
    propA: number = 1;
    subState = new Substate()
}

const myState = new State();

// will lead to 2 invocations of observer
function modify() {
    myState.propA ++;
    myState.subState.propB *= 2;
}
```
If you only use state in `LitElement` components this is not a problem since they have built in deferred updating so your component will only render once even if you change multiple states that are used during rendering.

In contrast, ```observers:[ .. ]``` wich are affected are invoked synchronously right when you mutate each part of the state.
So in the case above ```observer()``` will be invoked twice.
If you only want one invocation after all your state mutations have been executed you can use [transactions](api/modules.html#transaction).

```ts
import { transaction } from 'lit-shared-state';
// ..

const myState = new State();

class Actions {

    @transaction()
    mutation() {
        // will only lead to one invokation per observer
        // even if it is observing the root of myState!
        myState.propA ++;
        myState.subState.propB *= 2;
        // you can also call synchrunous methods here!
        // ..
    }
}

// transaction als takes a simple callback
transaction(() => {
    myState.propA ++;
    myState.subState.propB *= 2;
})
```

Transactions are very usefull when you have global observers and want to avoid notifying them about intermediate/transient states.


#### Relevant APIs
* [observers Option](api/interfaces/StateOptions.html#observers) - set custom observers
* [transaction](api/modules.html#transaction) - decorator/callback to define batched transaction