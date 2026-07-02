import Game from "js/game/game";
import Client from "js/game/client";
import { Socket } from "phoenix";

export const ThreeWorld = {
	game: null,
	client: null,
	socket: new Socket("/socket", {
		// @ts-check
		authToken: window.userToken,
		heartbeatIntervalMs: 10000,
	}),
	mounted() {
		try {
			this.socket.connect();
			const channel = this.socket.channel("room:42", {});
			this.game = new Game(this.el, channel, {
				pushEvent: (event, payload) => {
					this.pushEvent(event, payload);
				},
			});
		} catch (e) {
			console.error(e);
		}
	},
};
