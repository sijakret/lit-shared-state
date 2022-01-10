## Sample Apps

The following samples illsutrate

### Todo List App 

[source](https://github.com/sijakret/lit-shared-state/tree/main/examples/app-todo) - [stackblitz](https://stackblitz.com/github/sijakret/lit-shared-state/tree/main/examples/app-todo)

Simple todo list with two views that are synced via `lit-shared-state`.
The full app state (including selection etc..) is persisted in localStorage.


### Time Travel Todo List App 

[source](https://github.com/sijakret/lit-shared-state/tree/main/examples/app-todo-timetravel) - [stackblitz](https://stackblitz.com/github/sijakret/lit-shared-state/tree/main/examples/app-todo-timetravel)

Same as Todo list App but with timetravel mechanism in a separate ```@state()``` object.
Once you add todos, all mutations are recorded and persisted in `localStorage`.
