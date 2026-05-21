import EventEmitter from "./event_emitter";

export default class KeyboardController {
    keys = {};
    events = new EventEmitter()

    // mouseClick = false;
    // mousePosition = {
    //     x: 0,
    //     y: 0,
    // };

    constructor() {
        // SET Event
        document.addEventListener("keydown", (e) => {
					this.events.emit("down", [e.code])
				});
        document.addEventListener("keyup", (e) => {
					this.events.emit("up", [e.code])
				});

    }
}
