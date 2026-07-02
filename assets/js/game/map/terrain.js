import * as THREE from "three";
import GrassChunkManager from "./grass_chunk_manager";
import Debug from "../utils/debug";

export default class Terrain {
	#floor = new THREE.Mesh(
		new THREE.PlaneGeometry(50, 50),
		new THREE.MeshBasicMaterial()
	).rotateX(Math.PI/2)

	/**
	 *
	 * @param {THREE.Scene} scene
	 * @param {Debug} debug
	 */
	constructor(scene, debug) {
		scene.add(this.#floor)

		// const terrain = new TerrainManager(this.scene, this.debug);
		// await terrain.load();
		const grass = new GrassChunkManager(scene, this.#floor, debug)
	}

	update() {
		if (this.player) {
			const position = this.player.getWorldPosition(new THREE.Vector3());
			grass.update(position)
		}
	}
}
