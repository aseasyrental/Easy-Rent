import { useCallback, useEffect, useState } from 'react';
import apiClient from '../services/api.js';

const SLOT_POSITIONS = [1, 2, 3];

/**
 * Fetches the three featured slots and exposes mutations for picking, clearing,
 * and swapping. Slots are always returned as a fixed array of length 3, ordered
 * by position; missing slots have property === null.
 */
export default function useFeaturedSlots() {
  const [slots, setSlots] = useState(() =>
    SLOT_POSITIONS.map((position) => ({ position, property: null })),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyPosition, setBusyPosition] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/properties', { params: { featured: true } });
      const featured = res.data?.data || [];
      const next = SLOT_POSITIONS.map((position) => ({
        position,
        property: featured.find((p) => p.featured_position === position) || null,
      }));
      setSlots(next);
    } catch (err) {
      console.error('Failed to load featured slots:', err);
      setError('Could not load featured slots.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Push a property into a slot. The backend kicks out the previous occupant
  // atomically, so we just refresh from the source of truth after.
  const setSlot = useCallback(async (propertyId, position) => {
    setBusyPosition(position);
    setError(null);
    try {
      await apiClient.patch(`/properties/${propertyId}/featured`, { position });
      await refresh();
      return true;
    } catch (err) {
      console.error('Failed to set featured slot:', err);
      setError('Could not update featured slot.');
      return false;
    } finally {
      setBusyPosition(null);
    }
  }, [refresh]);

  // Clear a slot — finds whoever currently holds it and sets their position to null.
  const clearSlot = useCallback(async (position) => {
    const occupant = slots.find((s) => s.position === position)?.property;
    if (!occupant) return true;
    setBusyPosition(position);
    setError(null);
    try {
      await apiClient.patch(`/properties/${occupant.id}/featured`, { position: null });
      await refresh();
      return true;
    } catch (err) {
      console.error('Failed to clear featured slot:', err);
      setError('Could not clear featured slot.');
      return false;
    } finally {
      setBusyPosition(null);
    }
  }, [slots, refresh]);

  // Swap two slots. Implemented as: park A at NULL, move B into A's spot, move A into B's spot.
  // Three sequential PATCHes — slow path, but safe with the UNIQUE index.
  const swapSlots = useCallback(async (positionA, positionB) => {
    const a = slots.find((s) => s.position === positionA)?.property;
    const b = slots.find((s) => s.position === positionB)?.property;
    setBusyPosition(positionA);
    setError(null);
    try {
      if (a) {
        await apiClient.patch(`/properties/${a.id}/featured`, { position: null });
      }
      if (b) {
        await apiClient.patch(`/properties/${b.id}/featured`, { position: positionA });
      }
      if (a) {
        await apiClient.patch(`/properties/${a.id}/featured`, { position: positionB });
      }
      await refresh();
      return true;
    } catch (err) {
      console.error('Failed to swap featured slots:', err);
      setError('Could not swap featured slots.');
      await refresh();
      return false;
    } finally {
      setBusyPosition(null);
    }
  }, [slots, refresh]);

  return {
    slots,
    loading,
    error,
    busyPosition,
    refresh,
    setSlot,
    clearSlot,
    swapSlots,
  };
}
