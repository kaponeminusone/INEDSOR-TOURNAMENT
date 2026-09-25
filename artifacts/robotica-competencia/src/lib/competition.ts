// Motor de competencia: sorteo, llaves (simple y doble eliminación), series, contrarreloj y estimaciones.
// Funciones puras: la base de datos guarda el sorteo y los resultados; los participantes de cada
// encuentro se calculan aquí a partir de sus "fuentes" (sembrado, bye o resultado de otro encuentro).

export type CompetitionKind = "elimination" | "heats" | "timed" | "direct"
export type CompetitionStatus = "draft" | "revealed" | "finished"
export type Entrant = { key: string; robots: string[] }

export type Source =
  | { seed: string }
  | { bye: true }
  | { match: string; take: "winner" | "loser" }
  | { match: string; place: number }

export type Stage = "W" | "L" | "GF" | "GF2" | "3P" | "H"

export type CompetitionMatch = {
  id: string
  competitionId: string
  stage: Stage
  round: number
  position: number
  sourceA: Source | null
  sourceB: Source | null
  sources: Source[]
  winnerKey: string | null
  placements: string[]
  status: "pending" | "active" | "done"
  locked: boolean
}

export type Run = {
  id: string
  competitionId: string
  entrantKey: string
  phase: "main" | "final"
  attempt: number
  status: "done" | "dnf" | "absent"
  timeMs: number | null
  splits: number[]
  checkpoints: number
  locked: boolean
}

export type CompetitionSettings = {
  onlyPresent: boolean
  avoidSameSchool: boolean
  teamSize: 1 | 2
  doubleElimination: boolean
  thirdPlace: boolean
  heatSize: number
  advancePerHeat: number
  attempts: number
  timeLimitSec: number
  checkpoints: string[]
  finalTopTwo: boolean
  places: 1 | 2 | 3
}

export type Competition = {
  id: string
  categoryId: string
  kind: CompetitionKind
  settings: CompetitionSettings
  entrants: Entrant[]
  status: CompetitionStatus
  estimateMinutes: number | null
  revealedAt: string | null
  finishedAt: string | null
}

export type Places = string[][]

export function defaultSettings(kind: CompetitionKind, slug: string, teamSize = 1): CompetitionSettings {
  const base: CompetitionSettings = {
    onlyPresent: true, avoidSameSchool: true, teamSize: teamSize === 2 ? 2 : 1, doubleElimination: false, thirdPlace: true,
    heatSize: 4, advancePerHeat: 2, attempts: 2, timeLimitSec: 120, checkpoints: [], finalTopTwo: false, places: 3,
  }
  if (kind === "timed" && slug === "circuito-dron") return { ...base, attempts: 2, timeLimitSec: 180, checkpoints: ["Aro 1", "Aro 2", "Aro 3"] }
  if (kind === "timed" && slug === "laberinto-rc") return { ...base, attempts: 1, timeLimitSec: 180 }
  if (kind === "timed") return { ...base, attempts: 2, timeLimitSec: 120 }
  return base
}

export const entrantKey = (robots: string[]) => robots.join("+")
export const robotsOf = (key: string) => key.split("+")

function shuffle<T>(list: T[], random: () => number): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const nextPow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(2, n)))

// ─── Participantes (robots o equipos) ─────────────────────────────

export function buildEntrants(robotIds: string[], teamSize: 1 | 2, schoolOf: (robotId: string) => string, random = Math.random): Entrant[] {
  if (teamSize === 1) return shuffle(robotIds, random).map(id => ({ key: id, robots: [id] }))
  // Equipos de 2: primero con compañeros del mismo colegio; los que sobran forman equipos mixtos.
  const bySchool = new Map<string, string[]>()
  for (const id of shuffle(robotIds, random)) bySchool.set(schoolOf(id), [...(bySchool.get(schoolOf(id)) ?? []), id])
  const teams: string[][] = []
  const leftovers: string[] = []
  for (const ids of bySchool.values()) {
    for (let i = 0; i + 1 < ids.length; i += 2) teams.push([ids[i], ids[i + 1]])
    if (ids.length % 2) leftovers.push(ids[ids.length - 1])
  }
  for (let i = 0; i < leftovers.length; i += 2) teams.push(leftovers.slice(i, i + 2))
  return shuffle(teams, random).map(robots => ({ key: entrantKey(robots), robots }))
}

