export type RecommendationStatus =
  | "PENDING"
  | "QUOTED"
  | "ACCEPTED"
  | "RUNNING"
  | "POSTED"
  | "CONFIRMED"
  | "CANCELLED"
  | "REFUNDED"

export type RecommendationCandidate = {
  id: string
  title: string
  category: string
  country: string
  platform: string
  tags: string[]
  followers: number | null
  leadTimeDays: number | null
  createdAt: Date
  reviews: { rating: number }[]
  orders: { status: RecommendationStatus; createdAt: Date }[]
}

export type RecommendationPreference = {
  category: string
  country: string
  platform: string
  tags: string[]
  weight: number
}

export type Recommendation = {
  id: string
  score: number
  reason: string
}

const orderWeights: Record<RecommendationStatus, number> = {
  PENDING: 1,
  QUOTED: 2.5,
  ACCEPTED: 5,
  RUNNING: 7,
  POSTED: 8,
  CONFIRMED: 10,
  CANCELLED: 0,
  REFUNDED: 0
}

const DAY = 24 * 60 * 60 * 1000

function normalize(values: number[]) {
  const max = Math.max(...values, 0)
  return values.map((value) => max > 0 ? value / max : 0)
}

function overlap(left: string[], right: string[]) {
  if (!left.length || !right.length) return 0
  const rightSet = new Set(right)
  return left.filter((value) => rightSet.has(value)).length / new Set([...left, ...right]).size
}

function preferenceScore(candidate: RecommendationCandidate, preferences: RecommendationPreference[]) {
  const totalWeight = preferences.reduce((sum, item) => sum + item.weight, 0)
  if (!totalWeight) return 0

  return preferences.reduce((sum, item) => {
    const match =
      (candidate.category === item.category ? 0.42 : 0) +
      (candidate.country === item.country ? 0.18 : 0) +
      (candidate.platform === item.platform ? 0.12 : 0) +
      overlap(candidate.tags, item.tags) * 0.28
    return sum + match * item.weight
  }, 0) / totalWeight
}

/**
 * A small, explainable hybrid ranker: popularity quality signals are blended
 * with a logged-in user's historical intent, then diversified by category.
 */
export function rankRecommendations(
  candidates: RecommendationCandidate[],
  preferences: RecommendationPreference[] = [],
  now = new Date(),
  take = 6
): Recommendation[] {
  const demand = candidates.map((candidate) => candidate.orders.reduce((sum, order) => {
    const ageInDays = Math.max(0, (now.getTime() - order.createdAt.getTime()) / DAY)
    return sum + orderWeights[order.status] * Math.exp(-ageInDays / 30)
  }, 0))
  const averageRating = candidates.reduce((sum, candidate) => {
    const ratings = candidate.reviews.map((review) => review.rating)
    return sum + (ratings.length ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length : 0)
  }, 0) / Math.max(candidates.filter((candidate) => candidate.reviews.length).length, 1)
  const quality = candidates.map((candidate) => {
    const count = candidate.reviews.length
    const rating = count ? candidate.reviews.reduce((sum, review) => sum + review.rating, 0) / count : averageRating
    // Bayesian average prevents one five-star review from outranking reliable resources.
    return ((count / (count + 4)) * rating + (4 / (count + 4)) * averageRating) / 5
  })
  const audience = candidates.map((candidate) => Math.log1p(candidate.followers ?? 0))
  const freshness = candidates.map((candidate) => Math.exp(-Math.max(0, (now.getTime() - candidate.createdAt.getTime()) / DAY) / 120))
  const speed = candidates.map((candidate) => candidate.leadTimeDays == null ? 0.45 : 1 / (1 + candidate.leadTimeDays / 14))
  const normalizedDemand = normalize(demand)
  const normalizedAudience = normalize(audience)
  const normalizedQuality = normalize(quality)
  const normalizedFreshness = normalize(freshness)
  const normalizedSpeed = normalize(speed)

  const scored = candidates.map((candidate, index) => {
    const global = normalizedDemand[index] * 0.42 + normalizedQuality[index] * 0.24 + normalizedAudience[index] * 0.14 + normalizedSpeed[index] * 0.12 + normalizedFreshness[index] * 0.08
    const personal = preferenceScore(candidate, preferences)
    const score = preferences.length ? global * 0.62 + personal * 0.38 : global
    const reason = preferences.length && personal >= 0.28
      ? "与你的历史需求相近"
      : normalizedDemand[index] >= 0.45
        ? "近期需求热度上升"
        : normalizedQuality[index] >= 0.65
          ? "评价与履约表现稳定"
          : normalizedSpeed[index] >= 0.7
            ? "预计响应周期较短"
            : "综合表现突出"
    return { candidate, score, reason }
  }).sort((left, right) => right.score - left.score)

  const selected: Recommendation[] = []
  const categoryCount = new Map<string, number>()
  for (const item of scored) {
    if ((categoryCount.get(item.candidate.category) ?? 0) >= 2) continue
    selected.push({ id: item.candidate.id, score: item.score, reason: item.reason })
    categoryCount.set(item.candidate.category, (categoryCount.get(item.candidate.category) ?? 0) + 1)
    if (selected.length === take) break
  }
  return selected
}

export function buildPreferences(items: Array<Omit<RecommendationPreference, "weight"> & { weight?: number }>) {
  return items.map((item) => ({ ...item, weight: item.weight ?? 1 }))
}
