'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadCustomers() {
    setLoading(true);
    const res = await fetch('/api/customers');
    const data = await res.json();
    setCustomers(data.customers || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !address.trim()) {
      setError('Name and address are both required.');
      return;
    }

    setSubmitting(true);
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Something went wrong.');
      setSubmitting(false);
      return;
    }

    setName('');
    setAddress('');
    setSubmitting(false);
    loadCustomers();
  }

  return (
    <>
      <div className="two-col">
        <div className="card">
          <h2 style={{ fontSize: 18 }}>Add a customer</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
            Just their name and address. You&apos;ll generate and save
            mockups on their page.
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
            <div className="field">
              <label htmlFor="name">Customer name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jamie Whitfield"
              />
            </div>
            <div className="field">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="412 Birchwood Lane, Nashville, TN"
              />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save customer'}
            </button>
          </form>
        </div>

        <div>
          <h2 style={{ fontSize: 18 }}>Customers</h2>
          <div className="light-strand">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className="bulb" />
            ))}
          </div>

          {loading ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</p>
          ) : customers.length === 0 ? (
            <div className="empty-state">
              No customers yet. Add your first one on the left.
            </div>
          ) : (
            <div className="customer-grid">
              {customers.map((c) => (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="customer-card"
                >
                  <div className="name">{c.name}</div>
                  <div className="address">{c.address}</div>
                  <div className="meta">
                    added {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
