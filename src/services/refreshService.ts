// Global Data Refresh Service using BroadcastChannel
// This allows real-time updates across different components and even different browser tabs.

const DATA_CHANGE_EVENT = 'simantab-data-changed';
const channel = new BroadcastChannel('simantab-realtime-updates');

type RefreshCallback = () => void;
const listeners = new Set<RefreshCallback>();

// Initialize the channel listener
channel.onmessage = (event) => {
  if (event.data === DATA_CHANGE_EVENT) {
    listeners.forEach(callback => callback());
  }
};

/**
 * Notify all components that data has changed.
 * Should be called after any successful mutation (add, update, delete).
 */
export const notifyDataChange = () => {
  // Notify same tab
  listeners.forEach(callback => callback());
  // Notify other tabs
  channel.postMessage(DATA_CHANGE_EVENT);
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
