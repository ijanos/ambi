import ManifoldModule, { type ManifoldToplevel } from 'manifold-3d';

// Polyfill Symbol.dispose for environments (like Safari < 18.3) that don't support it natively
if (typeof Symbol !== 'undefined' && !Symbol.dispose) {
  Object.defineProperty(Symbol, 'dispose', {
    value: Symbol.for('Symbol.dispose'),
    configurable: false,
    enumerable: false,
    writable: false,
  });
}

// Augment the manifold-3d module types so TS knows these types support the Disposable protocol
declare module 'manifold-3d' {
  interface Manifold {
    [Symbol.dispose](): void;
  }
  interface CrossSection {
    [Symbol.dispose](): void;
  }
}

let manifold: ManifoldToplevel | undefined;

export async function initManifold(): Promise<void> {
  manifold = await ManifoldModule();
  manifold.setup();

  // Patch prototypes to implement the Explicit Resource Management (Disposable) protocol
  if (typeof Symbol !== 'undefined' && Symbol.dispose) {
    const manifoldProto = manifold.Manifold.prototype as any;
    if (!(Symbol.dispose in manifoldProto)) {
      Object.defineProperty(manifoldProto, Symbol.dispose, {
        value: manifoldProto.delete,
        configurable: true,
        writable: true,
      });
    }
    const xsProto = manifold.CrossSection.prototype as any;
    if (!(Symbol.dispose in xsProto)) {
      Object.defineProperty(xsProto, Symbol.dispose, {
        value: xsProto.delete,
        configurable: true,
        writable: true,
      });
    }
  }
}

export function getManifold(): ManifoldToplevel {
  if (!manifold) {
    throw new Error('Manifold not initialized. Call initManifold() first.');
  }
  return manifold;
}
