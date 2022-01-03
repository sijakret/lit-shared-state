import { makeLockedState, state as volatile } from 'lit-shared-state';
import { statePersist } from './persist-json-state';

/**
 * decorate the locked realm with the json persistence
 * and export state decorator + unlocker
 * these are specific to the todo list state only!
 */

export const { state, emptyState, unlockState } = makeLockedState(
  statePersist('todo-list')
);
/**
 * interfaces
 */
export interface Todo {
  task: string;
  selected: boolean;
}

/**
 * actual state
 */
class TodoListState {
  @emptyState currentTodo?: Todo;
  @state todos: Todo[] = [];
}

export const todolistState = new TodoListState();
