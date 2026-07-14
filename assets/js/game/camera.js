import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Game from "./game";

export default class Camera {
	#target = null;
	#config = {
		frustumSize: 60,
		offset: new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(60), // offset iso depuis la cible
	};

	#controls = null;

	constructor() {
		this.game = Game.getInstance();
		this.sizes = this.game.sizes;
		this.scene = this.game.scene;
		this.canvas = this.game.canvas;
		this.setInstance();
		this.setOrbitControls();
	}


	/**
	 * @type {THREE.Object3D}
	 */
	set target(object) {
		this.#target = object
		// this.instance.lookAt(this.#target.position)
		this.#controls.target.copy(this.#target.position)
	}

	setInstance() {
		const {frustumSize} = this.#config
		const aspect = this.sizes.width / this.sizes.height

		this.instance = new THREE.OrthographicCamera(
			-frustumSize * aspect / 2,  // left
			frustumSize * aspect / 2,  // right
			frustumSize / 2,            // top
			-frustumSize / 2,            // bottom
			0.1,                        // near
			1000                        // far
		);

		this.instance.position.set(60, 60, 60);
		this.instance.lookAt(0, 0, 0);
		this.scene.add(this.instance);
	}


	setOrbitControls() {
		this.#controls = new OrbitControls(this.instance, this.canvas);
		this.#controls.enableDamping = true;
		this.#controls.dampingFactor = 0.05;

		// 🔒 Angle vertical fixe (isométrique ~35.26°)
		this.#controls.minPolarAngle = Math.PI / 4; // 45°
		this.#controls.maxPolarAngle = Math.PI / 4; // bloque à 45°


		this.#controls.enableRotate = false; // ou true si tu veux la rotation libre
		this.#controls.enablePan = false;    // le pan est géré manuellement via target
		this.#controls.enableZoom = true;
	}

	resize() {
		// this.instance.aspect = this.sizes.width / this.sizes.height;
		const aspect = window.innerWidth / window.innerHeight;
		const frustumSize = 50

		this.instance.left   = -frustumSize * aspect / 2;
		this.instance.right  =  frustumSize * aspect / 2;
		this.instance.top    =  frustumSize / 2;
		this.instance.bottom = -frustumSize / 2;

		this.instance.updateProjectionMatrix();
	}

	update() {
		if (!this.#target) return;

		this.instance.position.copy(this.#target.position).add(this.#config.offset);
		this.#controls.target.copy(this.#target.position);
  	this.#controls.update();
	}
}
