import * as THREE from "three";
import Time from "./utils/time";
import Sizes from "./utils/sizes";
import Camera from "./camera";
import Renderer from "./renderer";
import { setGridFloor } from "./terrain";
import Debug from "./utils/debug";

export default class Game {
	debug = new Debug();
	scene = new THREE.Scene();
	time = new Time();
	sizes = new Sizes();
	renderer = null;
	camera = null;
	playerUuid = null;

	// TODO: Entity manager ?
	players = new Map();
	mobs = new Map();

	constructor(canvas) {
		if (Game.instance) {
			return Game.instance;
		}

		Game.instance = this;
		this.init(canvas);
	}

	/**
	 *
	 * @returns {Game}
	 */
	static getInstance() {
		return Game.instance;
	}

	init(canvas) {
		if (!canvas) throw new Error("No canvas... !");

		this.canvas = canvas;

		// Env
		const light = new THREE.AmbientLight(0xffffff);
		this.scene.add(light);

		const light2 = new THREE.DirectionalLight(0xffffff, 1.8);
		light.position.set(0, 10, 5);
		this.scene.add(light2);

		// Terrain
		const grid = setGridFloor();
		this.scene.add(grid);

		// camera and render
		this.camera = new Camera();
		this.renderer = new Renderer();

		// Callback
		this.time.on("tick", () => {
			this.#update();
		});

		this.sizes.on("resize", () => {
			this.#resize();
		});
	}

	destroy() {
		this.sizes.off("resize");
		this.time.off("tick");

		// Traverse the scene
		this.scene.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				child.geometry.dispose();
				for (const key in child.material) {
					const value = child.material[key];
					// Test if there is a dispose function
					if (value && typeof value.dispose === "function") {
						value.dispose();
					}
				}
			}
		});

		this.camera.controls.dispose();
		this.renderer.instance.dispose();
		if (this.debug.active) {
			this.debug.ui.destroy();
		}
	}

	#updateLocalPlayer() {
		const player = this.players.get(this.playerUuid);
		if (!player) return;

		const delta = this.time.delta;
		if (this.characterController?.isActive("forward")) {
			const speed = 3.0; // unités/seconde
			const moveDistance = speed * delta * 0.005;
			//player.position.z += speed * delta * 0.005;

			// change direction
			const cameraDirection = new THREE.Vector3()
			this.camera.instance.getWorldDirection(cameraDirection)

			cameraDirection.y = 0 // Cancel Y
			cameraDirection.normalize()

			player.position.x += cameraDirection.x * moveDistance
			player.position.z += cameraDirection.z * moveDistance

			player.rotation.y = Math.atan2(cameraDirection.x, cameraDirection.z);

			player.changeFsmState("walk");
			player._dirty = true;
		} else {
			player.changeFsmState("idle");
			player._dirty = true;
		}
	}

	#update() {
		this.camera.update();
		this.renderer.update();
		this.#updateLocalPlayer();

		this.players.forEach((p) => {
			p.update(this.time.delta * 0.005);
		});

		this.mobs.forEach((m) => {
			m.update(this.time.delta * 0.005);
		});
	}

	#resize() {
		this.camera.resize();
		this.renderer.resize();
	}
}
