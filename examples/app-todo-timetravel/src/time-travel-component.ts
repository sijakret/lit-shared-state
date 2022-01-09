import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@material/mwc-slider';
import { use } from 'lit-shared-state';
import { history, rootState, TodoListState } from './todo-list-state';

@customElement('time-travel')
export class TimeTravel extends LitElement {
  @use() history = history;
  @use() root = rootState;

  // shortcut
  get h() {
    return this.history;
  }

  reset() {
    history.reset();
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: row;
      }
    `;
  }

  render() {
    return this.h.history.length > 1
      ? html`<mwc-slider
            style="flex: 1 0"
            discrete
            withTickMarks
            step="1"
            @input=${(e: any) => this.h.setPosition(e.detail.value)}
            min="0"
          ></mwc-slider>
          <mwc-button
            style="width: 64px"
            icon="delete"
            @click=${this.reset}
          ></mwc-button>`
      : '';
  }

  updated(changed: Map<string | number | symbol, unknown>) {
    super.updated(changed);
    const slider = this.renderRoot.querySelector('mwc-slider') as any;
    if (slider) {
      slider.max = this.h.history.length - 1;
      this.updateComplete.then(() => {
        slider.value = this.h.pos;
      });
    }
  }
}
