import Game from "./game";
import * as THREE from "three";

/**
 * Get some lights and add a sky
 * Days and Nights
 */
export default class Environement {
	ambientLight = new THREE.AmbientLight(0xffffff);
	directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
	#directionalLightConfig = {
		intensity: 1,
		position: { x: -50, y: 40, z: -35 },
		castShadow: true,
	};
	#skyConfig = {
		color: "#daf4f4"
	}

	constructor() {
		this.game = Game.getInstance();
		this.debug = this.game.debug;
		this.scene = this.game.scene;
		this.game.scene.background = new THREE.Color(this.#skyConfig.color)

		const d = 50;
		this.directionalLight.shadow.camera.left = -d;
		this.directionalLight.shadow.camera.right = d;
		this.directionalLight.shadow.camera.top = d;
		this.directionalLight.shadow.camera.bottom = -d;
		this.directionalLight.shadow.camera.near = 0.1;
		this.directionalLight.shadow.camera.far = 100;
		this.directionalLight.shadow.mapSize.width = 4096;
		this.directionalLight.shadow.mapSize.height = 4096;
		this.directionalLight.shadow.bias = -0.001;
		this.directionalLight.castShadow = true;

		this.#applyLightConfig();

		this.scene.add(this.ambientLight);
		this.scene.add(this.directionalLight);

		if (this.debug.active) {
			// LIGHTS FOLDER
			const lightsFolder = this.debug.ui.addFolder({
				title: "Lights"
			});

			lightsFolder.addBinding(this.#directionalLightConfig, "intensity", {
				min: 0,
				max: 2,
			});
			lightsFolder.addBinding(this.#directionalLightConfig, "position");
			lightsFolder.addBinding(this.#directionalLightConfig, "castShadow");
			lightsFolder.on("change", () => {
				console.log("Changement lights");
				this.#applyLightConfig();
			});


			// SKY FOLDER
			const skyFolder = this.debug.ui.addFolder({
				title: "Sky"
			});
			skyFolder.addBinding(this.#skyConfig, "color")
			skyFolder.on("change", () => {
				console.log("Changement sky");
				this.#applySkyConfig();
			});
		}
	}

	#applyLightConfig() {
		this.directionalLight.intensity = this.#directionalLightConfig.intensity;
		this.directionalLight.position.set(
			this.#directionalLightConfig.position.x,
			this.#directionalLightConfig.position.y,
			this.#directionalLightConfig.position.z,
		);
		this.directionalLight.castShadow = this.#directionalLightConfig.castShadow;
	}

	#applySkyConfig() {
		this.scene.background = new THREE.Color(this.#skyConfig.color)
	}
}
