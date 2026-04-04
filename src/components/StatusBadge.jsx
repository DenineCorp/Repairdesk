const STATUS_CONFIG = {
  pending: {
    color: '#8b8b9a',
    bg: 'rgba(139,139,154,0.1)',
    border: 'rgba(139,139,154,0.15)',
    label: 'Pending',
  },
  'in progress': {
    color: 'var(--accent-blue)',
    bg: 'var(--accent-blue-dim)',
    border: 'rgba(227,24,55,0.2)',
    label: 'In Progress',
  },
  ready: {
    color: 'var(--accent-green)',
    bg: 'var(--accent-green-dim)',
    border: 'rgba(16,185,129,0.2)',
    label: 'Ready',
  },
  collected: {
    color: 'var(--text-tertiary)',
    bg: 'transparent',
    border: 'var(--border-subtle)',
    label: 'Collected',
  },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG.pending

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: 12,
      fontWeight: 500,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-sm)',
      padding: '3px 8px',
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: cfg.color,
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  )
}
