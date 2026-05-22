import type { Font } from 'three/addons/loaders/FontLoader.js';
import type {
  FillRule,
  Manifold as ManifoldSolid,
  ManifoldToplevel,
  Mesh,
  SimplePolygon,
  Vec2,
  Vec3,
} from 'manifold-3d';
import { getManifold } from './manifold';

const GLYPH_SIZE = 100;
const GLYPH_DEPTH = 100;
const CURVE_SEGMENTS = 12;
const FILL_RULE: FillRule = 'EvenOdd';
const EPSILON = 1e-6;

type OutlinePoint = {
  x: number;
  y: number;
};

type ShapePoints = {
  shape: OutlinePoint[];
  holes: OutlinePoint[][];
};

type ExtractableShape = {
  extractPoints(curveSegments: number): ShapePoints;
};

function arePointsEqual(a: Vec2, b: Vec2): boolean {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
}

function toVec2(point: OutlinePoint): Vec2 {
  return [point.x, point.y];
}

function removeClosingPoint(contour: Vec2[]) {
  if (contour.length < 2) {
    return;
  }

  const first = contour[0];
  const last = contour[contour.length - 1];
  if (arePointsEqual(first, last)) {
    contour.pop();
  }
}

function sanitizeContour(points: OutlinePoint[]): SimplePolygon {
  const contour: Vec2[] = [];

  for (const point of points) {
    const next = toVec2(point);
    const previous = contour.at(-1);

    if (previous && arePointsEqual(previous, next)) {
      continue;
    }

    contour.push(next);
  }

  removeClosingPoint(contour);

  if (contour.length < 3) {
    throw new Error(`Invalid contour: expected at least 3 unique points, got ${contour.length}`);
  }

  return contour;
}

function shapeToContours(shape: ExtractableShape): SimplePolygon[] {
  const { shape: outerPoints, holes } = shape.extractPoints(CURVE_SEGMENTS);
  const contours: SimplePolygon[] = [sanitizeContour(outerPoints)];

  for (const holePoints of holes) {
    contours.push(sanitizeContour(holePoints));
  }

  return contours;
}

function collectContours(shapes: ExtractableShape[]): SimplePolygon[] {
  const contours: SimplePolygon[] = [];

  for (const shape of shapes) {
    contours.push(...shapeToContours(shape));
  }

  return contours;
}

function logOutlineStats(character: string, contours: SimplePolygon[]) {
  console.log('[font-glyph] outline stats', {
    character,
    curveSegments: CURVE_SEGMENTS,
    contourCount: contours.length,
    pointsPerContour: contours.map((contour) => contour.length),
  });
}

function logMeshStats(character: string, manifoldMesh: Mesh) {
  if (!manifoldMesh || !manifoldMesh.triVerts || !manifoldMesh.vertProperties) {
    throw new Error(`Invalid mesh data returned from Manifold for glyph ${character}`);
  }

  console.log('[font-glyph] mesh stats', {
    character,
    numProp: manifoldMesh.numProp,
    vertProperties: manifoldMesh.vertProperties.length,
    vertices: manifoldMesh.vertProperties.length / manifoldMesh.numProp,
    triangles: manifoldMesh.triVerts.length / 3,
  });
}

function getBoxCenter(solid: ManifoldSolid): Vec3 {
  const box = solid.boundingBox();
  return [
    (box.min[0] + box.max[0]) / 2,
    (box.min[1] + box.max[1]) / 2,
    (box.min[2] + box.max[2]) / 2,
  ];
}

function centerSolid(solid: ManifoldSolid): ManifoldSolid {
  const [x, y, z] = getBoxCenter(solid);
  return solid.translate(-x, -y, -z);
}

function extrudeContours(
  manifold: ManifoldToplevel,
  character: string,
  contours: SimplePolygon[],
): ManifoldSolid {
  const crossSection = manifold.CrossSection.ofPolygons(contours, FILL_RULE);
  const solid = crossSection.extrude(GLYPH_DEPTH, 0, 0, [1, 1], true);
  const centeredSolid = centerSolid(solid);

  logMeshStats(character, centeredSolid.getMesh());
  return centeredSolid;
}

export function createGlyphSolidFromFont(font: Font, character: string): ManifoldSolid {
  const manifold = getManifold();
  const shapes = font.generateShapes(character, GLYPH_SIZE);

  if (shapes.length === 0) {
    throw new Error(`No glyph shapes generated for character ${JSON.stringify(character)}`);
  }

  const contours = collectContours(shapes);
  logOutlineStats(character, contours);

  return extrudeContours(manifold, character, contours);
}
