import { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext, type ReactNode } from "react"
import type { PostgrestError, Session } from "@supabase/supabase-js"
import { toast } from "sonner"
import { supabase, supabaseConfigured, MEDIA_BUCKET, ORGANIZER_EMAIL, publicMediaUrl } from "@/lib/supabase"
import { resizeImage } from "@/lib/image"
import { extractYoutubeId } from "@/lib/youtube"
import { robotsOf, type Competition, type CompetitionKind, type CompetitionMatch, type Entrant, type Places, type Run, type CompetitionSettings } from "@/lib/competition"

export type Institution = { id: string; name: string; coach: string; initials: string; logo?: string }
export type Robot = { id: string; name: string; categories: string[]; participantId: string | null }
export type Participant = { id: string; name: string; email: string; whatsapp: string; grade: string; institutionId: string; attendedAt?: string; robots: string[] }
export type Category = { id: string; name: string; slug: string; format: CompetitionKind; rules: string; startTime: string; teamSize: number; groupSize?: number }
export type RankingRow = { institutionId: string; gold: number; silver: number; bronze: number }
export type CategoryResult = { categoryId: string; places: Places; recordedAt: string }
export type EntrantInfo = { key: string; name: string; school: string; schoolInitials: string; institutionIds: string[] }
export type LiveStream = { id: string; categoryId: string; label: string; youtubeUrl: string; videoId: string | null; isLive: boolean; updatedAt: string }

type ParticipantRow = Omit<Participant, "robots">

type Tables = {
  institutions: Institution[]
  categories: Category[]
  participants: ParticipantRow[]
  robots: Robot[]
  competitions: Competition[]
  competitionMatches: CompetitionMatch[]
  competitionRuns: Run[]
  categoryResults: CategoryResult[]
  liveStreams: LiveStream[]
}
type TableName = keyof Tables

