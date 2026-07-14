// Thin fetch wrapper around the SynapRX backend API.
// This replaces the old mock data.js — components now call these
// functions (mostly via the useApi hook below) instead of importing
// static arrays.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function fetchDrugs({ search, drugClass } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (drugClass) params.set('class', drugClass);
  const qs = params.toString();
  return request(`/drugs${qs ? `?${qs}` : ''}`);
}

export function fetchDrug(id) {
  return request(`/drugs/${encodeURIComponent(id)}`);
}

export function fetchClasses() {
  return request('/classes');
}

export function fetchInteractionsFor(drugId) {
  return request(`/interactions/${encodeURIComponent(drugId)}`);
}

export function fetchMetabolism() {
  return request('/metabolism');
}

export function fetchMetabolismOverlaps() {
  return request('/metabolism/overlaps');
}

export function fetchHistory({ drugClass } = {}) {
  const qs = drugClass ? `?class=${encodeURIComponent(drugClass)}` : '';
  return request(`/history${qs}`);
}

export async function askQuestion(question) {
  const res = await fetch(`${BASE_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}
