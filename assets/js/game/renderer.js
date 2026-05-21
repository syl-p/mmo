import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/Addons.js";
import Game from "./game";

export default class Renderer {
	game = Game.getInstance();
	instance;
	scene;
	canvas;
	labelRenderer;

	constructor() {
		this.game =Game.getInstance();
		this.sizes = this.game.sizes;
		this.scene = this.game.scene;
		this.canvas = this.game.canvas;
		this.setInstance();
	}

	setInstance() {
		this.instance = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
		});

		this.instance.physicallyCorrectLights = true;
		// this.instance.outputEncoding = THREE.sRGBEncoding;
		this.instance.toneMapping = THREE.ACESFilmicToneMapping;
		this.instance.toneMappingExposure = 1.75;
		this.instance.shadowMap.enabled = true;
		this.instance.shadowMap.type = THREE.PCFShadowMap;
		this.instance.setClearColor("#211d20");
		this.instance.setSize(this.sizes.width, this.sizes.height);
		this.instance.setPixelRatio(this.sizes.pixelRatio);

		// CSS2 Label on Mobs and players
		this.labelRenderer = new CSS2DRenderer();
		this.labelRenderer.setSize(this.sizes.width, this.sizes.height);
		this.labelRenderer.domElement.style.position = "absolute";
		this.labelRenderer.domElement.style.top = "0";
		this.labelRenderer.domElement.style.pointerEvents = "none";
		document.body.appendChild(this.labelRenderer.domElement);
	}

	resize() {
		this.instance.setSize(this.sizes.width, this.sizes.height);
		this.instance.setPixelRatio(this.sizes.pixelRatio);

		if (this.labelRenderer) {
			this.labelRenderer.setSize(this.sizes.width, this.sizes.height);
		}
	}

	update() {
		this.instance.render(this.scene, this.game.camera.instance);
		this.labelRenderer.render(this.scene, this.game.camera.instance);
	}
}
