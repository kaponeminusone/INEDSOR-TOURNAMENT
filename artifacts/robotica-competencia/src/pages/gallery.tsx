import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronRight, ExternalLink, Heart, ImagePlus, Maximize2, Pause, Play, RefreshCw, Send, Trash2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { useData } from "@/lib/data";
import { supabase, MEDIA_BUCKET, publicMediaUrl } from "@/lib/supabase";
import { resizeImage } from "@/lib/image";
import { extractYoutubeId, youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/youtube";
import { extractDriveFileId, driveThumbnailUrl, driveWatchUrl } from "@/lib/drive";
import { Reveal } from "@/components/reveal";
import lineFollower from "@assets/generated_images/inedsor-seguidor-de-linea.jpg";
import minisumo from "@assets/generated_images/inedsor-minisumo.jpg";
import soccer from "@assets/generated_images/inedsor-soccer-rc.jpg";
import drone from "@assets/generated_images/inedsor-pista-dron.jpg";
import balloons from "@assets/generated_images/inedsor-explotaglobos.jpg";
import maze from "@assets/generated_images/inedsor-laberinto.jpg";

type VideoProvider = "youtube" | "drive";
type Post = {
  id: string; caption: string; createdAt: string; imageUrl: string; imageUrls: string[]; storagePath?: string; storagePaths: string[];
  likeCount: number; sample: boolean;
  videoUrl: string | null; videoProvider: VideoProvider | null; videoId: string | null;
};
type PhotoRow = {
  id: string; caption: string; storage_path: string | null; storage_paths: string[] | null; created_at: string; like_count: number;
  video_url: string | null; video_provider: VideoProvider | null; video_id: string | null;
};

const PAGE_SIZE = 12;
const PHOTO_COLUMNS = "id,caption,storage_path,storage_paths,created_at,like_count,video_url,video_provider,video_id";
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

const SAMPLE_POSTS: Post[] = [
  { id: "sample-1", imageUrl: minisumo, imageUrls: [minisumo], createdAt: hoursAgo(0.4), likeCount: 0, sample: true, caption: "Así se verá una publicación del torneo: la foto del momento y una breve descripción de lo que está pasando en la pista. #Minisumo" },
  { id: "sample-2", imageUrl: lineFollower, imageUrls: [lineFollower], createdAt: hoursAgo(2), likeCount: 0, sample: true, caption: "Las publicaciones aparecen en orden, de la más reciente a la más antigua. #SeguidorDeLinea" },
  { id: "sample-3", imageUrl: drone, imageUrls: [drone], createdAt: hoursAgo(5), likeCount: 0, sample: true, caption: "Toca dos veces la imagen para darle me gusta. #Dron" },
  { id: "sample-4", imageUrl: soccer, imageUrls: [soccer, minisumo], createdAt: hoursAgo(26), likeCount: 0, sample: true, caption: "Si una publicación tiene varias fotos, se deslizan hacia los lados como aquí. #Futbolito" },
  { id: "sample-5", imageUrl: balloons, imageUrls: [balloons], createdAt: hoursAgo(50), likeCount: 0, sample: true, caption: "" },
  { id: "sample-6", imageUrl: maze, imageUrls: [maze], createdAt: hoursAgo(75), likeCount: 0, sample: true, caption: "Cuando la organización publique las primeras fotos, estos ejemplos desaparecerán. #Robotica" },
].map(p => ({ ...p, storagePaths: [] as string[], videoUrl: null, videoProvider: null, videoId: null }));

const toPost = (row: PhotoRow): Post => {
  if (row.video_provider && row.video_id) {
    return {
      id: row.id, caption: row.caption ?? "", createdAt: row.created_at, storagePaths: [],
      imageUrl: "", imageUrls: [], likeCount: row.like_count ?? 0, sample: false,
      videoUrl: row.video_url, videoProvider: row.video_provider, videoId: row.video_id,
    };
  }
  const paths = row.storage_paths?.length ? row.storage_paths : row.storage_path ? [row.storage_path] : [];
  return {
    id: row.id, caption: row.caption ?? "", createdAt: row.created_at, storagePath: row.storage_path ?? undefined, storagePaths: paths,
    imageUrl: paths[0] ? publicMediaUrl(paths[0]) : "", imageUrls: paths.map(publicMediaUrl), likeCount: row.like_count ?? 0, sample: false,
    videoUrl: null, videoProvider: null, videoId: null,
  };
};

// ─── Tags (#etiqueta) ───────────────────────────────────────────
const TAG_RE = /#[\p{L}\d_]+/gu;

function splitCaption(caption: string): { text: string; tag: boolean }[] {
  const parts: { text: string; tag: boolean }[] = [];
  let last = 0;
  for (const match of caption.matchAll(TAG_RE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: caption.slice(last, index), tag: false });
    parts.push({ text: match[0], tag: true });
    last = index + match[0].length;
  }
  if (last < caption.length) parts.push({ text: caption.slice(last), tag: false });
  return parts;
}

