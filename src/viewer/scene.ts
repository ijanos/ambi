import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let glyphGroup: THREE.Group;
let meshes: THREE.Mesh[] = [];
let animationFrameId: number;

const DEFAULT_VIEW_DIRECTION = new THREE.Vector3(1, 0.8, 1).normalize();
const GLYPH_GAP = 40;
const glyphMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });

export interface MeshInstance {
  geometry: THREE.BufferGeometry;
  position?: readonly [number, number, number];
  rotation?: readonly [number, number, number];
}

export function initScene(container: HTMLElement) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfafafa);

  const width = container.clientWidth;
  const height = container.clientHeight;
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  camera.position.set(150, 150, 150);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(100, 100, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  glyphGroup = new THREE.Group();
  scene.add(glyphGroup);

  const placeholder = new THREE.Mesh(new THREE.BoxGeometry(), glyphMaterial);
  glyphGroup.add(placeholder);
  meshes = [placeholder];

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.target.set(0, 0, 0);
  controls.update();

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  const container = renderer.domElement.parentElement;
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function clearMeshes() {
  for (const mesh of meshes) {
    glyphGroup.remove(mesh);
    mesh.geometry.dispose();
  }
  meshes = [];
}

function layoutMeshes() {
  if (meshes.length === 0) return;

  const widths = meshes.map((mesh) => {
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    return box ? box.max.x - box.min.x : 0;
  });

  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + GLYPH_GAP * Math.max(meshes.length - 1, 0);
  let cursor = -totalWidth / 2;

  meshes.forEach((mesh, index) => {
    const width = widths[index];
    mesh.position.set(cursor + width / 2, 0, 0);
    cursor += width + GLYPH_GAP;
  });
}

function frameMeshes() {
  const box = new THREE.Box3().setFromObject(glyphGroup);
  if (box.isEmpty()) return;

  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 1);
  const distance = radius * 2.8;

  controls.target.copy(sphere.center);
  camera.position.copy(sphere.center).addScaledVector(DEFAULT_VIEW_DIRECTION, distance);
  camera.near = Math.max(0.1, radius / 100);
  camera.far = Math.max(1000, radius * 20);
  camera.updateProjectionMatrix();
  controls.update();
}

export function setMeshInstances(instances: MeshInstance[]) {
  clearMeshes();

  meshes = instances.map(({ geometry, position, rotation }) => {
    const mesh = new THREE.Mesh(geometry, glyphMaterial);

    if (position) {
      mesh.position.set(position[0], position[1], position[2]);
    }

    if (rotation) {
      mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    }

    glyphGroup.add(mesh);
    return mesh;
  });

  frameMeshes();
}

export function setMeshGeometries(geometries: THREE.BufferGeometry[]) {
  clearMeshes();

  meshes = geometries.map((geometry) => {
    const mesh = new THREE.Mesh(geometry, glyphMaterial);
    glyphGroup.add(mesh);
    return mesh;
  });

  layoutMeshes();
  frameMeshes();
}

export function setMeshGeometry(geometry: THREE.BufferGeometry) {
  setMeshGeometries([geometry]);
}

export function dispose() {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', onWindowResize);
  controls.dispose();
  renderer.dispose();
}
