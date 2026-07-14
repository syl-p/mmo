import * as THREE from "three";
const CELL_SIZE = 5.0;

export default class GridManager {
	#width = 0;
	#height = 0;
	#obstacles = [];
	#meshMap = new Map();
	#hoveredKey = null;
	#raycaster = new THREE.Raycaster();
	#camera = null;

	gridGroup = new THREE.Group();
	cellMeshes = new Map();

	#config = {
		walkable: 0x33aa33,
		nonWalkable: 0x555555,
	};

	/**
	 * Creates an instance of GridManager.
	 *
	 * @constructor
	 * @param {THREE.Scene} scene
	 * @param {THREE.Camera} camera
	 * @param {number} width
	 * @param {number} height
	 * @param {Array<{x: number, y: number}>} obstacles
	 */
	constructor(scene, camera, width, height, obstacles) {
		this.scene = scene;
		this.#camera = camera;
		this.#width = width;
		this.#height = height;
		this.#obstacles = obstacles;

		// GEO
		this.geo = new THREE.PlaneGeometry(CELL_SIZE * 0.94, CELL_SIZE * 0.94);
		this.geo.rotateX(-Math.PI / 2);

		this.#buildCells();
	}

	#buildCells() {
		// for lookup
		const obstacleSet = new Set(this.#obstacles.map((o) => `${o.x},${o.y}`));

		for (let x = 0; x < this.#width; x++) {
			for (let y = 0; y < this.#height; y++) {
				const walkable = !obstacleSet.has(`${x},${y}`);

				const mat = new THREE.MeshBasicMaterial({
					color: walkable ? this.#config.walkable : this.#config.nonWalkable,
					transparent: true,
					opacity: walkable ? 0.08 : 0.35,
					depthWrite: false,
					side: THREE.DoubleSide,
				});

				const mesh = new THREE.Mesh(this.geo, mat);

				mesh.position.set(
					x * CELL_SIZE + CELL_SIZE / 2,
					0.05, // léger offset au-dessus du sol
					y * CELL_SIZE + CELL_SIZE / 2,
				);
				mesh.userData = { gridX: x, gridY: y, walkable };
				mesh.raycast = THREE.Mesh.prototype.raycast;

				this.gridGroup.add(mesh);
				this.cellMeshes.set(`${x},${y}`, mesh);
			}
		}

		this.scene.add(this.gridGroup);
	}

	/**
	 *
	 * @param {number} gridX
	 * @param {number} gridY
	 * @returns
	 */
	static gridToWorld(gridX, gridY) {
		return new THREE.Vector3(
			gridX * CELL_SIZE + CELL_SIZE / 2,
			0,
			gridY * CELL_SIZE + CELL_SIZE / 2,
		);
	}

	static worldToGrid(worldX, worldZ) {
		return {
			x: Math.floor(worldX / CELL_SIZE),
			y: Math.floor(worldZ / CELL_SIZE),
		};
	}

	onHover(x, y) {
		const key = `${x},${y}`;
		const mesh = this.cellMeshes.get(key);
		if (this.#hoveredKey) {
			this.#resetCell(this.#hoveredKey);
		}

		if (mesh) {
			const { walkable } = mesh.userData;
			mesh.material.color.set(
				walkable ? this.#config.walkable : this.#config.nonWalkable,
			);
			mesh.material.opacity = 0.45;
		}

		this.#hoveredKey = key;
	}

	#resetCell(key) {
		const mesh = this.cellMeshes.get(key);

		if (mesh) {
			mesh.material.color.set(
				mesh.userData.walkable
					? this.#config.walkable
					: this.#config.nonWalkable,
			);
			mesh.material.opacity = mesh.userData.walkable ? 0.08 : 0.35;
		}
	}
}
