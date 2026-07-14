import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import Time from "./utils/time";
import Sizes from "./utils/sizes";
import Camera from "./camera";
import Renderer from "./renderer";
import Debug from "./utils/debug";
import Player from "./entities/player";
import CharacterController from "./character_controller";
import Environement from "./environement";
import ResourceManager from "./resource_manager";
import sources from "./sources";
import ObstacleManager from "./map/obstacle_manager";
import GridManager from "./map/grid_manager";
import Terrain from "./map/terrain";
import { Channel } from "phoenix";
import Client from "./client";

export default class Game {
	debug = new Debug();
	stats = new Stats();
	scene = new THREE.Scene();
	time = new Time();
	sizes = new Sizes();

	/**
	 * @type {Map<string, Player>}
	 */
	players = new Map();


	/**
	 * @type {Map<string, Mob>}
	 */
	mobs = new Map();

	/** @type {GridManager} */
	grid = null;

	/** @type {string} */
	playerUuid = null;

	/** @type {CharacterController} */
	characterController = null;

	renderer = null;
	/** @type {Camera} */
	camera = null;

	/**
	 *
	 * @param {HTMLCanvasElement} canvas
	 * @param {Channel} chanel
	 * @param {Object} options
	 * @returns
	 */
	constructor(canvas, channel, options) {
		if (Game.instance) {
			return Game.instance;
		}

		Game.instance = this;
		this.client = new Client(channel, options);

		this.init(canvas).then(() => {
			console.log("Game initialized");
			window.Game = this
			this.initTerrain();
		});

		if (this.debug.active) {
			document.body.appendChild(this.stats.dom);
		}
	}

	/**
	 *
	 * @returns {Game}
	 */
	static getInstance() {
		return Game.instance;
	}

	async init(canvas) {
		if (!canvas) throw new Error("No canvas... !");
		this.canvas = canvas;
		this.environement = new Environement();

		// camera and controller
		this.camera = new Camera();
		if (this.player) {
			this.camera.target = this.player;
		}

		// render
		this.renderer = new Renderer();

		// Resources
		this.resourceManager = new ResourceManager(sources);
		this.resourceManager.on("progress", (url, loaded, total) => {
			console.log("loading", loaded, total);
		});
		this.resourceManager.on("ready", () => {
			console.log("ready");
			new ObstacleManager(this.resourceManager);
		});

		// Callback
		this.time.on("tick", () => {
			this.#update();
		});

		this.sizes.on("resize", () => {
			this.#resize();
		});
	}

	/**
	 * Get the player 3D Object
	 * @readonly
	 * @type {Player | undefined}
	 */
	get player() {
		return this.players.get(this.playerUuid);
	}

	initGrid(width, height, obstacles) {
		this.grid = new GridManager(
			this.scene,
			this.camera.instance,
			width,
			height,
			obstacles,
		);
	}

	/**
	 *
	 */
	initCharacterController() {
		if (!this.grid) throw new Error("No grid... !");
		this.characterController = new CharacterController();

		this.characterController.events.on("select", (args) => {
			const { x, y } = args;
			const position = this.#getWorldPosition(x, y, this.grid.gridGroup);

			if (position) {
				const worldToGrid = GridManager.worldToGrid(position.x, position.z);
				this.client.selectCell({ x: worldToGrid.x, y: worldToGrid.y });
			}
		});

		this.characterController.events.on("move", (args) => {
			const { x, y } = args;
			const position = this.#getWorldPosition(x, y, this.grid.gridGroup);

			if (position) {
				const worldToGrid = GridManager.worldToGrid(position.x, position.z);
				this.grid.onHover(worldToGrid.x, worldToGrid.y);
			}
		});
	}

	initTerrain() {
		this.terrain = new Terrain(this.scene, this.debug);
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

	/**
	 * PRIVATE METHODS
	 */

	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 * @param {THREE.Object3D} intersectObject
	 * @returns {THREE.Vector3 | null}
	 */
	#getWorldPosition(x, y, intersectObject) {
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera({ x: x, y: y }, this.camera.instance);

		const hits = raycaster.intersectObject(intersectObject);

		if (hits.length > 0) {
			return hits[0].point;
		}
		return null;
	}

	#update() {
		this.camera.update();
		this.renderer.update();
		this.terrain.update(this.player)

		this.players.forEach((p) => {
			p.update(this.time.delta * 0.005);
		});

		this.mobs.forEach((m) => {
			m.update(this.time.delta * 0.005);
		});

		if (this.debug.active) {
			this.stats.update();
		}
	}

	#resize() {
		this.camera.resize();
		this.renderer.resize();
	}
}