// ─── Sorteo con opción de evitar el mismo colegio ────────────────

// Empareja minimizando cruces del mismo colegio: toma del colegio con más participantes y lo cruza con otro.
function pairAvoiding(entrants: Entrant[], schoolOfEntrant: (e: Entrant) => string, random: () => number): [Entrant, Entrant][] {
  const groups = new Map<string, Entrant[]>()
  for (const e of shuffle(entrants, random)) groups.set(schoolOfEntrant(e), [...(groups.get(schoolOfEntrant(e)) ?? []), e])
  const pairs: [Entrant, Entrant][] = []
  const take = (school: string) => {
    const list = groups.get(school)!
    const e = list.pop()!
    if (!list.length) groups.delete(school)
    return e
  }
  while (groups.size) {
    const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || (random() - 0.5))
    const [first] = ordered[0]
    const a = take(first)
    const others = [...groups.keys()].filter(s => s !== first)
    let partnerSchool: string | undefined
    if (others.length) {
      const maxSize = Math.max(...others.map(s => groups.get(s)!.length))
      const biggest = others.filter(s => groups.get(s)!.length === maxSize)
      partnerSchool = biggest[Math.floor(random() * biggest.length)]
    } else if (groups.has(first)) partnerSchool = first
    if (!partnerSchool) break
    pairs.push([a, take(partnerSchool)])
  }
  return shuffle(pairs, random)
}

// Primera ronda: P/2 encuentros (P = potencia de 2); los byes se reparten de forma pareja en la llave.
export function drawFirstRound(entrants: Entrant[], schoolOfEntrant: (e: Entrant) => string, avoidSameSchool: boolean, random = Math.random): [Entrant | null, Entrant | null][] {
  const size = nextPow2(entrants.length)
  const byes = size - entrants.length
  const shuffled = shuffle(entrants, random)
  let byeEntrants = shuffled.slice(0, byes)
  let rest = shuffled.slice(byes)
  if (avoidSameSchool) {
    // Los byes van primero al colegio con más participantes: así sobran menos cruces inevitables.
    const groups = new Map<string, Entrant[]>()
    for (const e of shuffled) groups.set(schoolOfEntrant(e), [...(groups.get(schoolOfEntrant(e)) ?? []), e])
    byeEntrants = []
    for (let i = 0; i < byes; i++) {
      const largest = [...groups.values()].sort((a, b) => b.length - a.length)[0]
      byeEntrants.push(largest.pop()!)
    }
    rest = [...groups.values()].flat()
  }
  const pairs: [Entrant, Entrant][] = avoidSameSchool
    ? pairAvoiding(rest, schoolOfEntrant, random)
    : Array.from({ length: rest.length / 2 }, (_, i) => [rest[2 * i], rest[2 * i + 1]] as [Entrant, Entrant])

  const slots = size / 2
  const byeSlots = new Set(Array.from({ length: byes }, (_, k) => Math.floor(((k + 0.5) * slots) / byes)))
  const out: [Entrant | null, Entrant | null][] = []
  let b = 0
  let p = 0
  for (let i = 0; i < slots; i++) {
    if (byeSlots.has(i)) out.push(i % 2 ? [null, byeEntrants[b++]] : [byeEntrants[b++], null])
    else out.push(pairs[p++])
  }
  return out
}

// ─── Llaves ───────────────────────────────────────────────────────

type NewMatch = Omit<CompetitionMatch, "competitionId">

const blankMatch = (stage: Stage, round: number, position: number): NewMatch => ({
  id: crypto.randomUUID(), stage, round, position, sourceA: null, sourceB: null, sources: [],
  winnerKey: null, placements: [], status: "pending", locked: false,
})

const seedOrBye = (e: Entrant | null): Source => (e ? { seed: e.key } : { bye: true })

