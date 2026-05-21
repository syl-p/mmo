export default class EventEmitter {
	#listeners;

	constructor() {
		this.listeners = new Map();
	}

	/**
	 * Description placeholder
	 *
	 * @param {string} event
	 * @param {void} listener
	 */
	on(event, listener) {
		let listeners = this.listeners.get(event);
		if (!listeners) {
			listeners = [];
			this.listeners.set(event, listeners);
		}
		listeners.push(listener);
	}

	/**
	 * Description placeholder
	 *
	 * @param {string} event
	 * @param {{}} [args=[]]
	 */
	emit(event, args = []) {
		const listeners = this.listeners.get(event);
		if (!listeners) {
			return;
		}
		listeners.forEach((listener) => listener(...args));
	}

	/**
	 * Description placeholder
	 *
	 * @param {string} event
	 */
	off(event) {
		const listeners = this.listeners.get(event);
		if (!listeners) {
			return;
		}
		this.listeners.delete(event);
	}
}
