import { Radio, RadioTower } from "lucide-react"
import { useData } from "@/lib/data"
import { PageHeader } from "@/components/page-header"
import { youtubeEmbedUrl } from "@/lib/youtube"

export default function Live() {
  const { categories, liveStreams } = useData()
  const live = liveStreams.filter(s => s.isLive && s.videoId)
  const categoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name ?? "Categoría"

  return (
    <div className="pb-20">
      <PageHeader
        eyebrow="En vivo"
        title="Sigue las pistas en directo."
        description="Cada categoría transmite por separado desde el dispositivo asignado en su pista. Si una categoría no aparece aquí, aún no ha comenzado su transmisión."
      />

      <div className="container-wide">
        {live.length === 0 ? (
          <div className="panel grid place-items-center p-14 text-center">
            <RadioTower size={32} strokeWidth={1.4} className="text-muted-foreground" />
            <p className="mt-4 text-[19px] font-semibold tracking-[-0.02em]">Todavía no hay transmisiones activas.</p>
            <p className="mt-2 max-w-md text-muted-foreground">Vuelve a esta página cuando comience una categoría; se mostrará automáticamente en cuanto la organización active el directo.</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${live.length === 1 ? "mx-auto max-w-3xl" : "md:grid-cols-2 xl:grid-cols-3"}`}>
            {live.map(stream => (
              <div key={stream.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-2 px-4 py-3">
                  <span className="status-dot animate-pulse bg-[hsl(4_90%_58%)]" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold tracking-[-0.01em]">{categoryName(stream.categoryId)}</p>
                    {stream.label && <p className="truncate text-[12px] text-muted-foreground">{stream.label}</p>}
                  </div>
                  <Radio size={15} className="ml-auto shrink-0 text-[hsl(4_90%_58%)]" />
                </div>
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={youtubeEmbedUrl(stream.videoId!, { autoplay: true })}
                    title={`En vivo · ${categoryName(stream.categoryId)}`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
