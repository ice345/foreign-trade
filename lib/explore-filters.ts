export function buildExploreFilterUrl(
  current: URLSearchParams,
  key: string,
  value: string
) {
  const next = new URLSearchParams(current.toString())
  if (next.get(key) === value) next.delete(key)
  else next.set(key, value)
  next.delete("page")
  const query = next.toString()
  return query ? `/explore?${query}` : "/explore"
}
