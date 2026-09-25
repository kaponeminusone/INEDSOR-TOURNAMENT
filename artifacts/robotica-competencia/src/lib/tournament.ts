import type { Category, Institution, RankingRow } from "@/lib/data"
import { regulationFor } from "@/lib/regulations"

export const POINTS = { gold: 10, silver: 7, bronze: 5 } as const

export function formatLabel(format: Category["format"]) {
  switch (format) {
    case "elimination": return "Llaves"
    case "heats": return "Series"
    case "timed": return "Contrarreloj"
    case "direct": return "Resultado directo"
  }
}

export function modalityOf(category: Category) {
  return regulationFor(category.slug)?.modality ?? formatLabel(category.format)
}

export function kindOf(category: Category) {
  return regulationFor(category.slug)?.kind
}

export function buildLeaderboard(rankings: RankingRow[], institutions: Institution[]) {
  return rankings
    .map(r => ({
      ...r,
      institution: institutions.find(i => i.id === r.institutionId),
      points: r.gold * POINTS.gold + r.silver * POINTS.silver + r.bronze * POINTS.bronze,
    }))
    .filter((r): r is typeof r & { institution: Institution } => Boolean(r.institution))
    .sort((a, b) => b.points - a.points || b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
}
