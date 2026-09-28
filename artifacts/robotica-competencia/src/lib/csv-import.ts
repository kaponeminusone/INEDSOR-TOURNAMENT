import type { Category, ImportInstitution, ImportParticipant, ImportRobot, Institution, Participant, Robot } from "@/lib/data"

export const CSV_COLUMNS = ["institución", "sigla", "coach", "nombre", "correo", "whatsapp", "grado", "robot", "categorías"]

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase()

// "IE X", "I.E. X" e "Institución Educativa X" son la misma institución.
export const institutionKey = (name: string) => normalize(name)
  .replace(/^(institucion educativa|i\.\s*e\.?|ie)\s+/, "ie ")
  .replace(/[.,]/g, "")

const STOPWORDS = new Set(["ie", "i.e.", "institucion", "educativa", "colegio", "de", "del", "la", "las", "los", "el", "y"])
export function initialsFor(name: string) {
  const letters = name.split(/\s+/).filter(w => w && !STOPWORDS.has(normalize(w))).map(w => w[0].toUpperCase()).join("")
  return (letters || name.slice(0, 3).toUpperCase()).slice(0, 6)
}

// Nombres del formulario de inscripción que difieren de los del sitio.
const CATEGORY_ALIASES: Record<string, string> = {
  "soccer rc": "futbolito",
  "flight lab": "circuito-dron",
  "rally": "carrera-rc",
  "laberinto": "laberinto-rc",
  "explota globos rc": "explotaglobos",
  "explota globos": "explotaglobos",
  "seguidor de linea": "seguidor-de-linea",
}

function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = []
  let current = ""
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++ }
      else if (ch === '"') quoted = false
      else current += ch
    } else if (ch === '"') quoted = true
    else if (ch === delimiter) { out.push(current.trim()); current = "" }
    else current += ch
  }
  out.push(current.trim())
  return out
}

// Divide en registros respetando saltos de línea dentro de comillas (los formularios los permiten).
function splitRecords(text: string): string[] {
  const records: string[] = []
  let current = ""
  let quoted = false
  for (const ch of text) {
    if (ch === '"') quoted = !quoted
    if ((ch === "\n" || ch === "\r") && !quoted) {
      if (current.trim()) records.push(current)
      current = ""
      continue
    }
    current += ch
  }
  if (current.trim()) records.push(current)
  return records
}

function parseTable(text: string): { headers: string[]; rows: string[][] } {
  const records = splitRecords(text.replace(/^﻿/, ""))
  if (records.length < 2) return { headers: [], rows: [] }
  const delimiter = (records[0].match(/;/g)?.length ?? 0) > (records[0].match(/,/g)?.length ?? 0) ? ";" : ","
  return { headers: splitLine(records[0], delimiter), rows: records.slice(1).map(r => splitLine(r, delimiter)) }
}

export type ImportRow = {
  institucion: string
  sigla: string
  coach: string
  nombre: string
  correo: string
  whatsapp: string
  grado: string
  robot: string
  categorias: string[]
  time: number
  source: string
}

export type ImportFile = { format: "official" | "simple"; rows: ImportRow[]; responses: number; missingColumns: string[] }

// Marca temporal del formulario: "25/9/2026 14:19:08".
function parseTimestamp(value: string, fallback: number) {
  const m = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  return m ? new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +(m[6] ?? 0)).getTime() : fallback
}