export function generateElimination(firstRound: [Entrant | null, Entrant | null][], opts: { doubleElimination: boolean; thirdPlace: boolean }): NewMatch[] {
  const size = firstRound.length * 2
  const k = Math.log2(size)
  const W: NewMatch[][] = []
  for (let r = 1; r <= k; r++) {
    W[r] = Array.from({ length: size / 2 ** r }, (_, i) => {
      const m = blankMatch("W", r, i)
      if (r === 1) { m.sourceA = seedOrBye(firstRound[i][0]); m.sourceB = seedOrBye(firstRound[i][1]) }
      else { m.sourceA = { match: W[r - 1][2 * i].id, take: "winner" }; m.sourceB = { match: W[r - 1][2 * i + 1].id, take: "winner" } }
      return m
    })
  }
  const all = W.slice(1).flat()
  const double = opts.doubleElimination && k >= 2

  if (!double && opts.thirdPlace && k >= 2) {
    const third = blankMatch("3P", k, 0)
    third.sourceA = { match: W[k - 1][0].id, take: "loser" }
    third.sourceB = { match: W[k - 1][1].id, take: "loser" }
    all.push(third)
  }

  if (double) {
    const L: NewMatch[][] = []
    for (let m = 1; m <= k - 1; m++) {
      const count = size / 2 ** (m + 1)
      const odd = 2 * m - 1
      const even = 2 * m
      L[odd] = Array.from({ length: count }, (_, i) => {
        const match = blankMatch("L", odd, i)
        if (m === 1) { match.sourceA = { match: W[1][2 * i].id, take: "loser" }; match.sourceB = { match: W[1][2 * i + 1].id, take: "loser" } }
        else { match.sourceA = { match: L[odd - 1][2 * i].id, take: "winner" }; match.sourceB = { match: L[odd - 1][2 * i + 1].id, take: "winner" } }
        return match
      })
      L[even] = Array.from({ length: count }, (_, i) => {
        const match = blankMatch("L", even, i)
        match.sourceA = { match: L[odd][i].id, take: "winner" }
        match.sourceB = { match: W[m + 1][count - 1 - i].id, take: "loser" }
        return match
      })
    }
    all.push(...L.slice(1).flat())
    const gf = blankMatch("GF", k + 1, 0)
    gf.sourceA = { match: W[k][0].id, take: "winner" }
    gf.sourceB = { match: L[2 * (k - 1)][0].id, take: "winner" }
    const gf2 = blankMatch("GF2", k + 2, 0)
    gf2.sourceA = { match: gf.id, take: "winner" }
    gf2.sourceB = { match: gf.id, take: "loser" }
    all.push(gf, gf2)
  }
  return all
}

export type Side = { kind: "entrant"; key: string } | { kind: "bye" } | { kind: "pending" }
export type MatchState = "waiting" | "ready" | "active" | "done" | "bye" | "skipped" | "review"
export type ResolvedMatch = CompetitionMatch & { a: Side; b: Side; winner: Side; loser: Side; state: MatchState; entrants: Side[] }

const PENDING: Side = { kind: "pending" }
const BYE: Side = { kind: "bye" }

