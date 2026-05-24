import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
const stlExporter = new STLExporter();
let perspectiveCamera: THREE.PerspectiveCamera;
let orthographicCamera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let glyphGroup: THREE.Group;
let meshes: THREE.Mesh[] = [];
let animationFrameId: number;

const DEFAULT_VIEW_DIRECTION = new THREE.Vector3(0, 0.25, 1).normalize();
const DEFAULT_GLYPH_GAP = 40;
const GRID_SIZE = 4500;
const GRID_DIVISIONS = 60;
const DEFAULT_ORTHOGRAPHIC_FRUSTUM_HEIGHT = 300;
const baseColorMaterial = new THREE.MeshMatcapMaterial({
  color: 'skyblue',
  side: THREE.DoubleSide,
  flatShading: true,
});
const normalMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, flatShading: true });

export type CameraMode = 'perspective' | 'orthographic';
export type MaterialMode = 'base-color' | 'normal-vectors';

let currentCameraMode: CameraMode = 'perspective';
let currentMaterialMode: MaterialMode = 'base-color';
let orthographicFrustumHeight = DEFAULT_ORTHOGRAPHIC_FRUSTUM_HEIGHT;
let glyphGap = DEFAULT_GLYPH_GAP;

export interface MeshInstance {
  geometry: THREE.BufferGeometry;
  position?: THREE.Vector3;
  rotation?: THREE.Vector3;
}

function getGlyphMaterial(mode: MaterialMode): THREE.Material {
  return mode === 'normal-vectors' ? normalMaterial : baseColorMaterial;
}

function applyMaterialMode(mode: MaterialMode) {
  currentMaterialMode = mode;
  const material = getGlyphMaterial(mode);

  for (const mesh of meshes) {
    mesh.material = material;
  }
}

function setOrthographicFrustum(width: number, height: number) {
  const safeHeight = Math.max(height, 1);
  const aspect = width / safeHeight;
  const halfHeight = orthographicFrustumHeight / 2;
  const halfWidth = halfHeight * aspect;

  orthographicCamera.left = -halfWidth;
  orthographicCamera.right = halfWidth;
  orthographicCamera.top = halfHeight;
  orthographicCamera.bottom = -halfHeight;
  orthographicCamera.updateProjectionMatrix();
}

function setCameraPositionAndRange(center: THREE.Vector3, radius: number) {
  const distance = radius * 2.8;

  camera.position.copy(center).addScaledVector(DEFAULT_VIEW_DIRECTION, distance);
  camera.near = Math.max(0.1, radius / 100);
  camera.far = Math.max(1000, radius * 20);
  camera.updateProjectionMatrix();
}

function applyCameraMode(mode: CameraMode) {
  currentCameraMode = mode;
  camera = mode === 'orthographic' ? orthographicCamera : perspectiveCamera;

  controls.object = camera;
  frameMeshes();
}

export function initScene(container: HTMLElement) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfafafa);

  const width = container.clientWidth;
  const height = container.clientHeight;

  perspectiveCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
  perspectiveCamera.position.set(150, 150, 150);
  perspectiveCamera.lookAt(0, 0, 0);

  orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10000);
  orthographicCamera.position.set(150, 150, 150);
  orthographicCamera.lookAt(0, 0, 0);
  setOrthographicFrustum(width, height);

  camera = perspectiveCamera;

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

  const floorGrid = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, 0x8b8f9c, 0xc7cbd6);
  floorGrid.position.set(0, 0, 0);
  scene.add(floorGrid);

  glyphGroup = new THREE.Group();
  scene.add(glyphGroup);

  const placeholder = new THREE.Mesh(new THREE.BoxGeometry(), getGlyphMaterial(currentMaterialMode));
  glyphGroup.add(placeholder);
  meshes = [placeholder];

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.target.set(0, 0, 0);
  controls.update();

  applyCameraMode(currentCameraMode);

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  const container = renderer.domElement.parentElement;
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  perspectiveCamera.aspect = width / Math.max(height, 1);
  perspectiveCamera.updateProjectionMatrix();
  setOrthographicFrustum(width, height);
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

  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + glyphGap * Math.max(meshes.length - 1, 0);
  let cursor = -totalWidth / 2;

  meshes.forEach((mesh, index) => {
    const width = widths[index];
    mesh.position.set(cursor + width / 2, 0, 0);
    cursor += width + glyphGap;
  });
}

function frameMeshes() {
  const box = new THREE.Box3().setFromObject(glyphGroup);
  if (box.isEmpty()) return;

  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 1);

  controls.target.copy(sphere.center);
  setCameraPositionAndRange(sphere.center, radius);

  if (currentCameraMode === 'orthographic') {
    orthographicFrustumHeight = radius * 2.8;
    const container = renderer.domElement.parentElement;
    if (container) {
      setOrthographicFrustum(container.clientWidth, container.clientHeight);
    }
  }

  controls.update();
}

export function setMeshInstances(instances: MeshInstance[]) {
  clearMeshes();

  const hasExplicitPositions = instances.some(({ position }) => position !== undefined);

  meshes = instances.map(({ geometry, position, rotation }) => {
    const mesh = new THREE.Mesh(geometry, getGlyphMaterial(currentMaterialMode));

    if (position) {
      mesh.position.copy(position);
    }

    if (rotation) {
      mesh.rotation.setFromVector3(rotation);
    }

    glyphGroup.add(mesh);
    return mesh;
  });

  if (!hasExplicitPositions) {
    layoutMeshes();
  }

  frameMeshes();
}

export function setCameraMode(mode: CameraMode) {
  applyCameraMode(mode);
}

export function setGlyphGap(nextGlyphGap: number) {
  glyphGap = Number.isFinite(nextGlyphGap) ? Math.max(0, nextGlyphGap) : DEFAULT_GLYPH_GAP;
}

export function exportGlyphGroupBinaryStl(): DataView<ArrayBuffer> {
  const exportRoot = glyphGroup.clone();
  exportRoot.rotation.x = Math.PI / 2;
  exportRoot.updateMatrixWorld(true);

  return stlExporter.parse(exportRoot, { binary: true }) as DataView<ArrayBuffer>;
}

export function setMaterialMode(mode: MaterialMode) {
  applyMaterialMode(mode);
}

export function dispose() {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', onWindowResize);
  controls.dispose();
  renderer.dispose();
  baseColorMaterial.dispose();
  normalMaterial.dispose();
}