function readOfficial(headers: string[], rows: string[][]): ImportRow[] {
  const h = headers.map(normalize)
  const find = (test: (x: string) => boolean, from = 0) => { const i = h.findIndex((x, j) => j >= from && test(x)); return i < 0 ? null : i }
  const col = (r: string[], i: number | null) => (i === null ? "" : (r[i] ?? "").trim())
  const iTime = find(x => x === "marca temporal")
  const iInst = find(x => x === "institucion")
  const iOther = find(x => x.startsWith("si no esta en la lista"))
  const iCoach = find(x => x === "coach")

  const blocks = [1, 2, 3, 4, 5, 6].map(n => {
    const name = find(x => new RegExp(`^nombre( completo)? participante ${n}$`).test(x))
    const robot = find(x => new RegExp(`^nombre robot participante ${n}$`).test(x))
    const categories: { index: number; label: string }[] = []
    if (robot !== null) {
      for (let i = robot + 1; i < h.length && h[i].startsWith("categorias ["); i++) categories.push({ index: i, label: headers[i].split("[")[1]?.replace("]", "").trim() ?? "" })
    }
    return {
      n, name, robot, categories,
      email: find(x => new RegExp(`^correo participante ${n}$`).test(x)),
      whatsapp: find(x => new RegExp(`^whatsapp\\s+participante ${n}$`).test(x)),
      grade: find(x => new RegExp(`^grado participante ${n}$`).test(x)),
    }
  })

  const out: ImportRow[] = []
  rows.forEach((r, ri) => {
    const listed = col(r, iInst)
    const institucion = listed || col(r, iOther)
    const time = parseTimestamp(col(r, iTime), ri)
    for (const b of blocks) {
      const nombre = col(r, b.name)
      if (!nombre) continue
      out.push({
        institucion, sigla: "", coach: col(r, iCoach), nombre,
        correo: col(r, b.email), whatsapp: col(r, b.whatsapp), grado: col(r, b.grade), robot: col(r, b.robot),
        categorias: b.categories.filter(c => normalize(r[c.index] ?? "") === "si").map(c => c.label),
        time, source: `Respuesta ${ri + 1} · participante ${b.n}`,
      })
    }
  })
  return out
}

export function readImportFile(text: string): ImportFile {
  const { headers, rows } = parseTable(text)
  const h = headers.map(normalize)
  if (h.includes("marca temporal") && h.some(x => /^nombre( completo)? participante 1$/.test(x))) {
    return { format: "official", rows: readOfficial(headers, rows), responses: rows.length, missingColumns: [] }
  }
  const records = rows.map(r => Object.fromEntries(h.map((key, i) => [key, (r[i] ?? "").trim()])))
  const missingColumns = ["institucion", "nombre", "robot", "categorias"].filter(c => !h.includes(c))
  return {
    format: "simple", responses: rows.length, missingColumns,
    rows: records.map((r, i) => ({
      institucion: r["institucion"] ?? "", sigla: r["sigla"] ?? "", coach: r["coach"] ?? "", nombre: r["nombre"] ?? "",
      correo: r["correo"] ?? "", whatsapp: r["whatsapp"] ?? "", grado: r["grado"] ?? "", robot: r["robot"] ?? "",
      categorias: (r["categorias"] ?? "").split(/[|;/]/).map(t => t.trim()).filter(Boolean),
      time: i, source: `Fila ${i + 2}`,
    })),
  }
}

export type ImportPlan = {
  institutions: ImportInstitution[]
  participants: ImportParticipant[]
  robots: ImportRobot[]
  rows: number
  existingParticipants: number
  skippedRobots: number
  corrections: number
  unknownCategories: string[]
  reviews: string[]
}

type Existing = { institutions: Institution[]; participants: Participant[]; robots: Robot[]; categories: Category[] }

