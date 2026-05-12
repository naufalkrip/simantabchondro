import { supabase } from './supabaseClient';
import { queryClient } from '../lib/queryClient';

// Global Data Refresh Service using BroadcastChannel AND Supabase Realtime
// This allows real-time updates across different components, browser tabs, and even different devices.

const DATA_CHANGE_EVENT = 'simantab-data-changed';
const localChannel = new BroadcastChannel('simantab-realtime-updates');

type RefreshCallback = () => void;
const listeners = new Set<RefreshCallback>();

// 1. Initialize BroadcastChannel (for multi-tab same browser)
localChannel.onmessage = (event) => {
  if (event.data === DATA_CHANGE_EVENT) {
    listeners.forEach(callback => callback());
  }
};

// 2. Initialize Supabase Realtime (for cross-device/server-side updates)
// Penting: Pastikan "Realtime" diaktifkan untuk tabel-tabel di Dashboard Supabase
supabase.channel('public_changes')
  .on(
    'postgres_changes',
    {
      event: '*', // Listen to INSERT, UPDATE, DELETE
      schema: 'public'
    },
    (payload) => {
      console.log('Realtime update received from Supabase:', payload);
      // Trigger refresh for all local listeners
      listeners.forEach(callback => callback());
      // Invalidate React Query cache
      queryClient.invalidateQueries();
    }
  )
  .subscribe((status) => {
    console.log('Supabase Realtime subscription status:', status);
  });

/**
 * Notify all components that data has changed.
 * Should be called after any successful mutation (add, update, delete).
 */
export const notifyDataChange = () => {
  console.log('Notifying data change locally...');
  console.trace('notifyDataChange called');
  // Notify same tab
  listeners.forEach(callback => callback());
  // Invalidate React Query cache
  queryClient.invalidateQueries();
  // Notify other tabs on same browser
  localChannel.postMessage(DATA_CHANGE_EVENT);
};

/**
 * Subscribe a component to data changes.
 * Returns an unsubscribe function.
 */
export const subscribeToDataChange = (callback: RefreshCallback) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};
