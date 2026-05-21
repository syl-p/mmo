import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Game from "./game";

export default class Camera {
	#target = null;
	#config = {
		followingOffset: new THREE.Vector3(0, 10, -11.5),
		followingLookAt: new THREE.Vector3(-5, 2, 12),
		applyQuaternion: true,
		active: false,
	};
	#controls = null;
	currentPosition = new THREE.Vector3();
	currentLookAt = new THREE.Vector3();

	constructor() {
		this.game = Game.getInstance();
		this.sizes = this.game.sizes;
		this.scene = this.game.scene;
		this.canvas = this.game.canvas;
		this.debug = this.game.debug;

		this.instance = new THREE.PerspectiveCamera(
			75,
			this.sizes.width / this.sizes.height,
			1,
			2000,
		);

		this.#controls = new OrbitControls(this.instance, this.canvas);
		this.#controls.enableDamping = true;
		this.#controls.enableDamping = true;
		this.#controls.minDistance = 5;
		this.#controls.maxDistance = 30;

		this.instance.position.set(6, 4, 8);
		this.scene.add(this.instance);

		if (this.debug.active) {
			const cameraPositionFolder = this.debug.ui.addFolder({
				title: "Camera Configuration",
			});

			cameraPositionFolder.addBinding(this.#config, "followingOffset");
			cameraPositionFolder.addBinding(this.#config, "followingLookAt");
			cameraPositionFolder.addBinding(this.#config, "active");
		}
	}

	set target(object) {
		this.#target = object;
		this.instance.lookAt(this.#target.position);
	}

	resize() {
		this.instance.aspect = this.sizes.width / this.sizes.height;
		this.instance.updateProjectionMatrix();
	}

	update() {
		if (!this.#target) return;

		const delta = new THREE.Vector3()
			.copy(this.#target.position)
			.sub(this.#controls.target);
		this.#controls.target.copy(this.#target.position);
		this.instance.position.add(delta);
		this.#controls.update();
	}
}
