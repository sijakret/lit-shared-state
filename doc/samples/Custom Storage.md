## Custom Storage

By default ```@state``` takes care of storing data in memory as is.

You plug in your own logic to store and load data.
For instance you could tie parts of your state to localstorage or another DB.

> Currently read and write access cannot be `async`!

<code-sample folder="samples/storage" style="height: 600px;"> </code-sample>

> **Note:** if you write custom storage logic it is your job to call ```stateVar.notifyObservers()```
> to let broadcast the fact that a state valua has changed

### Relevant APIs
* [StateOptions?.init](api/interfaces/StateOptions.html#init) - must return initial value
* [StateOptions?.store](api/interfaces/StateOptions.html#store) - must store given value
* [StateOptions?.load](api/interfaces/StateOptions.html#load) - must return current value
