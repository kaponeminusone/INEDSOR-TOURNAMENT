import type { Category, ImportInstitution, ImportParticipant, ImportRobot, Institution, Participant, Robot } from "@/lib/data"

export const CSV_COLUMNS = ["institución", "sigla", "coach", "nombre", "correo", "whatsapp", "grado", "robot", "categorías"]

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase()

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

// Rows keyed by accent-free lowercase header (institucion, categorias, ...). Accepts "," or ";" (Excel in Spanish).
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length < 2) return []
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ","
  const headers = splitLine(lines[0], delimiter).map(normalize)
  return lines.slice(1).map(line => {
    const values = splitLine(line, delimiter)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]))
  })
}

export type ImportPlan = {
  institutions: ImportInstitution[]
  participants: ImportParticipant[]
  robots: ImportRobot[]
  rows: number
  existingParticipants: number
  skippedRobots: number
  unknownCategories: string[]
  missingColumns: string[]
}

type Existing = { institutions: Institution[]; participants: Participant[]; robots: Robot[]; categories: Category[] }

export function buildImportPlan(rows: Record<string, string>[], existing: Existing): ImportPlan {
  const same = (a?: string, b?: string) => Boolean(a && b && normalize(a) === normalize(b))
  const plan: ImportPlan = { institutions: [], participants: [], robots: [], rows: rows.length, existingParticipants: 0, skippedRobots: 0, unknownCategories: [], missingColumns: [] }
  const present = new Set(rows.flatMap(r => Object.keys(r)))
  plan.missingColumns = ["institucion", "nombre", "robot", "categorias"].filter(c => !present.has(c))

  for (const row of rows) {
    const instName = row["institucion"] ?? ""
    const initials = row["sigla"] ?? ""
    let institutionId = ""
    const inst = existing.institutions.find(i => same(i.initials, initials) || same(i.name, instName))
      ?? plan.institutions.find(i => same(i.initials, initials) || same(i.name, instName))
    if (inst) institutionId = inst.id
    else if (instName) {
      institutionId = crypto.randomUUID()
      plan.institutions.push({ id: institutionId, name: instName, initials: initials || instName.substring(0, 3).toUpperCase(), coach: row["coach"] ?? "" })
    }

    const email = row["correo"] ?? ""
    const name = row["nombre"] ?? ""
    let participant = plan.participants.find(p => (email && same(p.email, email)) || (same(p.name, name) && p.institutionId === institutionId))
    if (!participant && name) {
      const known = existing.participants.find(p => (email && same(p.email, email)) || (same(p.name, name) && p.institutionId === institutionId))
      participant = known
        ? { id: known.id, name: known.name, email: known.email, whatsapp: known.whatsapp, grade: known.grade, institutionId: known.institutionId, robots: [], existing: true }
        : { id: crypto.randomUUID(), name, email, whatsapp: row["whatsapp"] ?? "", grade: row["grado"] ?? "", institutionId, robots: [] }
      plan.participants.push(participant)
      if (known) plan.existingParticipants++
    }

    const robotName = row["robot"] ?? ""
    if (!robotName) continue
    const alreadyThere = participant?.existing && existing.robots.some(r => r.participantId === participant!.id && same(r.name, robotName))
    const alreadyPlanned = participant && plan.robots.some(r => participant!.robots.includes(r.id) && same(r.name, robotName))
    if (alreadyThere || alreadyPlanned) { plan.skippedRobots++; continue }

    const categoryIds: string[] = []
    for (const token of (row["categorias"] ?? "").split(/[|;/]/).map(t => t.trim()).filter(Boolean)) {
      const category = existing.categories.find(c => c.slug === normalize(token) || same(c.name, token))
      if (category) categoryIds.push(category.id)
      else if (!plan.unknownCategories.includes(token)) plan.unknownCategories.push(token)
    }
    const id = crypto.randomUUID()
    plan.robots.push({ id, name: robotName, categories: categoryIds })
    participant?.robots.push(id)
  }
  return plan
}
