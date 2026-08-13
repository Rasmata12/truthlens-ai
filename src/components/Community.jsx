import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, CheckCircle, Flag, ChevronUp, User, Clock, Globe, ArrowUpDown, PlusCircle, Wifi, WifiOff } from 'lucide-react';
import { translations } from '../translations';

export default function Community({ language, posts, backendOnline, onAddPost, onAddComment, onVotePost, onFlagPost }) {
  const t = translations[language];
  const [filter, setFilter] = useState('all'); // all, pending, fake, reliable
  const [sortBy, setSortBy] = useState('flags'); // flags, recent
  
  // State for adding new report
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPlatform, setNewPlatform] = useState('Twitter / X');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  
  // Comment inputs text per post
  const [commentInputs, setCommentInputs] = useState({});

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const newPost = {
      id: `post-${Date.now()}`,
      author: language === 'fr' ? "Vous" : "You",
      avatar: "VO",
      avatarColor: "#00E5FF",
      date: language === 'fr' ? "À l'instant" : "Just now",
      platform: newPlatform,
      title: newTitle,
      content: newContent,
      sourceUrl: newSourceUrl || null,
      flags: 1,
      status: "En attente d'analyse",
      comments: [],
      votes: 1
    };

    onAddPost(newPost);
    
    setNewTitle('');
    setNewContent('');
    setNewSourceUrl('');
    setShowAddForm(false);
  };

  const handleCommentSubmit = (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    onAddComment(postId, {
      id: `c-${Date.now()}`,
      author: language === 'fr' ? "Vous" : "You",
      avatar: "VO",
      date: language === 'fr' ? "À l'instant" : "Just now",
      content: text
    });

    setCommentInputs(prev => ({
      ...prev,
      [postId]: ''
    }));
  };

  const getStatusBadge = (status) => {
    // Map French status to bilingual labels
    if (status === "En attente d'analyse" || status === "En attente") {
      return <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{language === 'fr' ? 'En attente' : 'Awaiting check'}</span>;
    }
    if (status === "En cours d'analyse" || status === "En cours") {
      return <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{language === 'fr' ? "En cours d'analyse" : 'Analyzing...'}</span>;
    }
    if (status === "Vérifié - Fake News" || status === "Fake News") {
      return <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>{language === 'fr' ? 'Vérifié : Faux' : 'Verified: Fake'}</span>;
    }
    if (status === "Vérifié - Fiable" || status === "Fiable") {
      return <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{language === 'fr' ? 'Vérifié : Fiable' : 'Verified: Reliable'}</span>;
    }
    return <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{status}</span>;
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    if (filter === 'pending') return post.status === "En attente d'analyse" || post.status === "En cours d'analyse" || post.status === "En attente";
    if (filter === 'fake') return post.status.includes("Fake");
    if (filter === 'reliable') return post.status.includes("Fiable") || post.status.includes("Reliable");
    return true;
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'flags') {
      return b.flags - a.flags;
    } else {
      return b.id.localeCompare(a.id);
    }
  });

  return (
    <div className="community-container animate-fade-in">
      <div className="community-hero" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', background: 'linear-gradient(to right, #00e5ff, #d400ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {t.community.title}
        </h1>
        <p style={{ fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
          {t.community.subtitle}
        </p>
        <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.3rem 0.8rem', borderRadius: '999px', background: backendOnline ? 'rgba(0,230,118,0.12)' : 'rgba(255,196,0,0.12)', color: backendOnline ? 'var(--success)' : 'var(--warning)' }}>
          {backendOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          {backendOnline
            ? (language === 'fr' ? 'Connecté au serveur — données partagées en temps réel' : 'Connected to server — real-time shared data')
            : (language === 'fr' ? 'Mode local (serveur non démarré) — données propres à ce navigateur' : 'Local mode (server not running) — data stays in this browser')}
        </div>
      </div>

      <div className="community-toolbar">
        {/* Filter buttons */}
        <div className="filter-group-pills">
          <button className={`pill-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            {t.community.filterAll} ({posts.length})
          </button>
          <button className={`pill-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
            {t.community.filterPending}
          </button>
          <button className={`pill-btn ${filter === 'fake' ? 'active' : ''}`} onClick={() => setFilter('fake')}>
            {t.community.filterFake}
          </button>
          <button className={`pill-btn ${filter === 'reliable' ? 'active' : ''}`} onClick={() => setFilter('reliable')}>
            {t.community.filterReliable}
          </button>
        </div>

        {/* Sort and Create */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="sort-box">
            <ArrowUpDown size={14} style={{ color: 'var(--color-text-muted)' }} />
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="flags">{t.community.sortByFlags}</option>
              <option value="recent">{t.community.sortByRecent}</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <PlusCircle size={16} />
            {t.community.btnReport}
          </button>
        </div>
      </div>

      <div className="community-layout">
        {/* Create Post Section Form */}
        {showAddForm && (
          <div className="glass-card add-post-form animate-fade-in" style={{ gridColumn: '1 / -1', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--color-text)', marginBottom: '1.2rem' }}>{t.community.formTitle}</h3>
            <form onSubmit={handleCreatePost}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div className="form-group">
                    <label>{t.community.formInputTitle}</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={t.community.formInputTitlePl}
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t.community.formInputDesc}</label>
                    <textarea 
                      className="form-control" 
                      placeholder={t.community.formInputDescPl}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{language === 'fr' ? 'Lien / vidéo à signaler (optionnel)' : 'Link / video to report (optional)'}</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder={language === 'fr' ? 'https://...' : 'https://...'}
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="form-group">
                    <label>{t.community.formPlatform}</label>
                    <select 
                      className="form-control"
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value)}
                    >
                      <option>Twitter / X</option>
                      <option>Facebook</option>
                      <option>TikTok</option>
                      <option>WhatsApp / Telegram</option>
                      <option>Lien / Web Link</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{t.community.formSubmit}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>{t.common.cancel}</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Community Feed */}
        <div className="community-feed">
          {sortedPosts.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <AlertTriangle size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.8rem' }} />
              <p>{language === 'fr' ? 'Aucun signalement trouvé.' : 'No reports found.'}</p>
            </div>
          ) : (
            sortedPosts.map(post => (
              <div key={post.id} className="glass-card post-card animate-fade-in">
                {/* Meta details */}
                <div className="post-header">
                  <div className="post-author-info">
                    <div className="avatar-circle" style={{ backgroundColor: post.avatarColor || '#d400ff' }}>
                      {post.avatar}
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}>{post.author}</h4>
                      <div className="post-meta-row">
                        <span className="meta-item"><Clock size={12} /> {post.date}</span>
                        <span className="meta-item"><Globe size={12} /> {post.platform}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {getStatusBadge(post.status)}
                    <button 
                      className="flag-btn" 
                      onClick={() => onFlagPost(post.id)}
                      title="Flag report"
                    >
                      <Flag size={14} style={{ color: 'var(--danger)' }} />
                      <span>{post.flags}</span>
                    </button>
                  </div>
                </div>

                {/* Content body */}
                <div className="post-body" style={{ marginTop: '1rem' }}>
                  <h3 style={{ color: 'var(--color-text)', fontSize: '1.25rem', marginBottom: '0.6rem' }}>{post.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{post.content}</p>
                  {post.sourceUrl && (
                    <a
                      href={post.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.8rem',
                        color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
                        border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.8rem',
                      }}
                    >
                      <Globe size={14} /> {post.sourceUrl.length > 55 ? post.sourceUrl.slice(0, 55) + '…' : post.sourceUrl}
                    </a>
                  )}
                </div>

                {/* Footer votes / comments count */}
                <div className="post-footer" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <button className="vote-btn" onClick={() => onVotePost(post.id)}>
                    <ChevronUp size={16} />
                    <span>{t.community.postRequestCheck} ({post.votes})</span>
                  </button>

                  <span className="comments-count">
                    <MessageSquare size={16} />
                    {post.comments.length} {t.community.commentsTitle}
                  </span>
                </div>

                {/* Comments Thread */}
                <div className="comments-box" style={{ marginTop: '1rem' }}>
                  {post.comments.length > 0 && (
                    <div className="comments-list">
                      {post.comments.map(c => (
                        <div key={c.id} className="comment-item">
                          <div className="comment-author-avatar">{c.avatar}</div>
                          <div className="comment-details">
                            <div className="comment-meta">
                              <span className="comment-author">{c.author}</span>
                              <span className="comment-date">{c.date}</span>
                            </div>
                            <p className="comment-text">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment row */}
                  <div className="add-comment-row" style={{ marginTop: '1rem' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={t.community.commentPl}
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(post.id); }}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={() => handleCommentSubmit(post.id)}>
                      {t.community.commentBtn}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="community-sidebar">
          <div className="glass-card info-sidebar-card">
            <h3 style={{ color: 'var(--color-text)', fontSize: '1.15rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
              {t.community.sidebarTitle}
            </h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              {t.community.sidebarDesc}
            </p>
            <div className="sidebar-stats-list">
              <div className="sidebar-stat-item">
                <span>{t.community.sidebarPriority}</span>
                <strong>{posts.filter(p => p.flags > 20).length}</strong>
              </div>
              <div className="sidebar-stat-item">
                <span>{t.community.sidebarWeekly}</span>
                <strong>1,248</strong>
              </div>
              <div className="sidebar-stat-item">
                <span>{t.community.sidebarMods}</span>
                <strong style={{ color: 'var(--success)' }}>Active (8)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
