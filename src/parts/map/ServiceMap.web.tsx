// Browser version of the map (npm run web). react-native-maps doesn't work
// on web, so Expo picks this file instead of ServiceMap.tsx when it builds for
// the browser. It uses Leaflet with free map tiles (see mapTiles.ts), so no API
// key is needed.
import './leaflet.css';
import L from 'leaflet';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TILE_LAYERS } from './mapTiles';
import {
  MAP_COLORS,
  MILES_TO_METERS,
  pointNorthOf,
  SELF_MOVE_GRACE_MS,
  type ServiceMapProps,
} from './ServiceMapTypes';
import { CLUSTER_OFF_AT_ZOOM, clusterPoints } from '../../technicians/mapClusters';

// Pin looks for the browser. Same shapes and colors as the phone pins.
const PIN_CSS = `
.ce-map.leaflet-container { background: ${MAP_COLORS.land}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; outline: none; }
.ce-map .leaflet-control-attribution { background: rgba(7, 11, 19, 0.7); color: ${MAP_COLORS.muted}; font-size: 10px; }
.ce-map .leaflet-control-attribution a { color: #AFC4E2; }
.ce-map .leaflet-tile-pane { transition: opacity 0.3s; }
.ce-pin { background: transparent; border: 0; }
.ce-home { width: 22px; height: 22px; border-radius: 50%; background: ${MAP_COLORS.volt}; border: 4px solid ${MAP_COLORS.night}; box-sizing: border-box; position: relative; box-shadow: 0 0 0 10px rgba(245, 185, 0, 0.18); }
.ce-home::after { content: ''; position: absolute; inset: -16px; border-radius: 50%; border: 2px solid rgba(245, 185, 0, 0.6); animation: ce-pulse 2.6s ease-out infinite; }
.ce-drop { width: 34px; height: 46px; position: relative; cursor: grab; filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.5)); }
.ce-drop.is-dragging { cursor: grabbing; transform: translateY(-8px); transition: transform 0.12s; }
.ce-drop-head { position: absolute; top: 0; left: 1px; width: 32px; height: 32px; box-sizing: border-box; border-radius: 50%; background: ${MAP_COLORS.volt}; border: 4px solid ${MAP_COLORS.night}; }
.ce-drop-head::after { content: ''; position: absolute; inset: 6px; border-radius: 50%; background: ${MAP_COLORS.night}; }
.ce-drop-tail { position: absolute; top: 30px; left: 16px; width: 2px; height: 14px; background: ${MAP_COLORS.night}; }
.ce-drop-tip { position: absolute; bottom: 0; left: 12px; width: 10px; height: 10px; box-sizing: border-box; border-radius: 50%; background: ${MAP_COLORS.volt}; border: 2px solid ${MAP_COLORS.night}; }
.ce-drop:focus-visible { outline: 3px solid #AFC4E2; outline-offset: 4px; }
.ce-cluster { width: 44px; height: 44px; box-sizing: border-box; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; background: ${MAP_COLORS.panel}; color: ${MAP_COLORS.text}; border: 3px solid ${MAP_COLORS.available}; box-shadow: 0 0 0 5px rgba(126, 226, 168, 0.22), 0 3px 6px rgba(0, 0, 0, 0.45); cursor: pointer; }
.ce-cluster.is-charger { border-color: ${MAP_COLORS.charger}; box-shadow: 0 0 0 5px rgba(155, 123, 255, 0.25), 0 3px 6px rgba(0, 0, 0, 0.45); font-size: 14px; }
.ce-cluster:focus-visible { outline: 3px solid #AFC4E2; outline-offset: 2px; }
.ce-you { width: 18px; height: 18px; border-radius: 50%; background: ${MAP_COLORS.you}; border: 3px solid #fff; box-sizing: border-box; box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5); }
@keyframes ce-pulse { from { transform: scale(0.45); opacity: 1; } to { transform: scale(1.35); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .ce-home::after { animation: none; opacity: 0.4; } .ce-drop.is-dragging { transition: none; } }
.ce-tech { display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.45)); }
.ce-tech-body { min-width: 36px; height: 36px; padding: 0 6px; box-sizing: border-box; border-radius: 12px; border: 2px solid ${MAP_COLORS.available}; background: ${MAP_COLORS.panel}; color: ${MAP_COLORS.text}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; }
.ce-tech-tail { width: 2px; height: 7px; background: ${MAP_COLORS.available}; }
.ce-tech.is-busy .ce-tech-body { border-color: ${MAP_COLORS.busy}; color: ${MAP_COLORS.muted}; }
.ce-tech.is-busy .ce-tech-tail { background: ${MAP_COLORS.busy}; }
.ce-tech.is-selected .ce-tech-body { background: ${MAP_COLORS.volt}; border-color: ${MAP_COLORS.volt}; color: ${MAP_COLORS.night}; height: 42px; min-width: 42px; font-size: 15px; }
.ce-tech.is-selected .ce-tech-tail { background: ${MAP_COLORS.volt}; width: 3px; }
.ce-charger { width: 28px; height: 28px; box-sizing: border-box; border-radius: 7px; border: 2px solid ${MAP_COLORS.night}; background: ${MAP_COLORS.charger}; color: #fff; font-weight: 900; font-size: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4); }
.ce-charger.is-selected { border-color: ${MAP_COLORS.volt}; transform: scale(1.2); }
.ce-dot { width: 14px; height: 14px; box-sizing: border-box; border-radius: 50%; background: ${MAP_COLORS.available}; border: 3px solid ${MAP_COLORS.night}; }
.ce-mini { display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.55)); }
.ce-mini-body { width: 26px; height: 26px; box-sizing: border-box; border-radius: 50%; background: ${MAP_COLORS.panel}; border: 2px solid ${MAP_COLORS.available}; color: ${MAP_COLORS.text}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 10px; letter-spacing: 0.2px; }
.ce-mini-tail { width: 0; height: 0; margin-top: -1px; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid ${MAP_COLORS.available}; }
.ce-mini.is-busy .ce-mini-body { border-color: ${MAP_COLORS.busy}; color: ${MAP_COLORS.muted}; }
.ce-mini.is-busy .ce-mini-tail { border-top-color: ${MAP_COLORS.busy}; }
.ce-mini-home { width: 16px; height: 16px; box-sizing: border-box; border-radius: 50%; background: ${MAP_COLORS.volt}; border: 3px solid ${MAP_COLORS.night}; box-shadow: 0 0 0 7px rgba(245, 185, 0, 0.2), 0 2px 5px rgba(0, 0, 0, 0.5); position: relative; }
.ce-mini-home::after { content: ''; position: absolute; inset: -12px; border-radius: 50%; border: 2px solid rgba(245, 185, 0, 0.55); animation: ce-pulse 2.6s ease-out infinite; }
@media (prefers-reduced-motion: reduce) { .ce-mini-home::after { animation: none; opacity: 0.35; } }
.ce-ring-label { display: inline-block; white-space: nowrap; transform: translate(-50%, -50%); background: rgba(7, 11, 19, 0.85); color: ${MAP_COLORS.volt}; border-radius: 6px; padding: 2px 5px; font-size: 10px; font-weight: 700; }
.ce-tech:focus-visible .ce-tech-body, .ce-charger:focus-visible { outline: 3px solid #AFC4E2; outline-offset: 2px; }
`;

