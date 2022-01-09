import { locked } from 'lit-shared-state';

// locked returns a set of decorators that are connected
// state defined by @state can unly be writen by using @unlock
export const { state, unlock } = locked();
// you could create a separate set of decorators like this:
// const { state: otherState, unlock: otherUnlock} = locked();

@state()
class State {
  count: number = 1;

  // unlockState can be used as a decorator
  // NOT restricted to the class where state is defined
  @unlock
  decrement() {
    this.count--;
  }
}
export const mySharedState = new State();

// unlocking can be done by passing a callback
// to an unlock function like below
export const actions = {
  increment: () => {
    unlock(() => {
      // this context is allowed to manipulate state
      mySharedState.count++;
    });
  },
};
