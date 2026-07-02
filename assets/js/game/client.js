import CharacterController from "./character_controller";
import Mob from "./entities/mob";
import Player from "./entities/player";
import Game from "./game";
import * as THREE from "three";
import GridManager from "./map/grid_manager";

export default class Client {
	#channel = null;

	constructor(channel, options) {
		this.#channel = channel;
		this.game = Game.getInstance();
		this.pushEvent = options?.pushEvent;
		this.#init();
	}

	#init() {
		// JOIN THE CHANNEL
		this.#channel
			.join()
			.receive("ok", ({ player_uuid, initial_state, grid }) => {
				// LIVEVIEW SHARE
				this.pushEvent("set_player_uuid", { uuid: player_uuid });

				// GAME PLAYER
				this.game.playerUuid = player_uuid;
				const { position } = initial_state.transform;
				const { x, y, z } = GridManager.gridToWorld(position.x, position.y);

				const playerObject = new Player(
					player_uuid,
					new THREE.Vector3(x, y, z),
				);

				playerObject.isLocal = true;
				this.game.players.set(player_uuid, playerObject);
				this.game.scene.add(playerObject);

				if (this.game.camera) {
					this.game.camera.target = playerObject;
				}

				// GAME GRID AND CONTROLLER
				this.game.initGrid(grid.width, grid.height, grid.obstacles);
				this.game.initCharacterController();
			})
			.receive("error", (resp) => {
				console.log("Impossible de connecter le channel");
			});

		// ON STATE
		this.#channel.on("presence_state", ({ players, mobs }) => {
			players.forEach(({ uuid, transform }) => {
				if (this.game.players.has(uuid)) return;
				const { position, rotation } = transform;
				const { x, y, z } = GridManager.gridToWorld(position.x, position.z);

				const playerObject = new Player(uuid, new THREE.Vector3(x, y, z));

				this.game.players.set(uuid, playerObject);
				this.game.scene.add(playerObject);
			});

			mobs.forEach(({ uuid, transform }) => {
				const { position, rotation } = transform;
				const { x, y, z } = GridManager.gridToWorld(position.x, position.z);

				const mobObject = new Mob(uuid, new THREE.Vector3(x, y, z));

				mobObject.rotation.y = Math.PI / 2 - (rotation || 0);
				this.game.mobs.set(uuid, mobObject);
				this.game.scene.add(mobObject);
			});
		});

		this.#channel.on("player_joined", ({ uuid, transform }) => {
			if (this.game.players.has(uuid)) return;
			const { position } = transform;
			const { x, y, z } = GridManager.gridToWorld(position.x, position.z);

			const playerObject = new Player(uuid, new THREE.Vector3(x, y, z));
			this.game.players.set(uuid, playerObject);
			this.game.scene.add(playerObject);
		});

		this.#channel.on("player_left", ({ uuid }) => {
			const playerObject = this.game.players.get(uuid);
			if (!playerObject) return;

			playerObject.destroy();
			this.game.scene.remove(playerObject);
			this.game.players.delete(uuid);
		});

		this.#channel.on("world_updated", ({ players, mobs }) => {
			players.forEach(({ uuid, transform, fsm_state }) => {
				const { position, rotation } = transform;
				this.updatePlayer(uuid, { position, fsm_state });
			});

			mobs.forEach(({ uuid, transform, ai }) => {
				const { position, rotation } = transform;
				const { state } = ai;
				this.updateMob(uuid, { position, rotation, state });
			});
		});

		this.#channel.on("path_found", ({ path }) => {
			console.log("path found:", path);
		});

		// this.game.time.on("tick", () => this.#syncPlayer());
	}

	updatePlayer(uuid, { position, fsm_state }) {
		const player = this.game.players.get(uuid);
		if (!player) return;

		player.changeFsmState(fsm_state);

		const { x, y, z } = GridManager.gridToWorld(position.x, position.y);
		player.changePosition(new THREE.Vector3(x, y, z));

		// player.rotation.y = Math.PI / 2 - (rotation || 0);
	}

	updateMob(uuid, { position, rotation, state }) {
		const mob = this.game.mobs.get(uuid);
		if (!mob) return;

		mob.changeFsmState(state);

		const { x, y, z } = GridManager.gridToWorld(position.x, position.y);
		mob.changePosition(new THREE.Vector3(x, y, z));

		mob.rotation.y = Math.PI / 2 - (rotation || 0);
	}

	/**
	 *
	 * @param {{x: number, y: number}} cell
	 */
	selectCell(cell) {
		this.#channel.push("select_cell", cell);
	}

	#syncPlayer() {
		const player = this.game.player;

		if (!player || !player._dirty) return;
		const now = Date.now();

		if (!this._lastMoveSend || now - this._lastMoveSend > 50) {
			this._lastMoveSend = now;

			this.#channel.push("player_update", {
				uuid: player.uuid,
				position: {
					x: player.position.x,
					y: player.position.y,
					z: player.position.z,
				},
				fsm_state: player.fsm,
			});
			player._dirty = false;
		}
	}
}
