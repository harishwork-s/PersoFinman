import * as FileSystem from "expo-file-system";

const INVOICE_DIR = `${FileSystem.documentDirectory}invoices/`;

export async function persistInvoice(asset, id) {
  if (!asset?.uri) return "";
  await FileSystem.makeDirectoryAsync(INVOICE_DIR, { intermediates: true }).catch(() => null);
  const extension = getExtension(asset);
  const destination = `${INVOICE_DIR}${id}-${Date.now()}.${extension}`;
  await FileSystem.copyAsync({ from: asset.uri, to: destination });
  return destination;
}

export async function removeInvoice(uri) {
  if (!uri) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => null);
}

function getExtension(asset) {
  const fromName = asset.fileName?.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (asset.mimeType?.includes("png")) return "png";
  if (asset.mimeType?.includes("webp")) return "webp";
  return "jpg";
}
