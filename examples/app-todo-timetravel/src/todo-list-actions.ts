import { transaction } from 'lit-shared-state';
import { Todo, unlock, rootState, TodoListState } from './todo-list-state';

class TodoListActions {
  @transaction()
  @unlock()
  commitCurrentTodo() {
    const todoList = rootState.todoList;
    if (todoList.currentTodo) {
      todoList.todos = [...todoList.todos, todoList.currentTodo];
      todoList.currentTodo = undefined;
    }
  }

  @transaction()
  @unlock()
  editCurrentTodo(todo: Todo) {
    const todoList = rootState.todoList;
    todoList.currentTodo = todo;
  }

  @transaction()
  @unlock()
  setSelected(todo: Todo, selected = true) {
    if (todo) {
      // select event is apparently emitted when items are removed
      todo.selected = selected;
    }
  }

  @transaction()
  @unlock()
  deleteSelected() {
    const todoList = rootState.todoList;
    todoList.todos = todoList.todos.filter((todo) => !todo.selected);
  }
}

export const todoListActions = new TodoListActions();
