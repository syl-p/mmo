import * as THREE from "three";
import GrassChunkManager from "./grass_chunk_manager";
import Debug from "../utils/debug";
import Player from "../entities/player";

export default class Terrain {
	#grass;
	#floor = new THREE.Mesh(
		new THREE.PlaneGeometry(1000, 1000).rotateX(-Math.PI / 2),
		new THREE.MeshBasicMaterial(),
	);

	/**
	 *
	 * @param {THREE.Scene} scene
	 * @param {Player} player
	 * @param {Debug} debug
	 */
	constructor(scene, debug) {
		scene.add(this.#floor);
		// const terrain = new TerrainManager(this.scene, this.debug);
		// await terrain.load();
		this.#grass = new GrassChunkManager(scene, this.#floor, debug);
	}

	/**
	 *
	 * @param {Player} player
	 */
	update(player) {
		if (!player) return

		const position = player.getWorldPosition(new THREE.Vector3());
		this.#grass.update(position);
	}
}
