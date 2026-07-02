import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/Addons.js";
import Debug from "../utils/debug";

/**
 * Load Terrain from Heightmap Image and apply some stuff
 */
export default class TerrainManager {
	#heightCanvas = document.createElement("canvas")
	#heightImage = new Image();
	#splatCanvas = document.createElement("canvas")
	#splatImage = new Image()
	#geometry = new THREE.BufferGeometry();
	#shader = null;

	#config = {
		// leavesColor: "#00ff00",
		baseColor: "#c4b699",
		redMask: "#ff0000",
		greenMask: "#1a791a",
		blueMask: "#787879"
	};


	#material = new THREE.MeshStandardMaterial({
		lights: true,
		color: this.#config.baseColor,
		uniforms: {
			uBaseColor: { value: new THREE.Color(this.#config.baseColor) },
			uRedColor:   { value: new THREE.Color(this.#config.redMask) },
			uGreenColor: { value: new THREE.Color(this.#config.greenMask) },
			uBlueColor:  { value: new THREE.Color(this.#config.blueMask) },
		},
	});

	/**
	 *
	 * @param {THREE.Scene} scene
	 * @param {Debug} debug
	 */
	constructor(scene, debug) {
		this.debug = debug;
		this.scene = scene;
		this.validTiles = new Set();

		if (this.debug.active) {
			const terrainDebugFolder = this.debug.ui.addFolder({
				title: "Terrain",
			});

			terrainDebugFolder.addBinding(this.#config, "baseColor", {
				view: "color",
				label: "Base Color",
				color: true,
			});

			terrainDebugFolder.addBinding(this.#config, "redMask", {});
			terrainDebugFolder.addBinding(this.#config, "greenMask", {});
			terrainDebugFolder.addBinding(this.#config, "blueMask", {});

			terrainDebugFolder.on("change", () => {
				this.#updateConfig();
			});
		}
	}

	async load() {
		console.log("🗻 Loading heightmap...");

		// 1. Charge juste les metadata (léger)
		const response = await fetch("/assets/world/map/main_map.json");
		this.heightmapData = await response.json();

		// 2. Charge l'image PNG (le navigateur la cache)
		this.#heightImage.src = "/assets/world/map/main_map.png";

		// Attends que l'image soit chargée
		await new Promise((resolve) => {
			this.#heightImage.onload = resolve;
		});


		console.log("🗻 Loading splatmap...");
		this.#splatImage.src = "/assets/world/map/splat_map.png";

		await new Promise((resolve) => {
			this.#splatImage.onload = resolve;
		});


		// 3. Crée le terrain avec l'image
		this.#createTerrainMesh(this.#heightImage);
		this.#stylise(this.#splatImage)

		this.terrain = new THREE.Mesh(this.#geometry, this.#material);
		this.terrain.castShadow = true;
		this.terrain.receiveShadow = true;
		this.scene.add(this.terrain);
		console.log("✅ Terrain loaded");
	}

	/**
	 * @param {Image} image
	 */
	#createTerrainMesh(image) {
		const canvas = this.#heightCanvas;
		canvas.width = image.width;
		canvas.height = image.height;

		const ctx = canvas.getContext("2d");
		ctx.drawImage(image, 0, 0);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const pixels = imageData.data;

		const { bounds, maxHeight } = this.heightmapData;
		const width = image.width;
		const height = image.height;

		const vertices = [];
		const indices = [];

		// Vertices à partir du heightmap PNG
		for (let z = 0; z < height; z++) {
			for (let x = 0; x < width; x++) {
				const pixelIndex = (z * width + x) * 4;
				const gray = pixels[pixelIndex]; // R channel (grayscale)

				const posX = bounds.minX + (x / width) * (bounds.maxX - bounds.minX);
				const posY = (gray / 255) * maxHeight;
				const posZ = bounds.minZ + (z / height) * (bounds.maxZ - bounds.minZ);

				vertices.push(posX, posY, posZ);
			}
		}

		// Indices
		for (let z = 0; z < height - 1; z++) {
			for (let x = 0; x < width - 1; x++) {
				const a = z * width + x;
				const b = a + 1;
				const c = a + width;
				const d = c + 1;

				indices.push(a, c, b);
				indices.push(b, c, d);
			}
		}

		this.#geometry.setAttribute(
			"position",
			new THREE.BufferAttribute(new Float32Array(vertices), 3),
		);

		this.#geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
		this.#geometry.computeVertexNormals();
	}

	/**
	 *	Shader work
	 * @param {Image} image
	 */
	#stylise(image) {
		const canvas = this.#splatCanvas;
		canvas.width = image.width;
		canvas.height = image.height;

		const ctx = canvas.getContext("2d");
		ctx.drawImage(image, 0, 0);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const pixels = imageData.data;

		// GET COLOR ON PIXEL AND SET MASK FOR ATTRIBUTES APPLICATIONS

		const vertexCount = canvas.width * canvas.height;
		const RedMask = new Float32Array(vertexCount);
		const GreenMask = new Float32Array(vertexCount);
		const BlueMask = new Float32Array(vertexCount);

		for (let i = 0, pixelIndex = 0; i < vertexCount; i++, pixelIndex += 4) {
			RedMask[i] = pixels[pixelIndex] / 255;
			GreenMask[i] = pixels[pixelIndex + 1] / 255;
			BlueMask[i] = pixels[pixelIndex + 2] / 255;
		}

		this.#geometry.setAttribute("RedMask", new THREE.BufferAttribute(RedMask, 1));
		this.#geometry.setAttribute("GreenMask", new THREE.BufferAttribute(GreenMask, 1));
		this.#geometry.setAttribute("BlueMask", new THREE.BufferAttribute(BlueMask, 1));

		this.#material.onBeforeCompile = (shader) => {
			this.#shader = shader; // For updates

			shader.uniforms.uBaseColor = { value: new THREE.Color(this.#config.baseColor) };
			shader.uniforms.uRedColor   = { value: new THREE.Color(this.#config.redMask) };
			shader.uniforms.uGreenColor = { value: new THREE.Color(this.#config.greenMask) };
			shader.uniforms.uBlueColor  = { value: new THREE.Color(this.#config.blueMask) };

			shader.vertexShader = `
				attribute float RedMask;
				attribute float GreenMask;
				attribute float BlueMask;
				varying float vRedMask;
				varying float vGreenMask;
				varying float vBlueMask;

				varying vec2 vUv;
				varying vec3 vPosition;
				${shader.vertexShader}
			`.replace(
							`#include <uv_vertex>`,
							`#include <uv_vertex>
					vRedMask = RedMask;
					vGreenMask = GreenMask;
					vBlueMask = BlueMask;

					vUv = uv;
					vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
					`
				);

			shader.fragmentShader = `
					varying vec3 vPosition;
					varying float vRedMask;
					varying float vGreenMask;
					varying float vBlueMask;
					uniform vec3 uBaseColor;
					uniform vec3 uRedColor;
					uniform vec3 uGreenColor;
					uniform vec3 uBlueColor;
					${shader.fragmentShader}
			`.replace(
					 '#include <color_fragment>',
					`
					vec3 customColor = uBaseColor;
					customColor = mix(customColor, uRedColor, vRedMask);
					customColor = mix(customColor, uGreenColor, vGreenMask);
					customColor = mix(customColor, uBlueColor, vBlueMask);
					diffuseColor.rgb = customColor;
					`
			);
		};
	}

	// #setGrass() {
	// 	// Create instancedMesh
	// 	const geometry = new THREE.PlaneGeometry( 0.1, 1, 1, 4 );
	// 	const material = new THREE.MeshPhongMaterial({color: this.#config.leavesColor, side: THREE.DoubleSide})
	// 	const instanceNumber = 50000;

	// 	const grass = new THREE.InstancedMesh(geometry, material, instanceNumber)
	// 	this.scene.add(grass);

	// 	// On the terrain
	// 	const sampler = new MeshSurfaceSampler(this.terrain).setWeightAttribute("GreenMask").build()
	// 	const position = new THREE.Vector3();
	// 	const normal = new THREE.Vector3();
	// 	const dummy = new THREE.Object3D();

	// 	for (let i = 0; i < instanceNumber; i++) {
	// 		sampler.sample(position, normal)

	// 		dummy.position.copy(position)
  // 		dummy.rotation.y = Math.random() * Math.PI * 2;

	// 		const scale = 0.7 + Math.random() * 0.6;
	// 		dummy.scale.setScalar(scale);

	// 		dummy.updateMatrix();
	// 		grass.setMatrixAt(i, dummy.matrix);
	// 	}

	// 	grass.instanceMatrix.needsUpdate = true
	// 	console.log("✅ Grass loaded");
	// }

	#updateConfig() {
		this.#material.color.set(this.#config.baseColor);

		if (this.#shader) {
			this.#shader.uniforms.uBaseColor.value.set(this.#config.baseColor);
			this.#shader.uniforms.uRedColor.value.set(this.#config.redMask);
			this.#shader.uniforms.uGreenColor.value.set(this.#config.greenMask);
			this.#shader.uniforms.uBlueColor.value.set(this.#config.blueMask);
		}
	}
}
