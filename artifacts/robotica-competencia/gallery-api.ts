import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

type Photo = { id: string; caption: string; createdAt: string; imageUrl: string };
type StoredPhoto = Photo & { extension: string };

const directory = path.join(import.meta.dirname, 'data', 'gallery');
const indexFile = path.join(directory, 'photos.json');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const COOKIE = 'inedsor_gallery_admin';
const DEMO_CODE = 'ROBOT2026';

function respond(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function signature(data: string, secret: string) {
  return createHmac('sha256', secret).update(data).digest('hex');
}

function sessionValid(req: IncomingMessage) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  const token = req.headers.cookie?.split(';').map(item => item.trim())
    .find(item => item.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token) return false;
  const [expires, nonce, digest] = token.split('.');
  if (!expires || !nonce || !digest || Number(expires) < Date.now()) return false;
  const expected = signature(`${expires}.${nonce}`, secret);
  if (digest.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
}

function imageType(buffer: Buffer): { mime: string; extension: string } | null {
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { mime: 'image/jpeg', extension: 'jpg' };
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { mime: 'image/png', extension: 'png' };
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', extension: 'webp' };
  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return { mime: 'image/gif', extension: 'gif' };
  return null;
}

async function body(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('La imagen supera el tamaño permitido (5 MB).');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function readPhotos(): Promise<StoredPhoto[]> {
  try {
    const photos = JSON.parse(await readFile(indexFile, 'utf8'));
    return Array.isArray(photos) ? photos : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function savePhotos(photos: StoredPhoto[]) {
  await mkdir(directory, { recursive: true });
  const temporary = `${indexFile}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(photos));
  await rename(temporary, indexFile);
}

let mutation = Promise.resolve();
function serialize(action: () => Promise<void>) {
  const next = mutation.then(action);
  mutation = next.catch(() => {});
  return next;
}

async function handle(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  if (!pathname.startsWith('/api/gallery')) return next();
  try {
    if (pathname === '/api/gallery' && req.method === 'GET') {
      const photos = await readPhotos();
      return respond(res, 200, { photos: photos.map(({ extension: _extension, ...photo }) => photo) });
    }

    const imageId = pathname.match(/^\/api\/gallery\/image\/([a-f0-9-]+)$/)?.[1];
    if (imageId && req.method === 'GET') {
      const photo = (await readPhotos()).find(item => item.id === imageId);
      if (!photo) return respond(res, 404, { error: 'Imagen no encontrada.' });
      const image = await readFile(path.join(directory, `${photo.id}.${photo.extension}`));
      res.writeHead(200, { 'Content-Type': `image/${photo.extension === 'jpg' ? 'jpeg' : photo.extension}`, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
      return res.end(image);
    }

    if (!['POST', 'DELETE'].includes(req.method ?? '')) return respond(res, 405, { error: 'Método no permitido.' });
    const origin = req.headers.origin;
    const host = req.headers['x-forwarded-host'] ?? req.headers.host;
    if (origin && new URL(origin).host !== host) return respond(res, 403, { error: 'Origen no permitido.' });
    if (req.headers['sec-fetch-site'] === 'cross-site') return respond(res, 403, { error: 'Origen no permitido.' });

    if (pathname === '/api/gallery/session' && req.method === 'POST') {
      const secret = process.env.SESSION_SECRET;
      if (!secret) return respond(res, 503, { error: 'El acceso del organizador no está configurado.' });
      const input = await body(req);
      const supplied = Buffer.from(String(input.code ?? ''));
      const expected = Buffer.from(DEMO_CODE);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        return respond(res, 401, { error: 'Código incorrecto.' });
      }
      const expires = String(Date.now() + 12 * 60 * 60 * 1000);
      const nonce = randomUUID();
      const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
      res.setHeader('Set-Cookie', `${COOKIE}=${expires}.${nonce}.${signature(`${expires}.${nonce}`, secret)}; HttpOnly; SameSite=Strict; Path=/api/gallery; Max-Age=43200${secure}`);
      return respond(res, 200, { ok: true });
    }

    if (!sessionValid(req)) return respond(res, 401, { error: 'Inicia sesión como organizador para gestionar fotos.' });

    if (pathname === '/api/gallery' && req.method === 'POST') {
      const input = await body(req);
      const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(input.imageData ?? ''));
      if (!match) return respond(res, 400, { error: 'Formato no admitido. Usa JPG, PNG, WebP o GIF.' });
      const buffer = Buffer.from(match[2], 'base64');
      const type = imageType(buffer);
      if (!type || type.mime !== match[1] || !buffer.length || buffer.length > MAX_IMAGE_BYTES) {
        return respond(res, 400, { error: 'Imagen inválida o mayor a 5 MB.' });
      }
      const caption = String(input.caption ?? '').trim().slice(0, 500);
      let photo!: Photo;
      await serialize(async () => {
        const id = randomUUID();
        photo = { id, caption, createdAt: new Date().toISOString(), imageUrl: `/api/gallery/image/${id}` };
        await mkdir(directory, { recursive: true });
        await writeFile(path.join(directory, `${id}.${type.extension}`), buffer);
        await savePhotos([{ ...photo, extension: type.extension }, ...await readPhotos()]);
      });
      return respond(res, 201, { photo });
    }

    const deleteId = pathname.match(/^\/api\/gallery\/([a-f0-9-]+)$/)?.[1];
    if (deleteId && req.method === 'DELETE') {
      let found = false;
      await serialize(async () => {
        const photos = await readPhotos();
        const photo = photos.find(item => item.id === deleteId);
        if (!photo) return;
        found = true;
        await savePhotos(photos.filter(item => item.id !== deleteId));
        await unlink(path.join(directory, `${deleteId}.${photo.extension}`)).catch(() => {});
      });
      return found ? respond(res, 200, { ok: true }) : respond(res, 404, { error: 'Foto no encontrada.' });
    }
    return respond(res, 404, { error: 'Ruta no encontrada.' });
  } catch (error) {
    if (error instanceof SyntaxError) return respond(res, 400, { error: 'Solicitud inválida.' });
    if (error instanceof Error && error.message.includes('tamaño permitido')) return respond(res, 413, { error: error.message });
    console.error('Gallery API error:', error);
    return respond(res, 500, { error: 'No se pudo procesar la galería.' });
  }
}

export function galleryApi(): Plugin {
  return {
    name: 'inedsor-gallery-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => void handle(req, res, next));
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => void handle(req, res, next));
    },
  };
}