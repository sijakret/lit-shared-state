## Custom Storage

By default ```@state``` takes care of storing data in memory as is.

You can plug in your own logic to store and load data.
For instance you could tie parts of your state to localstorage or another DB.

> Currently read and write access cannot be `async`!

<code-sample folder="samples/storage" style="height: 600px;"> </code-sample>

> __Note:__ If you do NOT assign `stateVar.value` in ```set(..)```
> it is your job to call ```stateVar.notifyObservers()```
> to let broadcast the fact that a state valua has changed

### Serializing Somplex State
The pattern described in this section is best suited for storing small slices of your state.
If you intend on serializing and deserializing more complex state we recommend [class-transformer](https://www.npmjs.com/package/class-transformer).
It provides a set of straight forward decorators to make your (nested) state (de)serializable.

Take a lookt at section [Putting-it-all-together](#Putting-it-all-together) for an example on how to do this.


### Relevant APIs
* [StateOptions?.init](api/interfaces/StateOptions.html#init) - must return initial value
* [StateOptions?.store](api/interfaces/StateOptions.html#store) - must store given value
* [StateOptions?.load](api/interfaces/StateOptions.html#load) - must return current value
