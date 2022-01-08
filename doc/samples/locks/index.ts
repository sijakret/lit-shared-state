import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { use } from 'lit-shared-state';
import { mySharedState, actions } from './my-state.js';

@customElement('comp-a')
class CompA extends LitElement {
  @use() state = mySharedState;

  // this does not work, this.state.count is locked!
  click() {
    this.state.count--;
  }
  render() {
    return html`<button @click=${this.click}>
        I don't work :( ${this.state.count}</button
      ><br />
      watch console for errors!`;
  }
}

@customElement('comp-b')
class CompB extends LitElement {
  @use() state = mySharedState;

  render() {
    // state.increment and actions.decrement have an unlocked context!
    return html`<button @click=${() => this.state.decrement()}>
        I work :) ${this.state.count}
      </button>
      <button @click=${actions.increment}>
        I work too :) ${this.state.count}
      </button>`;
  }
}
