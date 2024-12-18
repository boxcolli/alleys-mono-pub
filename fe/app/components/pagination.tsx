type PaginationProps = {
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  size: number
  total: number
  r: number
}

export function Pagination({ page, setPage, size, total, r }: PaginationProps) {
  function Go({ to }: { to: number }) {
    const here = page === to;
    return (
      <button
        className={`chip ${here ? "primary" : "fill"}`}
        onClick={here ? undefined : () => setPage(to)}
      >
        {here ? <strong>{to}</strong> : to}
      </button>
    );
  }

  const maxPage = Math.ceil(total / size)
  const lo = (page - r <= 1) ? 1 : page - r
  const hi = (maxPage <= page + r) ? maxPage : page + r

  return (
    <>
      {r <= lo
        ? <Go to={1} />
        : null}
      {r < lo
        ? <i>more_horiz</i>
        : null}
      {Array.from({ length: hi - lo + 1 }).map((_, i) => (
        <Go key={`pagination-${lo + i}`} to={lo + i} />
      ))}
      {hi < maxPage - r + 1
        ? <i>more_horiz</i>
        : null}
      {hi <= maxPage - r + 1
        ? <Go to={maxPage} />
        : null}
    </>
  )
}
