// Groups pins that would sit on top of each other so the map stays readable,
// like the numbered bubbles in Airbnb or Zillow. It only does math on the
// coordinates (no map library), so it works the same on phones and in the
// browser and can be tested on its own.
//
// How it works: turn every pin into a screen position at the current zoom level,
// then merge pins that are closer than `radiusPx` pixels. Zoom in and the same
// pins are farther apart on screen, so the bubbles split back into single pins.

export type ClusterPoint = { id: string; latitude: number; longitude: number };

export type Cluster<T extends ClusterPoint> = {
  // the pin's own id when it is alone, or "cluster:<first id>" for a group
  id: string;
  latitude: number;
  longitude: number;
  members: T[];
};

// Past this zoom (about street level) pins are never grouped, so a customer can
// always reach every individual electrician.
export const CLUSTER_OFF_AT_ZOOM = 16;

// Web Mercator: how many pixels from the top-left of the world map a point is.
function toPixels(point: ClusterPoint, zoom: number): { x: number; y: number } {
  const scale = 256 * 2 ** zoom;
  const latitude = Math.max(-85.05, Math.min(85.05, point.latitude));
  const sin = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((point.longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

export function clusterPoints<T extends ClusterPoint>(
  points: T[],
  zoom: number,
  radiusPx = 46,
  // pins that must stay on their own (like the selected electrician)
  pinned: ReadonlySet<string> = new Set(),
): Cluster<T>[] {
  const usable = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  const single = (point: T): Cluster<T> => ({ id: point.id, latitude: point.latitude, longitude: point.longitude, members: [point] });

  if (!Number.isFinite(zoom) || zoom >= CLUSTER_OFF_AT_ZOOM || usable.length < 2) return usable.map(single);

  const pixels = usable.map((point) => toPixels(point, zoom));
  const taken = new Array<boolean>(usable.length).fill(false);
  const result: Cluster<T>[] = [];

  usable.forEach((point, index) => {
    if (taken[index]) return;
    taken[index] = true;
    if (pinned.has(point.id)) {
      result.push(single(point));
      return;
    }

    const memberIndexes = [index];
    for (let other = index + 1; other < usable.length; other += 1) {
      if (taken[other] || pinned.has(usable[other].id)) continue;
      const dx = pixels[other].x - pixels[index].x;
      const dy = pixels[other].y - pixels[index].y;
      if (Math.hypot(dx, dy) <= radiusPx) {
        taken[other] = true;
        memberIndexes.push(other);
      }
    }

    if (memberIndexes.length === 1) {
      result.push(single(point));
      return;
    }
    const members = memberIndexes.map((memberIndex) => usable[memberIndex]);
    result.push({
      id: `cluster:${point.id}`,
      latitude: members.reduce((sum, member) => sum + member.latitude, 0) / members.length,
      longitude: members.reduce((sum, member) => sum + member.longitude, 0) / members.length,
      members,
    });
  });

  return result;
}

// Leaflet-style zoom from a phone map's "how much longitude is visible" number.
export function zoomFromLongitudeDelta(longitudeDelta: number): number {
  if (!Number.isFinite(longitudeDelta) || longitudeDelta <= 0) return 12;
  return Math.log2(360 / longitudeDelta);
}