export function buildImportPlan(rows: ImportRow[], existing: Existing): ImportPlan {
  const plan: ImportPlan = { institutions: [], participants: [], robots: [], rows: rows.length, existingParticipants: 0, skippedRobots: 0, corrections: 0, unknownCategories: [], reviews: [] }
  const coaches = new Map<string, Set<string>>()

  const categoryFor = (token: string) => {
    const key = normalize(token)
    const slug = CATEGORY_ALIASES[key] ?? key
    return existing.categories.find(c => c.slug === slug || normalize(c.name) === key)
  }

  // El envío más reciente va al final: sus correcciones prevalecen dentro del archivo.
  const ordered = [...rows].sort((a, b) => a.time - b.time)
  const tokensOf = (row: ImportRow) => row.categorias.map(t => categoryFor(t)?.id).filter((id): id is string => Boolean(id))
  const studentOf = (row: ImportRow) => `${institutionKey(row.institucion)}|${normalize(row.nombre)}`
  // Filas que un envío posterior del mismo estudiante reemplaza (otro nombre de robot, mismas categorías).
  const superseded = new Set(ordered.filter((row, i) => row.robot && ordered.slice(i + 1).some(later =>
    later.robot && studentOf(later) === studentOf(row) && normalize(later.robot) !== normalize(row.robot)
    && tokensOf(later).some(c => tokensOf(row).includes(c)))))

  for (const row of ordered) {
    // Institución
    let institutionId = ""
    if (row.institucion) {
      const key = institutionKey(row.institucion)
      const inst = existing.institutions.find(i => institutionKey(i.name) === key || (row.sigla && normalize(i.initials) === normalize(row.sigla)))
        ?? plan.institutions.find(i => institutionKey(i.name) === key)
      if (inst) institutionId = inst.id
      else {
        institutionId = crypto.randomUUID()
        plan.institutions.push({ id: institutionId, name: row.institucion.trim(), initials: row.sigla || initialsFor(row.institucion), coach: "" })
      }
      if (row.coach && plan.institutions.some(i => i.id === institutionId)) {
        coaches.set(institutionId, (coaches.get(institutionId) ?? new Set()).add(row.coach.trim()))
      }
    }

    // Estudiante: mismo nombre en la misma institución = misma persona.
    if (!row.nombre) continue
    const nameKey = normalize(row.nombre)
    let participant = plan.participants.find(p => normalize(p.name) === nameKey && p.institutionId === institutionId)
    if (!participant) {
      const known = existing.participants.find(p => normalize(p.name) === nameKey && p.institutionId === institutionId)
      participant = known
        ? { id: known.id, name: known.name, email: known.email, whatsapp: known.whatsapp, grade: known.grade, institutionId: known.institutionId, robots: [], existing: true }
        : { id: crypto.randomUUID(), name: row.nombre.trim(), email: row.correo, whatsapp: row.whatsapp, grade: row.grado, institutionId, robots: [] }
      plan.participants.push(participant)
      if (known) plan.existingParticipants++
    } else if (!participant.existing) {
      participant.email ||= row.correo
      participant.whatsapp ||= row.whatsapp
      participant.grade ||= row.grado
    }

    // Robot
    const categoryIds: string[] = []
    for (const token of row.categorias) {
      const category = categoryFor(token)
      if (category) { if (!categoryIds.includes(category.id)) categoryIds.push(category.id) }
      else if (!plan.unknownCategories.includes(token)) plan.unknownCategories.push(token)
    }
    if (!row.robot) {
      if (!participant.existing) plan.reviews.push(`${row.nombre} (${row.source}) no registró robot.`)
      continue
    }
    const robotKey = normalize(row.robot)
    const overlaps = (cats: string[]) => cats.some(c => categoryIds.includes(c))

    if (participant.existing) {
      if (superseded.has(row)) continue
      const own = existing.robots.filter(r => r.participantId === participant!.id)
      const same = own.find(r => normalize(r.name) === robotKey)
      if (same) {
        plan.skippedRobots++
        const added = categoryIds.filter(c => !same.categories.includes(c))
        if (added.length) plan.reviews.push(`${row.nombre}: «${same.name}» trae categorías nuevas que no se aplicaron (${added.map(id => existing.categories.find(c => c.id === id)?.name).join(", ")}). Agrégalas desde Asistencia si corresponde.`)
        continue
      }
      const renamed = own.find(r => overlaps(r.categories))
      if (renamed) {
        plan.skippedRobots++
        plan.reviews.push(`${row.nombre}: ya tiene «${renamed.name}» en las mismas categorías; el archivo dice «${row.robot}». No se cambió; corrígelo a mano si fue un cambio de nombre.`)
        continue
      }
    } else {
      const planned = plan.robots.filter(r => participant!.robots.includes(r.id))
      const same = planned.find(r => normalize(r.name) === robotKey)
      if (same) {
        plan.skippedRobots++
        for (const c of categoryIds) if (!same.categories.includes(c)) same.categories.push(c)
        continue
      }
      const renamed = planned.find(r => overlaps(r.categories))
      if (renamed) {
        plan.corrections++
        plan.reviews.push(`${row.nombre}: «${renamed.name}» se reemplazó por «${row.robot}» (${row.source}, envío más reciente).`)
        renamed.name = row.robot.trim()
        renamed.categories = categoryIds
        continue
      }
    }

    if (!categoryIds.length) plan.reviews.push(`${row.nombre}: el robot «${row.robot}» no tiene categorías marcadas.`)
    const id = crypto.randomUUID()
    plan.robots.push({ id, name: row.robot.trim(), categories: categoryIds })
    participant.robots.push(id)
  }

  for (const inst of plan.institutions) inst.coach = [...(coaches.get(inst.id) ?? [])].join(" / ")
  return plan
}
