import React, { useState, useCallback, useMemo } from 'react';
import { iconLoaders } from '@Components/iconLoaders';
import SvgLoader from '@Components/SvgLoader';
import { Toast } from '@AC/ui/Toast';

// Extract path info from iconLoaders source for display
const iconEntries = Object.keys(iconLoaders).map((name) => ({
  name,
}));

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-HTTPS contexts (e.g. WP admin on localhost)
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export default function IconCatalog() {
  const [search, setSearch] = useState('');
  const [lastCopied, setLastCopied] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const filtered = useMemo(() => {
    if (!search) return iconEntries;
    const q = search.toLowerCase();
    return iconEntries.filter((e) => e.name.toLowerCase().includes(q));
  }, [search]);

  const handleCopy = async (name) => {
    const ok = await copyToClipboard(name);
    if (ok) {
      setLastCopied(name);
      setToast({ show: true, message: `Copied: ${name}`, type: 'success' });
      setTimeout(() => setLastCopied(null), 1500);
    } else {
      setToast({ show: true, message: 'Copy failed', type: 'error' });
    }
  };

  const handleToastClose = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  return (
    <div style={{ padding: '24px', position: 'relative' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
        Icon Catalog ({iconEntries.length} icons)
      </h1>
      <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
        Dev only — click icon to copy name. Use with{' '}
        <code style={{ background: '#f1f1f1', padding: '2px 6px', borderRadius: '4px' }}>
          {'<SvgLoader name="iconName" />'}
        </code>
      </p>

      <input
        type='text'
        placeholder='Search icons...'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px',
          marginBottom: '24px',
        }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '10px',
        }}
      >
        {filtered.map(({ name }) => (
          <div
            key={name}
            onClick={() => handleCopy(name)}
            title={`Click to copy: ${name}`}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '20px 8px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              background: lastCopied === name ? '#e8f5e9' : '#fff',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#333',
              }}
            >
              <SvgLoader name={name} style={{ width: '48px', height: '48px' }} />
            </div>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                textAlign: 'center',
                wordBreak: 'break-all',
                lineHeight: 1.3,
                color: '#333',
              }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: '40px' }}>
          No icons match "{search}"
        </p>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={handleToastClose}
      />
    </div>
  );
}
