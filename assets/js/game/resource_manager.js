import EventEmitter from "./utils/event_emitter";
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader.js";

export default class ResourceManager extends EventEmitter {

	/**
	 * @type {{name: string, type: string, path: string[]|string}[]}
	 */
	#assets = []

	items = new Map()
	#loaded = 0
	#toLoad = 0

	#loaderManager = new THREE.LoadingManager(
    () => {
      this.emit('loaded')
    },
    (itemUrl, itemsLoaded, itemsTotal) => {
      this.emit('progress', [
				itemUrl,
        itemsLoaded,
        itemsTotal
      ])
    }
  )

	#loaders = {
    gltfLoader: new GLTFLoader(this.#loaderManager),
    fbxLoader: new FBXLoader(this.#loaderManager),
    textureLoader: new THREE.TextureLoader(this.#loaderManager),
    cubeTextureLoader: new THREE.CubeTextureLoader(this.#loaderManager)
  }

	/**
	 *
	 * @param {{name: string, type: string, path: string[]|string}[]} assets
	 */
	constructor(assets) {
		super()
		this.#assets = assets
		this.#toLoad = assets.length
		this.#startLoading()
	}

	#startLoading() {
		for (const source of this.#assets) {
			switch (source.type) {
        case "gltf":
          this.#loaders.gltfLoader.load(source.path, (file) => {
              this.#sourceLoaded(source.name, file)
          })
          break;
        case "fbx":
          this.#loaders.fbxLoader.load(source.path, (file) => {
            this.#sourceLoaded(source.name, file)
          })
          break;
        case "texture":
          this.#loaders.textureLoader.load(source.path, (file) => {
            this.#sourceLoaded(source.name, file)
          })
          break;
        case "cubeTexture":
          this.#loaders.cubeTextureLoader.load(source.path, (file) => {
            this.#sourceLoaded(source.name, file)
          })
          break;
        default:
					throw new Error("Resource loading not implemented")
          break;
      }
		}
	}

	#sourceLoaded(name, file) {
		this.items.set(name, file)
		this.#loaded++

		if(this.#loaded == this.#toLoad) {
			this.emit("ready")
		}
	}
}
