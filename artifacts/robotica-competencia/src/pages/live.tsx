import { useMemo, useState } from "react"
import { ExternalLink, Play, RadioTower } from "lucide-react"
import { useData, type LiveStream } from "@/lib/data"
import { youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/youtube"
import { useTikTokThumbnail } from "@/lib/tiktok"

function shuffled<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const isValid = (s: LiveStream) => s.provider === "youtube" ? Boolean(s.videoId) : Boolean(s.url)

export default function Live() {
  const { categories, liveStreams } = useData()
  const live = liveStreams.filter(s => s.isLive && isValid(s))
  const idsKey = live.map(s => s.id).sort().join(",")
  // Se reordena al azar solo cuando cambia el conjunto de directos activos, no en cada refresco.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const order = useMemo(() => shuffled(live), [idsKey])
  const categoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name ?? "Categoría"

  // Solo YouTube se puede destacar/embeber; TikTok siempre es una miniatura que redirige.
  const embeddable = order.filter(s => s.provider === "youtube")
  const [featuredId, setFeaturedId] = useState<string | null>(null)
  const featured = embeddable.find(s => s.id === featuredId) ?? embeddable[0] ?? null
  const rest = order.filter(s => s.id !== featured?.id)
  const sidebar = rest.slice(0, 3)
  const overflow = rest.slice(3)

  if (!order.length) {
    return (
      <div className="container-wide py-20">
        <div className="panel mx-auto grid max-w-xl place-items-center p-14 text-center">
          <RadioTower size={32} strokeWidth={1.4} className="text-muted-foreground" />
          <p className="mt-4 text-[19px] font-semibold tracking-[-0.02em]">Todavía no hay transmisiones activas.</p>
          <p className="mt-2 max-w-md text-muted-foreground">Vuelve a esta página cuando comience una categoría; se mostrará automáticamente en cuanto la organización active el directo.</p>
        </div>
      </div>
    )
  }

  // Sin ningún YouTube activo (solo TikTok): no hay nada que embeber, se muestra todo en una grilla simple.
  if (!featured) {
    return (
      <div className="container-wide py-6 pb-20">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {order.map(stream => (
            <Thumbnail key={stream.id} stream={stream} label={categoryName(stream.categoryId)} onSelect={() => {}} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container-wide py-6 pb-20">
      <div className="flex flex-col gap-3 md:grid md:grid-cols-4">
        <div className="order-2 flex gap-3 overflow-x-auto pb-1 md:order-1 md:col-span-1 md:flex-col md:overflow-visible md:pb-0">
          {sidebar.map(stream => (
            <Thumbnail key={stream.id} stream={stream} label={categoryName(stream.categoryId)} onSelect={() => setFeaturedId(stream.id)} />
          ))}
        </div>
        <div className="order-1 md:order-2 md:col-span-3">
          <FeaturedPlayer stream={featured} label={categoryName(featured.categoryId)} />
        </div>
      </div>

      {overflow.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {overflow.map(stream => (
            <Thumbnail key={stream.id} stream={stream} label={categoryName(stream.categoryId)} onSelect={() => setFeaturedId(stream.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function FeaturedPlayer({ stream, label }: { stream: LiveStream; label: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-video w-full bg-black">
        <iframe
          key={stream.id}
          src={youtubeEmbedUrl(stream.videoId!, { autoplay: true })}
          title={`En vivo · ${label}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className="status-dot animate-pulse bg-[hsl(4_90%_58%)]" aria-hidden="true" />
        <p className="truncate text-[14px] font-semibold tracking-[-0.01em]">{label}</p>
        {stream.label && <p className="truncate text-[12px] text-muted-foreground">· {stream.label}</p>}
      </div>
    </div>
  )
}

function Thumbnail({ stream, label, onSelect }: { stream: LiveStream; label: string; onSelect: () => void }) {
  const isTikTok = stream.provider === "tiktok"
  const tiktokInfo = useTikTokThumbnail(isTikTok ? stream.url : null)
  const thumbnail = isTikTok ? tiktokInfo?.thumbnailUrl ?? null : youtubeThumbnailUrl(stream.videoId!)

  const commonProps = {
    className: "group relative aspect-video w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-black md:w-full",
  }

  const content = (
    <>
      {thumbnail ? (
        <img src={thumbnail} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
      ) : (
        <div className={`h-full w-full ${isTikTok ? "bg-gradient-to-br from-[#25f4ee]/25 via-black to-[#fe2c55]/35" : "bg-muted"}`} />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        <span className="status-dot animate-pulse bg-[hsl(4_90%_58%)]" aria-hidden="true" /> EN VIVO
      </span>
      {isTikTok && (
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">TikTok</span>
      )}
      <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
        {isTikTok ? <ExternalLink size={20} className="text-white" /> : <Play size={22} className="fill-white text-white" />}
      </span>
      <span className="absolute inset-x-0 bottom-0 truncate px-2 py-1.5 text-left text-[11px] font-medium text-white">{label}</span>
    </>
  )

  if (isTikTok) {
    return <a href={stream.url} target="_blank" rel="noreferrer" {...commonProps}>{content}</a>
  }
  return <button type="button" onClick={onSelect} {...commonProps}>{content}</button>
}
