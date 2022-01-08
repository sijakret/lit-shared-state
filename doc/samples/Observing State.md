## Observing State

If you want to observe changes to a state variable you can pass a custom callbacks to the ```@state``` decorator.

```ts
import { state } from 'lit-shared-state';

function observer<T>({value}:StateVar<T>) {
    console.log('new value:', value);
}

@state({ observers: [observer] })
class State {
    // observer will aready be invoked for initial set
     myNumber: number = 1;
}
```
> **Note:** patterns like this are typically not needed!
> In case you want to trigger logic around state it is probably preferrable
> to have code that orchestrates your sequence and just reads and writes state.


### Relevant APIs
* [StateOptions](api/interfaces/StateOptions.html#observers) - get/set - customization for logging