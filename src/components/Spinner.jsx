export default function Spinner({ fullscreen = false, text = '' }) {
  const inner = (
    <div className="flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
      <div
        className="rounded-full animate-spin"
        style={{
          width: 28, height: 28,
          border: '2.5px solid var(--secondary)',
          borderTopColor: 'var(--primary)',
        }}
      />
      {text && <p className="text-sm">{text}</p>}
    </div>
  );

  if (fullscreen) {
    return <div className="flex items-center justify-center min-h-screen">{inner}</div>;
  }
  return <div className="flex items-center justify-center py-12">{inner}</div>;
}