/* eslint-disable @typescript-eslint/no-explicit-any */
const mappers: { [K in TableName]: (row: any) => Tables[K][number] } = {
  institutions: r => ({ id: r.id, name: r.name, coach: r.coach ?? "", initials: r.initials ?? "", logo: r.logo_url ?? undefined }),
  categories: r => ({ id: r.id, name: r.name, slug: r.slug, format: r.format, rules: r.rules ?? "", startTime: r.start_time ?? "Por definir", teamSize: r.team_size ?? 1, groupSize: r.group_size ?? undefined }),
  participants: r => ({ id: r.id, name: r.name ?? "", email: r.email ?? "", whatsapp: r.whatsapp ?? "", grade: r.grade ?? "", institutionId: r.institution_id ?? "", attendedAt: r.attended_at ?? undefined }),
  robots: r => ({ id: r.id, name: r.name, categories: r.category_ids ?? [], participantId: r.participant_id ?? null }),
  competitions: r => ({ id: r.id, categoryId: r.category_id, kind: r.kind, settings: r.settings as CompetitionSettings, entrants: r.entrants as Entrant[], status: r.status, estimateMinutes: r.estimate_minutes ?? null, revealedAt: r.revealed_at ?? null, finishedAt: r.finished_at ?? null }),
  competitionMatches: r => ({ id: r.id, competitionId: r.competition_id, stage: r.stage, round: r.round, position: r.position, sourceA: r.source_a ?? null, sourceB: r.source_b ?? null, sources: r.sources ?? [], winnerKey: r.winner_key ?? null, placements: r.placements ?? [], status: r.status, locked: r.locked }),
  competitionRuns: r => ({ id: r.id, competitionId: r.competition_id, entrantKey: r.entrant_key, phase: r.phase, attempt: r.attempt, status: r.status, timeMs: r.time_ms ?? null, splits: r.splits ?? [], checkpoints: r.checkpoints ?? 0, locked: r.locked }),
  categoryResults: r => ({ categoryId: r.category_id, places: r.places ?? [], recordedAt: r.recorded_at }),
  liveStreams: r => ({ id: r.id, categoryId: r.category_id, label: r.label ?? "", youtubeUrl: r.youtube_url ?? "", videoId: r.video_id ?? null, isLive: r.is_live ?? false, updatedAt: r.updated_at }),
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const PUBLIC_PARTICIPANT_COLUMNS = "id,institution_id,attended_at,created_at"

function queryFor(table: TableName, organizer: boolean) {
  switch (table) {
    case "institutions": return supabase.from("institutions").select("*").order("name")
    case "categories": return supabase.from("categories").select("*").order("sort_order")
    case "participants": return supabase.from("participants").select(organizer ? "*" : PUBLIC_PARTICIPANT_COLUMNS).order("created_at")
    case "robots": return supabase.from("robots").select("*").order("created_at")
    case "competitions": return supabase.from("competitions").select("*")
    case "competitionMatches": return supabase.from("competition_matches").select("*").order("stage").order("round").order("position")
    case "competitionRuns": return supabase.from("competition_runs").select("*").order("created_at")
    case "categoryResults": return supabase.from("category_results").select("*")
    case "liveStreams": return supabase.from("live_streams").select("*")
  }
}

function describe(error: PostgrestError | Error | { message: string }) {
  if ("code" in error && error.code === "42501") return "No tienes permisos de organizador para esta acción."
  return error.message || "Ocurrió un error inesperado."
}

export type ImportInstitution = { id: string; name: string; initials: string; coach: string }
export type ImportParticipant = { id: string; name: string; email: string; whatsapp: string; grade: string; institutionId: string; robots: string[]; existing?: boolean }
export type ImportRobot = { id: string; name: string; categories: string[] }

type NewParticipantFull = {
  participantName: string; email: string; whatsapp: string; grade: string
  institutionId: string; newInstitutionName?: string
  robotName: string; categoryId: string
}

type DataContextType = Omit<Tables, "participants"> & {
  participants: Participant[]
  rankings: RankingRow[]
  configured: boolean
  loading: boolean
  loadError: string | null
  session: Session | null
  isOrganizer: boolean
  isLoggedIn: boolean
  login: (code: string) => Promise<string | null>
  logout: () => Promise<void>
  markAttendance: (participantId: string) => Promise<boolean>
  addParticipant: (participant: { name: string; email: string; whatsapp: string; grade: string; institutionId: string }) => Promise<boolean>
  addRobot: (robot: { name: string; categories: string[]; participantId?: string | null }) => Promise<string | null>
  updateInstitution: (id: string, updates: Partial<Pick<Institution, "name" | "coach" | "initials">>) => Promise<boolean>
  setInstitutionLogo: (id: string, file: File | null) => Promise<boolean>
  addParticipantFull: (payload: NewParticipantFull) => Promise<boolean>
  importData: (institutions: ImportInstitution[], participants: ImportParticipant[], robots: ImportRobot[]) => Promise<boolean>
  describeEntrant: (key: string) => EntrantInfo
  createCompetition: (input: NewCompetition) => Promise<boolean>
  discardCompetition: (competitionId: string) => Promise<boolean>
  revealCompetition: (competitionId: string) => Promise<boolean>
  setMatchWinner: (matchId: string, winnerKey: string | null) => Promise<boolean>
  setMatchActive: (matchId: string, active: boolean) => Promise<boolean>
  setHeatPlacements: (matchId: string, placements: string[] | null) => Promise<boolean>
  recordRun: (run: Omit<Run, "id" | "locked">) => Promise<boolean>
  deleteRun: (runId: string) => Promise<boolean>
  finishCompetition: (competition: Competition, places: Places) => Promise<boolean>
  reopenCompetition: (competition: Competition) => Promise<boolean>
  setLiveStream: (categoryId: string, updates: { label: string; youtubeUrl: string; isLive: boolean }) => Promise<boolean>
  editModeUntil: number | null
  startEditMode: (code: string) => Promise<string | null>
  endEditMode: () => Promise<void>
}

export type NewCompetition = {
  categoryId: string
  kind: CompetitionKind
  settings: CompetitionSettings
  entrants: Entrant[]
  estimateMinutes: number
  matches: Omit<CompetitionMatch, "competitionId">[]
}

const DataContext = createContext<DataContextType | undefined>(undefined)

const emptyTables: Tables = { institutions: [], categories: [], participants: [], robots: [], competitions: [], competitionMatches: [], competitionRuns: [], categoryResults: [], liveStreams: [] }
const ALL_TABLES = Object.keys(emptyTables) as TableName[]

export function DataProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<Tables>(emptyTables)
  const [loading, setLoading] = useState(supabaseConfigured)
  const [loadError, setLoadError] = useState<string | null>(supabaseConfigured ? null : "Supabase no está configurado.")
  const [session, setSession] = useState<Session | null>(null)
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [editModeUntil, setEditModeUntil] = useState<number | null>(null)
  const organizerRef = useRef(false)
  organizerRef.current = isOrganizer

  const refresh = useCallback(async (table: TableName) => {
    const { data, error } = await queryFor(table, organizerRef.current)
    if (error) throw error
    const mapRow = mappers[table] as (row: unknown) => unknown
    const rows = ((data ?? []) as unknown[]).map(mapRow)
    setTables(prev => ({ ...prev, [table]: rows }))
  }, [])

  const refreshMany = useCallback(async (names: TableName[]) => {
    try {
      await Promise.all(names.map(refresh))
    } catch (error) {
      toast.error(describe(error as PostgrestError))
    }
  }, [refresh])

  // Session and organizer role
  useEffect(() => {
    if (!supabaseConfigured) return
    const checkRole = async (next: Session | null) => {
      setSession(next)
      if (!next) { setIsOrganizer(false); return }
      const { data } = await supabase.from("organizers").select("user_id").eq("user_id", next.user.id).maybeSingle()
      setIsOrganizer(Boolean(data))
    }
    void supabase.auth.getSession().then(({ data }) => checkRole(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setTimeout(() => void checkRole(next), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  // Initial load
  useEffect(() => {
    if (!supabaseConfigured) return
    let cancelled = false
    Promise.all(ALL_TABLES.map(refresh))
      .then(() => { if (!cancelled) setLoadError(null) })
      .catch(error => { if (!cancelled) setLoadError(describe(error)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [refresh])

  // Private data (contacts, draft brackets, edit session) appears/disappears with the organizer role
  useEffect(() => {
    if (!supabaseConfigured || loading) return
    void refreshMany(["participants", "competitions", "competitionMatches", "competitionRuns"])
    if (isOrganizer) {
      void supabase.from("edit_sessions").select("expires_at").maybeSingle().then(({ data }) => {
        const until = data ? new Date(data.expires_at).getTime() : null
        setEditModeUntil(until && until > Date.now() ? until : null)
      })
    } else setEditModeUntil(null)
    if (!isOrganizer) return
    const poll = window.setInterval(() => void refreshMany(["participants"]), 30_000)
    return () => window.clearInterval(poll)
  }, [isOrganizer, loading, refreshMany])

  // Live updates from other devices
  useEffect(() => {
    if (!supabaseConfigured) return
    const timers = new Map<TableName, number>()
    const channel = supabase.channel("tournament-data")
    const dbName: Partial<Record<TableName, string>> = { competitionMatches: "competition_matches", competitionRuns: "competition_runs", categoryResults: "category_results", liveStreams: "live_streams" }
    for (const table of ["institutions", "categories", "robots", "competitions", "competitionMatches", "competitionRuns", "categoryResults", "liveStreams"] as TableName[]) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: dbName[table] ?? table }, () => {
        window.clearTimeout(timers.get(table))
        timers.set(table, window.setTimeout(() => void refreshMany([table]), 250))
      })
    }
    channel.subscribe()
    return () => {
      timers.forEach(t => window.clearTimeout(t))
      void supabase.removeChannel(channel)
    }
  }, [refreshMany])

  const mutate = useCallback(async (action: () => PromiseLike<{ error: PostgrestError | null }>, affected: TableName[], success?: string) => {
    const { error } = await action()
    if (error) {
      toast.error(describe(error))
      await refreshMany(affected)
      return false
    }
    await refreshMany(affected)
    if (success) toast.success(success)
    return true
  }, [refreshMany])

  const login = useCallback(async (code: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: ORGANIZER_EMAIL, password: code })
    if (error) return error.message === "Invalid login credentials" ? "Código incorrecto. Inténtalo de nuevo." : error.message
    const { data: role } = await supabase.from("organizers").select("user_id").eq("user_id", data.user.id).maybeSingle()
    if (!role) {
      await supabase.auth.signOut()
      return "Este código no tiene permisos de organizador."
    }
    setSession(data.session)
    setIsOrganizer(true)
    return null
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setIsOrganizer(false)
  }, [])

  const markAttendance = useCallback((participantId: string) =>
    mutate(() => supabase.from("participants").update({ attended_at: new Date().toISOString() }).eq("id", participantId), ["participants"])
  , [mutate])

  const addParticipant = useCallback((p: { name: string; email: string; whatsapp: string; grade: string; institutionId: string }) =>
    mutate(() => supabase.from("participants").insert({ name: p.name, email: p.email, whatsapp: p.whatsapp, grade: p.grade, institution_id: p.institutionId || null }), ["participants"], "Participante registrado.")
  , [mutate])

  const addRobot = useCallback(async (robot: { name: string; categories: string[]; participantId?: string | null }) => {
    const id = crypto.randomUUID()
    const ok = await mutate(() => supabase.from("robots").insert({ id, name: robot.name, category_ids: robot.categories.filter(Boolean), participant_id: robot.participantId ?? null }), ["robots"], "Robot registrado.")
    return ok ? id : null
  }, [mutate])

  const updateInstitution = useCallback((id: string, updates: Partial<Pick<Institution, "name" | "coach" | "initials">>) =>
    mutate(() => supabase.from("institutions").update(updates).eq("id", id), ["institutions"], "Institución actualizada.")
  , [mutate])

  const setInstitutionLogo = useCallback(async (id: string, file: File | null) => {
    if (!file) return mutate(() => supabase.from("institutions").update({ logo_url: null }).eq("id", id), ["institutions"])
    try {
      const blob = await resizeImage(file, 512, "image/png")
      const path = `logos/${id}-${Date.now()}.png`
      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType: "image/png", cacheControl: "31536000" })
      if (error) throw error
      return mutate(() => supabase.from("institutions").update({ logo_url: publicMediaUrl(path) }).eq("id", id), ["institutions"], "Logo actualizado.")
    } catch (error) {
      toast.error(describe(error as Error))
      return false
    }
  }, [mutate])

  const addParticipantFull = useCallback(async (payload: NewParticipantFull) => {
    let institutionId = payload.institutionId
    if (institutionId === "new" && payload.newInstitutionName) {
      institutionId = crypto.randomUUID()
      const name = payload.newInstitutionName.trim()
      const ok = await mutate(() => supabase.from("institutions").insert({ id: institutionId, name, initials: name.substring(0, 3).toUpperCase() }), ["institutions"])
      if (!ok) return false
    }
    const participantId = crypto.randomUUID()
    const ok = await mutate(() => supabase.from("participants").insert({
      id: participantId, name: payload.participantName, email: payload.email, whatsapp: payload.whatsapp,
      grade: payload.grade, institution_id: institutionId, attended_at: new Date().toISOString(),
    }), ["participants"])
    if (!ok) return false
    return mutate(() => supabase.from("robots").insert({
      name: payload.robotName, participant_id: participantId, category_ids: payload.categoryId ? [payload.categoryId] : [],
    }), ["robots"], "Participante registrado y marcado como presente.")
  }, [mutate])

  const importData = useCallback(async (institutions: ImportInstitution[], participants: ImportParticipant[], robots: ImportRobot[]) => {
    const ownerOf = new Map(participants.flatMap(p => p.robots.map(r => [r, p.id] as const)))
    const newParticipants = participants.filter(p => !p.existing)
    if (institutions.length) {
      const ok = await mutate(() => supabase.from("institutions").insert(institutions), ["institutions"])
      if (!ok) return false
    }
    if (newParticipants.length) {
      const ok = await mutate(() => supabase.from("participants").insert(newParticipants.map(p => ({
        id: p.id, name: p.name, email: p.email, whatsapp: p.whatsapp, grade: p.grade, institution_id: p.institutionId || null,
      }))), ["participants"])
      if (!ok) return false
    }
    if (robots.length) {
      const ok = await mutate(() => supabase.from("robots").insert(robots.map(r => ({
        id: r.id, name: r.name, category_ids: r.categories, participant_id: ownerOf.get(r.id) ?? null,
      }))), ["robots"])
      if (!ok) return false
    }
    toast.success(`Importados: ${institutions.length} instituciones, ${newParticipants.length} participantes y ${robots.length} robots.`)
    return true
  }, [mutate])


  // ─── Competencia ─────────────────────────────────────────────

  useEffect(() => {
    if (!editModeUntil) return
    const timer = window.setTimeout(() => setEditModeUntil(null), Math.max(0, editModeUntil - Date.now()))
    return () => window.clearTimeout(timer)
  }, [editModeUntil])

  const startEditMode = useCallback(async (code: string) => {
    const { data, error } = await supabase.rpc("start_edit_session", { p_code: code })
    if (error) return error.message || "No se pudo activar el modo edición."
    setEditModeUntil(new Date(data as string).getTime())
    return null
  }, [])

  const endEditMode = useCallback(async () => {
    await supabase.rpc("end_edit_session")
    setEditModeUntil(null)
  }, [])

  const competitionTables: TableName[] = ["competitions", "competitionMatches", "competitionRuns", "categoryResults"]

  const createCompetition = useCallback(async (input: NewCompetition) => {
    const existing = tables.competitions.find(c => c.categoryId === input.categoryId)
    if (existing) {
      const removed = await mutate(() => supabase.from("competitions").delete().eq("id", existing.id), competitionTables)
      if (!removed) return false
    }
    const id = crypto.randomUUID()
    const created = await mutate(() => supabase.from("competitions").insert({
      id, category_id: input.categoryId, kind: input.kind, settings: input.settings, entrants: input.entrants,
      estimate_minutes: input.estimateMinutes, status: "draft",
    }), ["competitions"])
    if (!created) return false
    if (input.matches.length) {
      const rows = input.matches.map(m => ({
        id: m.id, competition_id: id, stage: m.stage, round: m.round, position: m.position,
        source_a: m.sourceA, source_b: m.sourceB, sources: m.sources, status: "pending", locked: false,
      }))
      const ok = await mutate(() => supabase.from("competition_matches").insert(rows), ["competitionMatches"])
      if (!ok) return false
    }
    toast.success("Llave generada en borrador. Revísala y revélala cuando esté lista.")
    return true
  }, [mutate, tables.competitions])

  const discardCompetition = useCallback((competitionId: string) =>
    mutate(() => supabase.from("competitions").delete().eq("id", competitionId), competitionTables, "Llave descartada.")
  , [mutate])

  const revealCompetition = useCallback((competitionId: string) =>
    mutate(() => supabase.from("competitions").update({ status: "revealed", revealed_at: new Date().toISOString() }).eq("id", competitionId), ["competitions"], "Llave revelada al público.")
  , [mutate])

  const setMatchWinner = useCallback((matchId: string, winnerKey: string | null) => {
    const row = winnerKey
      ? { winner_key: winnerKey, status: "done", locked: true, updated_at: new Date().toISOString() }
      : { winner_key: null, status: "pending", locked: false, updated_at: new Date().toISOString() }
    setTables(prev => ({ ...prev, competitionMatches: prev.competitionMatches.map(m => m.id === matchId ? { ...m, winnerKey, status: winnerKey ? "done" : "pending", locked: Boolean(winnerKey) } : m) }))
    return mutate(() => supabase.from("competition_matches").update(row).eq("id", matchId), ["competitionMatches"])
  }, [mutate])

  const setMatchActive = useCallback((matchId: string, active: boolean) => {
    setTables(prev => ({ ...prev, competitionMatches: prev.competitionMatches.map(m => m.id === matchId ? { ...m, status: active ? "active" : "pending" } : m) }))
    return mutate(() => supabase.from("competition_matches").update({ status: active ? "active" : "pending" }).eq("id", matchId), ["competitionMatches"])
  }, [mutate])

  const setHeatPlacements = useCallback((matchId: string, placements: string[] | null) => {
    const row = placements
      ? { placements, status: "done", locked: true, updated_at: new Date().toISOString() }
      : { placements: [], status: "pending", locked: false, updated_at: new Date().toISOString() }
    return mutate(() => supabase.from("competition_matches").update(row).eq("id", matchId), ["competitionMatches"])
  }, [mutate])

  const recordRun = useCallback((run: Omit<Run, "id" | "locked">) =>
    mutate(() => supabase.from("competition_runs").insert({
      competition_id: run.competitionId, entrant_key: run.entrantKey, phase: run.phase, attempt: run.attempt,
      status: run.status, time_ms: run.timeMs, splits: run.splits, checkpoints: run.checkpoints, locked: true,
    }), ["competitionRuns"])
  , [mutate])

  const deleteRun = useCallback((runId: string) =>
    mutate(() => supabase.from("competition_runs").delete().eq("id", runId), ["competitionRuns"], "Intento eliminado.")
  , [mutate])

  const finishCompetition = useCallback(async (competition: Competition, places: Places) => {
    const saved = await mutate(() => supabase.from("category_results").upsert({
      category_id: competition.categoryId, places, locked: true, recorded_at: new Date().toISOString(),
    }), ["categoryResults"])
    if (!saved) return false
    return mutate(() => supabase.from("competitions").update({ status: "finished", finished_at: new Date().toISOString() }).eq("id", competition.id), ["competitions"], "Categoría finalizada. El podio ya suma al ranking.")
  }, [mutate])

  const reopenCompetition = useCallback(async (competition: Competition) => {
    const removed = await mutate(() => supabase.from("category_results").delete().eq("category_id", competition.categoryId), ["categoryResults"])
    if (!removed) return false
    return mutate(() => supabase.from("competitions").update({ status: "revealed", finished_at: null }).eq("id", competition.id), ["competitions"], "Categoría reabierta.")
  }, [mutate])

  // ─── Streaming en vivo ───────────────────────────────────────

  const setLiveStream = useCallback((categoryId: string, updates: { label: string; youtubeUrl: string; isLive: boolean }) => {
    const videoId = extractYoutubeId(updates.youtubeUrl)
    return mutate(() => supabase.from("live_streams").upsert({
      category_id: categoryId, label: updates.label, youtube_url: updates.youtubeUrl, video_id: videoId,
      is_live: updates.isLive && Boolean(videoId), updated_at: new Date().toISOString(),
    }, { onConflict: "category_id" }), ["liveStreams"], updates.isLive ? "Transmisión activada." : "Transmisión guardada.")
  }, [mutate])

  const participants = useMemo<Participant[]>(() => {
    const byOwner = new Map<string, string[]>()
    for (const robot of tables.robots) {
      if (!robot.participantId) continue
      byOwner.set(robot.participantId, [...(byOwner.get(robot.participantId) ?? []), robot.id])
    }
    return tables.participants.map(p => ({ ...p, robots: byOwner.get(p.id) ?? [] }))
  }, [tables.participants, tables.robots])

  const describeEntrant = useCallback((key: string): EntrantInfo => {
    const robots = robotsOf(key).map(id => tables.robots.find(r => r.id === id))
    const institutionIds = [...new Set(robots.map(r => tables.participants.find(p => p.id === r?.participantId)?.institutionId).filter((id): id is string => Boolean(id)))]
    const schools = institutionIds.map(id => tables.institutions.find(i => i.id === id)).filter(Boolean)
    return {
      key,
      name: robots.map(r => r?.name ?? "Robot eliminado").join(" + "),
      school: schools.map(i => i!.name).join(" / ") || "Sin institución",
      schoolInitials: schools.map(i => i!.initials).join(" / ") || "—",
      institutionIds,
    }
  }, [tables.robots, tables.participants, tables.institutions])

  const rankings = useMemo<RankingRow[]>(() => {
    const rows = new Map<string, RankingRow>()
    const medals = ["gold", "silver", "bronze"] as const
    for (const result of tables.categoryResults) {
      result.places.slice(0, 3).forEach((keys, index) => {
        const credited = new Set(keys.flatMap(key => describeEntrant(key).institutionIds))
        for (const institutionId of credited) {
          const row = rows.get(institutionId) ?? { institutionId, gold: 0, silver: 0, bronze: 0 }
          row[medals[index]] += 1
          rows.set(institutionId, row)
        }
      })
    }
    return [...rows.values()]
  }, [tables.categoryResults, describeEntrant])

  const value: DataContextType = {
    institutions: tables.institutions,
    categories: tables.categories,
    robots: tables.robots,
    competitions: tables.competitions,
    competitionMatches: tables.competitionMatches,
    competitionRuns: tables.competitionRuns,
    categoryResults: tables.categoryResults,
    liveStreams: tables.liveStreams,
    participants,
    rankings,
    configured: supabaseConfigured,
    loading,
    loadError,
    session,
    isOrganizer,
    isLoggedIn: Boolean(session) && isOrganizer,
    login, logout, markAttendance, addParticipant, addRobot,
    updateInstitution, setInstitutionLogo, addParticipantFull, importData, describeEntrant,
    createCompetition, discardCompetition, revealCompetition, setMatchWinner, setMatchActive, setHeatPlacements,
    recordRun, deleteRun, finishCompetition, reopenCompetition, setLiveStream,
    editModeUntil: editModeUntil && editModeUntil > Date.now() ? editModeUntil : null, startEditMode, endEditMode,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error("useData must be used within DataProvider")
  return context
}
