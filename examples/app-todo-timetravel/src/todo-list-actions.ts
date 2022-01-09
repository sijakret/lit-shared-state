import { Todo, unlock, rootState, TodoListState } from './todo-list-state';

class TodoListActions {
  @unlock()
  commitCurrentTodo() {
    const todoList = rootState.todoList;
    if (todoList.currentTodo) {
      todoList.todos = [...todoList.todos, todoList.currentTodo];
      todoList.currentTodo = undefined;
    }
  }

  @unlock()
  editCurrentTodo(todo: Todo) {
    const todoList = rootState.todoList;
    todoList.currentTodo = todo;
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
    const todoList = rootState.todoList;
    todoList.todos = todoList.todos.filter((todo) => !todo.selected);
  }
}

export const todoListActions = new TodoListActions();