export function resolveMatches(matches: CompetitionMatch[]): Map<string, ResolvedMatch> {
  const byId = new Map(matches.map(m => [m.id, m]))
  const memo = new Map<string, ResolvedMatch>()

  const sideOf = (source: Source | null): Side => {
    if (!source) return PENDING
    if ("seed" in source) return { kind: "entrant", key: source.seed }
    if ("bye" in source) return BYE
    const upstream = resolve(source.match)
    if (!upstream) return PENDING
    if ("take" in source) return source.take === "winner" ? upstream.winner : upstream.loser
    if (upstream.state !== "done") return PENDING
    const key = upstream.placements[source.place - 1]
    return key ? { kind: "entrant", key } : BYE
  }

  function resolve(id: string): ResolvedMatch | undefined {
    const cached = memo.get(id)
    if (cached) return cached
    const m = byId.get(id)
    if (!m) return undefined
    let result: ResolvedMatch

    if (m.stage === "H") {
      const entrants = m.sources.map(sideOf).filter(s => s.kind !== "bye")
      const waiting = entrants.some(s => s.kind === "pending")
      const keys = entrants.filter((s): s is { kind: "entrant"; key: string } => s.kind === "entrant").map(s => s.key)
      const valid = m.placements.length > 0 && m.placements.every(k => keys.includes(k))
      const state: MatchState = waiting ? "waiting" : m.placements.length && !valid ? "review" : valid && m.status === "done" ? "done" : m.status === "active" ? "active" : "ready"
      result = { ...m, a: PENDING, b: PENDING, winner: PENDING, loser: PENDING, state, entrants }
    } else {
      const a = sideOf(m.sourceA)
      const b = sideOf(m.sourceB)
      let winner: Side = PENDING
      let loser: Side = PENDING
      let state: MatchState = "waiting"
      if (m.stage === "GF2") {
        const gf = m.sourceA && "match" in m.sourceA ? resolve(m.sourceA.match) : undefined
        if (gf && gf.state === "done" && gf.winner.kind === "entrant" && gf.a.kind === "entrant" && gf.winner.key === gf.a.key) {
          memo.set(id, { ...m, a, b, winner: BYE, loser: BYE, state: "skipped", entrants: [a, b] })
          return memo.get(id)
        }
      }
      if (a.kind === "bye" && b.kind === "bye") { winner = BYE; loser = BYE; state = "bye" }
      else if (a.kind === "bye" && b.kind === "entrant") { winner = b; loser = BYE; state = "bye" }
      else if (b.kind === "bye" && a.kind === "entrant") { winner = a; loser = BYE; state = "bye" }
      else if (a.kind === "entrant" && b.kind === "entrant") {
        if (m.winnerKey === a.key) { winner = a; loser = b; state = "done" }
        else if (m.winnerKey === b.key) { winner = b; loser = a; state = "done" }
        else if (m.winnerKey) state = "review"
        else state = m.status === "active" ? "active" : "ready"
      }
      result = { ...m, a, b, winner, loser, state, entrants: [a, b] }
    }
    memo.set(id, result)
    return result
  }

  for (const m of matches) resolve(m.id)
  return memo
}

export function roundLabel(stage: Stage, round: number, totalWinnerRounds: number, totalLoserRounds = 0): string {
  if (stage === "GF") return "Gran final"
  if (stage === "GF2") return "Final extra"
  if (stage === "3P") return "Tercer puesto"
  if (stage === "L") return round === totalLoserRounds ? "Final de repechaje" : `Repechaje · ronda ${round}`
  if (stage === "H") return `Ronda ${round}`
  const fromEnd = totalWinnerRounds - round
  return ["Final", "Semifinal", "Cuartos de final", "Octavos de final", "Dieciseisavos"][fromEnd] ?? `Ronda ${round}`
}

export function eliminationPlaces(matches: CompetitionMatch[], resolved: Map<string, ResolvedMatch>): Places | null {
  const get = (stage: Stage) => matches.filter(m => m.stage === stage).map(m => resolved.get(m.id)!)
  const keyOf = (s: Side) => (s.kind === "entrant" ? s.key : null)
  const gf = get("GF")[0]
  if (gf) {
    const gf2 = get("GF2")[0]
    const decider = gf2 && gf2.state !== "skipped" ? gf2 : gf
    if (decider.state !== "done" && decider.state !== "bye") return null
    const lFinal = matches.filter(m => m.stage === "L").sort((a, b) => b.round - a.round)[0]
    const third = lFinal ? keyOf(resolved.get(lFinal.id)!.loser) : null
    return [[keyOf(decider.winner)!], [keyOf(decider.loser)].filter(Boolean) as string[], third ? [third] : []].filter(p => p.length)
  }
  const winners = get("W")
  const final = winners.sort((a, b) => b.round - a.round)[0]
  if (!final || (final.state !== "done" && final.state !== "bye")) return null
  const places: Places = [[keyOf(final.winner)!]]
  if (final.loser.kind === "entrant") places.push([final.loser.key])
  const third = get("3P")[0]
  if (third) {
    if (third.state !== "done" && third.state !== "bye") return null
    if (third.winner.kind === "entrant") places.push([third.winner.key])
  } else {
    const semis = winners.filter(m => m.round === final.round - 1).map(m => keyOf(m.loser)).filter(Boolean) as string[]
    if (semis.length) places.push(semis)
  }
  return places
}

