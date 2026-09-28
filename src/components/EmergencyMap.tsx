import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Hospital, Ambulance, Dispatch } from '../types.ts';
import { loadGoogleMaps } from '../utils/googleMapsLoader.ts';
import { emergencyDarkMapStyle } from '../utils/googleMapsStyles.ts';
import { 
  Layers, MapPin, Navigation, Siren, Radio, Eye, 
  Car, ShieldAlert, CheckCircle, RefreshCw, ZoomIn, ZoomOut, Compass
} from 'lucide-react';

interface EmergencyMapProps {
  userLat: number;
  userLng: number;
  hospitals: Hospital[];
  ambulances: Ambulance[];
  activeDispatch: Dispatch | null;
  onSelectHospital: (hospital: Hospital) => void;
  selectedHospitalId?: string | null;
  mapsApiKey?: string;
  theme?: 'light' | 'dark';
}

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  userLat,
  userLng,
  hospitals,
  ambulances,
  activeDispatch,
  onSelectHospital,
  selectedHospitalId,
  mapsApiKey = 'AIzaSyBG2FFrZIx6U0X7iWVtAGEVH_ITCoOtC2g',
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Map Engine & State
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'dark'>('roadmap');

  // Google Maps Instance Refs
  const gMapRef = useRef<google.maps.Map | null>(null);
  const gTrafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const gMarkersRef = useRef<google.maps.Marker[]>([]);
  const gPolylineRef = useRef<google.maps.Polyline | null>(null);
  const gInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Leaflet Instance Refs
  const lMapRef = useRef<L.Map | null>(null);
  const lMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const lRouteLayerRef = useRef<L.LayerGroup | null>(null);

  // -------------------------------------------------------------
  // 1. INITIALIZE GOOGLE MAPS SDK
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    const key = mapsApiKey || 'AIzaSyBG2FFrZIx6U0X7iWVtAGEVH_ITCoOtC2g';

    loadGoogleMaps(key)
      .then(() => {
        if (isMounted) {
          setGoogleMapsLoaded(true);
          setLoadError(null);
        }
      })
      .catch((err) => {
        console.warn('Google Maps SDK load fallback to Leaflet:', err);
        if (isMounted) {
          setLoadError('Google Maps failed to load, switched to Leaflet/CartoDB engine');
          setMapEngine('leaflet');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [mapsApiKey]);

  // -------------------------------------------------------------
  // 2. CREATE GOOGLE MAP INSTANCE
  // -------------------------------------------------------------
  useEffect(() => {
    if (mapEngine !== 'google' || !googleMapsLoaded || !mapContainerRef.current) return;

    // Destroy leaflet instance if it was attached
    if (lMapRef.current) {
      lMapRef.current.remove();
      lMapRef.current = null;
      lMarkersLayerRef.current = null;
      lRouteLayerRef.current = null;
    }

    if (!gMapRef.current) {
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: userLat, lng: userLng },
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: mapType === 'dark' ? emergencyDarkMapStyle : undefined,
        mapTypeId: mapType === 'satellite' ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP,
      });

      // Traffic Layer for real-time congestion
      const trafficLayer = new google.maps.TrafficLayer();
      if (trafficEnabled) {
        trafficLayer.setMap(map);
      }
      gTrafficLayerRef.current = trafficLayer;

      // Shared InfoWindow
      gInfoWindowRef.current = new google.maps.InfoWindow({
        disableAutoPan: false,
      });

      gMapRef.current = map;
    }

    return () => {
      // Map stays or will be destroyed if switching engines
    };
  }, [mapEngine, googleMapsLoaded]);

  // Smoothly pan map whenever user coordinates update (e.g. user allows location)
  useEffect(() => {
    if (mapEngine === 'google' && gMapRef.current) {
      gMapRef.current.panTo({ lat: userLat, lng: userLng });
    } else if (mapEngine === 'leaflet' && lMapRef.current) {
      lMapRef.current.panTo([userLat, userLng]);
    }
  }, [userLat, userLng, mapEngine]);

  // Handle map type changes on Google Maps
  useEffect(() => {
    if (!gMapRef.current || mapEngine !== 'google') return;

    if (mapType === 'satellite') {
      gMapRef.current.setMapTypeId(google.maps.MapTypeId.HYBRID);
      gMapRef.current.setOptions({ styles: null });
    } else if (mapType === 'dark') {
      gMapRef.current.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      gMapRef.current.setOptions({ styles: emergencyDarkMapStyle });
    } else {
      gMapRef.current.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      gMapRef.current.setOptions({ styles: null });
    }
  }, [mapType, mapEngine]);

  // Handle traffic layer toggle on Google Maps
  useEffect(() => {
    if (!gTrafficLayerRef.current || !gMapRef.current || mapEngine !== 'google') return;
    if (trafficEnabled) {
      gTrafficLayerRef.current.setMap(gMapRef.current);
    } else {
      gTrafficLayerRef.current.setMap(null);
    }
  }, [trafficEnabled, mapEngine]);

  // -------------------------------------------------------------
  // 3. RENDER GOOGLE MAPS MARKERS, INFO-WINDOWS & ROUTES
  // -------------------------------------------------------------
  useEffect(() => {
    if (mapEngine !== 'google' || !gMapRef.current || !googleMapsLoaded) return;
    const map = gMapRef.current;

    // Clear previous markers
    gMarkersRef.current.forEach((m) => m.setMap(null));
    gMarkersRef.current = [];

    // Clear previous polyline
    if (gPolylineRef.current) {
      gPolylineRef.current.setMap(null);
      gPolylineRef.current = null;
    }

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: userLat, lng: userLng });

    // 1. Patient SOS Marker
    const sosMarker = new google.maps.Marker({
      position: { lat: userLat, lng: userLng },
      map,
      title: 'Emergency SOS Incident',
      zIndex: 100,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#ef4444" fill-opacity="0.3"/>
            <circle cx="20" cy="20" r="14" fill="#dc2626" stroke="#ffffff" stroke-width="2.5"/>
            <text x="20" y="24" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="900" text-anchor="middle">SOS</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
      },
    });

    sosMarker.addListener('click', () => {
      if (gInfoWindowRef.current) {
        gInfoWindowRef.current.setContent(`
          <div style="color: #0f172a; font-family: sans-serif; padding: 6px; min-width: 200px;">
            <div style="font-weight: 800; color: #dc2626; font-size: 13px; display: flex; align-items: center; gap: 4px;">
              🚨 Active Incident / SOS Location
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px;">
              Coordinates: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}
            </div>
            <div style="font-size: 11px; color: #16a34a; font-weight: 600; margin-top: 4px;">
              Nearest Units Dispatched
            </div>
          </div>
        `);
        gInfoWindowRef.current.open(map, sosMarker);
      }
    });
    gMarkersRef.current.push(sosMarker);

    // 2. Hospital Markers
    hospitals.forEach((hosp) => {
      const isSelected = hosp.id === selectedHospitalId;
      const isOpen = hosp.emergency_status === 'OPEN';
      const bgColor = isSelected ? '#dc2626' : isOpen ? '#059669' : '#d97706';
      const labelBed = `${hosp.capacity.icu_available} ICU`;

      bounds.extend({ lat: hosp.latitude, lng: hosp.longitude });

      const hospMarker = new google.maps.Marker({
        position: { lat: hosp.latitude, lng: hosp.longitude },
        map,
        title: hosp.name,
        zIndex: isSelected ? 90 : 50,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="44" height="48" viewBox="0 0 44 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="2" width="32" height="32" rx="8" fill="${bgColor}" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"/>
              <text x="22" y="23" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="900" text-anchor="middle">H</text>
              <rect x="2" y="34" width="40" height="13" rx="3" fill="#0f172a" stroke="#334155" stroke-width="1"/>
              <text x="22" y="44" fill="#ffffff" font-family="sans-serif" font-size="8" font-weight="700" text-anchor="middle">${labelBed}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(44, 48),
          anchor: new google.maps.Point(22, 24),
        },
      });

      hospMarker.addListener('click', () => {
        onSelectHospital(hosp);
        if (gInfoWindowRef.current) {
          gInfoWindowRef.current.setContent(`
            <div style="color: #0f172a; font-family: sans-serif; padding: 8px; max-width: 260px;">
              <div style="font-weight: 800; font-size: 13px; color: #0f172a; line-height: 1.2;">${hosp.name}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 3px;">${hosp.address}</div>
              <div style="margin-top: 8px; background: #f1f5f9; padding: 6px; border-radius: 6px; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <div><strong>ICU:</strong> ${hosp.capacity.icu_available}/${hosp.capacity.icu_total}</div>
                <div><strong>General:</strong> ${hosp.capacity.general_available}/${hosp.capacity.general_total}</div>
                <div><strong>Ventilators:</strong> ${hosp.capacity.ventilators_available} free</div>
                <div><strong>Liquid O₂:</strong> ${hosp.capacity.oxygen_supply_percent}%</div>
              </div>
              <div style="margin-top: 8px; font-size: 11px; font-weight: 700; color: #059669;">
                ${hosp.distance_km ? `${hosp.distance_km} km away (~${hosp.drive_time_mins} mins ETA)` : ''}
              </div>
            </div>
          `);
          gInfoWindowRef.current.open(map, hospMarker);
        }
      });
      gMarkersRef.current.push(hospMarker);
    });

    // 3. Ambulance Markers
    ambulances.forEach((amb) => {
      const isBusy = amb.status !== 'available';
      bounds.extend({ lat: amb.latitude, lng: amb.longitude });

      const ambMarker = new google.maps.Marker({
        position: { lat: amb.latitude, lng: amb.longitude },
        map,
        title: `${amb.call_sign} (${amb.vehicle_type})`,
        zIndex: 80,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="44" height="46" viewBox="0 0 44 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="2" width="32" height="30" rx="7" fill="#f59e0b" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"/>
              <text x="22" y="22" fill="#0f172a" font-family="sans-serif" font-size="14" font-weight="900" text-anchor="middle">🚑</text>
              <rect x="2" y="32" width="40" height="13" rx="3" fill="#020617" stroke="#334155" stroke-width="1"/>
              <text x="22" y="42" fill="#fef08a" font-family="sans-serif" font-size="8" font-weight="700" text-anchor="middle">${amb.call_sign}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(44, 46),
          anchor: new google.maps.Point(22, 23),
        },
      });

      ambMarker.addListener('click', () => {
        if (gInfoWindowRef.current) {
          gInfoWindowRef.current.setContent(`
            <div style="color: #0f172a; font-family: sans-serif; padding: 6px; min-width: 220px;">
              <div style="font-weight: 800; font-size: 13px; display: flex; align-items: center; gap: 4px;">
                🚑 ${amb.call_sign} (${amb.vehicle_type})
              </div>
              <div style="font-size: 11px; color: #475569; margin-top: 3px;">Paramedic: ${amb.driver_name}</div>
              <div style="font-size: 11px; color: #475569;">Vehicle Plate: ${amb.vehicle_number}</div>
              <div style="margin-top: 6px; display: flex; gap: 8px; font-size: 11px;">
                <span style="background: ${isBusy ? '#fee2e2' : '#dcfce7'}; color: ${isBusy ? '#b91c1c' : '#15803d'}; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                  ${amb.status.toUpperCase()}
                </span>
                <span style="font-weight: 700; color: #0284c7;">${amb.speed_kmh} km/h</span>
              </div>
            </div>
          `);
          gInfoWindowRef.current.open(map, ambMarker);
        }
      });
      gMarkersRef.current.push(ambMarker);
    });

    // 4. Active Emergency Route Polyline
    if (activeDispatch && activeDispatch.route_coordinates?.length > 0) {
      const path = activeDispatch.route_coordinates.map((coord) => ({
        lat: coord[0],
        lng: coord[1],
      }));

      const routeLine = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#ef4444',
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map,
      });

      gPolylineRef.current = routeLine;

      // Fit bounds to the active route
      path.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, 50);
    }
  }, [
    mapEngine, 
    googleMapsLoaded, 
    userLat, 
    userLng, 
    hospitals, 
    ambulances, 
    activeDispatch, 
    selectedHospitalId, 
    onSelectHospital
  ]);

  // -------------------------------------------------------------
  // 4. LEAFLET FALLBACK ENGINE INITIALIZATION
  // -------------------------------------------------------------
  useEffect(() => {
    if (mapEngine !== 'leaflet' || !mapContainerRef.current) return;

    // Clean up google map if it was initialized
    if (gMapRef.current) {
      gMapRef.current = null;
      gTrafficLayerRef.current = null;
      gMarkersRef.current = [];
      gPolylineRef.current = null;
    }

    if (!lMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([userLat, userLng], 13);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      lMapRef.current = map;
      lMarkersLayerRef.current = L.layerGroup().addTo(map);
      lRouteLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = lMapRef.current;
    const markersLayer = lMarkersLayerRef.current;
    const routeLayer = lRouteLayerRef.current;

    if (!map || !markersLayer || !routeLayer) return;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // Leaflet SOS Marker
    const userIcon = L.divIcon({
      className: 'custom-user-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-red-500/30 animate-ping"></div>
          <div class="relative w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">SOS</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.marker([userLat, userLng], { icon: userIcon }).addTo(markersLayer);

    // Leaflet Hospitals
    hospitals.forEach((hosp) => {
      const isSelected = hosp.id === selectedHospitalId;
      const isOpen = hosp.emergency_status === 'OPEN';
      const badgeBg = isSelected ? 'bg-red-600 ring-4 ring-red-400' : isOpen ? 'bg-emerald-600' : 'bg-amber-600';

      const hospIcon = L.divIcon({
        className: 'custom-hosp-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="w-8 h-8 rounded-xl ${badgeBg} border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black">H</div>
            <div class="absolute -bottom-4 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap border border-slate-700">
              ${hosp.capacity.icu_available} ICU
            </div>
          </div>
        `,
        iconSize: [36, 40],
        iconAnchor: [18, 20],
      });
      const marker = L.marker([hosp.latitude, hosp.longitude], { icon: hospIcon }).addTo(markersLayer);
      marker.on('click', () => onSelectHospital(hosp));
    });

    // Leaflet Ambulances
    ambulances.forEach((amb) => {
      const isBusy = amb.status !== 'available';
      const ambIcon = L.divIcon({
        className: 'custom-amb-icon',
        html: `
          <div class="relative flex items-center justify-center">
            ${isBusy ? '<div class="absolute -inset-1 rounded-full bg-red-500/40 animate-pulse"></div>' : ''}
            <div class="relative w-8 h-8 rounded-lg bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center text-slate-950 text-xs font-black">🚑</div>
            <div class="absolute -bottom-4 bg-slate-950 text-amber-300 text-[9px] font-bold px-1 rounded shadow whitespace-nowrap border border-slate-700">${amb.call_sign}</div>
          </div>
        `,
        iconSize: [36, 40],
        iconAnchor: [18, 20],
      });
      L.marker([amb.latitude, amb.longitude], { icon: ambIcon }).addTo(markersLayer);
    });

    // Leaflet Polyline
    if (activeDispatch && activeDispatch.route_coordinates?.length > 0) {
      const poly = L.polyline(activeDispatch.route_coordinates, {
        color: '#ef4444',
        weight: 5,
        opacity: 0.85,
      }).addTo(routeLayer);
      map.fitBounds(poly.getBounds(), { padding: [50, 50], maxZoom: 15 });
    }
  }, [mapEngine, userLat, userLng, hospitals, ambulances, activeDispatch, selectedHospitalId, onSelectHospital]);

  // Recenter Map Function
  const handleRecenter = () => {
    if (mapEngine === 'google' && gMapRef.current) {
      gMapRef.current.panTo({ lat: userLat, lng: userLng });
      gMapRef.current.setZoom(13);
    } else if (mapEngine === 'leaflet' && lMapRef.current) {
      lMapRef.current.setView([userLat, userLng], 13);
    }
  };

  const handleZoom = (delta: number) => {
    if (mapEngine === 'google' && gMapRef.current) {
      const current = gMapRef.current.getZoom() || 13;
      gMapRef.current.setZoom(current + delta);
    } else if (mapEngine === 'leaflet' && lMapRef.current) {
      lMapRef.current.setZoom(lMapRef.current.getZoom() + delta);
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border shadow-lg flex flex-col transition-all ${
      isDark ? 'border-slate-800 bg-[#060913]' : 'border-slate-200/90 bg-slate-100 shadow-slate-200/50'
    }`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 relative z-0" />

      {/* TOP-LEFT: Map Controls & Traffic Toggle */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Engine Switcher */}
        <div className={`backdrop-blur-xl border p-1 rounded-xl shadow-lg flex items-center gap-1 ${
          isDark ? 'bg-[#080d1a]/90 border-slate-700/80 text-white' : 'bg-white/90 border-slate-200 text-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => setMapEngine('google')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mapEngine === 'google'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Google Maps</span>
          </button>

          <button
            type="button"
            onClick={() => setMapEngine('leaflet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              mapEngine === 'leaflet'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CartoDB</span>
          </button>
        </div>

        {/* Google Maps View Styles */}
        {mapEngine === 'google' && (
          <div className={`backdrop-blur-xl border p-1 rounded-xl shadow-lg flex items-center gap-1 ${
            isDark ? 'bg-[#080d1a]/90 border-slate-700/80 text-white' : 'bg-white/90 border-slate-200 text-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapType === 'roadmap'
                  ? isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => setMapType('satellite')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapType === 'satellite'
                  ? isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapType('dark')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mapType === 'dark'
                  ? isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dark
            </button>
          </div>
        )}

        {/* Live Traffic Toggle (Google Maps Exclusive) */}
        {mapEngine === 'google' && (
          <button
            type="button"
            onClick={() => setTrafficEnabled(!trafficEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-lg backdrop-blur-xl transition-all ${
              trafficEnabled
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                : isDark ? 'bg-[#080d1a]/90 border-slate-700/80 text-slate-400 hover:text-white' : 'bg-white/90 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Real-time live Google Traffic Layer for emergency response vehicles"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Traffic: {trafficEnabled ? 'ON' : 'OFF'}</span>
          </button>
        )}
      </div>

      {/* TOP-RIGHT: Live Emergency Legend */}
      <div className={`absolute top-3 right-3 z-[400] backdrop-blur-xl border p-3 rounded-2xl shadow-xl text-xs space-y-1.5 pointer-events-auto max-w-[200px] ${
        isDark ? 'bg-[#080d1a]/90 border-slate-700/80 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700'
      }`}>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>{mapEngine === 'google' ? 'Google Maps Live' : 'CartoDB Live'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white shrink-0 animate-ping"></span>
          <span className="truncate">Emergency Incident</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-white flex items-center justify-center text-[8px] font-bold text-white shrink-0">H</span>
          <span className="truncate">Trauma Hospital</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-white flex items-center justify-center text-[9px] shrink-0">🚑</span>
          <span className="truncate">Active Ambulance</span>
        </div>
        {activeDispatch && (
          <div className="flex items-center gap-2 text-rose-600 font-bold pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px]">
            <span className="w-3.5 h-1 bg-rose-600 rounded-full shrink-0"></span>
            <span>Emergency Corridor</span>
          </div>
        )}
      </div>

      {/* BOTTOM-RIGHT: Quick Zoom & Recenter Controls */}
      <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => handleZoom(1)}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-lg backdrop-blur-xl transition-all ${
            isDark ? 'bg-[#080d1a]/90 hover:bg-slate-800 border-slate-700 text-white' : 'bg-white/90 hover:bg-slate-100 border-slate-200 text-slate-700'
          }`}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-lg backdrop-blur-xl transition-all ${
            isDark ? 'bg-[#080d1a]/90 hover:bg-slate-800 border-slate-700 text-white' : 'bg-white/90 hover:bg-slate-100 border-slate-200 text-slate-700'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-lg backdrop-blur-xl transition-all ${
            isDark ? 'bg-[#080d1a]/90 hover:bg-rose-600 border-slate-700 text-white' : 'bg-white/90 hover:bg-rose-600 hover:text-white border-slate-200 text-rose-600'
          }`}
          title="Center on Emergency SOS Incident"
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>

      {/* BOTTOM-LEFT: Status Toast */}
      {loadError && (
        <div className="absolute bottom-3 left-3 z-[400] bg-amber-500/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-md pointer-events-auto">
          {loadError}
        </div>
      )}
    </div>
  );
};
