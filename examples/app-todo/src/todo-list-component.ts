import { LitElement, html, css } from 'lit';
import { customElement, state as privateState } from 'lit/decorators.js';
import { Todo, todolistState, state } from './todo-list-state';
import { todoListActions } from './todo-list-actions';
import '@material/mwc-button';
import '@material/mwc-textfield';
import '@material/mwc-list/mwc-list.js';
import '@material/mwc-list/mwc-check-list-item.js';
import { SelectedDetail } from '@material/mwc-list/mwc-list.js';
import { use } from 'lit-shared-state';

@customElement('todo-list')
export class TodoList extends LitElement {
  @use() todos = todolistState;

  edit({ target }: { target: { value: string } }) {
    todoListActions.editCurrentTodo(new Todo(target.value));
  }

  add() {
    todoListActions.commitCurrentTodo();
  }
  select(selected: SelectedDetail<Set<number>>) {
    for (const s of selected.diff.added) {
      todoListActions.setSelected(this.todos.todos[s], true);
    }
    for (const s of selected.diff.removed) {
      todoListActions.setSelected(this.todos.todos[s], false);
    }
  }
  deleteSelected() {
    todoListActions.deleteSelected();
  }

  get hasSelected() {
    return todolistState.todos.filter((todo) => todo.selected).length > 0;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(0, 0, 0, 0.1);
        -webkit-box-shadow: 0px 10px 13px -7px #000000,
          5px 5px 15px 5px rgba(0, 0, 0, 0);
        box-shadow: 0px 10px 13px -7px #000000,
          5px 5px 15px 5px rgba(0, 0, 0, 0);
      }
      .add {
        display: flex;
        flex-direction: row;
        align-items: center;
        text-align: center;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.09);
      }
      mwc-textfield {
        margin-right: 20px;
        flex: 1 0;
      }
      mwc-button {
        margin: 12px;
      }
      .list {
        overflow-y: scroll;
      }
    `;
  }

  render() {
    return html`<h2><slot></slot></h2>
      <div class="add">
        ${!this.hasSelected
          ? html`<mwc-textfield
                placeholder="what to do??"
                value=${this.todos.currentTodo?.task}
                @keydown=${({ key }: KeyboardEvent) =>
                  key === 'Enter' && this.add()}
                @input=${this.edit}
              ></mwc-textfield>
              <mwc-button
                raised
                icon="add"
                ?disabled=${!this.todos.currentTodo}
                @click=${this.add}
                label="add"
              ></mwc-button>`
          : html`
              <mwc-button
                style="margin-left: auto; margin-right: auto"
                raised
                trailingIcon
                icon="delete"
                @click=${this.deleteSelected}
                label="delete selected todos"
              ></mwc-button>
            `}
      </div>
      <div class="list">
        <mwc-list
          multi
          @selected=${({ detail }: { detail: SelectedDetail<Set<number>> }) =>
            this.select(detail)}
        >
          ${this.todos.todos?.map((todo, index) => {
            return html`<mwc-check-list-item ?selected=${todo.selected}
              >${index + 1}. ${todo.task}</mwc-check-list-item
            >`;
          })}
        </mwc-list>
      </div>`;
  }
}