// ─── Series (carreras) ────────────────────────────────────────────

function balancedSizes(total: number, maxSize: number): number[] {
  const heats = Math.ceil(total / maxSize)
  return Array.from({ length: heats }, (_, i) => Math.floor(total / heats) + (i < total % heats ? 1 : 0))
}

// Reparte alternando colegios para que cada serie quede mezclada.
function interleaveBySchool(entrants: Entrant[], schoolOfEntrant: (e: Entrant) => string, random: () => number): Entrant[] {
  const groups = new Map<string, Entrant[]>()
  for (const e of shuffle(entrants, random)) groups.set(schoolOfEntrant(e), [...(groups.get(schoolOfEntrant(e)) ?? []), e])
  const lists = shuffle([...groups.values()], random).sort((a, b) => b.length - a.length)
  const out: Entrant[] = []
  for (let i = 0; out.length < entrants.length; i++) for (const list of lists) if (list[i]) out.push(list[i])
  return out
}

export function generateHeats(entrants: Entrant[], schoolOfEntrant: (e: Entrant) => string, opts: { heatSize: number; advancePerHeat: number; avoidSameSchool: boolean }, random = Math.random): NewMatch[] {
  const heatSize = Math.max(2, opts.heatSize)
  const advance = Math.min(Math.max(1, opts.advancePerHeat), heatSize - 1)
  const ordered = opts.avoidSameSchool ? interleaveBySchool(entrants, schoolOfEntrant, random) : shuffle(entrants, random)
  const all: NewMatch[] = []

  let round = 1
  let pool: Source[] = ordered.map(e => ({ seed: e.key }))
  while (true) {
    const sizes = pool.length <= heatSize ? [pool.length] : balancedSizes(pool.length, heatSize)
    const heats = sizes.map((_, i) => blankMatch("H", round, i))
    pool.forEach((source, j) => heats[j % heats.length].sources.push(source))
    all.push(...heats)
    if (heats.length === 1) break
    const next: Source[] = []
    for (let place = 1; place <= advance; place++) {
      const order = place % 2 ? heats : [...heats].reverse()
      for (const heat of order) if (heat.sources.length >= place) next.push({ match: heat.id, place })
    }
    pool = next
    round++
  }
  return all
}

export function heatsPlaces(matches: CompetitionMatch[], resolved: Map<string, ResolvedMatch>, places: number): Places | null {
  const lastRound = Math.max(...matches.map(m => m.round))
  const final = matches.find(m => m.round === lastRound)
  const r = final && resolved.get(final.id)
  if (!r || r.state !== "done") return null
  return r.placements.slice(0, places).map(k => [k])
}

// ─── Contrarreloj ─────────────────────────────────────────────────

export type TimedRow = { key: string; order: number; runs: Run[]; best: Run | null; absent: boolean; complete: boolean }

const betterRun = (a: Run, b: Run) => {
  if (a.status === "done" && b.status !== "done") return -1
  if (b.status === "done" && a.status !== "done") return 1
  if (a.status === "dnf" && b.status === "dnf" && a.checkpoints !== b.checkpoints) return b.checkpoints - a.checkpoints
  return (a.timeMs ?? Infinity) - (b.timeMs ?? Infinity)
}

export function rankTimed(entrants: Entrant[], runs: Run[], attempts: number, phase: "main" | "final" = "main"): TimedRow[] {
  const rows = entrants.map((e, order) => {
    const own = runs.filter(r => r.entrantKey === e.key && r.phase === phase).sort((a, b) => a.attempt - b.attempt)
    const absent = own.some(r => r.status === "absent")
    const scored = own.filter(r => r.status !== "absent")
    const best = scored.length ? [...scored].sort(betterRun)[0] : null
    return { key: e.key, order, runs: own, best, absent, complete: absent || scored.length >= attempts }
  })
  return rows.sort((a, b) => {
    if (a.absent !== b.absent) return a.absent ? 1 : -1
    if (!a.best || !b.best) return a.best ? -1 : b.best ? 1 : a.order - b.order
    return betterRun(a.best, b.best) || a.order - b.order
  })
}

