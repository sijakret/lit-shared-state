import { statePersist } from './state-persist.js';

class SearchState {
  // @statePersist is a custom decorator
  // that has store/load logic which will
  // runs localStorage.setItem/getItem
  @statePersist searchString?: string;
}

export const searchState = new SearchState();
