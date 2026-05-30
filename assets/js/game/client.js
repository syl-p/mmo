import CharacterController from "./character_controller";
import Mob from "./entities/mob";
import Player from "./entities/player";
import Game from "./game";
import * as THREE from "three";

export default class Client {
	#channel = null;

	constructor(channel) {
		this.#channel = channel;
		this.game = Game.getInstance();
		this.#init();
	}

	#init() {
		// JOIN THE CHANNEL
		this.#channel
			.join()
			.receive("ok", ({ player_uuid, initial_state }) => {
				this.game.playerUuid = player_uuid;
				const {position, rotation} = initial_state.transform

				const playerObject = new Player(
					player_uuid,
					new THREE.Vector3(
						position.x,
						position.y,
						position.z,
					),
				);

				playerObject.isLocal = true;

				this.game.players.set(player_uuid, playerObject);
				this.game.scene.add(playerObject);

				this.game.camera.target = playerObject;
				this.game.characterController = new CharacterController();
			})
			.receive("error", (resp) => {
				console.log("Impossible de connecter le channel");
			});

		// ON STATE
		this.#channel.on("presence_state", ({ players, mobs }) => {
			players.forEach(({ uuid, transform }) => {
				if (this.game.players.has(uuid)) return;
				const {position, rotation} = transform

				const playerObject = new Player(
					uuid,
					new THREE.Vector3(position.x, position.y, position.z),
				);
				this.game.players.set(uuid, playerObject);
				this.game.scene.add(playerObject);
			});

			mobs.forEach(({ uuid, transform }) => {
				const {position, rotation} = transform
				const mobObject = new Mob(
					uuid,
					new THREE.Vector3(position.x, position.y, position.z),
				);
				mobObject.rotation.y = Math.PI / 2 - (rotation || 0);
				this.game.mobs.set(uuid, mobObject);
				this.game.scene.add(mobObject);
			});
		});

		this.#channel.on("player_joined", ({ uuid, transform, fsm_state }) => {
			if (this.game.players.get(uuid)) return;
			const {position, rotation} = transform

			const playerObject = new Player(
				uuid,
				new THREE.Vector3(position.x, position.y, position.z),
			);
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
				if (this.game.playerUuid !== uuid) {
					const {position, rotation} = transform
					this.updatePlayer(uuid, { position, fsm_state });
				}
			});

			mobs.forEach(({ uuid, transform, ai }) => {
				const {position, rotation} = transform
				const {state} = ai
				this.updateMob(uuid, { position, rotation, state });
			});
		});

		this.game.time.on("tick", () => this.#syncPlayer());
	}

	updatePlayer(uuid, { position, fsm_state }) {
		const player = this.game.players.get(uuid);
		if (!player) return;

		player.changeFsmState(fsm_state);
		player.changePosition(position);
	}

	updateMob(uuid, { position, rotation, state }) {
		const mob = this.game.mobs.get(uuid);
		if (!mob) return;

		mob.changeFsmState(state);
		mob.changePosition(new THREE.Vector3(position.x, position.y, position.z));
		mob.rotation.y = Math.PI / 2 - (rotation || 0);
	}

	#syncPlayer() {
		const player = this.game.players.get(this.game.playerUuid);
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