function addPinStylesOnce() {
  if (document.getElementById('ce-map-pins')) return;
  const tag = document.createElement('style');
  tag.id = 'ce-map-pins';
  tag.textContent = PIN_CSS;
  document.head.appendChild(tag);
}

// a point only counts if both numbers are real, one NaN makes Leaflet throw
function isUsable(point: { latitude: number; longitude: number }) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude);
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
}

// If this many tiles fail and none have loaded, the map has no streets.
const TILE_ERRORS_BEFORE_FAILED = 4;

export function ServiceMap({
  ref,
  center,
  markers,
  selectedId,
  onSelectMarker,
  onPressMap,
  onServicePinMove,
  onMapMoved,
  routePath,
  routeTo,
  userLocation,
  showServiceLocation = true,
  rings = [],
  interactive = true,
  bottomInset = 0,
  topInset = 0,
  leftInset = 0,
  rightInset = 0,
  theme = 'dark',
  onTileStatus,
  style,
}: ServiceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // goes up by one whenever the map box changes size, so we can zoom again
  const [sizeTick, setSizeTick] = useState(0);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  // false until the first zoom-to-fit, which jumps instead of flying
  const hasFitRef = useRef(false);
  // keep the newest callbacks without rebuilding the map every render
  const onSelectRef = useRef(onSelectMarker);
  const onPressRef = useRef(onPressMap);
  const onTileStatusRef = useRef(onTileStatus);
  const onPinMoveRef = useRef(onServicePinMove);
  const onMovedRef = useRef(onMapMoved);
  // the map's own zoom level, so pins can be grouped for how far out we are
  const [zoom, setZoom] = useState(12);
  // the pin is only draggable when the screen listens for it
  const hasPinMove = !!onServicePinMove;
  // moves we start ourselves (fit, fly, zoom buttons) shouldn't count as the customer moving the map
  const ignoreMovesUntil = useRef(0);
  function markSelfMove() {
    ignoreMovesUntil.current = Date.now() + SELF_MOVE_GRACE_MS;
  }
  useEffect(() => {
    onPinMoveRef.current = onServicePinMove;
    onMovedRef.current = onMapMoved;
    onSelectRef.current = onSelectMarker;
    onPressRef.current = onPressMap;
    onTileStatusRef.current = onTileStatus;
  });

  // Create the Leaflet map once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    addPinStylesOnce();

    const map = L.map(container, {
      center: isUsable(center) ? [center.latitude, center.longitude] : [38.5816, -121.4944],
      zoom: 12,
      zoomControl: false,
      zoomSnap: 0.25,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: false,
      keyboard: interactive,
    });
    container.classList.add('ce-map');
    layerRef.current = L.layerGroup().addTo(map);
    map.on('click', () => onPressRef.current?.());
    map.on('zoomend', () => setZoom(map.getZoom()));
    map.on('moveend', () => {
      if (Date.now() < ignoreMovesUntil.current) return;
      const middle = map.getCenter();
      if (Number.isFinite(middle.lat) && Number.isFinite(middle.lng)) {
        onMovedRef.current?.({ latitude: middle.lat, longitude: middle.lng });
      }
    });
    markSelfMove();
    mapRef.current = map;

    // Leaflet needs to know when its box changes size (sheet, window resize)
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      setSizeTick((tick) => tick + 1);
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      tilesRef.current = null;
    };
    // the map is built once, later prop changes are handled by the effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Street tiles. Runs again when the customer switches between dark and streets.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const info = TILE_LAYERS[theme];
    const tiles = L.tileLayer(info.url, {
      attribution: info.attribution,
      subdomains: info.subdomains,
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);
    tilesRef.current = tiles;

    let loaded = 0;
    let failed = 0;
    let reported: 'ok' | 'failed' | undefined;
    const report = (status: 'ok' | 'failed') => {
      if (reported === status) return;
      reported = status;
      onTileStatusRef.current?.(status);
    };
    const onTileLoad = () => {
      loaded += 1;
      report('ok');
    };
    const onTileError = () => {
      failed += 1;
      if (loaded === 0 && failed >= TILE_ERRORS_BEFORE_FAILED) report('failed');
    };
    tiles.on('tileload', onTileLoad);
    tiles.on('tileerror', onTileError);

    return () => {
      // Only remove our own two listeners. Calling tiles.off() with no arguments
      // would also delete Leaflet's own cleanup hook and break later zooming.
      tiles.off('tileload', onTileLoad);
      tiles.off('tileerror', onTileError);
      tiles.remove();
    };
  }, [theme]);

  // Redraw rings, route and pins whenever they change.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!isUsable(center)) return;

    const home: L.LatLngExpression = [center.latitude, center.longitude];

    rings.forEach((miles, index) => {
      L.circle(home, {
        radius: miles * MILES_TO_METERS,
        color: MAP_COLORS.volt,
        opacity: 0.35,
        weight: 1,
        fillColor: MAP_COLORS.volt,
        fillOpacity: index === 0 ? 0.06 : 0,
        interactive: false,
      }).addTo(layer);

      if (interactive) {
        const labelPoint = pointNorthOf(center, miles);
        L.marker([labelPoint.latitude, labelPoint.longitude], {
          icon: L.divIcon({ className: 'ce-pin', html: `<span class="ce-ring-label">${miles} mi</span>`, iconSize: [0, 0] }),
          interactive: false,
          keyboard: false,
        }).addTo(layer);
      }
    });

    if (routePath && routePath.length > 1) {
      // the real road route: a solid line with a dark outline so it reads on any map
      const latLngs = routePath.map((point): L.LatLngTuple => [point.latitude, point.longitude]);
      L.polyline(latLngs, { color: MAP_COLORS.night, weight: 8, opacity: 0.55, interactive: false }).addTo(layer);
      L.polyline(latLngs, { color: MAP_COLORS.volt, weight: 4, interactive: false }).addTo(layer);
    } else if (routeTo) {
      L.polyline([home, [routeTo.latitude, routeTo.longitude]], {
        color: MAP_COLORS.volt,
        weight: 3,
        dashArray: '10 8',
        interactive: false,
      }).addTo(layer);
    }

    if (showServiceLocation) {
      if (interactive && onPinMoveRef.current) {
        // A teardrop pin whose tip is the exact spot. Drag it to correct the address.
        const pin = L.marker(home, {
          icon: L.divIcon({
            className: 'ce-pin',
            html: '<div class="ce-drop"><div class="ce-drop-head"></div><div class="ce-drop-tail"></div><div class="ce-drop-tip"></div></div>',
            iconSize: [34, 46],
            iconAnchor: [17, 46],
          }),
          draggable: true,
          autoPan: true,
          keyboard: true,
          title: 'Service location. Drag to move it.',
          alt: 'Service location pin, drag to move it',
          // on top of the electrician pins, so the customer can always grab it
          // (zoom in or press "Fine-tune pin" to pull apart anything hiding behind it)
          zIndexOffset: 900,
        }).addTo(layer);
        pin.on('dragstart', () => pin.getElement()?.querySelector('.ce-drop')?.classList.add('is-dragging'));
        pin.on('dragend', () => {
          pin.getElement()?.querySelector('.ce-drop')?.classList.remove('is-dragging');
          const dropped = pin.getLatLng();
          markSelfMove();
          if (Number.isFinite(dropped.lat) && Number.isFinite(dropped.lng)) {
            onPinMoveRef.current?.({ latitude: dropped.lat, longitude: dropped.lng });
          }
        });
      } else {
        L.marker(home, {
          // the dashboard preview gets a smaller dot so it doesn't cover the streets
          icon: interactive
            ? L.divIcon({ className: 'ce-pin', html: '<div class="ce-home"></div>', iconSize: [22, 22], iconAnchor: [11, 11] })
            : L.divIcon({ className: 'ce-pin', html: '<div class="ce-mini-home"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
          interactive: false,
          keyboard: false,
          title: 'Service location',
        }).addTo(layer);
      }
    }

    if (userLocation && interactive) {
      const you: L.LatLngExpression = [userLocation.latitude, userLocation.longitude];
      if (userLocation.accuracyMeters && userLocation.accuracyMeters > 15) {
        L.circle(you, {
          radius: userLocation.accuracyMeters,
          color: MAP_COLORS.you,
          weight: 1,
          opacity: 0.4,
          fillColor: MAP_COLORS.you,
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(layer);
      }
      L.marker(you, {
        icon: L.divIcon({ className: 'ce-pin', html: '<div class="ce-you"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        interactive: false,
        keyboard: false,
        title: 'Your location',
      }).addTo(layer);
    }

    const usableMarkers = markers.filter(isUsable);
    if (!interactive) {
      // the dashboard preview is small: compact initials badges, no clustering or taps
      usableMarkers.forEach((marker) => {
        const busy = marker.tone === 'busy';
        L.marker([marker.latitude, marker.longitude], {
          icon: L.divIcon({
            className: 'ce-pin',
            html: `<div class="ce-mini${busy ? ' is-busy' : ''}"><div class="ce-mini-body">${escapeHtml(marker.label)}</div><div class="ce-mini-tail"></div></div>`,
            iconSize: [26, 30],
            iconAnchor: [13, 30],
          }),
          interactive: false,
          keyboard: false,
          // available electricians sit on top of busy ones
          zIndexOffset: busy ? 0 : 100,
        }).addTo(layer);
      });
      return;
    }

    // Pins that overlap at this zoom level become a numbered bubble. The picked
    // electrician always stays a normal pin so the card and the map agree.
    const pinned = new Set(selectedId ? [selectedId] : []);
    const drawGroup = (kind: 'technician' | 'charger') => {
      const group = usableMarkers.filter((marker) => marker.kind === kind);
      clusterPoints(group, zoom, 46, pinned).forEach((cluster) => {
        if (cluster.members.length > 1) {
          const names = kind === 'technician' ? 'electricians' : 'chargers';
          L.marker([cluster.latitude, cluster.longitude], {
            icon: L.divIcon({
              className: 'ce-pin',
              html: `<div class="ce-cluster${kind === 'charger' ? ' is-charger' : ''}">${cluster.members.length}</div>`,
              iconSize: [44, 44],
              iconAnchor: [22, 22],
            }),
            title: `${cluster.members.length} ${names} close together. Zoom in.`,
            alt: `${cluster.members.length} ${names} close together. Zoom in.`,
            keyboard: true,
            zIndexOffset: 700,
          })
            .on('click', (event) => {
              L.DomEvent.stopPropagation(event);
              const map = mapRef.current;
              if (!map) return;
              markSelfMove();
              map.flyToBounds(
                L.latLngBounds(cluster.members.map((member): L.LatLngTuple => [member.latitude, member.longitude])),
                { padding: [70, 70], maxZoom: CLUSTER_OFF_AT_ZOOM + 1, duration: 0.5 },
              );
            })
            .addTo(layer);
          return;
        }

        const marker = cluster.members[0];
        const selected = marker.id === selectedId;
        const busy = marker.tone === 'busy';
        const html = marker.kind === 'charger'
          ? `<div class="ce-charger${selected ? ' is-selected' : ''}">EV</div>`
          : `<div class="ce-tech${selected ? ' is-selected' : ''}${busy ? ' is-busy' : ''}"><div class="ce-tech-body">${escapeHtml(marker.label)}</div><div class="ce-tech-tail"></div></div>`;
        const height = marker.kind === 'charger' ? 28 : selected ? 49 : 43;
        const width = marker.kind === 'charger' ? 28 : selected ? 42 : 36;

        L.marker([marker.latitude, marker.longitude], {
          icon: L.divIcon({
            className: 'ce-pin',
            html,
            iconSize: [width, height],
            iconAnchor: marker.kind === 'charger' ? [width / 2, height / 2] : [width / 2, height],
          }),
          title: marker.title,
          alt: marker.title,
          keyboard: true,
          zIndexOffset: selected ? 1000 : 600,
        })
          .on('click', (event) => {
            L.DomEvent.stopPropagation(event);
            onSelectRef.current?.(marker.id);
          })
          .addTo(layer);
      });
    };
    drawGroup('charger');
    drawGroup('technician');
  }, [center, markers, selectedId, routePath, routeTo, userLocation, showServiceLocation, rings, interactive, zoom, hasPinMove]);

  // Zoom the map: to the home + picked pin (and its road route) when someone is
  // selected, otherwise to the home + every pin.
  function fitEverything(animate: boolean) {
    const map = mapRef.current;
    if (!map) return;
    // when the page is hidden (like after tapping Request) the map has no size,
    // and fitting to a zero-size box gives NaN, so wait until it is visible again
    const size = map.getSize();
    if (!size.x || !size.y) return;
    const usable = markers.filter(isUsable);
    const picked = usable.find((marker) => marker.id === selectedId);
    const points: L.LatLngTuple[] = [
      ...(isUsable(center) ? [[center.latitude, center.longitude] as L.LatLngTuple] : []),
      ...(picked ? [picked] : usable).map((marker): L.LatLngTuple => [marker.latitude, marker.longitude]),
    ];
    if (picked && routePath) {
      routePath.filter(isUsable).forEach((point) => points.push([point.latitude, point.longitude]));
    }
    if (points.length === 0) return;
    if (points.length === 1) {
      markSelfMove();
      map.setView(points[0], 12, { animate: interactive && hasFitRef.current && animate });
      hasFitRef.current = true;
      return;
    }
    // the small dashboard preview gets tight padding so pins don't bunch up
    const edge = !interactive ? 24 : picked ? 70 : 40;
    const options: L.FitBoundsOptions = {
      paddingTopLeft: [edge + leftInset, topInset + (!interactive ? 40 : picked ? 80 : 50)],
      paddingBottomRight: [edge + rightInset, bottomInset + (!interactive ? 12 : picked ? 60 : 40)],
      maxZoom: picked ? 16 : 14,
    };
    const bounds = L.latLngBounds(points);
    markSelfMove();
    const padX = 2 * edge + leftInset + rightInset;
    const padY = topInset + bottomInset + (!interactive ? 52 : picked ? 140 : 90);
    if (size.x <= padX + 20 || size.y <= padY + 20) {
      // padding is bigger than the map, so just center instead of fitting
      map.setView(bounds.getCenter(), 12, { animate: false });
      hasFitRef.current = true;
      return;
    }
    if (interactive && animate && hasFitRef.current) {
      map.flyToBounds(bounds, { ...options, duration: 0.7 });
    } else {
      map.fitBounds(bounds, { ...options, animate: false });
    }
    hasFitRef.current = true;
  }

  useEffect(() => {
    fitEverything(true);
    // markers.length is enough here, we don't want to re-zoom on every Firestore update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.latitude, center.longitude, markers.length, selectedId, routePath, bottomInset, topInset, leftInset, rightInset, sizeTick]);

  useImperativeHandle(ref, () => ({
    zoomBy: (steps) => {
      const map = mapRef.current;
      if (map) {
        markSelfMove();
        map.setZoom(map.getZoom() + steps);
      }
    },
    panTo: (point) => {
      const map = mapRef.current;
      if (!map || map.getSize().x === 0 || !isUsable(point)) return;
      markSelfMove();
      map.flyTo([point.latitude, point.longitude], Math.max(map.getZoom(), 14), { duration: 0.7 });
    },
    showAll: () => fitEverything(true),
    focusPin: () => {
      const map = mapRef.current;
      if (!map || map.getSize().x === 0 || !isUsable(center)) return;
      markSelfMove();
      map.flyTo([center.latitude, center.longitude], 18, { duration: 0.6 });
    },
  }));

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
    </View>
  );
}
