// Client API pour le backend TruthLens (FastAPI).
// Toutes les fonctions renvoient les données déjà normalisées au format attendu par l'UI.
// En cas d'échec réseau (backend non démarré), chaque fonction lève une erreur —
// App.jsx s'en sert pour basculer sur le mode local (localStorage) sans planter l'app.

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AVATAR_COLORS = ['#00E5FF', '#D400FF', '#FFC400', '#00E676', '#FF3D00'];

function colorFor(name) {
  const idx = (name || '').charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.max(idx, 0)];
}

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(iso) {
  const diffMs = Date.now() - new Date(iso + 'Z').getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

function mapComment(c) {
  return { id: c.id, author: c.author, avatar: initials(c.author), date: formatDate(c.created_at), content: c.content };
}

function mapPost(p, comments = []) {
  return {
    id: p.id,
    author: p.author,
    avatar: initials(p.author),
    avatarColor: colorFor(p.author),
    date: formatDate(p.created_at),
    platform: p.platform,
    title: p.title,
    content: p.content,
    sourceUrl: p.source_url || null,
    flags: p.flags,
    status: p.status,
    votes: p.votes,
    comments: comments.map(mapComment),
  };
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAllPosts() {
  const posts = await request('/posts');
  const withComments = await Promise.all(
    posts.map(async (p) => {
      const comments = await request(`/posts/${p.id}/comments`);
      return mapPost(p, comments);
    })
  );
  return withComments;
}

export async function createPost({ author, platform, title, content, source_url }) {
  const p = await request('/posts', { method: 'POST', body: JSON.stringify({ author, platform, title, content, source_url: source_url || null }) });
  return mapPost(p, []);
}

export async function addCommentApi(postId, { author, content }) {
  const c = await request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ author, content }) });
  return mapComment(c);
}

export async function voteApi(postId) {
  const p = await request(`/posts/${postId}/vote`, { method: 'POST', body: JSON.stringify({ direction: 'up' }) });
  return p;
}

export async function flagApi(postId) {
  const p = await request(`/posts/${postId}/vote`, { method: 'POST', body: JSON.stringify({ direction: 'flag' }) });
  return p;
}

export async function pingBackend() {
  await request('/health');
  return true;
}
