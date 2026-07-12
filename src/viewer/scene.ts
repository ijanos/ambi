import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { createChamferedBaseSolid } from '../geometry/base';
import type { CameraMode, MaterialMode } from '../types';
import { manifoldToThree } from './mesh-bridge';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
const stlExporter = new STLExporter();
let perspectiveCamera: THREE.PerspectiveCamera;
let orthographicCamera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let glyphGroup: THREE.Group;
let meshes: THREE.Mesh[] = [];
let baseMesh: THREE.Mesh | undefined;
let animationFrameId: number;

const DEFAULT_VIEW_DIRECTION = new THREE.Vector3(0, 0.25, 1).normalize();
const DEFAULT_GLYPH_GAP = 5;
const GRID_SIZE = 500;
const GRID_DIVISIONS = 50;
const DEFAULT_ORTHOGRAPHIC_FRUSTUM_HEIGHT = 300;
const baseColorMaterial = new THREE.MeshMatcapMaterial({
  color: 'skyblue',
  side: THREE.DoubleSide,
  flatShading: true,
});
const normalMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, flatShading: true });
const wireframeMaterial = new THREE.MeshStandardMaterial({
  color: 0x6b6375,
  side: THREE.DoubleSide,
  wireframe: true,
});

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
  if (mode === 'normal-vectors') return normalMaterial;
  if (mode === 'wireframe') return wireframeMaterial;
  return baseColorMaterial;
}

function applyMaterialMode(mode: MaterialMode) {
  currentMaterialMode = mode;
  const material = getGlyphMaterial(mode);

  for (const mesh of meshes) {
    mesh.material = material;
  }
  if (baseMesh) {
    baseMesh.material = material;
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
  perspectiveCamera.position.set(15, 15, 15);
  perspectiveCamera.lookAt(0, 0, 0);

  orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10000);
  orthographicCamera.position.set(15, 15, 15);
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

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.autoRotate = false;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
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

  if (baseMesh) {
    glyphGroup.remove(baseMesh);
    baseMesh.geometry.dispose();
    baseMesh = undefined;
  }
}

function layoutMeshes() {
  if (meshes.length === 0) return;

  const widths = meshes.map((mesh) => {
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    if (!box) return 0;
    const width = box.max.x - box.min.x;
    // Empty geometries produce degenerate bounding boxes (min=Infinity, max=-Infinity),
    // resulting in non-finite widths. Guard against this to prevent cascading NaN layout.
    return Number.isFinite(width) ? Math.max(0, width) : 0;
  });

  const totalWidth =
    widths.reduce((sum, width) => sum + width, 0) + glyphGap * Math.max(meshes.length - 1, 0);
  let cursor = -totalWidth / 2;

  meshes.forEach((mesh, index) => {
    // biome-ignore lint/style/noNonNullAssertion: index is bounded by meshes.forEach
    const width = widths[index]!;
    mesh.position.set(cursor + width / 2, 0, 0);
    cursor += width + glyphGap;
  });
}

function frameMeshes() {
  const box = new THREE.Box3().setFromObject(glyphGroup);
  if (box.isEmpty()) return;

  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 1);
  controls.minDistance = radius * 0.3;
  controls.maxDistance = radius * 10;

  controls.target.copy(sphere.center);
  setCameraPositionAndRange(sphere.center, radius);

  if (currentCameraMode === 'orthographic') {
    orthographicFrustumHeight = radius * 3.5;
    const container = renderer.domElement.parentElement;
    if (container) {
      setOrthographicFrustum(container.clientWidth, container.clientHeight);
    }
  }

  controls.update();
}

export function setMeshInstances(
  instances: MeshInstance[],
  baseOptions?: { enabled: boolean; height: number },
) {
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

  if (baseOptions?.enabled && meshes.length > 0) {
    const box = new THREE.Box3();
    for (const mesh of meshes) {
      box.expandByObject(mesh);
    }

    if (!box.isEmpty()) {
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const BASE_PADDING = 1.5;
      const baseWidth = size.x + BASE_PADDING * 2;
      const baseDepth = size.z + BASE_PADDING * 2;
      const baseHeight = baseOptions.height / 10;

      using baseSolid = createChamferedBaseSolid(baseWidth, baseDepth, baseHeight);
      const baseGeometry = manifoldToThree(baseSolid.getMesh());

      baseMesh = new THREE.Mesh(baseGeometry, getGlyphMaterial(currentMaterialMode));
      baseMesh.position.set(center.x, 0, center.z);

      // Shift all letter meshes upwards so they sit on top of the base with a small overlap
      const shiftY = baseHeight - 0.15;
      for (const mesh of meshes) {
        mesh.position.y += shiftY;
      }

      glyphGroup.add(baseMesh);
    }
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
  wireframeMaterial.dispose();
}
