'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

      <h1 style={{ fontSize: 26 }}>{customer.name}</h1>
      <p style={{ color: 'var(--muted)', marginTop: 4 }}>{customer.address}</p>

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
                <a
                  key={m.id}
                  href={m.mockup_image_path}
                  target="_blank"
                  rel="noreferrer"
                  className="mockup-tile"
                  style={{ textDecoration: 'none' }}
                >
                  <img src={m.mockup_image_path} alt="Generated mockup" />
                  <div className="tile-meta">
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
