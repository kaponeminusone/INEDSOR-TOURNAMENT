import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, ChevronRight, ImagePlus, LockKeyhole, Maximize2, Pause, Play, RefreshCw, Trash2, X } from "lucide-react";
import { useData } from "@/lib/data";

type Photo = { id: string; caption: string; createdAt: string; imageUrl: string };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", ...init });
  let body: unknown;
  try { body = await response.json(); } catch { throw new Error(`El servidor respondió con un formato inesperado (${response.status}).`); }
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : `No se pudo completar la solicitud (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}

function shuffled(ids: string[], last?: string): string[] {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.length > 1 && result[0] === last) {
    const swap = 1 + Math.floor(Math.random() * (result.length - 1));
    [result[0], result[swap]] = [result[swap], result[0]];
  }
  return result;
}

function photoDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

const photoAlt = (photo: Photo) => photo.caption.trim() || `Fotografía del Torneo INEDSOR del ${photoDate(photo.createdAt) || "evento"}`;

export default function Gallery() {
  const { isLoggedIn } = useData();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"unlock" | "upload" | string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [position, setPosition] = useState(0);
  const presentationRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const load = useCallback(async (initial = false) => {
    try {
      const result = await api<{ photos: Photo[] }>("/api/gallery");
      if (!Array.isArray(result.photos)) throw new Error("La galería recibió una respuesta inválida.");
      setPhotos(result.photos);
      setFeedError("");
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : "No se pudo cargar la galería.");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    const poll = window.setInterval(() => void load(), 20000);
    return () => window.clearInterval(poll);
  }, [load]);

  useEffect(() => {
    if (!isLoggedIn) { setUnlocked(false); setCode(""); }
  }, [isLoggedIn]);

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    setActionError(""); setNotice(""); setBusy("unlock");
    try {
      await api<{ ok: true }>("/api/gallery/session", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code })
      });
      setUnlocked(true); setCode(""); setNotice("Carga de fotografías habilitada en este navegador.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo validar el código.");
    } finally { setBusy(null); }
  };

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setActionError("");
    if (selected && !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(selected.type)) {
      setFile(null); setActionError("Selecciona una imagen JPG, PNG, WebP o GIF."); return;
    }
    if (selected && selected.size > 5 * 1024 * 1024) {
      setFile(null); setActionError("La imagen supera el máximo de 5 MB."); return;
    }
    setFile(selected);
  };

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || !unlocked) return;
    setActionError(""); setNotice(""); setBusy("upload");
    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("No se pudo leer la imagen."));
        reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
        reader.readAsDataURL(file);
      });
      await api<{ photo: Photo }>("/api/gallery", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData, caption: caption.trim() })
      });
      setFile(null); setCaption("");
      if (fileRef.current) fileRef.current.value = "";
      setNotice("Fotografía publicada correctamente.");
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo publicar la fotografía.");
    } finally { setBusy(null); }
  };

  const remove = async (photo: Photo) => {
    if (!window.confirm(`¿Eliminar esta fotografía${photo.caption ? `: “${photo.caption}”` : ""}? Esta acción no se puede deshacer.`)) return;
    setActionError(""); setNotice(""); setBusy(photo.id);
    try {
      await api<{ ok: true }>(`/api/gallery/${encodeURIComponent(photo.id)}`, { method: "DELETE" });
      setPhotos(current => current.filter(item => item.id !== photo.id));
      setNotice("Fotografía eliminada.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo eliminar la fotografía.");
    } finally { setBusy(null); }
  };

  const start = () => {
    if (!photos.length) return;
    setOrder(shuffled(photos.map(photo => photo.id)));
    setPosition(0); setPaused(false); setPresenting(true);
    void document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const stop = useCallback(() => {
    setPresenting(false); setPaused(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, []);
  const next = useCallback(() => {
    const available = photosRef.current.map(photo => photo.id);
    if (!available.length) { stop(); return; }
    const remaining = order.slice(position + 1).findIndex(id => available.includes(id));
    if (remaining !== -1) {
      setPosition(position + 1 + remaining);
    } else {
      setOrder(shuffled(available, order[position]));
      setPosition(0);
    }
  }, [order, position, stop]);

  useEffect(() => {
    if (!presenting || paused || photos.length < 2) return;
    const timer = window.setInterval(next, 6500);
    return () => window.clearInterval(timer);
  }, [presenting, paused, next, photos.length]);
  useEffect(() => {
    if (presenting && photos.length === 0) stop();
  }, [presenting, photos.length, stop]);
  useEffect(() => {
    if (!presenting) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") stop();
      if (event.key === "ArrowRight") next();
      if (event.key === " ") { event.preventDefault(); setPaused(value => !value); }
    };
    const fullscreen = () => { if (!document.fullscreenElement) stop(); };
    window.addEventListener("keydown", keydown);
    document.addEventListener("fullscreenchange", fullscreen);
    return () => { window.removeEventListener("keydown", keydown); document.removeEventListener("fullscreenchange", fullscreen); };
  }, [presenting, next, stop]);

  const currentPhoto = photos.find(photo => photo.id === order[position]) ?? photos[0];

  return (
    <div className="gallery-page">
      <header className="gallery-heading">
        <div className="gallery-kicker"><span className="gallery-marker" /> TORNEO INEDSOR <span className="gallery-kicker-divider">/</span> ARCHIVO VISUAL</div>
        <div className="gallery-heading-row">
          <div><h1>Galería del torneo</h1><p>Momentos de la competencia, contados desde el evento.</p></div>
          <button className="gallery-button gallery-button-primary" onClick={start} disabled={loading || photos.length === 0} type="button"><Maximize2 size={16} /> Iniciar presentación</button>
        </div>
      </header>

      <div className="gallery-body">
        <main className="gallery-feed" aria-label="Fotografías del torneo">
          <div className="gallery-section-head"><div><span className="gallery-eyebrow">COBERTURA DEL EVENTO</span><h2>Últimas fotografías</h2></div><span className="gallery-count">{loading ? "Cargando" : `${photos.length} ${photos.length === 1 ? "imagen" : "imágenes"}`}</span></div>
          {feedError && <div className="gallery-alert" role="alert"><span>{feedError}</span><button type="button" onClick={() => void load()}><RefreshCw size={14} /> Reintentar</button></div>}
          {loading ? <div className="gallery-skeletons" role="status" aria-label="Cargando fotografías"><div /><div /><div /></div> :
            photos.length === 0 && !feedError ? <div className="gallery-empty"><div className="gallery-empty-icon"><Camera size={28} strokeWidth={1.5} /></div><h3>La historia comienza aquí</h3><p>Aún no hay fotografías publicadas. Vuelve pronto para ver los momentos del torneo.</p></div> :
            <div className="gallery-list">{photos.map((photo, index) => <article className="gallery-post" key={photo.id}>
              <div className="gallery-post-top"><div className="gallery-post-seal">TI</div><div className="gallery-post-byline"><strong>Torneo INEDSOR</strong><span>{photoDate(photo.createdAt) || "Fotografía del evento"}</span></div><span className="gallery-post-number">FOTO {String(index + 1).padStart(2, "0")}</span></div>
              <img src={photo.imageUrl} alt={photoAlt(photo)} loading={index < 2 ? "eager" : "lazy"} className="gallery-post-image" />
              <div className="gallery-post-bottom"><p>{photo.caption.trim() || "Un momento del torneo."}</p>{isLoggedIn && unlocked && <button className="gallery-delete" type="button" onClick={() => void remove(photo)} disabled={busy !== null} aria-label={`Eliminar fotografía ${index + 1}`}><Trash2 size={15} /> Eliminar</button>}</div>
            </article>)}</div>}
        </main>

        <aside className="gallery-sidebar">
          <div className="gallery-info"><span className="gallery-eyebrow">SOBRE ESTA GALERÍA</span><h2>El torneo, en imágenes.</h2><p>Un registro público de los equipos, robots y personas que hacen posible esta jornada.</p><div className="gallery-info-rule" /><div className="gallery-info-line"><span>Actualización</span><strong>Cada 20 segundos</strong></div><div className="gallery-info-line"><span>Acceso</span><strong>Público</strong></div></div>
          {isLoggedIn && <div className="gallery-admin">
            <div className="gallery-admin-title"><LockKeyhole size={16} /><span>Publicación · Organizadores</span></div>
            {!unlocked ? <form onSubmit={unlock}><p>Confirma el código de organizador para publicar.</p><label htmlFor="gallery-code">Código de organizador</label><input id="gallery-code" type="password" autoComplete="off" value={code} onChange={event => setCode(event.target.value)} required placeholder="Introduce el código" /><button className="gallery-button gallery-button-primary" type="submit" disabled={busy !== null || !code.trim()}>{busy === "unlock" ? "Validando…" : "Desbloquear carga"} <ChevronRight size={15} /></button></form> :
              <form onSubmit={upload}><p>Publica una fotografía para todos los visitantes.</p><label htmlFor="gallery-file">Fotografía</label><input ref={fileRef} id="gallery-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseFile} required /><small>JPG, PNG, WebP o GIF · Máximo 5 MB</small><label htmlFor="gallery-caption">Descripción</label><textarea id="gallery-caption" value={caption} onChange={event => setCaption(event.target.value)} placeholder="¿Qué sucede en esta imagen?" maxLength={500} rows={3} /><button className="gallery-button gallery-button-primary" type="submit" disabled={busy !== null || !file}><ImagePlus size={15} /> {busy === "upload" ? "Publicando…" : "Publicar fotografía"}</button></form>}
            {actionError && <p className="gallery-action-error" role="alert">{actionError}</p>}
            {notice && <p className="gallery-action-success" role="status">{notice}</p>}
          </div>}
        </aside>
      </div>

      {presenting && currentPhoto && createPortal(<div className="gallery-presentation" ref={presentationRef} role="dialog" aria-modal="true" aria-label="Presentación de fotografías">
        <div className="gallery-presentation-top"><div><span className="gallery-marker" /> TORNEO INEDSOR <span className="gallery-presentation-muted">/ PRESENTACIÓN</span></div><button type="button" onClick={stop} aria-label="Salir de la presentación"><X size={20} /> <span>Salir</span></button></div>
        <div className="gallery-presentation-content"><AnimatePresence initial={false}>
          <motion.div className="gallery-presentation-slide" key={currentPhoto.id}
            initial={{ y: reduceMotion ? 0 : "100%" }} animate={{ y: 0 }} exit={{ y: reduceMotion ? 0 : "-100%" }}
            transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.4, 0, 0.2, 1] }}>
            <img src={currentPhoto.imageUrl} alt={photoAlt(currentPhoto)} />
            <div className="gallery-presentation-caption"><span>ARCHIVO VISUAL · {String(position + 1).padStart(2, "0")} / {String(order.length).padStart(2, "0")}</span><p>{currentPhoto.caption.trim() || "Un momento del torneo."}</p></div>
          </motion.div>
        </AnimatePresence></div>
        <div className="gallery-presentation-controls"><span>Orden aleatorio · sin repeticiones por ciclo</span><div><button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Reanudar presentación" : "Pausar presentación"}>{paused ? <Play size={18} /> : <Pause size={18} />} {paused ? "Reanudar" : "Pausar"}</button><button type="button" onClick={next} aria-label="Siguiente fotografía">Siguiente <ChevronRight size={18} /></button></div></div>
      </div>, document.body)}
    </div>
  );
}