import * as THREE from "three";

/**
 * @returns {THREE.GridHelper}
 */
export function setGridFloor(width = 100, div = 10) {
  const grid = new THREE.GridHelper(width, div, 0x444444, 0x888888);
  grid.receiveShadow = true;
  return grid;
}