// Real road data for the map screen. Two hooks:
//
// - useDriveTimes: one request that fills in the drive time for the nearest
//   electricians, so the list can show real minutes instead of guesses.
// - useRoadRoute: the actual road path (and time) for the electrician the
//   customer tapped, so the map can draw the real route.
//
// Both fail quietly: if the routing service is down or slow, status becomes
// 'failed' and the screen falls back to the rough estimate and says so.
import { useEffect, useState } from 'react';
import {
  fetchDriveTimes,
  fetchRoadRoute,
  MAX_DRIVE_TIME_LOOKUPS,
  type RoadRoute,
  type RoadTime,
} from './routing';

type Point = { latitude: number; longitude: number };
type Status = 'idle' | 'loading' | 'ready' | 'failed';

type DriveTimesState = { key: string; status: 'ready' | 'failed'; times: Record<string, RoadTime> };

export function useDriveTimes(customer: Point | undefined, technicians: (Point & { id: string })[]) {
  const nearest = technicians.slice(0, MAX_DRIVE_TIME_LOOKUPS);
  const key = customer && nearest.length > 0
    ? `${customer.latitude},${customer.longitude}|${nearest.map((item) => `${item.id}@${item.latitude},${item.longitude}`).join(';')}`
    : '';
  const [state, setState] = useState<DriveTimesState | null>(null);

  useEffect(() => {
    if (!key || !customer) return;

    const controller = new AbortController();
    fetchDriveTimes(customer, nearest, controller.signal)
      .then((results) => {
        const times: Record<string, RoadTime> = {};
        results.forEach((result, index) => {
          if (result) times[nearest[index].id] = result;
        });
        setState({ key, status: 'ready', times });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ key, status: 'failed', times: {} });
      });

    return () => controller.abort();
    // `key` already describes everything these depend on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!key) return { status: 'idle' as Status, times: {} as Record<string, RoadTime> };
  if (!state || state.key !== key) return { status: 'loading' as Status, times: {} as Record<string, RoadTime> };
  return { status: state.status as Status, times: state.times };
}

type RouteState = { key: string; status: 'ready' | 'failed'; route: RoadRoute | null };

export function useRoadRoute(customer: Point | undefined, technician: Point | undefined) {
  const key = customer && technician
    ? `${technician.latitude},${technician.longitude}>${customer.latitude},${customer.longitude}`
    : '';
  const [state, setState] = useState<RouteState | null>(null);

  useEffect(() => {
    if (!key || !customer || !technician) return;

    const controller = new AbortController();
    fetchRoadRoute(technician, customer, controller.signal)
      .then((route) => setState({ key, status: route ? 'ready' : 'failed', route }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ key, status: 'failed', route: null });
      });

    return () => controller.abort();
    // `key` already describes everything these depend on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!key) return { status: 'idle' as Status, route: null as RoadRoute | null };
  if (!state || state.key !== key) return { status: 'loading' as Status, route: null as RoadRoute | null };
  return { status: state.status as Status, route: state.route };
}
