import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

export default class Mob extends THREE.Object3D {
	fsm = "idle";
	uuid = null;
	label = null;
	targetedPosition = new THREE.Vector3();

	/**
	 * @param {string} uuid
	 * @param {import('three').Vector3} spawnPosition
	 */
	constructor(uuid, spawnPosition = new THREE.Vector3(), rotation) {
		super();
		this.uuid = uuid;
		this.$setModel();
		this.$createLabel();
		this.position.copy(spawnPosition);
		this.rotation.y = Math.PI / 2 - (rotation || 0);
	}

	/**
	 * @param {string} stateName
	 */
	changeFsmState(stateName) {
		this.fsm = stateName;
		this.$updateLabel();
	}

	/**
	 * @param {THREE.Vector3} position
	 */
	changePosition(position) {
		if (this.targetedPosition) this.targetedPosition.copy(position);
	}

	/**
	 * Place it into Threejs global loop
	 * @param {number} delta
	 */
	update(delta) {
		const lerpFactor = 1 - Math.pow(0.001, delta);
		this.position.lerp(this.targetedPosition, lerpFactor);
	}

	destroy() {
		if (this.label.element) {
			const el = this.label.element;
			el.parentNode.removeChild(el);
		}

		this.label = null;
	}

	$setModel() {
		// TODO: use a model
		const geometry = new THREE.BoxGeometry(1, 1, 2);
		const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
		const mesh = new THREE.Mesh(geometry, material);

		this.add(mesh);
	}

	$createLabel() {
		const div = document.createElement("div");
		div.innerHTML = `
            <p style="color:white">${this.uuid}</p>
            <p style="color:white">fsm_state: ${this.fsm} </p>
        `;

		this.label = new CSS2DObject(div);
		this.label.position.set(0, 3, 0);
		this.add(this.label);
	}

	$updateLabel() {
		if (!this.label || !this.label.element) return;

		this.label.element.innerHTML = `
            <p style="color:white">${this.uuid}</p>
            <p style="color:white">fsm_state: ${this.fsm} </p>
        `;
	}
}
