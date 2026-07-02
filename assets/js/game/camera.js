import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Game from "./game";

export default class Camera {
	#target = null;
	#config = {
		frustumSize: 50,
		isoAngle: new THREE.Vector3(50, 50, 50), // offset iso depuis la cible
		active: false,
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
		this.instance.lookAt(this.#target.position)
		this.controls.target.copy(this.#target.position)
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

		this.instance.position.set(50, 50, 50);
		this.scene.add(this.instance);
	}


	setOrbitControls() {
		this.controls = new OrbitControls(this.instance, this.canvas);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;

		// 🔒 Angle vertical fixe (isométrique ~35.26°)
		this.controls.minPolarAngle = Math.PI / 4; // 45°
		this.controls.maxPolarAngle = Math.PI / 4; // bloque à 45°

		// 🔒 Angle horizontal fixe si tu veux (sinon tu peux laisser libre)
		// this.controls.minAzimuthAngle = Math.PI / 4;
		// this.controls.maxAzimuthAngle = Math.PI / 4;

		this.controls.enableRotate = false; // ou true si tu veux la rotation libre
		this.controls.enablePan = false;    // le pan est géré manuellement via target
		this.controls.enableZoom = true;
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

		const delta = new THREE.Vector3()
			.copy(this.#target.position)
			.sub(this.controls.target);

		delta.y = 0

		this.controls.target.copy(this.#target.position);

		this.instance.position.add(delta);
		this.controls.update();
	}
}
