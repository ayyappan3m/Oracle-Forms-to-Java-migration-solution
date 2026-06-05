import { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

function formatDateTime(value) {
  if (!value) return null;
  const d = new Date(value.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.valueOf())) return value;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PlatformItem({ account, platforms, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [instructions, setInstructions] = useState(null);
  const [notes, setNotes] = useState(account.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const platformMeta =
    platforms.find((p) => p.key === account.platform) || {
      key: account.platform,
      name: account.platform,
      category: 'Unknown',
      hasAPI: false,
    };

  useEffect(() => {
    setNotes(account.notes || '');
  }, [account.notes]);

  useEffect(() => {
    if (!expanded || instructions) return;
    let cancelled = false;
    api
      .get(`/platforms/${account.platform}/instructions`)
      .then(({ data }) => {
        if (!cancelled) setInstructions(data);
      })
      .catch(() => {
        if (!cancelled) setInstructions({ instructions: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [expanded, account.platform, instructions]);

  const handleStatusChange = (event) => {
    onUpdate(account.id, { status: event.target.value });
  };

  const handleNotesBlur = async () => {
    if (notes === (account.notes || '')) return;
    setSavingNotes(true);
    try {
      await onUpdate(account.id, { notes });
    } finally {
      setSavingNotes(false);
    }
  };

  const initial = platformMeta.name.charAt(0).toUpperCase();
  const statusClass = `status-select status-${account.status}`;

  return (
    <div className="platform-item">
      <div className="platform-item-row">
        <div className="platform-item-main">
          <div className="platform-icon" aria-hidden>{initial}</div>
          <div className="platform-meta">
            <h4>
              {platformMeta.name}
              {platformMeta.hasAPI && <span className="api-badge">API</span>}
            </h4>
            <p className="sub">
              {platformMeta.category}
              {account.username && ` · ${account.username}`}
              {!account.username && account.email && ` · ${account.email}`}
            </p>
          </div>
        </div>

        <div className="platform-controls">
          <select
            className={statusClass}
            value={account.status}
            onChange={handleStatusChange}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          <button
            type="button"
            className="toggle-button"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="platform-details">
          <div>
            <h5>How to update</h5>
            {instructions === null ? (
              <p className="sub">Loading…</p>
            ) : instructions.instructions.length === 0 ? (
              <p className="sub">No instructions available for this platform.</p>
            ) : (
              <ol className="instructions">
                {instructions.instructions.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            )}
            {instructions?.website && (
              <p className="timestamp">
                Reference:&nbsp;
                <a href={instructions.website} target="_blank" rel="noreferrer">
                  {instructions.website}
                </a>
              </p>
            )}
          </div>

          <div>
            <h5>Notes</h5>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Confirmation numbers, quirks, anything you need to remember…"
            />
            <p className="timestamp">
              {savingNotes
                ? 'Saving…'
                : account.update_date
                ? `Last updated ${formatDateTime(account.update_date)}`
                : 'Not updated yet'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
