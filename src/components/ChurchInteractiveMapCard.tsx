import React, { useState } from 'react';
import { ExternalLink, MapPin, Navigation, Compass } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';

export const ChurchInteractiveMapCard: React.FC = () => {
  const { data } = useChurch();
  const { profile } = data;

  const [mapType, setMapType] = useState<'embed' | 'satellite'>('embed');

  // GKI Efata Malanu, Sorong, Papua Barat Daya coordinates
  const lat = -0.8824;
  const lng = 131.2923;
  const query = profile.mapsQuery || 'GKI Efata Malanu Sorong Papua Barat Daya';
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  }&q=${encodeURIComponent(query)}&zoom=16`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    query
  )}`;

  const fallbackEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    query
  )}&t=${mapType === 'satellite' ? 'k' : ''}&z=16&output=embed`;

  return (
    <section
      aria-labelledby="peta-gereja-heading"
      className="rounded-2xl bg-white dark:bg-[#2B170C] border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#D4AF37]" />
            <h2
              id="peta-gereja-heading"
              className="font-display text-xl font-bold text-[#9A3412] dark:text-white"
            >
              Peta Lokasi & Navigasi Gedung Gereja
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {profile.namaGereja} — {profile.alamat}
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#FAF2E8] dark:bg-[#1E1008] p-1 shrink-0">
          <button
            type="button"
            onClick={() => setMapType('embed')}
            className={`min-h-[34px] px-3 rounded-md text-xs font-semibold transition-colors ${
              mapType === 'embed'
                ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Peta Standar
          </button>
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`min-h-[34px] px-3 rounded-md text-xs font-semibold transition-colors ${
              mapType === 'satellite'
                ? 'bg-[#9A3412] text-white dark:bg-[#D4AF37] dark:text-[#431407]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Satelit / 3D
          </button>
        </div>
      </div>

      <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#1E1008]">
        <iframe
          title={`Peta Lokasi ${profile.namaGereja}`}
          src={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? embedUrl : fallbackEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <Compass className="h-4 w-4 text-[#D4AF37] shrink-0" />
          <span>
            Koordinat GPS: <strong className="font-mono-nums">{lat}, {lng}</strong> (Klasis Sorong, Papua Barat Daya)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#9A3412] dark:bg-[#D4AF37] px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-[#431407] hover:opacity-95 transition-opacity whitespace-nowrap"
          >
            <Navigation className="h-4 w-4" />
            <span>Petunjuk Arah (Directions)</span>
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E1008] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#9A3412] dark:text-slate-200 hover:border-[#9A3412] dark:hover:border-[#D4AF37] transition-colors whitespace-nowrap"
          >
            <ExternalLink className="h-4 w-4 text-[#D4AF37]" />
            <span>Buka di Google Maps</span>
          </a>
        </div>
      </div>
    </section>
  );
};