function extractTags(caption: string): string[] {
  return [...caption.matchAll(TAG_RE)].map(m => m[0]);
}

function topTags(posts: Post[], limit: number): { tag: string; count: number }[] {
  const counts = new Map<string, { tag: string; count: number }>();
  for (const post of posts) {
    for (const raw of extractTags(post.caption)) {
      const key = raw.toLowerCase();
      const entry = counts.get(key);
      if (entry) entry.count += 1; else counts.set(key, { tag: raw, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
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

const relative = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
function timeAgo(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.round((date.getTime() - Date.now()) / 60_000);
  if (minutes > -1) return "ahora";
  if (minutes > -60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours > -24) return relative.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (days > -7) return relative.format(days, "day");
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" }).format(date);
}

const photoAlt = (post: Post) => post.caption.trim() || "Fotografía del Torneo INEDSOR";
const likesLabel = (n: number) => `${n} ${n === 1 ? "me gusta" : "me gusta"}`;

function readStorage(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function writeStorage(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } }

function deviceId() {
  let id = readStorage("inedsor_device_id");
  if (!id) { id = crypto.randomUUID(); writeStorage("inedsor_device_id", id); }
  return id;
}

function useLikedSet() {
  const [liked, setLiked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(readStorage("inedsor_gallery_likes") ?? "[]")); } catch { return new Set(); }
  });
  const set = useCallback((id: string, value: boolean) => {
    setLiked(current => {
      const next = new Set(current);
      if (value) next.add(id); else next.delete(id);
      writeStorage("inedsor_gallery_likes", JSON.stringify([...next]));
      return next;
    });
  }, []);
  return { liked, set };
}

function Avatar({ size = 32 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-[conic-gradient(from_210deg,#2997ff,#a970ff,#ff6a5c,#ffb340,#2997ff)] p-[2px]" style={{ width: size + 4, height: size + 4 }}>
      <span className="grid place-items-center rounded-full border-2 border-background bg-foreground font-bold text-background" style={{ width: size, height: size, fontSize: size * 0.42 }}>
        I
      </span>
    </span>
  );
}

function LikeButton({ liked, onToggle, size = 24, dark = false }: { liked: boolean; onToggle: () => void; size?: number; dark?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <button type="button" onClick={onToggle} aria-pressed={liked} aria-label={liked ? "Quitar me gusta" : "Me gusta"} className={`grid h-10 w-10 place-items-center rounded-full transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-muted"}`}>
      <motion.span key={liked ? "on" : "off"} initial={reduce ? false : { scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
        <Heart size={size} strokeWidth={1.8} className={liked ? "text-[#ff3040]" : ""} fill={liked ? "currentColor" : "none"} />
      </motion.span>
    </button>
  );
}

type FeedPostProps = {
  post: Post;
  index: number;
  liked: boolean;
  onLike: (value: boolean) => void;
  onShare: () => void;
  onPresent: () => void;
  onDelete?: () => void;
  onTag: (tag: string) => void;
  deleting: boolean;
};

function CaptionText({ caption, onTag }: { caption: string; onTag: (tag: string) => void }) {
  return (
    <>
      {splitCaption(caption).map((part, i) => part.tag ? (
        <button key={i} type="button" onClick={() => onTag(part.text)} className="font-medium text-primary hover:underline">{part.text}</button>
      ) : (
        <span key={i}>{part.text}</span>
      ))}
    </>
  );
}

function PhotoCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <img key={i} src={src} alt={i === 0 ? alt : ""} loading={i === 0 ? "eager" : "lazy"} decoding="async" draggable={false} className="max-h-[640px] w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {images.length > 1 && (
        <>
          <span className="absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">{active + 1}/{images.length}</span>
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
            {images.map((_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i === active ? "bg-white" : "bg-white/40"}`} />)}
          </div>
        </>
      )}
    </div>
  );
}

// YouTube se incrusta directo; Drive no siempre lo permite (depende de cómo se compartió el
// archivo), así que se muestra como miniatura que abre el video en una pestaña nueva.
function VideoEmbed({ provider, videoId, title }: { provider: VideoProvider; videoId: string; title: string }) {
  if (provider === "youtube") {
    return (
      <div className="aspect-video w-full">
        <iframe
          src={youtubeEmbedUrl(videoId)}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <a href={driveWatchUrl(videoId)} target="_blank" rel="noreferrer" className="group relative block aspect-video w-full overflow-hidden bg-black">
      <img src={driveThumbnailUrl(videoId)} alt="" loading="lazy" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-60" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-sm">
          <ExternalLink size={14} /> Ver video en Drive
        </span>
      </span>
    </a>
  );
}

function FeedPost({ post, index, liked, onLike, onShare, onPresent, onDelete, onTag, deleting }: FeedPostProps) {
  const reduce = useReducedMotion();
  const [burst, setBurst] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const caption = post.caption.trim();
  const long = caption.length > 110;
  const multi = post.imageUrls.length > 1;
  const isVideo = Boolean(post.videoProvider && post.videoId);

  const doubleTap = () => {
    if (!liked) onLike(true);
    setBurst(b => b + 1);
  };

  return (
    <Reveal as="article" y={20} className="border-b border-border pb-5 pt-4 last:border-b-0 sm:pb-6">
      <header className="flex items-center gap-3 px-4 pb-3 sm:px-0">
        <Avatar />
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[14px]">
          <span className="truncate font-semibold tracking-[-0.01em]">Torneo INEDSOR</span>
          <span className="text-muted-foreground">·</span>
          <time dateTime={post.createdAt} className="shrink-0 text-muted-foreground">{timeAgo(post.createdAt)}</time>
        </div>
        {post.sample && <span className="chip py-1 text-[11px] text-muted-foreground">Ejemplo</span>}
        {onDelete && (
          <button type="button" onClick={onDelete} disabled={deleting} aria-label={`Eliminar publicación ${index + 1}`} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40">
            <Trash2 size={16} />
          </button>
        )}
      </header>

      <div className="relative select-none overflow-hidden bg-muted sm:rounded-[10px] sm:border sm:border-border" onDoubleClick={isVideo ? undefined : doubleTap}>
        {isVideo ? (
          <VideoEmbed provider={post.videoProvider!} videoId={post.videoId!} title={photoAlt(post)} />
        ) : multi ? (
          <PhotoCarousel images={post.imageUrls} alt={photoAlt(post)} />
        ) : (
          <img src={post.imageUrl} alt={photoAlt(post)} loading={index < 2 ? "eager" : "lazy"} decoding="async" draggable={false} className="max-h-[640px] w-full object-cover" />
        )}
        <AnimatePresence>
          {burst > 0 && (
            <motion.span
              key={burst}
              className="pointer-events-none absolute inset-0 grid place-items-center text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.35)]"
              initial={{ opacity: 0, scale: reduce ? 1 : 0.4 }}
              animate={{ opacity: [0, 1, 1, 0], scale: reduce ? 1 : [0.4, 1.15, 1, 1] }}
              transition={{ duration: 0.9, times: [0, 0.25, 0.6, 1] }}
              onAnimationComplete={() => setBurst(0)}
            >
              <Heart size={96} fill="currentColor" strokeWidth={0} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1 px-2.5 pt-2 sm:-ml-2 sm:px-0">
        <LikeButton liked={liked} onToggle={() => onLike(!liked)} />
        <button type="button" onClick={onShare} aria-label="Compartir" className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted">
          <Send size={22} strokeWidth={1.8} />
        </button>
        <button type="button" onClick={onPresent} aria-label="Ver en presentación" title="Ver en presentación" className="ml-auto grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted">
          <Maximize2 size={20} strokeWidth={1.8} />
        </button>
      </div>

      {post.likeCount > 0 && <p className="px-4 text-[14px] font-semibold sm:px-0">{likesLabel(post.likeCount)}</p>}

      {caption && (
        <p className="px-4 pt-1 text-[14px] leading-[1.45] sm:px-0">
          <span className="mr-1.5 font-semibold">Torneo INEDSOR</span>
          {long && !expanded
            ? <>
                <CaptionText caption={caption.slice(0, 110).trimEnd()} onTag={onTag} />
                … <button type="button" onClick={() => setExpanded(true)} className="text-muted-foreground">más</button>
              </>
            : <CaptionText caption={caption} onTag={onTag} />}
        </p>
      )}
    </Reveal>
  );
}

export default function Gallery() {
  const { isLoggedIn } = useData();
  const [photos, setPhotos] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [composerMode, setComposerMode] = useState<"photos" | "video">("photos");
  const [videoUrl, setVideoUrl] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [presentationPosts, setPresentationPosts] = useState<Post[]>([]);
  const [paused, setPaused] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [position, setPosition] = useState(0);
  const reduceMotion = useReducedMotion();
  const fileRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { liked, set: setLiked } = useLikedSet();
  const device = useMemo(deviceId, []);

  const showingSamples = !loading && !feedError && photos.length === 0;
  const allFeed = showingSamples ? SAMPLE_POSTS : photos;
  const trending = useMemo(() => topTags(allFeed, 8), [allFeed]);
  const feed = activeTag ? allFeed.filter(post => extractTags(post.caption).some(t => t.toLowerCase() === activeTag.toLowerCase())) : allFeed;
  const presentationRef = useRef(presentationPosts);
  presentationRef.current = presentationPosts;

  const load = useCallback(async () => {
    setFeedError("");
    const { data, error, count } = await supabase.from("gallery_photos").select(PHOTO_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
    if (error) { setFeedError(error.message); setLoading(false); return; }
    setPhotos((data as PhotoRow[]).map(toPost));
    setTotal(count ?? 0);
    setHasMore((count ?? 0) > PAGE_SIZE);
    setLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const from = photos.length;
    const { data, error } = await supabase.from("gallery_photos").select(PHOTO_COLUMNS)
      .order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    setLoadingMore(false);
    if (error) { toast.error(error.message); return; }
    const rows = (data as PhotoRow[]).map(toPost);
    setPhotos(current => [...current, ...rows.filter(row => !current.some(p => p.id === row.id))]);
    setHasMore(rows.length === PAGE_SIZE);
  }, [hasMore, loadingMore, photos.length]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) void loadMore(); }, { rootMargin: "800px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    const channel = supabase.channel("gallery-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gallery_photos" }, ({ new: row }) => {
        const post = toPost(row as PhotoRow);
        setPhotos(current => current.some(p => p.id === post.id) ? current : [post, ...current]);
        setTotal(t => t + 1);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "gallery_photos" }, ({ new: row }) => {
        const updated = row as PhotoRow;
        const patch = (p: Post) => p.id === updated.id ? { ...p, caption: updated.caption, likeCount: updated.like_count } : p;
        setPhotos(current => current.map(patch));
        setPresentationPosts(current => current.map(patch));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "gallery_photos" }, ({ old }) => {
        const id = (old as { id?: string }).id;
        if (!id) return;
        setPhotos(current => current.filter(p => p.id !== id));
        setPresentationPosts(current => current.filter(p => p.id !== id));
        setTotal(t => Math.max(0, t - 1));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!files.length) { setPreviews([]); return; }
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);

  const applyLikeCount = (id: string, delta: number, exact?: number) => {
    const patch = (p: Post) => p.id === id ? { ...p, likeCount: exact ?? Math.max(0, p.likeCount + delta) } : p;
    setPhotos(current => current.map(patch));
    setPresentationPosts(current => current.map(patch));
  };

  const like = async (post: Post, value: boolean) => {
    if (liked.has(post.id) === value) return;
    setLiked(post.id, value);
    if (post.sample) return;
    applyLikeCount(post.id, value ? 1 : -1);
    const { data, error } = await supabase.rpc("set_photo_like", { p_photo: post.id, p_device: device, p_liked: value });
    if (error) {
      setLiked(post.id, !value);
      applyLikeCount(post.id, value ? -1 : 1);
      toast.error("No se pudo registrar el me gusta.");
      return;
    }
    if (typeof data === "number") applyLikeCount(post.id, 0, data);
  };

  const MAX_PHOTOS = 10;
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = [...(event.target.files ?? [])];
    if (!selected.length) return;
    const invalidType = selected.find(f => !ACCEPTED_TYPES.includes(f.type));
    if (invalidType) { toast.error("Selecciona solo imágenes JPG, PNG, WebP o GIF."); return; }
    const tooLarge = selected.find(f => f.size > 15 * 1024 * 1024);
    if (tooLarge) { toast.error("Cada imagen debe pesar menos de 15 MB."); return; }
    setFiles(current => {
      const next = [...current, ...selected].slice(0, MAX_PHOTOS);
      if (current.length + selected.length > MAX_PHOTOS) toast.error(`Máximo ${MAX_PHOTOS} fotos por publicación.`);
      return next;
    });
  };

  const removeFileAt = (index: number) => setFiles(current => current.filter((_, i) => i !== index));

  const clearComposer = () => {
    setFiles([]); setCaption(""); setVideoUrl("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!files.length) return;
    setBusy("upload");
    const id = crypto.randomUUID();
    const paths: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const path = `gallery/${id}-${i}.jpg`;
        const blob = await resizeImage(files[i], 1920, "image/jpeg", 0.82);
        const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (uploadError) throw uploadError;
        paths.push(path);
      }
      const { data, error } = await supabase.from("gallery_photos")
        .insert({ id, caption: caption.trim(), storage_path: paths[0], storage_paths: paths })
        .select(PHOTO_COLUMNS).single();
      if (error) {
        await supabase.storage.from(MEDIA_BUCKET).remove(paths);
        throw error;
      }
      const post = toPost(data as PhotoRow);
      setPhotos(current => current.some(p => p.id === post.id) ? current : [post, ...current]);
      setTotal(t => t + 1);
      clearComposer();
      toast.success("Publicado.");
    } catch (error) {
      if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);
      toast.error(error instanceof Error ? error.message : "No se pudo publicar la fotografía.");
    } finally { setBusy(null); }
  };

  // No se sube archivo de video: solo se guarda el enlace (YouTube o Drive).
  const detectVideo = (url: string): { provider: VideoProvider; id: string } | null => {
    const yt = extractYoutubeId(url);
    if (yt) return { provider: "youtube", id: yt };
    const drive = extractDriveFileId(url);
    if (drive) return { provider: "drive", id: drive };
    return null;
  };

  const publishVideo = async (event: FormEvent) => {
    event.preventDefault();
    const url = videoUrl.trim();
    if (!url) return;
    const detected = detectVideo(url);
    if (!detected) { toast.error("No reconozco ese enlace. Usa un link de YouTube o de Google Drive."); return; }
    setBusy("upload");
    const { data, error } = await supabase.from("gallery_photos")
      .insert({ caption: caption.trim(), video_url: url, video_provider: detected.provider, video_id: detected.id })
      .select(PHOTO_COLUMNS).single();
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    const post = toPost(data as PhotoRow);
    setPhotos(current => current.some(p => p.id === post.id) ? current : [post, ...current]);
    setTotal(t => t + 1);
    clearComposer();
    toast.success("Publicado.");
  };

  const remove = async (post: Post) => {
    if (!window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    setBusy(post.id);
    const { error } = await supabase.from("gallery_photos").delete().eq("id", post.id);
    if (error) { toast.error(error.message); setBusy(null); return; }
    const paths = post.storagePaths.length ? post.storagePaths : post.storagePath ? [post.storagePath] : [];
    if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);
    setPhotos(current => current.filter(p => p.id !== post.id));
    setTotal(t => Math.max(0, t - 1));
    setBusy(null);
  };

  const postUrl = (post: Post) => {
    const url = new URL(window.location.href);
    url.search = "";
    if (!post.sample) url.searchParams.set("foto", post.id);
    return url.toString();
  };

  // Nota: WhatsApp arma la vista previa (miniatura) leyendo las etiquetas <meta> del enlace,
  // no de lo que le pasamos aquí. Como el sitio es una página única (sin render por servidor),
  // esa miniatura sale genérica (la del sitio), no la foto exacta de la publicación.
  const share = async (post: Post) => {
    const url = postUrl(post);
    try {
      if (navigator.share) {
        await navigator.share({ title: "Torneo INEDSOR", text: post.caption || "Galería del Torneo INEDSOR", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) toast.error("No se pudo compartir");
    }
  };

  const start = async (firstId?: string) => {
    let posts = feed;
    if (!showingSamples && hasMore) {
      const { data, error } = await supabase.from("gallery_photos").select(PHOTO_COLUMNS).order("created_at", { ascending: false });
      if (!error && data) posts = (data as PhotoRow[]).map(toPost);
    }
    if (!posts.length) return;
    let nextOrder = shuffled(posts.map(post => post.id));
    if (firstId) nextOrder = [firstId, ...nextOrder.filter(id => id !== firstId)];
    setPresentationPosts(posts);
    setOrder(nextOrder);
    setPosition(0); setPaused(false); setPresenting(true);
    void document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const stop = useCallback(() => {
    setPresenting(false); setPaused(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, []);

  // Si se llega por un enlace compartido (?foto=id), abre esa publicación directamente.
  const openedSharedRef = useRef(false);
  useEffect(() => {
    if (openedSharedRef.current || loading) return;
    const id = new URLSearchParams(window.location.search).get("foto");
    if (!id) return;
    openedSharedRef.current = true;
    void (async () => {
      let target = photos.find(p => p.id === id);
      if (!target) {
        const { data } = await supabase.from("gallery_photos").select(PHOTO_COLUMNS).eq("id", id).maybeSingle();
        if (data) target = toPost(data as PhotoRow);
      }
      if (target) void start(target.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, photos]);
  const next = useCallback(() => {
    const available = presentationRef.current.map(post => post.id);
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
    if (!presenting || paused || presentationPosts.length < 2) return;
    const timer = window.setInterval(next, 7000);
    return () => window.clearInterval(timer);
  }, [presenting, paused, next, presentationPosts.length]);
  useEffect(() => {
    if (presenting && presentationPosts.length === 0) stop();
  }, [presenting, presentationPosts.length, stop]);
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

  const currentPost = presentationPosts.find(post => post.id === order[position]) ?? presentationPosts[0];
  const canPresent = !loading && feed.length > 0;

  return (
    <div className="mx-auto flex max-w-[1000px] justify-center gap-16 pb-24 sm:px-5 lg:pt-8">
      <div className="w-full max-w-[470px]">
        <div className="flex items-center justify-between px-4 py-3 sm:px-0 lg:hidden">
          <span className="text-[22px] font-semibold tracking-[-0.03em]">Galería</span>
          <button type="button" onClick={() => void start()} disabled={!canPresent} className="btn-pill btn-secondary btn-sm">
            <Play size={14} fill="currentColor" /> Presentación
          </button>
        </div>

        {isLoggedIn && (
          <section className="border-b border-border px-4 pb-4 pt-2 sm:px-0" aria-label="Publicar en la galería">
            <div className="ml-[46px] mb-2 flex gap-1.5">
              <button type="button" onClick={() => setComposerMode("photos")} className={`chip ${composerMode === "photos" ? "bg-foreground text-background" : "text-muted-foreground"}`}>Fotos</button>
              <button type="button" onClick={() => setComposerMode("video")} className={`chip ${composerMode === "video" ? "bg-foreground text-background" : "text-muted-foreground"}`}>Video</button>
            </div>
            <form onSubmit={composerMode === "photos" ? upload : publishVideo} className="flex gap-3">
              <Avatar size={36} />
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold">Torneo INEDSOR</div>
                <label htmlFor="gallery-caption" className="sr-only">Descripción</label>
                <textarea
                  id="gallery-caption"
                  value={caption}
                  onChange={event => setCaption(event.target.value)}
                  placeholder="¿Qué está pasando en el torneo?"
                  maxLength={500}
                  rows={caption ? 3 : 1}
                  className="mt-0.5 w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                />
                {composerMode === "photos" ? (
                  <>
                    {previews.length > 0 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {previews.map((src, i) => (
                          <div key={i} className="relative shrink-0">
                            <img src={src} alt="Vista previa" className="h-24 w-24 rounded-xl border border-border object-cover" />
                            <button type="button" onClick={() => removeFileAt(i)} aria-label="Quitar imagen" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md">
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Agregar fotos (hasta 10)">
                        <ImagePlus size={20} />
                        <span className="sr-only">Agregar fotos</span>
                        <input ref={fileRef} type="file" multiple className="sr-only" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseFile} />
                      </label>
                      <button className="btn-pill btn-primary btn-sm" type="submit" disabled={busy !== null || !files.length}>{busy === "upload" ? "Publicando…" : "Publicar"}</button>
                    </div>
                  </>
                ) : (
                  <>
                    <label htmlFor="gallery-video-url" className="sr-only">Enlace del video</label>
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-input px-3 py-2">
                      <Video size={16} className="shrink-0 text-muted-foreground" />
                      <input
                        id="gallery-video-url"
                        type="url"
                        value={videoUrl}
                        onChange={event => setVideoUrl(event.target.value)}
                        placeholder="Enlace de YouTube o Google Drive"
                        className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <p className="mt-1.5 text-[12px] text-muted-foreground">Pega el enlace para compartir; no se sube el archivo de video.</p>
                    <div className="mt-2 flex items-center justify-end">
                      <button className="btn-pill btn-primary btn-sm" type="submit" disabled={busy !== null || !videoUrl.trim()}>{busy === "upload" ? "Publicando…" : "Publicar"}</button>
                    </div>
                  </>
                )}
              </div>
            </form>
          </section>
        )}

        {feedError && (
          <div className="mx-4 mt-4 flex items-center justify-between gap-4 rounded-2xl bg-destructive/[.07] px-4 py-3 text-[14px] text-destructive sm:mx-0" role="alert">
            <span>No se pudo cargar la galería. {feedError}</span>
            <button type="button" onClick={() => void load()} className="inline-flex shrink-0 items-center gap-1.5 font-medium hover:underline"><RefreshCw size={14} /> Reintentar</button>
          </div>
        )}

        {showingSamples && (
          <div className="mx-4 mt-4 rounded-2xl bg-muted px-4 py-3 text-[13px] leading-relaxed text-muted-foreground sm:mx-0">
            <span className="font-semibold text-foreground">Vista de ejemplo.</span> Aún no hay fotos del torneo; así se verá el feed cuando se publiquen las primeras.
          </div>
        )}

        {trending.length > 0 && (
          <div className="mx-4 mt-4 flex flex-wrap items-center gap-1.5 sm:mx-0">
            {activeTag && (
              <button type="button" onClick={() => setActiveTag(null)} className="chip bg-foreground text-background">
                {activeTag} <X size={12} />
              </button>
            )}
            {trending.filter(t => t.tag.toLowerCase() !== activeTag?.toLowerCase()).map(t => (
              <button key={t.tag} type="button" onClick={() => setActiveTag(t.tag)} className="chip text-muted-foreground hover:text-foreground">
                {t.tag} <span className="tabular text-[11px]">· {t.count}</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div role="status" aria-label="Cargando publicaciones">
            {[0, 1].map(i => (
              <div key={i} className="animate-pulse border-b border-border py-4">
                <div className="flex items-center gap-3 px-4 pb-3 sm:px-0">
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="h-3 w-32 rounded-full bg-muted" />
                </div>
                <div className="aspect-square bg-muted sm:rounded-[10px]" />
                <div className="mx-4 mt-4 h-3 w-3/4 rounded-full bg-muted sm:mx-0" />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {activeTag && feed.length === 0 && (
              <p className="px-4 py-10 text-center text-[13px] text-muted-foreground sm:px-0">Nada con {activeTag} todavía.</p>
            )}
            {feed.map((post, index) => (
              <FeedPost
                key={post.id}
                post={post}
                index={index}
                liked={liked.has(post.id)}
                onLike={value => void like(post, value)}
                onShare={() => void share(post)}
                onPresent={() => void start(post.id)}
                onDelete={!post.sample && isLoggedIn ? () => void remove(post) : undefined}
                onTag={setActiveTag}
                deleting={busy !== null}
              />
            ))}
            <div ref={sentinelRef} />
            {loadingMore && <p className="py-6 text-center text-[13px] text-muted-foreground">Cargando más…</p>}
            {feed.length > 0 && !hasMore && (
              <p className="py-10 text-center text-[13px] text-muted-foreground">Estás al día.</p>
            )}
          </div>
        )}
      </div>

      <aside className="sticky top-[calc(var(--nav-height)+32px)] hidden h-fit w-[300px] shrink-0 lg:block">
        <div className="flex items-center gap-3">
          <Avatar size={44} />
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.01em]">Torneo INEDSOR</div>
            <div className="text-[13px] text-muted-foreground">Galería del evento</div>
          </div>
        </div>

        <div className="mt-6 rounded-[18px] bg-black p-5 text-white">
          <div className="text-[15px] font-semibold">Modo presentación</div>
          <p className="mt-1 text-[13px] leading-relaxed text-white/60">Todas las fotos en pantalla completa y en orden aleatorio. Ideal para proyectar durante el evento.</p>
          <button type="button" onClick={() => void start()} disabled={!canPresent} className="btn-pill btn-light btn-sm mt-4 w-full">
            <Play size={14} fill="currentColor" /> Iniciar presentación
          </button>
        </div>

        <dl className="mt-6 space-y-2.5 text-[13px]">
          <div className="flex justify-between"><dt className="text-muted-foreground">Publicaciones</dt><dd className="tabular font-medium">{total}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Actualización</dt><dd className="font-medium">En vivo</dd></div>
        </dl>
        <p className="mt-6 text-[12px] leading-relaxed text-muted-foreground">Toca dos veces una foto para darle me gusta. Se cuenta un me gusta por dispositivo.</p>
      </aside>

      {presenting && currentPost && createPortal(
        <div className="presentation-root" role="dialog" aria-modal="true" aria-label="Presentación de fotografías">
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <AnimatePresence initial={false}>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center p-4 lg:p-10"
                  key={currentPost.id}
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.28, 0.11, 0.32, 1] }}
                >
                  {currentPost.videoProvider && currentPost.videoId ? (
                    <div className="aspect-video w-full max-w-[90vw] lg:max-w-[60vw]">
                      <VideoEmbed provider={currentPost.videoProvider} videoId={currentPost.videoId} title={photoAlt(currentPost)} />
                    </div>
                  ) : (
                    <img src={currentPost.imageUrl} alt={photoAlt(currentPost)} className="max-h-full max-w-full rounded-[14px] object-contain" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <aside className="flex shrink-0 flex-col border-t border-white/10 bg-[#0d0d0d] lg:w-[380px] lg:border-l lg:border-t-0">
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <Avatar size={34} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold">Torneo INEDSOR</div>
                  <div className="text-[12px] text-white/50">{timeAgo(currentPost.createdAt)}</div>
                </div>
                <button type="button" onClick={stop} aria-label="Salir de la presentación" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"><X size={18} /></button>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentPost.id}
                  className="max-h-[22vh] overflow-y-auto px-5 py-5 lg:max-h-none lg:flex-1"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.4 }}
                >
                  {currentPost.caption.trim() ? (
                    <p className="text-[17px] leading-relaxed text-white/90 lg:text-[19px]"><CaptionText caption={currentPost.caption.trim()} onTag={() => {}} /></p>
                  ) : (
                    <p className="text-[15px] text-white/40">Sin descripción.</p>
                  )}
                  {currentPost.sample && <span className="mt-4 inline-block rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/60">Ejemplo</span>}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center gap-2 border-t border-white/10 px-3 py-3">
                <LikeButton liked={liked.has(currentPost.id)} onToggle={() => void like(currentPost, !liked.has(currentPost.id))} dark />
                <span className="text-[14px] font-medium text-white/80">{currentPost.likeCount > 0 ? likesLabel(currentPost.likeCount) : ""}</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="tabular mr-1 text-[13px] text-white/50">{position + 1} / {order.length}</span>
                  <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? "Reanudar presentación" : "Pausar presentación"} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20">{paused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />}</button>
                  <button type="button" onClick={next} aria-label="Siguiente fotografía" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"><ChevronRight size={19} /></button>
                </div>
              </div>
            </aside>
          </div>
        </div>, document.body)}
    </div>
  );
}
