import * as _THREE from "../external/three";
// import OrbitControls from "../external/OrbitControls.mjs";

const THREE = {
  ..._THREE,
  // OrbitControls,
};

export function setupScene({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
  camera.position.set(0, -100, 100);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minDistance = 10;
  controls.maxDistance = 600;

  scene.add(new THREE.AmbientLight(0x222222));

  /// direct light
  var light = new THREE.DirectionalLight(0x222222);
  light.position.set(0.75, 0.75, 1.0).normalize();
  scene.add(light);

  light = new THREE.PointLight(0x222222);
  light.position.copy(camera.position);
  scene.add(light);

  const group = new THREE.Group();
  scene.add(group);

  /// backgroup grids
  var helper = new THREE.GridHelper(70, 10);
  helper.rotation.x = Math.PI / 2;
  group.add(helper);
}
