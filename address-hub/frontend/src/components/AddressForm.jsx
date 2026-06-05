import { useState } from 'react';

const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

const EMPTY = {
  name: '',
  newStreet: '',
  newCity: '',
  newState: '',
  newZip: '',
  oldStreet: '',
  oldCity: '',
  oldState: '',
  oldZip: '',
};

export default function AddressForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(EMPTY);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleaned = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );
    onSubmit(cleaned);
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Add a new address</h2>
      <p className="card-subtitle">
        Give it a label so you can tell it apart later (e.g. "Home 2026" or "Mom's place").
      </p>

      <div className="form-grid">
        <div className="field field-full">
          <label htmlFor="name">Label</label>
          <input
            id="name"
            type="text"
            placeholder="Home 2026"
            value={form.name}
            onChange={updateField('name')}
            required
          />
        </div>
      </div>

      <h3 className="section-title">New address</h3>
      <div className="form-grid">
        <div className="field field-full">
          <label htmlFor="newStreet">Street</label>
          <input
            id="newStreet"
            type="text"
            placeholder="123 Main St, Apt 4B"
            value={form.newStreet}
            onChange={updateField('newStreet')}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="newCity">City</label>
          <input
            id="newCity"
            type="text"
            value={form.newCity}
            onChange={updateField('newCity')}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="newState">State</label>
          <select
            id="newState"
            value={form.newState}
            onChange={updateField('newState')}
            required
          >
            <option value="">Select…</option>
            {US_STATES.map(([code, label]) => (
              <option key={code} value={code}>{code} — {label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="newZip">ZIP</label>
          <input
            id="newZip"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}(-[0-9]{4})?"
            placeholder="12345"
            value={form.newZip}
            onChange={updateField('newZip')}
            required
          />
        </div>
      </div>

      <h3 className="section-title">Old address (optional)</h3>
      <div className="form-grid">
        <div className="field field-full">
          <label htmlFor="oldStreet">Street</label>
          <input
            id="oldStreet"
            type="text"
            value={form.oldStreet}
            onChange={updateField('oldStreet')}
          />
        </div>
        <div className="field">
          <label htmlFor="oldCity">City</label>
          <input
            id="oldCity"
            type="text"
            value={form.oldCity}
            onChange={updateField('oldCity')}
          />
        </div>
        <div className="field">
          <label htmlFor="oldState">State</label>
          <select
            id="oldState"
            value={form.oldState}
            onChange={updateField('oldState')}
          >
            <option value="">Select…</option>
            {US_STATES.map(([code, label]) => (
              <option key={code} value={code}>{code} — {label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="oldZip">ZIP</label>
          <input
            id="oldZip"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}(-[0-9]{4})?"
            value={form.oldZip}
            onChange={updateField('oldZip')}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save address'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
