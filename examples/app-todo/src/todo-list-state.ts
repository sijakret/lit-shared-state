import { keep, locked } from 'lit-shared-state';
import { plainToClass, instanceToPlain, Type } from 'class-transformer';
import 'reflect-metadata'; // needed for @Type decorator

/**
 * decorate the locked realm with the json persistence
 * and export state decorator + unlocker
 * these are specific to the todo list state only!
 */
export const { state, unlock } = locked();

/**
 * interfaces
 */
@state()
export class Todo {
  task: string;
  selected: boolean;

  constructor(task: string) {
    this.task = task;
    this.selected = false;
  }
}

/**
 * actual state
 */

@state({
  observers: [store],
})
class TodoListState {
  @keep()
  @Type(() => Todo)
  currentTodo?: Todo;
  @Type(() => Todo)
  todos: Todo[] = [];
}

export let todolistState: TodoListState;

function store() {
  todolistState &&
    localStorage.setItem(
      'fullState',
      JSON.stringify(instanceToPlain(todolistState))
    );
}

unlock(() => {
  const stored = localStorage.getItem('fullState');
  if (stored) {
    todolistState = plainToClass(TodoListState, JSON.parse(stored));
  } else {
    todolistState = new TodoListState();
  }
});
