import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/Addons.js";
import Debug from "../utils/debug";

export default class GrassChunkManager {
	#geometry = new THREE.PlaneGeometry(0.1, 1, 1, 4);
	#chunks = new Map();
	#lastChunk = {
		x: null,
		z: null,
	};

	#config = {
		chunkSize: 50,
		renderRadius: 2,
		instancesPerChunk: 20000,
		grassHeight: 1.5,
		leavesColor: "#1a791a",
	};

	#material = new THREE.MeshPhongMaterial({
		color: this.#config.leavesColor,
		side: THREE.DoubleSide,
	});


	/**
	 * @type {Map<string, THREE.Vector3[]>}
	 */
	#grassIndex = new Map()

	/**
	 *
	 * @param {THREE.SCENE} scene
	 * @param {THREE.Mesh} terrainMesh
	 * @param {Debug} debug
	 */
	constructor(scene, terrainMesh, debug) {
		this.debug = debug
		this.scene = scene;
		this.terrainMesh = terrainMesh;

		console.log("🌿 Pré-calcul des positions d'herbe...");
		this.#grassIndex = this.#precomputeGrassPositions(80000)
		console.log("✅ Positions pré-calculées");

		// Up the geometry
		this.#geometry.translate(0, this.#config.grassHeight / 2, 0);

		if (this.debug.active) {
			const grassDebugFolder = this.debug.ui.addFolder({
				title: "Grass",
			})

			grassDebugFolder.addBinding(this.#config, "leavesColor", {})
			grassDebugFolder.on("change", () => {
				this.#material.color.set(this.#config.leavesColor)
			})
		}
	}


	/**
	 * Sample une grande quantité de points et les indexe par chunk
	 *
	 * @param {number} totalCount - Nombre de brain estimé sur le terrain (ex: 40% du terrain est de l'herbe alors 40 * this.#config.instancesPerChunk)
	 * @param {number} [chunkSize=50] - doit correspondre à celui du GrassChunkManager
	 */
	#precomputeGrassPositions(totalCount, chunkSize = 50) {
		this.sampler = new MeshSurfaceSampler(this.terrainMesh)
			.setWeightAttribute("GreenMask")
			.build();

		const index = new Map()
		const p = new THREE.Vector3();

		for (let i = 0; i < totalCount; i++) {
			this.sampler.sample(p);

			const cx = Math.floor(p.x / chunkSize);
			const cz = Math.floor(p.z / chunkSize);
			const key = this.#getKey(cx, cz)

			if (!index.has(key)) {
				index.set(key, []);
			}

			index.get(key).push(p.clone()); // clone() crucial
		}

		return index
	}

	#getKey(cx, cz) {
		return `${cx},${cz}`;
	}

	/**
	 *
	 * @param {String} key
	 * @param {{mesh: THREE.Mesh, instanceCount: number}} chunk
	 */
	#unLoadChunk(key, chunk) {
		this.scene.remove(chunk.mesh);
		chunk.mesh.dispose();
		this.#chunks.delete(key);
	}

	/**
	 *	Load grass from precomputed positions
	 * @param {String} key
	 */
	#loadChunk(key) {
		const { instancesPerChunk } = this.#config;

		const mesh = new THREE.InstancedMesh(
				this.#geometry,
				this.#material,
				instancesPerChunk,
		);
		mesh.castShadow = false;
		this.scene.add(mesh);

		const positions = this.#grassIndex.get(key) ?? []
		const dummy = new THREE.Object3D();
		const count = Math.min(positions.length, instancesPerChunk);

		for (let i = 0; i < count; i++) {
			dummy.position.copy(positions[i]);
			dummy.rotation.y = Math.random() * Math.PI * 2;
			dummy.scale.setScalar(0.7 + Math.random() * 0.6);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}

		mesh.count = count
		mesh.instanceMatrix.needsUpdate = true
		this.#chunks.set(key, {mesh, instanceCount: count})
	}


	/**
	 * (old) create sample grass on the chunk each time
	 * @param {String} key
	 * @param {number} cx
	 * @param {number} cz
	 */
	// #loadChunk(key, cx, cz) {
	// 	const { chunkSize, instancesPerChunk } = this.#config;

	// 	// chunkMesh
	// 	const mesh = new THREE.InstancedMesh(
	// 		this.#geometry,
	// 		this.#material,
	// 		instancesPerChunk,
	// 	);

	// 	mesh.castShadow = false;
	// 	this.scene.add(mesh);

	// 	// ChunksBounds
	// 	const minX = cx * chunkSize;
	// 	const maxX = minX + chunkSize;
	// 	const minZ = cz * chunkSize;
	// 	const maxZ = minZ + chunkSize;

	// 	// Dummy utilities
	// 	const position = new THREE.Vector3();
	// 	const normal = new THREE.Vector3();
	// 	const dummy = new THREE.Object3D();
	// 	let count = 0;

	// 	// Filter sample effect on chunk
	// 	let attemps = 0;
	// 	while (count < instancesPerChunk && attemps < instancesPerChunk * 10) {
	// 		this.sample.sample(position, normal);
	// 		attemps++;

	// 		if (
	// 			position.x >= minX &&
	// 			position.x < maxX &&
	// 			position.z >= minZ &&
	// 			position.z < maxZ
	// 		) {
	// 			dummy.position.copy(position)

	// 			// Randomize
	// 			dummy.rotation.y = Math.random() * Math.PI * 2;
	// 			dummy.scale.setScalar(0.7 + Math.random() * 0.6);

	// 			dummy.updateMatrix();
	// 			mesh.setMatrixAt(count, dummy.matrix);
	// 			count++;
	// 		}
	// 	}

	// 	mesh.count = count;
	// 	mesh.instanceMatrix.needsUpdate = true;
	// 	this.#chunks.set(key, { mesh, instanceCount: count });
	// }

	/**
	 *
	 * @param {THREE.Vector3} playerPosition
	 */
	update(playerPosition) {
		if(!this.#grassIndex) return;

		const { chunkSize, renderRadius } = this.#config;

		const cx = Math.floor(playerPosition.x / chunkSize);
		const cz = Math.floor(playerPosition.z / chunkSize);

		if (cx == this.#lastChunk.x && cz == this.#lastChunk.z) return;

		this.#lastChunk.x = cx;
		this.#lastChunk.z = cz;

		// console.log("Make grass chunk now on", `${cx}:${cz}`);

		// Set construction
		const needed = new Set();

		for (let dx = -renderRadius; dx <= renderRadius; dx++) {
			for (let dz = -renderRadius; dz <= renderRadius; dz++) {
				needed.add(this.#getKey(cx + dx, cz + dz));
			}
		}

		// clean
		for (const [key, chunk] of this.#chunks) {
			if (!needed.has(key)) {
				this.#unLoadChunk(key, chunk);
			}
		}

		// add
		for (const key of needed) {
			if (!this.#chunks.has(key)) {
				const [ncx, ncz] = key.split(",").map(Number)
				// this.#loadChunk(key, ncx, ncz);
				this.#loadChunk(key);
			}
		}
	}
}
