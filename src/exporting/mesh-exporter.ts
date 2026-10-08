export function downloadStl(fileBasename: string, bytes: DataView<ArrayBuffer>): void {
  const blob = new Blob([bytes], { type: 'model/stl' });
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `${fileBasename}.stl`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}
