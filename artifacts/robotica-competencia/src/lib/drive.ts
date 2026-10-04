const DRIVE_ID_RE = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]{10,})/

export function extractDriveFileId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const match = trimmed.match(DRIVE_ID_RE)
  if (match) return match[1]
  if (/^[\w-]{10,}$/.test(trimmed) && trimmed.includes("-")) return trimmed
  return null
}

export function driveWatchUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`
}

// Drive no siempre permite embeberse (depende de cómo se compartió el archivo), así que no
// se usa en un <iframe>: se muestra como miniatura que abre el video en una pestaña nueva.
export function driveThumbnailUrl(fileId: string) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
}
