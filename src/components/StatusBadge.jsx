const STATUS_CONFIG = {
  pending: {
    color: '#ff9f0a',
    bg: 'rgba(255,159,10,0.1)',
    border: 'rgba(255,159,10,0.22)',
    label: 'Pending',
    pulse: true,
  },
  'in progress': {
    color: 'var(--accent-blue)',
    bg: 'var(--accent-blue-dim)',
    border: 'rgba(0,113,227,0.22)',
    label: 'In Progress',
    pulse: true,
  },
  ready: {
    color: 'var(--accent-green)',
    bg: 'var(--accent-green-dim)',
    border: 'rgba(16,185,129,0.22)',
    label: 'Ready',
    pulse: false,
  },
  collected: {
    color: 'var(--text-tertiary)',
    bg: 'transparent',
    border: 'var(--border-subtle)',
    label: 'Collected',
    pulse: false,
  },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG.pending

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '20px',
      padding: '3px 10px',
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
      letterSpacing: '0.01em',
    }}>
      <span
        className={cfg.pulse ? 'pulse-dot' : undefined}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.color,
          flexShrink: 0,
          boxShadow: cfg.pulse ? `0 0 6px ${cfg.color}` : 'none',
        }}
      />
      {cfg.label}
    </span>
  )
}
