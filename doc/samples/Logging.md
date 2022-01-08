## Logging

If you want to you can log access to a state variable.

```ts
import { state, log, options } from 'lit-shared-state';
@state()
// @state(log) would enable logging for all properties
class State {
    // log contains custom set/get logic that proxies
    // the default one and logs to the console. 
    @options(log) myNumber: number = 1;
}
```

#### Relevant APIs
* [log](api/modules.html#log) - get/set - customization for logging