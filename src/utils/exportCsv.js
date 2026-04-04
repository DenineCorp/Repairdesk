/**
 * Downloads an array of objects as a CSV file.
 * @param {string} filename - e.g. "repairdesk-export-2026-04-04.csv"
 * @param {Object[]} rows - each object becomes a row; keys become headers
 */
export function downloadCsv(filename, rows) {
  if (!rows.length) return

  const headers = Object.keys(rows[0])

  const escape = (v) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const lines = [
    headers.map(escape).join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ]

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
