'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

interface Mockup {
  id: string;
  house_image_path: string;
  reference_image_path: string | null;
  mockup_image_path: string;
  notes: string | null;
  created_at: string;
}

export default function CustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [housePhoto, setHousePhoto] = useState<File | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(false);

  // Editing customer info
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [deletingMockupId, setDeletingMockupId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/customers/${params.id}`);
    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCustomer(data.customer);
    setEditName(data.customer.name);
    setEditAddress(data.customer.address);
    setMockups(data.mockups || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!housePhoto) {
      setError('Upload a house photo first.');
      return;
    }

    setGenerating(true);

    const formData = new FormData();
    formData.append('customerId', params.id);
    formData.append('housePhoto', housePhoto);
    if (referenceImage) formData.append('referenceImage', referenceImage);
    formData.append('notes', notes);

    const res = await fetch('/api/mockups', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Generation failed.');
      setGenerating(false);
      return;
    }

    setDemoMode(!!data.demoMode);
    setMockups((prev) => [data.mockup, ...prev]);
    setHousePhoto(null);
    setReferenceImage(null);
    setNotes('');
    setGenerating(false);
  }

  function startEditing() {
    if (!customer) return;
    setEditName(customer.name);
    setEditAddress(customer.address);
    setEditError('');
    setIsEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError('');

    if (!editName.trim() || !editAddress.trim()) {
      setEditError('Both name and address are required.');
      return;
    }

    setSavingEdit(true);
    const res = await fetch(`/api/customers/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, address: editAddress }),
    });
    const data = await res.json();

    if (!res.ok) {
      setEditError(data.error || 'Could not save changes.');
      setSavingEdit(false);
      return;
    }

    setCustomer(data.customer);
    setSavingEdit(false);
    setIsEditing(false);
  }

  async function handleDeleteCustomer() {
    if (!customer) return;
    const confirmed = window.confirm(
      `Delete ${customer.name} and all their saved mockups? This can't be undone.`
    );
    if (!confirmed) return;

    setDeletingCustomer(true);
    const res = await fetch(`/api/customers/${params.id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      setDeletingCustomer(false);
      alert('Could not delete this customer. Try again.');
      return;
    }

    router.push('/');
  }

  async function handleDeleteMockup(mockupId: string) {
    const confirmed = window.confirm('Delete this mockup?');
    if (!confirmed) return;

    setDeletingMockupId(mockupId);
    const res = await fetch(`/api/mockups/${mockupId}`, { method: 'DELETE' });

    if (!res.ok) {
      setDeletingMockupId(null);
      alert('Could not delete this mockup. Try again.');
      return;
    }

    setMockups((prev) => prev.filter((m) => m.id !== mockupId));
    setDeletingMockupId(null);
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading...</p>;
  if (notFound)
    return (
      <div className="empty-state">
        Couldn&apos;t find that customer.{' '}
        <Link href="/">Back to dashboard</Link>
      </div>
    );
  if (!customer) return null;

  return (
    <>
      <Link href="/" className="back-link">
        ← all customers
      </Link>

      {isEditing ? (
        <form
          onSubmit={handleSaveEdit}
          className="card"
          style={{ maxWidth: 420, marginBottom: 8 }}
        >
          <div className="field">
            <label htmlFor="editName">Customer name</label>
            <input
              id="editName"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="editAddress">Address</label>
            <input
              id="editAddress"
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />
          </div>
          {editError && <div className="error-text">{editError}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" type="submit" disabled={savingEdit}>
              {savingEdit ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: 'transparent', color: 'var(--muted)' }}
              onClick={() => setIsEditing(false)}
              disabled={savingEdit}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ fontSize: 26 }}>{customer.name}</h1>
            <p style={{ color: 'var(--muted)', marginTop: 4 }}>
              {customer.address}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn"
              style={{ background: 'transparent', color: 'var(--evergreen-dark)', border: '1px solid var(--border)' }}
              onClick={startEditing}
            >
              Edit info
            </button>
            <button
              className="btn"
              style={{ background: 'transparent', color: 'var(--wreath-red)', border: '1px solid var(--wreath-red)' }}
              onClick={handleDeleteCustomer}
              disabled={deletingCustomer}
            >
              {deletingCustomer ? 'Deleting...' : 'Delete customer'}
            </button>
          </div>
        </div>
      )}

      <div className="light-strand">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="bulb" />
        ))}
      </div>

      {demoMode && (
        <div className="demo-banner">
          Demo mode: no OPENAI_API_KEY is set, so this saved the house photo
          as-is instead of a generated mockup. Add a key in .env.local to
          enable real AI generation. See README.
        </div>
      )}

      <div className="two-col">
        <div className="card">
          <h2 style={{ fontSize: 17 }}>Generate a mockup</h2>
          <form onSubmit={handleGenerate} style={{ marginTop: 14 }}>
            <div className="field">
              <label htmlFor="housePhoto">House photo (required)</label>
              <input
                id="housePhoto"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setHousePhoto(e.target.files ? e.target.files[0] : null)
                }
              />
            </div>
            <div className="field">
              <label htmlFor="referenceImage">
                Style reference photo (optional)
              </label>
              <input
                id="referenceImage"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setReferenceImage(e.target.files ? e.target.files[0] : null)
                }
              />
            </div>
            <div className="field">
              <label htmlFor="notes">Notes for the AI (optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. warm white only, add a wreath on the front gable"
              />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn btn-gold" type="submit" disabled={generating}>
              {generating ? 'Generating...' : 'Generate mockup'}
            </button>
          </form>
        </div>

        <div>
          <h2 style={{ fontSize: 17 }}>
            Saved mockups {mockups.length > 0 && `(${mockups.length})`}
          </h2>
          {mockups.length === 0 ? (
            <div className="empty-state">
              No mockups yet for {customer.name}. Generate one on the left.
            </div>
          ) : (
            <div className="mockup-grid">
              {mockups.map((m) => (
                <div key={m.id} className="mockup-tile" style={{ position: 'relative' }}>
                  <button
                    onClick={() => handleDeleteMockup(m.id)}
                    disabled={deletingMockupId === m.id}
                    title="Delete this mockup"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 2,
                      background: 'rgba(22, 48, 42, 0.85)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      width: 26,
                      height: 26,
                      fontSize: 14,
                      lineHeight: 1,
                      cursor: 'pointer',
                    }}
                  >
                    {deletingMockupId === m.id ? '…' : '✕'}
                  </button>
                  <a
                    href={m.mockup_image_path}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <img src={m.mockup_image_path} alt="Generated mockup" />
                    <div className="tile-meta">
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
