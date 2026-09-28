import { useEffect, useState } from "react"
import { Radio } from "lucide-react"
import { useData } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ControlHeader } from "@/components/page-header"
import { extractYoutubeId } from "@/lib/youtube"
import { detectStreamProvider } from "@/lib/live-links"

export default function ControlStreaming() {
  const { categories, liveStreams, setLiveStream } = useData()

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 md:px-10 md:py-12">
      <ControlHeader
        title="Streaming"
        description="Pega el enlace del directo (YouTube o TikTok) de cada categoría y actívalo cuando empiece a grabar. YouTube se autoreproduce en la página; TikTok se muestra como miniatura y redirige a la app al tocarla, porque TikTok no permite embeberlo."
      />

      <div className="space-y-4">
        {categories.map(category => (
          <StreamRow
            key={category.id}
            categoryId={category.id}
            categoryName={category.name}
            stream={liveStreams.find(s => s.categoryId === category.id)}
            onSave={setLiveStream}
          />
        ))}
      </div>
    </div>
  )
}

function StreamRow({
  categoryId, categoryName, stream, onSave,
}: {
  categoryId: string
  categoryName: string
  stream: { label: string; url: string; isLive: boolean } | undefined
  onSave: (categoryId: string, updates: { label: string; url: string; isLive: boolean }) => Promise<boolean>
}) {
  const [label, setLabel] = useState(stream?.label ?? "")
  const [url, setUrl] = useState(stream?.url ?? "")
  const [isLive, setIsLive] = useState(stream?.isLive ?? false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLabel(stream?.label ?? "")
    setUrl(stream?.url ?? "")
    setIsLive(stream?.isLive ?? false)
  }, [stream?.label, stream?.url, stream?.isLive])

  const provider = detectStreamProvider(url)
  const videoId = provider === "youtube" ? extractYoutubeId(url) : null
  const valid = provider === "youtube" ? Boolean(videoId) : provider === "tiktok"
  const dirty = label !== (stream?.label ?? "") || url !== (stream?.url ?? "") || isLive !== (stream?.isLive ?? false)

  const save = async (next: { label: string; url: string; isLive: boolean }) => {
    setSaving(true)
    await onSave(categoryId, next)
    setSaving(false)
  }

  return (
    <div className="panel flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-semibold tracking-[-0.015em]">{categoryName}</span>
        <div className="flex items-center gap-2">
          {provider && (
            <span className="chip text-[11px]">{provider === "youtube" ? "YouTube" : "TikTok"}</span>
          )}
          {stream?.isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(4_90%_58%/0.12)] px-2.5 py-1 text-[12px] font-medium text-[hsl(4_90%_45%)]">
              <Radio size={12} /> En vivo
            </span>
          )}
          <Switch
            checked={isLive}
            disabled={!valid || saving}
            onCheckedChange={checked => { setIsLive(checked); void save({ label, url, isLive: checked }) }}
            aria-label={`Activar en vivo para ${categoryName}`}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor={`url-${categoryId}`}>Enlace de YouTube o TikTok</Label>
          <Input
            id={`url-${categoryId}`}
            placeholder="https://youtube.com/watch?v=… · https://tiktok.com/@usuario/live"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`label-${categoryId}`}>Etiqueta (opcional)</Label>
          <Input
            id={`label-${categoryId}`}
            placeholder="Ej. Celular cancha 2, Dron…"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
        </div>
      </div>

      {url && !valid && <p className="text-[12px] text-destructive">No reconozco ese enlace como un video de YouTube ni como TikTok.</p>}
      {provider === "tiktok" && (
        <p className="text-[12px] text-muted-foreground">TikTok no se puede reproducir dentro de la página: aparecerá como miniatura y al tocarla se abre TikTok.</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          {isLive ? "Visible ahora en /envivo y en la previsualización flotante del sitio." : "Guardado, pero no visible hasta que actives el interruptor."}
        </p>
        <Button size="sm" variant="secondary" disabled={!dirty || saving} onClick={() => void save({ label, url, isLive })}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  )
}
