import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { use } from 'lit-shared-state';
import { mySharedState } from './my-state.js';

@customElement('comp-a')
class CompA extends LitElement {
  // one line to pull in a slice of global state
  @use() state = mySharedState;
  click() {
    this.state.count--;
  }
  render() {
    return html`<button @click=${this.click}>
      Click me ${this.state.count}
    </button>`;
  }
}

@customElement('comp-b')
class CompB extends LitElement {
  // state can be used in multiple components
  @use() state = mySharedState;
  render() {
    return html` I'm in sync<slot></slot>: ${this.state.count} `;
  }
}
