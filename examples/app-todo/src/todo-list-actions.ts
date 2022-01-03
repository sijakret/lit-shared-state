import { Todo, unlockState, todolistState } from './todo-list-state';

class TodoListActions {
  @unlockState
  commitCurrentTodo() {
    if (todolistState.currentTodo) {
      todolistState.todos = [...todolistState.todos, todolistState.currentTodo];
      todolistState.currentTodo = undefined;
    }
  }

  @unlockState
  editCurrentTodo(todo: Todo) {
    todolistState.currentTodo = todo;
  }

  @unlockState
  setSelected(todo: Todo, selected = true) {
    if (!todo) {
      // select event is apparently emitted when items are removed
      return;
    }
    todo.selected = selected;
    todolistState.todos = [...todolistState.todos];
  }

  @unlockState
  deleteSelected() {
    todolistState.todos = todolistState.todos.filter((todo) => !todo.selected);
  }
}

export const todoListActions = new TodoListActions();