export function nextTimedTurn(entrants: Entrant[], runs: Run[], attempts: number): { key: string; attempt: number } | null {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    for (const e of entrants) {
      const own = runs.filter(r => r.entrantKey === e.key && r.phase === "main")
      if (own.some(r => r.status === "absent")) continue
      if (!own.some(r => r.attempt === attempt)) return { key: e.key, attempt }
    }
  }
  return null
}

export function timedPlaces(entrants: Entrant[], runs: Run[], settings: CompetitionSettings): { places: Places | null; finalists: string[] | null } {
  const main = rankTimed(entrants, runs, settings.attempts)
  if (!main.every(r => r.complete)) return { places: null, finalists: null }
  const ranked = main.filter(r => r.best && !r.absent)
  if (settings.finalTopTwo && ranked.length >= 2) {
    const finalists = ranked.slice(0, 2).map(r => r.key)
    const finalEntrants = entrants.filter(e => finalists.includes(e.key))
    const final = rankTimed(finalEntrants, runs, 1, "final")
    if (!final.every(r => r.complete)) return { places: null, finalists }
    const order = [...final.map(r => r.key), ...ranked.slice(2).map(r => r.key)]
    return { places: order.slice(0, settings.places).map(k => [k]), finalists }
  }
  return { places: ranked.slice(0, settings.places).map(r => [r.key]), finalists: null }
}

// ─── Estimación de duración (una sola pista) ─────────────────────

export type Estimate = { minutes: number; matches: number; rounds: number; byes: number; runs: number; detail: string }

export function estimate(kind: CompetitionKind, slug: string, entrants: number, settings: CompetitionSettings): Estimate {
  const n = entrants
  if (kind === "elimination") {
    const size = nextPow2(n)
    const byes = n > 1 ? size - n : 0
    const rounds = n > 1 ? Math.log2(size) : 0
    const double = settings.doubleElimination && size >= 4
    const matches = n < 2 ? 0 : double ? 2 * n - 2 : n - 1 + (settings.thirdPlace && size >= 4 ? 1 : 0)
    const perMatch = slug === "futbolito" ? 10 : 5
    return { minutes: matches * perMatch, matches, rounds, byes, runs: 0, detail: `${perMatch} min por encuentro${double ? "; puede sumarse una final extra" : ""}` }
  }
  if (kind === "heats") {
    let pool = n
    let heats = 0
    let rounds = 0
    const advance = Math.min(settings.advancePerHeat, settings.heatSize - 1)
    while (pool > 0) {
      const sizes = pool <= settings.heatSize ? [pool] : balancedSizes(pool, settings.heatSize)
      heats += sizes.length
      rounds++
      if (sizes.length === 1) break
      pool = sizes.reduce((sum, s) => sum + Math.min(advance, s), 0)
    }
    return { minutes: heats * 4, matches: heats, rounds, byes: 0, runs: 0, detail: "4 min por serie (3 vueltas y preparación)" }
  }
  if (kind === "timed") {
    const runs = n * settings.attempts + (settings.finalTopTwo ? 2 : 0)
    const perRun = slug === "seguidor-de-linea" ? 1 + (settings.timeLimitSec * 0.5) / 60 + 0.5 : (settings.timeLimitSec * 0.6) / 60 + 1
    return { minutes: Math.ceil(runs * perRun), matches: 0, rounds: settings.attempts, byes: 0, runs, detail: `≈ ${perRun.toFixed(1)} min por intento, incluida la preparación` }
  }
  return { minutes: 5, matches: 1, rounds: 1, byes: 0, runs: 0, detail: "Un combate de 3 min más preparación" }
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function formatMs(ms: number | null | undefined) {
  if (ms == null) return "—"
  const total = Math.max(0, ms)
  const m = Math.floor(total / 60000)
  const s = Math.floor((total % 60000) / 1000)
  const cs = Math.floor((total % 1000) / 10)
  return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`
}
