import React from 'react';
import { Award, Shield, Search, GraduationCap, Users, Star, TrendingUp } from 'lucide-react';
import { translations } from '../translations';

export default function Dashboard({ language, stats }) {
  const t = translations[language];
  const {
    verifiedCount,
    completedCourses,
    completedKidsQuizzes,
    communityContributions,
    userPoints,
    badges
  } = stats;

  const getUserLevelInfo = (points) => {
    if (points >= 300) {
      return { 
        title: t.dashboard.levels.adv, 
        desc: t.dashboard.levels.advDesc, 
        color: 'var(--danger)', 
        nextVal: 500 
      };
    }
    if (points >= 150) {
      return { 
        title: t.dashboard.levels.int, 
        desc: t.dashboard.levels.intDesc, 
        color: 'var(--secondary)', 
        nextVal: 300 
      };
    }
    return { 
      title: t.dashboard.levels.beg, 
      desc: t.dashboard.levels.begDesc, 
      color: 'var(--primary)', 
      nextVal: 150 
    };
  };

  const levelInfo = getUserLevelInfo(userPoints);
  const nextLevelProgress = Math.min((userPoints / levelInfo.nextVal) * 100, 100);

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header" style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--color-text)', marginBottom: '0.4rem' }}>
          {t.dashboard.title}
        </h1>
        <p>{t.dashboard.subtitle}</p>
      </div>

      {/* Level Gamification */}
      <div className="glass-card level-card" style={{ marginBottom: '2.5rem', borderLeft: `4px solid ${levelInfo.color}` }}>
        <div className="level-grid">
          <div className="level-badge-visual animate-float" style={{
            background: levelInfo.color,
            boxShadow: `0 0 25px ${levelInfo.color}44`
          }}>
            <Shield size={36} style={{ color: '#000' }} />
          </div>
          <div className="level-text-info">
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.dashboard.levelLabel}</span>
            <h2 style={{ color: 'var(--color-text)', fontSize: '1.6rem', marginTop: '0.2rem' }}>{levelInfo.title}</h2>
            <p style={{ fontSize: '0.9rem', marginTop: '0.3rem', marginBottom: '1rem' }}>{levelInfo.desc}</p>
            
            <div className="level-progress-bar">
              <div className="level-progress-labels">
                <span>{userPoints} {t.dashboard.pointsLabel}</span>
                <span>{t.dashboard.nextLevel} {levelInfo.nextVal} pts</span>
              </div>
              <div className="level-track">
                <div className="level-fill" style={{ width: `${nextLevelProgress}%`, background: levelInfo.color }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card stat-item-card hoverable">
          <div className="stat-icon-circle" style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--primary)' }}>
            <Search size={20} />
          </div>
          <span className="stat-val">{verifiedCount}</span>
          <span className="stat-lbl">{t.dashboard.statVerified}</span>
          <div className="mini-trend green"><TrendingUp size={12} /> {t.dashboard.weeklyTrend}</div>
        </div>

        <div className="glass-card stat-item-card hoverable">
          <div className="stat-icon-circle" style={{ background: 'rgba(212, 0, 255, 0.1)', color: 'var(--secondary)' }}>
            <GraduationCap size={20} />
          </div>
          <span className="stat-val">{completedCourses.length}</span>
          <span className="stat-lbl">{t.dashboard.statCourses}</span>
          <div className="mini-trend green">{completedCourses.length > 0 ? t.dashboard.badgeUnlockedLabel : t.dashboard.badgeNoneLabel}</div>
        </div>

        <div className="glass-card stat-item-card hoverable">
          <div className="stat-icon-circle" style={{ background: 'rgba(255, 179, 0, 0.1)', color: 'var(--warning)' }}>
            <Star size={20} />
          </div>
          <span className="stat-val">{completedKidsQuizzes.length}</span>
          <span className="stat-lbl">{t.dashboard.statQuizzes}</span>
          <div className="mini-trend">{completedKidsQuizzes.length * 100} {t.dashboard.userPointsLabel}</div>
        </div>

        <div className="glass-card stat-item-card hoverable">
          <div className="stat-icon-circle" style={{ background: 'rgba(0, 230, 118, 0.1)', color: 'var(--success)' }}>
            <Users size={20} />
          </div>
          <span className="stat-val">{communityContributions}</span>
          <span className="stat-lbl">{t.dashboard.statContributions}</span>
          <div className="mini-trend green">{t.dashboard.modStatus}</div>
        </div>
      </div>

      {/* Badges Collection Gallery */}
      <div className="glass-card badges-collection-card">
        <h3 style={{ color: 'var(--color-text)', fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={22} style={{ color: 'var(--primary)' }} />
          {t.dashboard.galleryTitle} ({badges.length})
        </h3>

        {badges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            <Award size={36} style={{ color: 'var(--color-text-muted)', marginBottom: '0.8rem', opacity: 0.6 }} />
            <p style={{ fontSize: '0.95rem' }}>{t.dashboard.noBadgesTitle}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
              {t.dashboard.noBadgesDesc}
            </p>
          </div>
        ) : (
          <div className="badges-shelf-grid">
            {badges.map((badge, idx) => (
              <div 
                key={`${badge.id}-${idx}`} 
                className="badge-item-card glass-card hoverable text-center"
                style={{ '--badge-glow-color': badge.color }}
              >
                <div className="badge-visual-circle animate-float" style={{
                  background: badge.color,
                  boxShadow: `0 0 20px ${badge.color}55`
                }}>
                  <Award size={28} style={{ color: '#000' }} />
                </div>
                <h4 style={{ color: 'var(--color-text)', fontSize: '1.05rem', marginTop: '1rem', marginBottom: '0.4rem' }}>{badge.name}</h4>
                <p style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>{badge.description}</p>
                <span className="badge-acquired-tag">{t.dashboard.badgeCertified}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
