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
			this.game = new Game(this.el);
			this.client = new Client(channel);
		} catch (e) {
			console.error(e);
		}
	},
};
