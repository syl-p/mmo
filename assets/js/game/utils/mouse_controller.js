import EventEmitter from "./event_emitter";

export default class MouseController {
	events = new EventEmitter();
	mousePosition = {
		x: 0,
		y: 0,
	};

	constructor() {
		document.addEventListener("mousedown", () => {
			this.events.emit("down", this.mousePosition);
		});

		document.addEventListener("mouseup", () => {
			this.events.emit("up", this.mousePosition);
		});

		document.addEventListener("mousemove", (event) => {
			this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
			this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

			this.events.emit("move", this.mousePosition);
		});
	}
}
