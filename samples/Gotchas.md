## Gotchas

This sections deals with a few important details.

### Optional values

Due to the way typescript and our decorators work you need to make sure
* all properties are initialized
* uninitialized properties need to be annoated with ```@keep()```

```ts
class State {
    // Wrong: if you assign this later it will throw an error
    field?:number;

    // Correct:
    // we have a special decorator for optional properties
    @keep() field?:number;

    // Correct:
    // this pattern is also possible
    field:number | undefined = undefined;
}
```

### Updating nested objects
Updating nested properties in `@state`-annotated properties will not trigger a rerender (behavior is the same as in `LitElement`).

```ts
@state()
class State {
  object: { a: 'a', b: 'b' };
  array: ['a', 'b'];
}
const myState = new State();

// these will not trigger updates:
myState.object.c = 'c'; // would trigger if myState.object was also @state()-decorated!
myState.array.push('c');

// instead use explicit assignment (+ spread operators) like this:
myState.object = { ...myState.object, c: 'c' };
myState.array = [ ...myState.object, 'c' ];
```

### Pre-sliced state
Due to the way our dependency tracking works you always need to access `this.[myState].[myField]` directly in your render code path.
Instead we recommend you use getters.

```ts
@state()
class State {
  field: { data: string } = {
      data: 'value'
  } 
}
const myState = new State();

// wrong:
class BrokenComp extends LitElement {
    @state myState = myState;
    field: { data: string }
    constructor() {
        super();
        // wrong: this.field will not track updates
        this.field = myState.field;
    }

    render() {
        // will not work, you need to go throug this.myState
        return html`${this.field}`;
    }
}

// correct
class WorkingComp extends LitElement {
    @state myState = myState;
    
    // key is to go through this.myState everytime you read from it
    get field() {
        return this.myState.field;
    }

    render() {
        // this will work since it leads to live access via this.myState
        return html`${this.field}`;
    }
}
```