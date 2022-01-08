import { Todo, unlock, todolistState } from './todo-list-state';

class TodoListActions {
  @unlock()
  commitCurrentTodo() {
    if (todolistState.currentTodo) {
      todolistState.todos = [...todolistState.todos, todolistState.currentTodo];
      todolistState.currentTodo = undefined;
    }
  }

  @unlock()
  editCurrentTodo(todo: Todo) {
    todolistState.currentTodo = todo;
  }

  @unlock()
  setSelected(todo: Todo, selected = true) {
    if (todo) {
      // select event is apparently emitted when items are removed
      todo.selected = selected;
    }
  }

  @unlock()
  deleteSelected() {
    todolistState.todos = todolistState.todos.filter((todo) => !todo.selected);
  }
}

export const todoListActions = new TodoListActions();
