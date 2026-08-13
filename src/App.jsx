import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Verifier from './components/Verifier';
import Training from './components/Training';
import Community from './components/Community';
import KidsArena from './components/KidsArena';
import Dashboard from './components/Dashboard';

import { mockCommunityPosts } from './mockData';
import { fetchAllPosts, createPost, addCommentApi, voteApi, flagApi, pingBackend } from './lib/api';
import './App.css';

export default function App() {
  // Load configurations from localStorage
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('truthlens_lang');
    return (saved === 'fr' || saved === 'en') ? saved : 'fr';
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('truthlens_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'dark';
  });

  const [activeTab, setActiveTab] = useState('verifier');

  // Load community posts from localStorage or default (fallback mode, used until/unless backend responds)
  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('truthlens_posts');
    return saved ? JSON.parse(saved) : mockCommunityPosts;
  });

  // Whether the real FastAPI backend is reachable. When true, all community actions
  // go through the API and persist for every visitor; when false, we transparently
  // fall back to the local (per-browser) mode above.
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await pingBackend();
        const remotePosts = await fetchAllPosts();
        if (!cancelled) {
          setBackendOnline(true);
          setPosts(remotePosts);
        }
      } catch (err) {
        // Backend not running: stay in local fallback mode silently.
        if (!cancelled) setBackendOnline(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load stats from localStorage or default
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('truthlens_stats');
    if (saved) return JSON.parse(saved);
    return {
      verifiedCount: 12,
      completedCourses: [],
      completedKidsQuizzes: [],
      communityContributions: 4,
      userPoints: 80,
      badges: [
        {
          id: "badge-welcome",
          name: "Citoyen Curieux / Curious Citizen",
          description: "A rejoint la plateforme TruthLens AI pour défendre l'intégrité de l'information.",
          color: "#00E5FF",
          icon: "Users"
        }
      ]
    };
  });

  // Sync theme with body class
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('truthlens_theme', theme);
  }, [theme]);

  // Save states to localStorage
  useEffect(() => {
    localStorage.setItem('truthlens_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('truthlens_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('truthlens_stats', JSON.stringify(stats));
  }, [stats]);

  // Action Handlers
  const handleVerificationComplete = (score) => {
    setStats(prev => ({
      ...prev,
      verifiedCount: prev.verifiedCount + 1,
      userPoints: prev.userPoints + 15
    }));
  };

  const handleCourseCompleted = (courseId, badge) => {
    setStats(prev => {
      if (prev.completedCourses.includes(courseId)) return prev;
      
      return {
        ...prev,
        completedCourses: [...prev.completedCourses, courseId],
        userPoints: prev.userPoints + 100,
        badges: [...prev.badges, badge]
      };
    });
  };

  const handleKidsQuizCompleted = (quizId, points, badge) => {
    setStats(prev => {
      if (prev.completedKidsQuizzes.includes(quizId)) return prev;
      
      return {
        ...prev,
        completedKidsQuizzes: [...prev.completedKidsQuizzes, quizId],
        userPoints: prev.userPoints + points,
        badges: [...prev.badges, badge]
      };
    });
  };

  const handleMissionAnswered = (isCorrect) => {
    if (!isCorrect) return;
    setStats(prev => ({ ...prev, userPoints: prev.userPoints + 50 }));
  };

  const handleAddPost = async (newPost) => {
    if (backendOnline) {
      try {
        const created = await createPost({
          author: newPost.author, platform: newPost.platform,
          title: newPost.title, content: newPost.content, source_url: newPost.sourceUrl,
        });
        setPosts(prev => [created, ...prev]);
        setStats(prev => ({ ...prev, communityContributions: prev.communityContributions + 1, userPoints: prev.userPoints + 20 }));
        return created; // caller may attach follow-up comments (e.g. AI verifier report)
      } catch (err) {
        setBackendOnline(false); // API devenue indisponible : on repasse en local pour cette action
      }
    }
    setPosts(prev => [newPost, ...prev]);
    setStats(prev => ({
      ...prev,
      communityContributions: prev.communityContributions + 1,
      userPoints: prev.userPoints + 20
    }));
    return newPost;
  };

  const handleAddComment = async (postId, newComment) => {
    if (backendOnline) {
      try {
        const created = await addCommentApi(postId, { author: newComment.author, content: newComment.content });
        setPosts(prev => prev.map(post => post.id === postId ? { ...post, comments: [...post.comments, created] } : post));
        setStats(prev => ({ ...prev, communityContributions: prev.communityContributions + 1, userPoints: prev.userPoints + 5 }));
        return;
      } catch (err) {
        setBackendOnline(false);
      }
    }
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    setStats(prev => ({
      ...prev,
      communityContributions: prev.communityContributions + 1,
      userPoints: prev.userPoints + 5
    }));
  };

  const handleVotePost = async (postId) => {
    if (backendOnline) {
      try {
        await voteApi(postId);
        setPosts(prev => prev.map(post => post.id === postId ? { ...post, votes: post.votes + 1 } : post));
        return;
      } catch (err) {
        setBackendOnline(false);
      }
    }
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, votes: post.votes + 1 };
      }
      return post;
    }));
  };

  const handleFlagPost = async (postId) => {
    if (backendOnline) {
      try {
        await flagApi(postId);
        setPosts(prev => prev.map(post => {
          if (post.id !== postId) return post;
          const nextFlags = post.flags + 1;
          const nextStatus = (nextFlags >= 50 && post.status.includes("attente")) ? "En cours d'analyse" : post.status;
          return { ...post, flags: nextFlags, status: nextStatus };
        }));
        return;
      } catch (err) {
        setBackendOnline(false);
      }
    }
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const nextFlags = post.flags + 1;
        let nextStatus = post.status;
        if (nextFlags >= 50 && post.status.includes("attente")) {
          nextStatus = "En cours d'analyse";
        }
        return {
          ...post,
          flags: nextFlags,
          status: nextStatus
        };
      }
      return post;
    }));
  };

  // Bridge: Send AI Verifier report directly to Community Hub in real time
  const handleAddReportToCommunity = async (report) => {
    const newPost = {
      id: `post-report-${Date.now()}`,
      author: language === 'fr' ? "Vérificateur IA (Automatique)" : "AI Verifier (Automated)",
      avatar: "TL",
      avatarColor: "#D400FF",
      date: language === 'fr' ? "À l'instant" : "Just now",
      platform: report.type === 'link' ? (language === 'fr' ? 'Lien Direct' : 'Web Link') : report.type === 'text' ? 'Texte / Text' : 'Fichier média / Media',
      title: `[AI Alert] ${report.title}`,
      sourceUrl: report.sourceUrl || null,
      content: language === 'fr' 
        ? `Verdict TruthLens AI : ${report.verdict} (Score : ${report.score}%). Résumé : ${report.explanation}`
        : `TruthLens AI Verdict: ${report.verdict} (Score: ${report.score}%). Explanation: ${report.explanation}`,
      flags: 12,
      status: report.score >= 75 ? "Vérifié - Fiable" : report.score >= 40 ? "En cours d'analyse" : "Vérifié - Fake News",
      comments: [
        {
          id: `c-report-1`,
          author: "System Mod",
          avatar: "SM",
          date: language === 'fr' ? "À l'instant" : "Just now",
          content: `${language === 'fr' ? 'Anomalies détectées :' : 'Detected anomalies:'} ${report.negativePoints.join(' | ')}`
        }
      ],
      votes: 4
    };

    const createdPost = await handleAddPost(newPost);
    // In backend mode, the post above was created WITHOUT its explanatory comment
    // (the API only accepts author/platform/title/content) — attach it now so the
    // "anomalies détectées" detail isn't silently lost.
    if (backendOnline && createdPost && createdPost.id) {
      await handleAddComment(createdPost.id, {
        author: "System Mod",
        content: `${language === 'fr' ? 'Anomalies détectées :' : 'Detected anomalies:'} ${report.negativePoints.join(' | ')}`
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'verifier':
        return (
          <Verifier 
            language={language}
            onVerificationComplete={handleVerificationComplete} 
            onAddToCommunity={handleAddReportToCommunity}
          />
        );
      case 'training':
        return (
          <Training 
            language={language}
            completedCourses={stats.completedCourses} 
            onCourseCompleted={handleCourseCompleted}
          />
        );
      case 'community':
        return (
          <Community 
            language={language}
            posts={posts} 
            backendOnline={backendOnline}
            onAddPost={handleAddPost}
            onAddComment={handleAddComment}
            onVotePost={handleVotePost}
            onFlagPost={handleFlagPost}
          />
        );
      case 'kids':
        return (
          <KidsArena 
            language={language}
            completedKidsQuizzes={stats.completedKidsQuizzes} 
            onKidsQuizCompleted={handleKidsQuizCompleted}
            userPoints={stats.userPoints}
            onMissionAnswered={handleMissionAnswered}
          />
        );
      case 'dashboard':
        return (
          <Dashboard 
            language={language}
            stats={stats} 
          />
        );
      default:
        return (
          <Verifier 
            language={language}
            onVerificationComplete={handleVerificationComplete} 
            onAddToCommunity={handleAddReportToCommunity}
          />
        );
    }
  };

  return (
    <div className={`app-container ${activeTab === 'kids' ? 'kids-theme' : ''}`}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="main-content">
        {renderContent()}
      </main>
      
      <footer style={{
        textAlign: 'center', 
        padding: '2rem 1.5rem', 
        borderTop: '1px solid var(--border-color)', 
        background: 'rgba(8,7,16,0.95)', 
        fontSize: '0.8rem', 
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-title)',
        transition: 'background-color 0.3s'
      }} className="footer-layout">
        <p>
          {language === 'fr' 
            ? "© 2026 TruthLens AI. Développé pour la défense de l'intégrité de l'information et l'éducation aux médias."
            : "© 2026 TruthLens AI. Developed for media literacy and informational integrity support."
          }
        </p>
      </footer>
    </div>
  );
}
