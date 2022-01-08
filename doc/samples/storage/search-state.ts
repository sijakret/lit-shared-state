import { keep, options, state } from 'lit-shared-state';
import { persist } from './state-persist.js';

@state()
class SearchState {
  @keep() // this is needed since searchString is optional!
  @options(persist) // instead you could also do @state(persist)
  searchString?: string;
}

export const searchState = new SearchState();
