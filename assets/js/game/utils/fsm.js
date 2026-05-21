export default class FSM {
  currentState;
  states = {};
  previous = null;

  constructor() {}

  /**
   * 
   * @param {string} name 
   * @param {FsmState} state 
   */
  addState(name, state) {
    this.states[name] = state;
  }

  setState(name) {
    if (this.states[name]) {
      if (this.currentState && this.currentState.exit) {
        this.currentState.exit();
        this.previous = this.currentState;
      }

      this.currentState = this.states[name];

      if (this.currentState.enter) {
        this.currentState.enter();
      }
    }
  }

  /**
   * 
   * @param {number} deltaTime 
   */
  update(deltaTime) {
    if (this.currentState && this.currentState.execute) {
      this.currentState.execute(deltaTime);
    }
  }
}