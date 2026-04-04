export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12 }}>
      <div style={{
        width: 20,
        height: 20,
        border: '2px solid var(--border-default)',
        borderTopColor: 'var(--accent-blue)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }} />
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
