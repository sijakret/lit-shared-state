## Logging

If you want to you can log access to a state variable.

```ts
import { state, log } from 'lit-shared-state';

class State {
    // log contains custom load/store logic that proxies
    // the default one and logs to the console. 
    @state({ ...log }) myNumber: number = 1;
}
```

If you feel fancy you can also create a wrapped decorator
to enable/disable logging across the board:

```ts
import { state: _state, log } from 'lit-shared-state';

let loggingOn = true;

// use this
export const state = loggingOn ? _state({ ...log }) : _state;
```

### Relevant APIs
* [log](api/modules.html#log) - load/store - customization for logging