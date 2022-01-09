import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { use } from 'lit-shared-state';
import { searchState } from './search-state.js';

@customElement('search-component')
class Component extends LitElement {
  @use() state = searchState;

  runSearch({ target }: { target: HTMLInputElement }) {
    // searchString ends up in localStorage
    this.state.searchString = target.value;
  }

  render() {
    return html`<h4>Search</h4>
      <p>
        <input
          @input=${this.runSearch}
          placeholder="type search term"
          value=${this.state.searchString}
        />
      </p>`;
  }
}

// this component just displays current state
@customElement('secondary-component')
class SecondaryComponent extends LitElement {
  @use() state = searchState;

  render() {
    return html`<h4>Secondary</h4>
      Serching for:
      <p>${this.state.searchString}</p>`;
  }
}
