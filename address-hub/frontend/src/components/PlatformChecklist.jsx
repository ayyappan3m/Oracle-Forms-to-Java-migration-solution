import { useCallback, useEffect, useMemo, useState } from 'react';
import PlatformItem from './PlatformItem.jsx';

export default function PlatformChecklist({
  address,
  platforms,
  fetchDetails,
  onAddAccount,
  onUpdateAccount,
  onDeleteAddress,
  onBack,
}) {
  const [accounts, setAccounts] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [formState, setFormState] = useState({ username: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoadingDetails(true);
    try {
      const data = await fetchDetails(address.id);
      setAccounts(data.accounts || []);
    } finally {
      setLoadingDetails(false);
    }
  }, [address.id, fetchDetails]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const existingPlatformKeys = useMemo(
    () => new Set(accounts.map((a) => a.platform)),
    [accounts]
  );

  const handleUpdate = async (accountId, patch) => {
    await onUpdateAccount(accountId, patch);
    await refresh();
  };

  const handleStartAdd = (platformKey) => {
    setSelectedPlatform(platformKey);
    setFormState({ username: '', email: '', notes: '' });
    setFormOpen(true);
  };

  const handleSubmitAccount = async (event) => {
    event.preventDefault();
    if (!selectedPlatform) return;
    setSubmitting(true);
    try {
      await onAddAccount(address.id, {
        platform: selectedPlatform,
        username: formState.username.trim() || undefined,
        email: formState.email.trim() || undefined,
        notes: formState.notes.trim() || undefined,
      });
      setFormOpen(false);
      setSelectedPlatform(null);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const total = accounts.length;
  const completed = accounts.filter((a) => a.status === 'completed').length;
  const inProgress = accounts.filter((a) => a.status === 'in-progress').length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const fillClass = total === 0 ? 'empty' : pct === 100 ? '' : 'partial';

  return (
    <div className="checklist">
      <div className="checklist-header">
        <div className="checklist-header-row">
          <div>
            <button type="button" className="toggle-button" onClick={onBack}>
              ← All addresses
            </button>
            <h2 style={{ marginTop: 12 }}>{address.name}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onDeleteAddress(address.id)}
            >
              Delete address
            </button>
          </div>
        </div>
        <div className="addresses">
          <div className="address-row">
            <span className="label">New address</span>
            <span className="value">
              {address.new_street}<br />
              {address.new_city}, {address.new_state} {address.new_zip}
            </span>
          </div>
          {address.old_street && (
            <div className="address-row old">
              <span className="label">Old address</span>
              <span className="value">
                {address.old_street}<br />
                {address.old_city}, {address.old_state} {address.old_zip}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-numbers">
          <div className="stat">
            <span className="num">{total}</span>
            <span className="lbl">Total platforms</span>
          </div>
          <div className="stat">
            <span className="num">{completed}</span>
            <span className="lbl">Completed</span>
          </div>
          <div className="stat">
            <span className="num">{inProgress}</span>
            <span className="lbl">In progress</span>
          </div>
          <div className="stat">
            <span className="num">{pct}%</span>
            <span className="lbl">Done</span>
          </div>
        </div>
        <div className="progress">
          <div className="progress-meta">
            <span>Overall progress</span>
            <span>{completed} of {total}</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar-fill ${fillClass}`}
              style={{ width: total === 0 ? '100%' : `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <section className="card">
        <h2>Tracked accounts</h2>
        <p className="card-subtitle">
          Update each account, mark it complete, and keep notes as you go.
        </p>
        {loadingDetails && accounts.length === 0 ? (
          <p className="sub">Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <p className="sub">No accounts yet — add one from the list below.</p>
        ) : (
          <div className="account-list">
            {accounts.map((account) => (
              <PlatformItem
                key={account.id}
                account={account}
                platforms={platforms}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Add a platform</h2>
        <p className="card-subtitle">
          Pick from the list of supported platforms. Already-added platforms are dimmed.
        </p>

        <div className="available-grid">
          {platforms.map((platform) => {
            const alreadyAdded = existingPlatformKeys.has(platform.key);
            return (
              <button
                key={platform.key}
                type="button"
                className="available-card"
                disabled={alreadyAdded}
                onClick={() => handleStartAdd(platform.key)}
              >
                <span className="name">
                  {platform.name}
                  {platform.hasAPI && <span className="api-badge">API</span>}
                </span>
                <span className="cat">{platform.category}</span>
                {alreadyAdded && <span className="cat">✓ already tracked</span>}
              </button>
            );
          })}
        </div>

        {formOpen && selectedPlatform && (
          <form onSubmit={handleSubmitAccount} style={{ marginTop: 24 }}>
            <h3 className="section-title">
              New account · {platforms.find((p) => p.key === selectedPlatform)?.name}
            </h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="acct-username">Username (optional)</label>
                <input
                  id="acct-username"
                  type="text"
                  value={formState.username}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, username: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="acct-email">Email (optional)</label>
                <input
                  id="acct-email"
                  type="email"
                  value={formState.email}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, email: e.target.value }))
                  }
                />
              </div>
              <div className="field field-full">
                <label htmlFor="acct-notes">Notes (optional)</label>
                <textarea
                  id="acct-notes"
                  value={formState.notes}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, notes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add account'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setFormOpen(false);
                  setSelectedPlatform(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
