import { lockedState, unlockState } from 'lit-shared-state';

class State {
  // @lockedState only expects one initial assignment
  @lockedState count: number = 1;

  // unlockState can be used as a decorator
  // NOT restricted to the class where state is defined
  @unlockState
  decrement() {
    this.count--;
  }
}
export const mySharedState = new State();

// unlocking can be done by passing a callback
// to an unlock function like below
export const actions = {
  increment: () => {
    unlockState(() => {
      // this context is allowed to manipulate state
      mySharedState.count++;
    });
  },
};
