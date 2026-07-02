import * as THREE from "three";

/**
 * Calculates the size of a given object using its bounding box.
 * @param {THREE.Object3D} object
 * @returns {THREE.Vector3}
 */
function calculateObjectSize(object) {
	const vec3_4 = new THREE.Vector3();

	const bbox = new THREE.Box3();
	bbox.expandByObject(object);

	const size = bbox.getSize(vec3_4);

	return size;
}

export { calculateObjectSize };
