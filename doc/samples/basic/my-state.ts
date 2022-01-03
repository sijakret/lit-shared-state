import { state } from 'lit-shared-state';
class State {
  // one line to declare anything as state
  // all LitElements that use it will stay in sync.
  @state count: number = 1;
}
export const mySharedState = new State();

// state can be manipulated from anywhere
// including non-lit contexts!
setInterval(() => {
  mySharedState.count += 2;
}, 1000);
