import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { calculateObjectSize } from "../utils/calc";

export default class Player extends THREE.Object3D {
	fsm = "idle";
	uuid = null;
	label = null;
	targetedPosition = new THREE.Vector3();
	isLocal = false;
	_dirty = false;

	/**
	 * @param {string} uuid
	 * @param {import('three').Vector3} spawnPosition
	 */
	constructor(uuid, spawnPosition = new THREE.Vector3()) {
		super();
		this.uuid = uuid;
		this.#setModel();
		this.#createLabel();

		// Spawn at the centre of the grid cell.
		// gridToWorld already returns the cell centre, donc on ne doit pas appliquer de décalage x/z.
		const spawnPositionCopy = spawnPosition.clone();
		const sizes = calculateObjectSize(this);
		spawnPositionCopy.y = Math.max(spawnPositionCopy.y, sizes.y / 2);

		this.position.copy(spawnPositionCopy);
	}

	/**
	 * @param {string} stateName
	 */
	changeFsmState(stateName) {
		this.fsm = stateName;
		this.#updateLabel();
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
		this.position.lerp(this.targetedPosition, delta);
	}

	destroy() {
		if (this.label.element) {
			const el = this.label.element;
			el.parentNode.removeChild(el);
		}

		this.label = null;
	}

	#setModel() {
		// TODO: use a model
		const geometry = new THREE.CapsuleGeometry(1, 1.5, 10, 20, 1);
		const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
		const mesh = new THREE.Mesh(geometry, material);

		this.add(mesh);
	}

	#createLabel() {
		const div = document.createElement("div");
		div.innerHTML = `
            <p style="color:white">${this.uuid}</p>
            <p style="color:white">fsm_state: ${this.fsm} </p>
        `;

		this.label = new CSS2DObject(div);
		this.label.position.set(0, 3, 0);
		this.add(this.label);
	}

	#updateLabel() {
		if (!this.label || !this.label.element) return;

		this.label.element.innerHTML = `
            <p style="color:white">${this.uuid}</p>
            <p style="color:white">fsm_state: ${this.fsm} </p>
        `;
	}
}
