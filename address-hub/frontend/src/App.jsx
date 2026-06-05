import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AddressForm from './components/AddressForm.jsx';
import AddressCard from './components/AddressCard.jsx';
import PlatformChecklist from './components/PlatformChecklist.jsx';

const api = axios.create({ baseURL: '/api' });

const VIEW = {
  LIST: 'list',
  CREATE: 'create',
  DETAILS: 'details',
};

export default function App() {
  const [view, setView] = useState(VIEW.LIST);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/addresses');
      setAddresses(data);
    } catch (err) {
      setError(messageFromError(err, 'Failed to load addresses'));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlatforms = useCallback(async () => {
    try {
      const { data } = await api.get('/platforms');
      setPlatforms(data);
    } catch (err) {
      setError(messageFromError(err, 'Failed to load platforms'));
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
    fetchPlatforms();
  }, [fetchAddresses, fetchPlatforms]);

  const createAddress = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.post('/addresses', payload);
        setAddresses((prev) => [data, ...prev]);
        setSelectedAddressId(data.id);
        setView(VIEW.DETAILS);
      } catch (err) {
        setError(messageFromError(err, 'Failed to create address'));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteAddress = useCallback(async (addressId) => {
    if (!window.confirm('Delete this address and all of its accounts?')) return;
    setError(null);
    try {
      await api.delete(`/addresses/${addressId}`);
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      setSelectedAddressId((current) =>
        current === addressId ? null : current
      );
      setView(VIEW.LIST);
    } catch (err) {
      setError(messageFromError(err, 'Failed to delete address'));
    }
  }, []);

  const addAccount = useCallback(
    async (addressId, accountPayload) => {
      setError(null);
      try {
        await api.post(`/addresses/${addressId}/accounts`, accountPayload);
        await fetchAddresses();
      } catch (err) {
        setError(messageFromError(err, 'Failed to add account'));
      }
    },
    [fetchAddresses]
  );

  const updateAccount = useCallback(
    async (accountId, patch) => {
      setError(null);
      try {
        await api.patch(`/accounts/${accountId}`, patch);
        await fetchAddresses();
      } catch (err) {
        setError(messageFromError(err, 'Failed to update account'));
      }
    },
    [fetchAddresses]
  );

  const fetchAddressDetails = useCallback(async (addressId) => {
    const { data } = await api.get(`/addresses/${addressId}`);
    return data;
  }, []);

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden>📬</span>
          <div>
            <h1>Address Hub</h1>
            <p>Track every account that needs your new address.</p>
          </div>
        </div>
        <nav className="app-nav">
          <button
            type="button"
            className={view === VIEW.LIST ? 'nav-link active' : 'nav-link'}
            onClick={() => {
              setSelectedAddressId(null);
              setView(VIEW.LIST);
            }}
          >
            All addresses
          </button>
          <button
            type="button"
            className="nav-link primary"
            onClick={() => setView(VIEW.CREATE)}
          >
            + New address
          </button>
        </nav>
      </header>

      {error && (
        <div className="banner banner-error" role="alert">
          {error}
          <button
            type="button"
            className="banner-dismiss"
            onClick={() => setError(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <main className="app-main">
        {view === VIEW.LIST && (
          <AddressList
            addresses={addresses}
            loading={loading}
            onSelect={(id) => {
              setSelectedAddressId(id);
              setView(VIEW.DETAILS);
            }}
            onCreate={() => setView(VIEW.CREATE)}
          />
        )}

        {view === VIEW.CREATE && (
          <AddressForm
            onSubmit={createAddress}
            onCancel={() => setView(VIEW.LIST)}
            loading={loading}
          />
        )}

        {view === VIEW.DETAILS && selectedAddress && (
          <PlatformChecklist
            address={selectedAddress}
            platforms={platforms}
            fetchDetails={fetchAddressDetails}
            onAddAccount={addAccount}
            onUpdateAccount={updateAccount}
            onDeleteAddress={deleteAddress}
            onBack={() => {
              setSelectedAddressId(null);
              setView(VIEW.LIST);
            }}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>Local-first · SQLite · {addresses.length} address{addresses.length === 1 ? '' : 'es'} tracked</span>
      </footer>
    </div>
  );
}

function AddressList({ addresses, loading, onSelect, onCreate }) {
  if (loading && addresses.length === 0) {
    return <div className="empty-state">Loading addresses…</div>;
  }

  if (!loading && addresses.length === 0) {
    return (
      <div className="empty-state">
        <h2>No addresses yet</h2>
        <p>Add the address you just moved to and start ticking off accounts.</p>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          Create your first address
        </button>
      </div>
    );
  }

  return (
    <div className="address-grid">
      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onClick={() => onSelect(address.id)}
        />
      ))}
    </div>
  );
}

function messageFromError(err, fallback) {
  return (
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}
