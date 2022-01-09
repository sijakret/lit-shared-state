## Locked state

By default, properties in ```@state```-annotated classes can be set from anywhere in your app.

This is very handy and allows for very quick turn-around during development.

For complex apps, however, this can become a problem since it is increasingly difficult to know where and when state was changed and who changed it.

To solve this, we provde a locking mechanism that protects properties from any access _except for a defined context_.

This allows you to 
* pass state into LitElements without having to worry about unforseen side effects.
* explicitly limit state changes to a defined context

While `lit-shared-state` implicitly tracks dependencies similar to [mobx](https://www.npmjs.com/package/mobx). This means that `locks` allow you to very easily implement patterns similar to a reducer in [redux](https://www.npmjs.com/package/redux).

Take a look at the basic example rewritten to use locks.

<code-sample folder="samples/locks" style="height: 600px;"> </code-sample>

#### Relevant APIs
* [locked](api/modules.html#locked) - creates locked state decorators

This pattern is extremely powerful since it allows for very transparent state manpulation patterns
that are easy to reason about.
