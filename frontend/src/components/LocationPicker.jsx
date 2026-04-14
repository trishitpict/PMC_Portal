import { useState } from 'react';

export default function LocationPicker({ location, onChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualEntry, setManualEntry] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualError, setManualError] = useState('');

  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'CivicApp/1.0' } }
      );
      const data = await response.json();
      const address =
        [data.address?.road, data.address?.suburb, data.address?.city]
          .filter(Boolean)
          .join(', ') || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
      const area =
        data.address?.suburb ||
        data.address?.city_district ||
        data.address?.town ||
        data.address?.city ||
        '';
      return { address, area };
    } catch {
      return {
        address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
        area: '',
      };
    }
  };

  const getCoordinates = () => {
    setLoading(true);
    setError('');
    setManualEntry(false);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const { address, area } = await fetchAddress(latitude, longitude);
          onChange({ coordinates: { latitude, longitude }, address, area });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        let errorMsg = 'Unable to get your location.';
        if (err.code === 1) errorMsg += ' Permission denied.';
        else if (err.code === 2) errorMsg += ' Unable to retrieve position.';
        else if (err.code === 3) errorMsg += ' Request timed out.';
        setError(errorMsg);
        setLoading(false);
      },
      { timeout: 15000, enableHighAccuracy: true } // ✅ high accuracy on
    );
  };

  const handleManualSubmit = async () => {
    setManualError('');
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setManualError('Enter a valid latitude (-90 to 90).');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setManualError('Enter a valid longitude (-180 to 180).');
      return;
    }

    setLoading(true);
    try {
      const { address, area } = await fetchAddress(lat, lng);
      onChange({ coordinates: { latitude: lat, longitude: lng }, address, area });
      setManualEntry(false);
      setManualLat('');
      setManualLng('');
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    onChange({ coordinates: { latitude: null, longitude: null }, address: '', area: '' });
    setManualEntry(false);
    setManualLat('');
    setManualLng('');
    setError('');
  };

  const hasLocation =
    location?.coordinates?.latitude && location?.coordinates?.longitude;

  return (
    <div className="location-picker" style={{ marginBottom: '1rem' }}>
      <label style={{ fontWeight: 500, fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>
        📍 Location <span style={{ color: 'var(--on-surface-var)', fontWeight: 400 }}>(optional)</span>
      </label>

      {/* Action buttons */}
      {!hasLocation && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={getCoordinates}
            disabled={loading}
          >
            {loading ? <span className="spinner-sm" /> : '📍 Use Current Location'}
          </button>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => { setManualEntry((v) => !v); setError(''); }}
            disabled={loading}
          >
            ✏️ Enter Manually
          </button>
        </div>
      )}

      {/* Manual entry form */}
      {manualEntry && !hasLocation && (
        <div style={{
          marginTop: '0.75rem',
          background: 'var(--surface-low)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-var)', margin: 0 }}>
            Enter coordinates — you can get these from{' '}
            <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer">
              OpenStreetMap
            </a>{' '}
            by right-clicking any point.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="form-control"
              placeholder="Latitude (e.g. 18.5204)"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              className="form-control"
              placeholder="Longitude (e.g. 73.8567)"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
          {manualError && (
            <p style={{ color: 'var(--error)', fontSize: '0.8rem', margin: 0 }}>⚠️ {manualError}</p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={handleManualSubmit}
              disabled={loading}
            >
              {loading ? <span className="spinner-sm" /> : 'Confirm'}
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => { setManualEntry(false); setManualError(''); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: '0.5rem', color: 'var(--error)', fontSize: '0.82rem' }}>
          ⚠️ {error}
          <button
            type="button"
            className="btn-secondary btn-sm"
            style={{ marginLeft: '0.5rem' }}
            onClick={() => { setManualEntry(true); setError(''); }}
          >
            Enter manually instead
          </button>
        </div>
      )}

      {/* Location confirmed display */}
      {hasLocation && (
        <div style={{
          marginTop: '0.6rem',
          background: 'var(--primary-container)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {/* Coordinates row */}
          <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-var)' }}>
            <strong>Coordinates:</strong>{' '}
            {location.coordinates.latitude.toFixed(6)}, {location.coordinates.longitude.toFixed(6)}
          </div>

          {/* Editable address */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>
              Address <span style={{ color: 'var(--on-surface-var)', fontWeight: 400 }}>(edit if incorrect)</span>
            </label>
            <input
              className="form-control"
              value={location.address}
              onChange={(e) => onChange({ ...location, address: e.target.value })}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          {/* Verify + Clear */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href={`https://www.openstreetmap.org/?mlat=${location.coordinates.latitude}&mlon=${location.coordinates.longitude}&zoom=17`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.8rem',
                color: 'var(--primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              🗺️ Verify on map ↗
            </a>
            <span style={{ color: 'var(--on-surface-var)', fontSize: '0.75rem' }}>·</span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={getCoordinates}
              disabled={loading}
            >
              {loading ? <span className="spinner-sm" /> : '🔄 Retry'}
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={clearLocation}
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}