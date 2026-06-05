function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.valueOf())) return value;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AddressCard({ address, onClick }) {
  const { progress } = address;
  const pct = progress.total === 0
    ? 0
    : Math.round((progress.completed / progress.total) * 100);

  const fillClass =
    progress.total === 0
      ? 'empty'
      : pct === 100
      ? ''
      : 'partial';

  const hasOldAddress = Boolean(address.old_street && address.old_city);

  return (
    <button type="button" className="address-card" onClick={onClick}>
      <div className="address-card-head">
        <h3>{address.name}</h3>
        <span className="address-card-date">
          Added {formatDate(address.created_at)}
        </span>
      </div>

      <div className="address-row">
        <span className="label">New address</span>
        <span className="value">
          {address.new_street}<br />
          {address.new_city}, {address.new_state} {address.new_zip}
        </span>
      </div>

      {hasOldAddress && (
        <div className="address-row old">
          <span className="label">Old address</span>
          <span className="value">
            {address.old_street}<br />
            {address.old_city}, {address.old_state} {address.old_zip}
          </span>
        </div>
      )}

      <div className="progress">
        <div className="progress-meta">
          <span>{progress.completed} / {progress.total} platforms updated</span>
          <span>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-bar-fill ${fillClass}`}
            style={{ width: progress.total === 0 ? '100%' : `${pct}%` }}
          />
        </div>
      </div>
    </button>
  );
}
