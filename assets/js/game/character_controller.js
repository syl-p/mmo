import KeyboardController from "./utils/keyboard_controller";
import EventEmitter from "./utils/event_emitter";

const ACTIONS = [
	{ name: "forward", keys: ["Keyboard.ArrowUp", "Keyboard.KeyW"] },
	{ name: "boost", keys: ["Keyboard.Shift"] },
];

export default class CharacterController {
	// events = new EventEmitter();
	#activeActions = new Set();

	constructor() {
		this.keyboard = new KeyboardController();

		this.keyboard.events.on("down", (key) => {
			this.start(`Keyboard.${key}`);
		});

		this.keyboard.events.on("up", (key) => {
			this.end(`Keyboard.${key}`);
		});
	}

	start(key) {
		const action = ACTIONS.find((action) => action.keys.find((k) => k === key));
		if (action) {
			this.#activeActions.add(action.name);
			// this.events.emit(action.name);
		}
	}

	end(key) {
		const action = ACTIONS.find((action) => action.keys.find((k) => k === key));

		if (action) {
			this.#activeActions.delete(action.name);
			// this.events.emit(`end:${action.name}`);
		}
	}

	isActive(name) {
		return this.#activeActions.has(name);
	}
}
