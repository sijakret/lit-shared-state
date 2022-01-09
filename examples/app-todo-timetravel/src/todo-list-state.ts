import { keep, locked } from 'lit-shared-state';
import { plainToClass, instanceToPlain, Type } from 'class-transformer';
import 'reflect-metadata'; // needed for @Type decorator
import { HistoryStateInterface, makeHistory } from './time-travel-state';

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
  observers: [serialize],
})
export class TodoListState {
  @keep()
  @Type(() => Todo)
  currentTodo?: Todo;
  @Type(() => Todo)
  todos: Todo[] = [];
}

@state()
export class RootState {
  todoList = new TodoListState();
}

export let rootState: RootState = new RootState();
export let history: HistoryStateInterface<TodoListState>;

function serialize() {
  // ingores empty initial states
  if (rootState && rootState.todoList && history) {
    localStorage.setItem(
      'fullState',
      JSON.stringify(instanceToPlain(rootState.todoList))
    );
    history.add(rootState.todoList);
  }
}

// initialize
unlock(() => {
  const stored = localStorage.getItem('fullState');
  if (stored) {
    // get stored state
    rootState.todoList = plainToClass(TodoListState, JSON.parse(stored));
  }
});

function onTravel(serializedState?: string) {
  unlock(() => {
    rootState.todoList = plainToClass(
      TodoListState,
      serializedState ? JSON.parse(serializedState) : new TodoListState()
    );
    serialize();
  });
}
history = makeHistory(onTravel);
