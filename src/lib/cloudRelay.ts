// SIXATE Global Cloud Relay - Syncs student form submissions across all devices worldwide
import { StudentApplication } from '../types';

const GLOBAL_RELAY_KEY = 'sixate_math_club_2026_global_v1';
const RELAY_ENDPOINT = `https://kvdb.io/4yT8pDqQZzYk9N3v8L7m1X/${GLOBAL_RELAY_KEY}`;

export async function pushToGlobalCloud(application: StudentApplication): Promise<void> {
  try {
    // 1. Fetch current cloud list
    const current = await fetchFromGlobalCloud();
    
    // Check duplicate roll number
    const exists = current.some(a => a.rollNumber === application.rollNumber);
    if (!exists) {
      const updated = [application, ...current];
      // 2. Put updated list to global cloud relay
      await fetch(RELAY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    }
  } catch (e) {
    console.warn('Global Cloud Relay push notice:', e);
  }
}

export async function fetchFromGlobalCloud(): Promise<StudentApplication[]> {
  try {
    const res = await fetch(RELAY_ENDPOINT, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Global Cloud Relay fetch notice:', e);
  }
  return [];
}

export async function updateInGlobalCloud(applications: StudentApplication[]): Promise<void> {
  try {
    await fetch(RELAY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applications)
    });
  } catch (e) {
    console.warn('Global Cloud Relay update notice:', e);
  }
}
