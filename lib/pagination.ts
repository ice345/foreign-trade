const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

export function parsePagination(
  searchParams: URLSearchParams,
  defaults?: { page?: number; pageSize?: number }
): { page: number; pageSize: number; skip: number; take: number } {
  const page = Math.max(1, Number(searchParams.get("page") ?? defaults?.page ?? DEFAULT_PAGE))
  const rawPageSize = Number(searchParams.get("pageSize") ?? defaults?.pageSize ?? DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(Math.max(1, rawPageSize), MAX_PAGE_SIZE)

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize
  }
}
