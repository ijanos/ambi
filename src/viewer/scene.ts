import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let mesh: THREE.Mesh;
let animationFrameId: number;

const DEFAULT_VIEW_DIRECTION = new THREE.Vector3(1, 0.8, 1).normalize();

export function initScene(container: HTMLElement) {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfafafa);

  // Camera — 45° isometric view
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  camera.position.set(150, 150, 150);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(100, 100, 100);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Create a placeholder mesh (will be replaced when geometry is loaded)
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshNormalMaterial();
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.target.set(0, 0, 0);
  controls.update();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Start render loop
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

function frameGeometry(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingSphere();
  const sphere = geometry.boundingSphere;

  if (!sphere) return;

  const radius = Math.max(sphere.radius, 1);
  const distance = radius * 2.8;

  controls.target.copy(sphere.center);
  camera.position.copy(sphere.center).addScaledVector(DEFAULT_VIEW_DIRECTION, distance);
  camera.near = Math.max(0.1, radius / 100);
  camera.far = Math.max(1000, radius * 20);
  camera.updateProjectionMatrix();
  controls.update();
}

export function setMeshGeometry(geometry: THREE.BufferGeometry) {
  if (mesh.geometry !== geometry) {
    mesh.geometry.dispose();
    mesh.geometry = geometry;
  }

  frameGeometry(geometry);
}

export function dispose() {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', onWindowResize);
  controls.dispose();
  renderer.dispose();
}
