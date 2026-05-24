export type MeshExportFormat = 'stl';
export type MeshExportSource = 'glyph-group';

export type MeshExportRequest = {
  format: MeshExportFormat;
  source: MeshExportSource;
  fileBasename: string;
};

export type MeshExporter = {
  exportMesh(request: MeshExportRequest): void;
};

type CreateMeshExporterOptions = {
  exportGlyphGroupBinaryStl(): DataView<ArrayBuffer>;
};

function createStlFilename(fileBasename: string): string {
  return `${fileBasename}.stl`;
}

function triggerDownload(filename: string, bytes: DataView<ArrayBuffer>, mimeType: string): void {
  const blob = new Blob([bytes], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}

export function createMeshExporter(options: CreateMeshExporterOptions): MeshExporter {
  return {
    exportMesh(request) {
      if (request.source !== 'glyph-group') {
        throw new Error(`Unsupported mesh export source: ${request.source}`);
      }

      if (request.format !== 'stl') {
        throw new Error(`Unsupported mesh export format: ${request.format}`);
      }

      const bytes = options.exportGlyphGroupBinaryStl();
      const filename = createStlFilename(request.fileBasename);
      triggerDownload(filename, bytes, 'model/stl');
    },
  };
}
