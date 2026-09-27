import { useEffect, useRef, useState } from 'react'
import AuthorityHeader from '../../components/authority/AuthorityHeader'
import { mockRiskMapData } from '../../data/mockData'
import { Layers, Search, MapPin, X, AlertTriangle, Loader2, Navigation } from 'lucide-react'

// Lazy-import Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null

const LAYER_COLORS: Record<string, string> = {
  'Road Damage': '#f97316',
  'Water Stress': '#3b82f6',
  'Flood Risk': '#06b6d4',
  'OSM Roads (Geofabrik)': '#eab308',
  'OSM Buildings (Geofabrik)': '#8b5cf6',
  'OSM Land Use (Geofabrik)': '#10b981',
  'Power Infrastructure': '#a855f7',
  'Citizen Complaints': '#f59e0b',
  'Construction Activity': '#ec4899',
}

interface SelectedLocation {
  ward: string
  riskScore: number
  roadDamage: number
  waterStress: number
  floodRisk: number
  powerVulnerability: number
  citizenComplaints: number
  populationImpact: number
  recommendedAction: string
  lat: number
  lng: number
}

interface SearchResultItem {
  display_name: string
  latitude: number
  longitude: number
  type: string
  osm_id: string
  osm_type: string
}

export default function RiskMapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const tileLayerRef = useRef<import('leaflet').TileLayer | null>(null)
  const osmGeoJsonLayersRef = useRef<{ roads?: any; buildings?: any; landuse?: any }>({})
  const searchMarkerRef = useRef<import('leaflet').Marker | null>(null)

  const [baseMapStyle, setBaseMapStyle] = useState<'osm-standard' | 'osm-dark'>('osm-standard')
  const [activeLayers, setActiveLayers] = useState<string[]>([
    'Road Damage',
    'Water Stress',
    'OSM Roads (Geofabrik)',
    'OSM Buildings (Geofabrik)'
  ])
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [showLayerPanel, setShowLayerPanel] = useState(true)

  // Nominatim Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const layers = Object.keys(LAYER_COLORS)

  const wardDetails: Record<string, Omit<SelectedLocation, 'ward' | 'lat' | 'lng'>> = {
    'Ward 5': {
      riskScore: 91, roadDamage: 58, waterStress: 88, floodRisk: 74,
      powerVulnerability: 45, citizenComplaints: 127, populationImpact: 89000,
      recommendedAction: 'Activate emergency water supply protocol. Desilting of drainage channels required before monsoon. Road repair at Market Street is urgent.',
    },
    'Ward 9': {
      riskScore: 88, roadDamage: 72, waterStress: 92, floodRisk: 61,
      powerVulnerability: 38, citizenComplaints: 143, populationImpact: 95000,
      recommendedAction: 'Deploy water tankers immediately. Initiate road repair on Station Road. Inspect drainage network in north sector.',
    },
    'Ward 14': {
      riskScore: 87, roadDamage: 84, waterStress: 52, floodRisk: 48,
      powerVulnerability: 29, citizenComplaints: 98, populationImpact: 83000,
      recommendedAction: 'Emergency road repair required near school zone within 72 hours. Estimated cost: ₹12-18 lakhs.',
    },
    'Ward 12': {
      riskScore: 77, roadDamage: 61, waterStress: 58, floodRisk: 39,
      powerVulnerability: 52, citizenComplaints: 67, populationImpact: 72000,
      recommendedAction: 'Investigate potential unauthorized construction at Plot 45-B. Schedule road maintenance on Temple Road.',
    },
    'Ward 7': {
      riskScore: 74, roadDamage: 49, waterStress: 61, floodRisk: 55,
      powerVulnerability: 67, citizenComplaints: 54, populationImpact: 63000,
      recommendedAction: 'Power asset inspection required for coastal-area poles. Street light repair on Main Road pending.',
    },
    'Ward 2': {
      riskScore: 67, roadDamage: 38, waterStress: 42, floodRisk: 31,
      powerVulnerability: 22, citizenComplaints: 41, populationImpact: 58000,
      recommendedAction: 'Monitor water stress levels. Schedule routine road maintenance.',
    },
    'Ward 11': {
      riskScore: 43, roadDamage: 22, waterStress: 18, floodRisk: 15,
      powerVulnerability: 11, citizenComplaints: 18, populationImpact: 38000,
      recommendedAction: 'Routine maintenance schedule. No immediate action required.',
    },
    'Ward 8': {
      riskScore: 29, roadDamage: 12, waterStress: 8, floodRisk: 9,
      powerVulnerability: 7, citizenComplaints: 9, populationImpact: 28000,
      recommendedAction: 'Lowest risk ward. Continue routine monitoring.',
    },
  }

  // Debounced Forward Geocoding Search (400ms delay to prevent abuse)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      setShowDropdown(false)
      return
    }

    setIsSearching(true)
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocoding/search?q=${encodeURIComponent(searchQuery.trim())}&limit=6`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data)
          setShowDropdown(true)
        } else {
          setSearchResults([])
        }
      } catch (err) {
        console.error('Nominatim search error:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(handler)
  }, [searchQuery])

  // Update base tile layer on style change
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current)
    }

    if (baseMapStyle === 'osm-standard') {
      // 1. Standard OpenStreetMap Tiles (No API key required)
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current)
    } else {
      // 2. OpenStreetMap Dark Tiles (CartoDB with OSM attribution)
      tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(mapInstanceRef.current)
    }
  }, [baseMapStyle])

  // Manage Geofabrik OSM Layers visibility
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return
    const map = mapInstanceRef.current

    // Toggle Roads
    if (osmGeoJsonLayersRef.current.roads) {
      if (activeLayers.includes('OSM Roads (Geofabrik)')) {
        if (!map.hasLayer(osmGeoJsonLayersRef.current.roads)) {
          map.addLayer(osmGeoJsonLayersRef.current.roads)
        }
      } else {
        if (map.hasLayer(osmGeoJsonLayersRef.current.roads)) {
          map.removeLayer(osmGeoJsonLayersRef.current.roads)
        }
      }
    }

    // Toggle Buildings
    if (osmGeoJsonLayersRef.current.buildings) {
      if (activeLayers.includes('OSM Buildings (Geofabrik)')) {
        if (!map.hasLayer(osmGeoJsonLayersRef.current.buildings)) {
          map.addLayer(osmGeoJsonLayersRef.current.buildings)
        }
      } else {
        if (map.hasLayer(osmGeoJsonLayersRef.current.buildings)) {
          map.removeLayer(osmGeoJsonLayersRef.current.buildings)
        }
      }
    }

    // Toggle Land Use
    if (osmGeoJsonLayersRef.current.landuse) {
      if (activeLayers.includes('OSM Land Use (Geofabrik)')) {
        if (!map.hasLayer(osmGeoJsonLayersRef.current.landuse)) {
          map.addLayer(osmGeoJsonLayersRef.current.landuse)
        }
      } else {
        if (map.hasLayer(osmGeoJsonLayersRef.current.landuse)) {
          map.removeLayer(osmGeoJsonLayersRef.current.landuse)
        }
      }
    }
  }, [activeLayers])

  // Fly to searched location and add dedicated pin
  const handleSelectSearchResult = (result: SearchResultItem) => {
    if (!mapInstanceRef.current || !L) return
    const map = mapInstanceRef.current

    setShowDropdown(false)

    // Remove existing search marker
    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current)
      searchMarkerRef.current = null
    }

    const lat = result.latitude
    const lng = result.longitude

    // Create distinctive location marker with pulse animation
    const searchIcon = L.divIcon({
      className: '',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 36px;
            height: 36px;
            background: rgba(37, 99, 235, 0.4);
            border-radius: 50%;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            width: 30px;
            height: 30px;
            background: #2563eb;
            border: 2px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 15px;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.6);
          ">📍</div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20],
    })

    const marker = L.marker([lat, lng], { icon: searchIcon }).addTo(map)
    searchMarkerRef.current = marker

    marker.bindPopup(`
      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 270px; line-height: 1.4;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
          <span style="font-size: 14px;">🎯</span>
          <strong style="color: #1e293b; font-size: 13px;">${result.type ? result.type.toUpperCase() : 'SEARCH RESULT'}</strong>
        </div>
        <div style="color: #334155; margin-bottom: 8px; font-size: 11.5px; font-weight: 500;">
          ${result.display_name}
        </div>
        <div style="background: #f1f5f9; border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; font-size: 11px; border: 1px solid #e2e8f0;">
          <div><strong>Latitude:</strong> ${lat.toFixed(5)}</div>
          <div><strong>Longitude:</strong> ${lng.toFixed(5)}</div>
          ${result.osm_id ? `<div><strong>OSM ID:</strong> ${result.osm_id} (${result.osm_type || 'node'})</div>` : ''}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; color: #64748b; font-size: 10px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
          <span>Source: OpenStreetMap Nominatim</span>
          <span style="color: #2563eb; font-weight: 600;">Vanguard City</span>
        </div>
      </div>
    `).openPopup()

    map.flyTo([lat, lng], 16, {
      animate: true,
      duration: 1.2
    })
  }

  useEffect(() => {
    async function initMap() {
      if (mapInstanceRef.current || !mapRef.current) return

      // Dynamically import leaflet
      const leaflet = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      L = leaflet.default || leaflet

      // Fix Leaflet default icon issue
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current, {
        center: [mockRiskMapData.center.lat, mockRiskMapData.center.lng],
        zoom: mockRiskMapData.zoom,
        zoomControl: false,
      })

      // Standard OpenStreetMap base layer (No API key required)
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Add hotspot markers
      mockRiskMapData.hotspots.forEach(spot => {
        const color = spot.risk >= 76 ? '#ef4444' : spot.risk >= 51 ? '#f97316' : spot.risk >= 26 ? '#f59e0b' : '#22c55e'
        const size = Math.max(20, Math.min(45, spot.risk / 2.5))

        const icon = L!.divIcon({
          className: '',
          html: `<div style="
            width:${size}px;height:${size}px;
            background:${color}22;
            border:2px solid ${color};
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            color:${color};font-size:${size < 30 ? '10' : '12'}px;font-weight:bold;
            box-shadow:0 0 12px ${color}44;
          ">${spot.risk}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })

        const details = wardDetails[spot.ward]

        L!.marker([spot.lat, spot.lng], { icon }).addTo(map)
          .on('click', () => {
            if (details) {
              setSelectedLocation({
                ward: spot.ward,
                lat: spot.lat,
                lng: spot.lng,
                ...details,
              })
            }
          })
      })

      // Map Click Event — Reverse Geocoding via Nominatim OpenStreetMap
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng

        // Open loading popup immediately at clicked position
        const clickPopup = L!.popup({ offset: [0, -10] })
          .setLatLng([lat, lng])
          .setContent(`
            <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; padding: 4px; min-width: 190px;">
              <div style="font-weight: 600; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; color: #2563eb;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#2563eb; animation:ping 1s infinite;"></span>
                Reverse Geocoding...
              </div>
              <div style="color: #64748b; font-size: 11px;">Querying Nominatim for address details...</div>
            </div>
          `)
          .openOn(map)

        try {
          const res = await fetch(`/api/geocoding/reverse?latitude=${lat}&longitude=${lng}`)
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`)
          }
          const data = await res.json()
          const addr = data.address || {}
          const title = addr.road || addr.city || addr.district || 'Identified Location'

          clickPopup.setContent(`
            <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #0f172a; max-width: 270px; line-height: 1.4;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
                <span style="font-size: 14px;">📍</span>
                <strong style="color: #1e293b; font-size: 13px;">${title}</strong>
              </div>
              <div style="color: #334155; margin-bottom: 6px; font-size: 11.5px;">
                ${data.display_name}
              </div>
              <div style="background: #f8fafc; border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; border: 1px solid #e2e8f0; font-size: 11px;">
                ${addr.road ? `<div><strong>Road:</strong> ${addr.road}</div>` : ''}
                ${addr.city ? `<div><strong>City:</strong> ${addr.city}</div>` : ''}
                ${addr.district ? `<div><strong>District:</strong> ${addr.district}</div>` : ''}
                ${addr.state ? `<div><strong>State:</strong> ${addr.state}</div>` : ''}
                ${addr.country ? `<div><strong>Country:</strong> ${addr.country}</div>` : ''}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; color: #64748b; font-size: 10px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
                <span>(${Number(data.latitude).toFixed(5)}, ${Number(data.longitude).toFixed(5)})</span>
                <span style="color: #2563eb; font-weight: 500;">Nominatim OSM</span>
              </div>
            </div>
          `)
        } catch (err) {
          clickPopup.setContent(`
            <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #b91c1c; padding: 4px;">
              <strong>Reverse Geocoding Unavailable</strong>
              <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Unable to resolve address for coordinates. Please retry.</div>
            </div>
          `)
        }
      })

      // Fetch and attach Geofabrik OpenStreetMap layers from FastAPI
      fetch('/api/gis/osm/roads')
        .then(res => res.json())
        .then(data => {
          if (data && data.features && L) {
            const roadsLayer = L.geoJSON(data, {
              style: (feature) => {
                const hw = feature?.properties?.highway
                const color = hw === 'primary' ? '#eab308' : hw === 'trunk' ? '#f59e0b' : hw === 'secondary' ? '#38bdf8' : '#cbd5e1'
                const weight = hw === 'primary' || hw === 'trunk' ? 4 : 2.5
                return { color, weight, opacity: 0.85 }
              },
              onEachFeature: (feature, layer) => {
                const p = feature.properties
                layer.bindPopup(`
                  <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
                    <strong>🛣️ ${p.name || 'Unnamed Road'}</strong><br/>
                    <span style="color: #64748b;">Type: ${p.highway} | Lanes: ${p.lanes || 2}</span><br/>
                    <span>Max Speed: ${p.maxspeed ? p.maxspeed + ' km/h' : 'Standard'}</span><br/>
                    <small style="color: #94a3b8;">Source: OpenStreetMap / Geofabrik</small>
                  </div>
                `)
              }
            })
            osmGeoJsonLayersRef.current.roads = roadsLayer
            roadsLayer.addTo(map)
          }
        })
        .catch(err => console.log('OSM Roads layer fetch notice:', err))

      fetch('/api/gis/osm/buildings')
        .then(res => res.json())
        .then(data => {
          if (data && data.features && L) {
            const buildingsLayer = L.geoJSON(data, {
              style: (feature) => {
                const btype = feature?.properties?.building
                const color = btype === 'civic' ? '#6366f1' : btype === 'hospital' ? '#ef4444' : btype === 'commercial' ? '#8b5cf6' : '#a855f7'
                return { color, fillColor: color, fillOpacity: 0.4, weight: 1.5 }
              },
              onEachFeature: (feature, layer) => {
                const p = feature.properties
                layer.bindPopup(`
                  <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
                    <strong>🏢 ${p.name || 'Building Footprint'}</strong><br/>
                    <span style="color: #64748b;">Type: ${p.building || 'General'} | Levels: ${p.building_levels || 1}</span><br/>
                    <span>Height: ~${p.height || 12}m</span><br/>
                    <small style="color: #94a3b8;">Source: OpenStreetMap / Geofabrik</small>
                  </div>
                `)
              }
            })
            osmGeoJsonLayersRef.current.buildings = buildingsLayer
            buildingsLayer.addTo(map)
          }
        })
        .catch(err => console.log('OSM Buildings layer fetch notice:', err))

      fetch('/api/gis/osm/landuse')
        .then(res => res.json())
        .then(data => {
          if (data && data.features && L) {
            const landuseLayer = L.geoJSON(data, {
              style: (feature) => {
                const lutype = feature?.properties?.landuse
                const color = lutype === 'park' ? '#10b981' : lutype === 'water' ? '#06b6d4' : lutype === 'commercial' ? '#f59e0b' : '#64748b'
                return { color, fillColor: color, fillOpacity: 0.2, weight: 1, dashArray: '4' }
              },
              onEachFeature: (feature, layer) => {
                const p = feature.properties
                layer.bindPopup(`
                  <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
                    <strong>🌳 ${p.name || 'Zoned Area'}</strong><br/>
                    <span style="color: #64748b;">Classification: ${p.landuse}</span><br/>
                    <small style="color: #94a3b8;">Source: OpenStreetMap / Geofabrik</small>
                  </div>
                `)
              }
            })
            osmGeoJsonLayersRef.current.landuse = landuseLayer
          }
        })
        .catch(err => console.log('OSM Landuse layer fetch notice:', err))

      mapInstanceRef.current = map
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev =>
      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
    )
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0a0f1e' }}>
      <AuthorityHeader
        title="Risk Map"
        subtitle="Geospatial risk visualization powered by OpenStreetMap, Geofabrik data & Nominatim geocoding"
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Map Canvas */}
        <div ref={mapRef} className="flex-1 h-full" />

        {/* Top-Center Nominatim Geocoding Location Search Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] w-full max-w-lg px-4">
          <div
            className="rounded-xl overflow-hidden shadow-2xl transition-all"
            style={{
              background: 'rgba(10, 15, 30, 0.94)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div className="flex items-center gap-2 px-3.5 py-2.5">
              <Search size={16} className="text-blue-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                placeholder="Search location (e.g., Patia, Bhubaneswar, Station Road)..."
                className="bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none flex-1 font-normal"
              />
              {isSearching && (
                <Loader2 size={16} className="text-blue-400 animate-spin flex-shrink-0" />
              )}
              {searchQuery && !isSearching && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setShowDropdown(false)
                  }}
                  className="text-slate-400 hover:text-white flex-shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="border-t border-blue-900/40 max-h-72 overflow-y-auto dark-scroll divide-y divide-blue-950/50">
                {searchResults.map((item, idx) => (
                  <button
                    key={`${item.osm_id || idx}-${item.latitude}`}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-600/20 transition-colors flex items-start gap-2.5 group"
                  >
                    <MapPin size={14} className="text-blue-400 mt-1 flex-shrink-0 group-hover:text-blue-300" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-slate-100 truncate group-hover:text-white">
                          {item.display_name.split(',')[0]}
                        </span>
                        {item.type && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {item.type}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.display_name}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                      </div>
                    </div>
                    <Navigation size={12} className="text-slate-500 group-hover:text-blue-400 mt-1.5 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {showDropdown && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
              <div className="border-t border-blue-900/40 p-4 text-center text-xs text-slate-400">
                No locations found matching &ldquo;{searchQuery}&rdquo;. Try another landmark or street.
              </div>
            )}
          </div>
        </div>

        {/* Base Map Style Switcher (OSM Standard / OSM Dark) */}
        <div
          className="absolute top-4 right-4 z-[1000] rounded-xl overflow-hidden p-1 flex items-center gap-1 shadow-lg"
          style={{ background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(30,58,138,0.4)' }}
        >
          <button
            onClick={() => setBaseMapStyle('osm-standard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              baseMapStyle === 'osm-standard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🗺️ OSM Standard
          </button>
          <button
            onClick={() => setBaseMapStyle('osm-dark')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              baseMapStyle === 'osm-dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🌙 OSM Dark
          </button>
        </div>

        {/* Layer Control Panel */}
        {showLayerPanel && (
          <div
            className="absolute top-4 left-4 w-64 rounded-xl z-[1000] overflow-hidden"
            style={{ background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(30,58,138,0.4)' }}
          >
            <div className="px-4 py-3 border-b border-blue-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-blue-400" />
                <span className="text-sm font-semibold text-white">Map Layers</span>
              </div>
              <button onClick={() => setShowLayerPanel(false)} className="text-slate-500 hover:text-white">
                <X size={12} />
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-[50vh] overflow-y-auto dark-scroll">
              <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1">
                OpenStreetMap / Geofabrik
              </div>
              {layers.filter(l => l.includes('OSM')).map(layer => (
                <label key={layer} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      activeLayers.includes(layer) ? 'opacity-100' : 'opacity-40'
                    }`}
                    style={{ borderColor: LAYER_COLORS[layer], background: activeLayers.includes(layer) ? LAYER_COLORS[layer] + '33' : 'transparent' }}
                    onClick={() => toggleLayer(layer)}
                  >
                    {activeLayers.includes(layer) && (
                      <div className="w-2 h-2 rounded-sm" style={{ background: LAYER_COLORS[layer] }} />
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LAYER_COLORS[layer] }} />
                  <span className="text-xs text-slate-200 group-hover:text-white font-medium">{layer}</span>
                </label>
              ))}

              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-3 mb-1">
                Municipal Risk Intelligence
              </div>
              {layers.filter(l => !l.includes('OSM')).map(layer => (
                <label key={layer} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      activeLayers.includes(layer) ? 'opacity-100' : 'opacity-40'
                    }`}
                    style={{ borderColor: LAYER_COLORS[layer], background: activeLayers.includes(layer) ? LAYER_COLORS[layer] + '33' : 'transparent' }}
                    onClick={() => toggleLayer(layer)}
                  >
                    {activeLayers.includes(layer) && (
                      <div className="w-2 h-2 rounded-sm" style={{ background: LAYER_COLORS[layer] }} />
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LAYER_COLORS[layer] }} />
                  <span className="text-xs text-slate-300 group-hover:text-white">{layer}</span>
                </label>
              ))}
            </div>

            <div className="px-3 py-2 bg-blue-950/30 border-t border-blue-900/30 text-[11px] text-slate-400">
              💡 <em>Click anywhere on map to reverse geocode address.</em>
            </div>
          </div>
        )}

        {!showLayerPanel && (
          <button
            className="absolute top-4 left-4 z-[1000] p-2 rounded-lg text-white"
            style={{ background: 'rgba(10,15,30,0.92)', border: '1px solid rgba(30,58,138,0.4)' }}
            onClick={() => setShowLayerPanel(true)}
            title="Open Layer Panel"
          >
            <Layers size={16} />
          </button>
        )}

        {/* Legend */}
        <div
          className="absolute bottom-6 left-4 rounded-xl z-[1000] p-3 max-w-xs"
          style={{ background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(30,58,138,0.4)' }}
        >
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">
            Base Map & Geocoding Provenance
          </div>
          <div className="text-xs text-slate-300 space-y-1 mb-2">
            <div>Base: <strong>OpenStreetMap</strong> (No API Key Required)</div>
            <div>Geocoding: <strong>Nominatim OSM</strong></div>
            <div>Data: <strong>Geofabrik .osm.pbf</strong> Extract</div>
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 pt-2 border-t border-blue-900/30">
            Risk Score Severity
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {[
              { color: '#ef4444', label: 'Critical (76–100)' },
              { color: '#f97316', label: 'High (51–75)' },
              { color: '#f59e0b', label: 'Moderate (26–50)' },
              { color: '#22c55e', label: 'Low (0–25)' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-[11px] text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-blue-900/30">
            <div className="text-[10px] text-slate-500">
              © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenStreetMap</a> contributors
            </div>
          </div>
        </div>

        {/* Selected Location Panel */}
        {selectedLocation && (
          <div
            className="absolute top-16 right-4 w-72 rounded-xl z-[1000] overflow-hidden"
            style={{ background: 'rgba(10,15,30,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(30,58,138,0.5)' }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(37,99,235,0.15)', borderBottom: '1px solid rgba(30,58,138,0.3)' }}>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-400" />
                <span className="text-sm font-bold text-white">{selectedLocation.ward}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-lg font-bold"
                  style={{ color: selectedLocation.riskScore >= 76 ? '#ef4444' : selectedLocation.riskScore >= 51 ? '#f97316' : '#f59e0b' }}
                >
                  {selectedLocation.riskScore}
                </span>
                <button onClick={() => setSelectedLocation(null)} className="text-slate-500 hover:text-white ml-1">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">AI Risk Factors</div>
              <div className="space-y-2">
                {[
                  { label: 'Road Damage', value: selectedLocation.roadDamage, color: '#f97316' },
                  { label: 'Water Stress', value: selectedLocation.waterStress, color: '#3b82f6' },
                  { label: 'Flood Risk', value: selectedLocation.floodRisk, color: '#06b6d4' },
                  { label: 'Power Vulnerability', value: selectedLocation.powerVulnerability, color: '#a855f7' },
                  { label: 'Citizen Complaints', value: selectedLocation.citizenComplaints / 2, color: '#f59e0b' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{item.label}</span>
                      <span style={{ color: item.color }}>{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, item.value)}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-blue-900/30">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Population Impact</div>
                <div className="text-sm font-semibold text-white">
                  {selectedLocation.populationImpact.toLocaleString('en-IN')} residents
                </div>
              </div>

              <div className="pt-2 border-t border-blue-900/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] text-yellow-400 uppercase tracking-wider mb-1">AI Recommendation</div>
                    <div className="text-xs text-slate-300 leading-relaxed">{selectedLocation.recommendedAction}</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-900/30">
                <div className="text-[10px] text-slate-600">⚠ AI-generated. Not an official assessment.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
