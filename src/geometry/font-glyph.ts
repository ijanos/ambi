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
const GLYPH_DEPTH = 200;
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
  // Center the solid along the x and z axes, keeping y at 0 to keep letters base aligned
  const [x, , z] = getBoxCenter(solid);
  return solid.translate(-x, 0, -z);
}

function extrudeContours(
  manifold: ManifoldToplevel,
  character: string,
  contours: SimplePolygon[],
): ManifoldSolid {
  using crossSection = manifold.CrossSection.ofPolygons(contours, FILL_RULE);
  using solid = crossSection.extrude(GLYPH_DEPTH, 0, 0, [1, 1], true);
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

export function createIntersectedGlyphSolidFromFont(
  font: Font,
  firstCharacter: string,
  secondCharacter: string,
  rotatedGlyphYDegrees: number,
): ManifoldSolid {
  using firstGlyph = createGlyphSolidFromFont(font, firstCharacter);
  using secondGlyph = createGlyphSolidFromFont(font, secondCharacter);
  using rotatedSecondGlyph = secondGlyph.rotate(0, rotatedGlyphYDegrees, 0);
  const intersection = firstGlyph.intersect(rotatedSecondGlyph);

  // Detect disconnected components in the intersection result.
  // decompose() splits the solid into topologically disconnected pieces.
  // A component is only a problem for 3D printing if it's elevated above
  // the baseplate (Y=0); components touching Y≈0 can be printed fine.
  const components = intersection.decompose();
  try {
    if (components.length > 1) {
      const baseplateTolerance = Math.max(EPSILON, intersection.tolerance());
      const componentInfo = components.map((comp, i) => {
        const box = comp.boundingBox();
        return {
          index: i,
          volume: comp.volume(),
          minY: box.min[1],
          onBaseplate: box.min[1] <= baseplateTolerance,
        };
      });

      // Sort by volume descending so the largest component is first
      componentInfo.sort((a, b) => b.volume - a.volume);

      const baseplateComponents = componentInfo.filter(c => c.onBaseplate);
      const floatingComponents = componentInfo.filter(c => !c.onBaseplate);

      if (floatingComponents.length > 0) {
        console.warn('[font-glyph] Truly floating geometry in intersection', {
          characters: `${firstCharacter}/${secondCharacter}`,
          totalComponents: components.length,
          baseplateComponents: baseplateComponents.length,
          floatingComponents: floatingComponents.length,
          floatingVolumes: floatingComponents.map(c => c.volume.toFixed(2)),
          floatingMinY: floatingComponents.map(c => c.minY.toFixed(3)),
        });
      } else {
        console.info('[font-glyph] Disconnected components all touch baseplate (printable)', {
          characters: `${firstCharacter}/${secondCharacter}`,
          componentCount: components.length,
          volumes: componentInfo.map(c => c.volume.toFixed(2)),
        });
      }
    }
  } finally {
    // Dispose decomposed components; they are copies, not the original intersection.
    for (const comp of components) {
      comp.delete();
    }
  }

  logMeshStats(`${firstCharacter}/${secondCharacter} intersection`, intersection.getMesh());
  return intersection;
}
