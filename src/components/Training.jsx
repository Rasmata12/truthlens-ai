import React, { useState, useEffect } from 'react';
import { coursesData, translations } from '../translations';
import { Play, Pause, BookOpen, ChevronRight, Award, AlertCircle, CheckCircle, RefreshCw, Eye, Sparkles, ShieldCheck } from 'lucide-react';

export default function Training({ language, completedCourses, onCourseCompleted }) {
  const t = translations[language];
  const courses = coursesData[language];
  
  const [activeLevel, setActiveLevel] = useState('Débutant'); // Débutant, Intermédiaire, Avancé (FR) or mapped
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  
  // Track video watching
  const [watched, setWatched] = useState(false);
  const [watching, setWatching] = useState(false);
  const [watchSeconds, setWatchSeconds] = useState(0);
  
  // Quiz states
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Sync selected course when language shifts
  useEffect(() => {
    // find mapped course by ID
    const currentId = selectedCourse.id;
    const matched = courses.find(c => c.id === currentId);
    if (matched) {
      setSelectedCourse(matched);
    }
  }, [language]);

  const handleLevelChange = (levelLabel, index) => {
    const nextCourse = courses[index];
    if (nextCourse) {
      setSelectedCourse(nextCourse);
      setActiveLevel(levelLabel);
      resetVideoProgress();
      resetQuiz();
    }
  };

  // Watch video timer simulation (takes 10 seconds to unlock quiz for fluid testing, showing a real countdown)
  useEffect(() => {
    let interval;
    if (watching && !watched) {
      interval = setInterval(() => {
        setWatchSeconds(prev => {
          if (prev >= 10) {
            setWatched(true);
            setWatching(false);
            clearInterval(interval);
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [watching, watched]);

  const resetVideoProgress = () => {
    setWatched(false);
    setWatching(false);
    setWatchSeconds(0);
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const handleAnswerSubmit = (idx) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    if (idx === selectedCourse.quiz[currentQuestionIdx].correct) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    if (currentQuestionIdx < selectedCourse.quiz.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setQuizFinished(true);
      const isPassed = quizScore + (selectedAnswer === selectedCourse.quiz[currentQuestionIdx].correct ? 1 : 0) === selectedCourse.quiz.length;
      if (isPassed) {
        onCourseCompleted(selectedCourse.id, selectedCourse.badge);
      }
    }
  };

  const isCompleted = completedCourses.includes(selectedCourse.id);

  return (
    <div className="training-container animate-fade-in">
      <div className="training-hero" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', background: 'linear-gradient(to right, #00e5ff, #d400ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {t.training.title}
        </h1>
        <p style={{ fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
          {t.training.subtitle}
        </p>
      </div>

      {/* Course Level Tabs */}
      <div className="training-tabs-nav" style={{ flexWrap: 'wrap', gap: '0.8rem' }}>
        {courses.map((c, idx) => (
          <button 
            key={c.id} 
            className={`level-tab-btn ${selectedCourse.id === c.id ? 'active' : ''}`}
            onClick={() => handleLevelChange(c.level, idx)}
            style={{ padding: '0.7rem 1.1rem', fontSize: '0.88rem' }}
          >
            <span>{c.title.split('—')[0] || c.title}</span>
          </button>
        ))}
      </div>

      <div className="training-layout">
        {/* Left column: Video & Cheat Sheets */}
        <div className="training-learning-side">
          <div className="glass-card module-main-card">
            <div className="module-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`badge ${
                selectedCourse.level.includes('Débutant') || selectedCourse.level.includes('Beginner') 
                  ? 'badge-info' 
                  : selectedCourse.level.includes('Intermédiaire') || selectedCourse.level.includes('Intermediate') 
                    ? 'badge-warning' 
                    : 'badge-danger'
              }`}>
                {t.training.moduleLevel} : {selectedCourse.level}
              </span>
              {isCompleted && (
                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <CheckCircle size={14} /> {t.training.validated}
                </span>
              )}
            </div>
            
            <h2 style={{ color: 'var(--color-text)', fontSize: '1.8rem', marginTop: '0.8rem', marginBottom: '0.5rem' }}>
              {selectedCourse.title}
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>{selectedCourse.description}</p>

            {/* REAL EMBEDDED YOUTUBE VIDEO */}
            <div className="video-player-container">
              <div className="youtube-embed-wrapper" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px' }}>
                <iframe
                  src={selectedCourse.videoUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onPlay={() => setWatching(true)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                ></iframe>
              </div>
              
              {/* Video Validation Watch Tracker */}
              <div className="video-controls" style={{ justifyContent: 'space-between', padding: '1rem' }}>
                {!watched ? (
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setWatching(true)}
                    disabled={watching}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {watching 
                      ? `${language === 'fr' ? 'Validation dans' : 'Validating in'} ${10 - watchSeconds}s...` 
                      : (language === 'fr' ? 'Déclencher la validation du visionnage' : 'Unlock quiz assessment')}
                  </button>
                ) : (
                  <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle size={14} /> {language === 'fr' ? 'Visionnage complété (Quiz débloqué)' : 'Video watched (Quiz unlocked)'}
                  </span>
                )}
                <span className="time-display">{selectedCourse.duration}</span>
              </div>
            </div>

            {/* Fiche & Exemple */}
            <div className="course-text-details" style={{ marginTop: '2rem' }}>
              <div className="details-grid">
                <div className="details-panel glass-card">
                  <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={18} />
                    {t.training.reviewTitle}
                  </h4>
                  <ul className="sheet-points">
                    {selectedCourse.sheet.points.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>

                <div className="details-panel glass-card">
                  <h4 style={{ color: 'var(--secondary)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} />
                    {t.training.caseTitle}
                  </h4>
                  <h5 style={{ color: 'var(--color-text)', fontSize: '1rem', marginBottom: '0.7rem', lineHeight: 1.4 }}>{selectedCourse.example.title}</h5>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>{selectedCourse.example.description}</p>
                  <div className="lesson-box">
                    <strong>{t.training.lessonLearned}</strong> {selectedCourse.example.lessons}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Assessments */}
        <div className="training-quiz-side">
          <div className="glass-card quiz-card" style={{ height: '100%' }}>
            {!quizStarted && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <Award size={48} className="animate-float" style={{ color: 'var(--primary)', marginBottom: '1.2rem' }} />
                <h3 style={{ color: 'var(--color-text)', fontSize: '1.4rem', marginBottom: '0.8rem' }}>{t.training.quizTitle}</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  {t.training.quizDesc.replace('badge', selectedCourse.badge.name)}
                </p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setQuizStarted(true)}
                >
                  {t.training.startQuiz}
                </button>
                {!watched && !isCompleted && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
                    {language === 'fr' ? 'Astuce : regardez la vidéo avant pour mieux répondre.' : 'Tip: watch the video first to answer more easily.'}
                  </p>
                )}
              </div>
            )}

            {quizStarted && !quizFinished && (
              <div className="quiz-active-interface">
                <div className="quiz-progress-bar">
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Question {currentQuestionIdx + 1} / {selectedCourse.quiz.length}</span>
                  <div className="quiz-progress-track">
                    <div className="quiz-progress-fill" style={{ width: `${((currentQuestionIdx) / selectedCourse.quiz.length) * 100}%` }}></div>
                  </div>
                </div>

                <h3 style={{ color: 'var(--color-text)', fontSize: '1.15rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  {selectedCourse.quiz[currentQuestionIdx].question}
                </h3>

                <div className="quiz-options-list">
                  {selectedCourse.quiz[currentQuestionIdx].options.map((opt, oIdx) => {
                    let btnClass = 'quiz-opt-btn';
                    if (selectedAnswer !== null) {
                      if (oIdx === selectedCourse.quiz[currentQuestionIdx].correct) {
                        btnClass += ' correct';
                      } else if (oIdx === selectedAnswer) {
                        btnClass += ' incorrect';
                      } else {
                        btnClass += ' disabled';
                      }
                    }

                    return (
                      <button 
                        key={oIdx} 
                        className={btnClass}
                        onClick={() => handleAnswerSubmit(oIdx)}
                        disabled={selectedAnswer !== null}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedAnswer !== null && (
                  <div className="quiz-explanation-box animate-fade-in" style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    border: '1px solid',
                    background: selectedAnswer === selectedCourse.quiz[currentQuestionIdx].correct ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 61, 0, 0.08)',
                    borderColor: selectedAnswer === selectedCourse.quiz[currentQuestionIdx].correct ? 'var(--success)' : 'var(--danger)',
                    color: selectedAnswer === selectedCourse.quiz[currentQuestionIdx].correct ? 'var(--success)' : 'var(--color-text)'
                  }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      {selectedAnswer === selectedCourse.quiz[currentQuestionIdx].correct 
                        ? <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} /> 
                        : <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem', color: 'var(--danger)' }} />
                      }
                      <div>
                        <strong>{selectedAnswer === selectedCourse.quiz[currentQuestionIdx].correct ? t.common.correct : t.common.incorrect}</strong>
                        <p style={{ marginTop: '0.3rem', color: 'var(--color-text)' }}>{selectedCourse.quiz[currentQuestionIdx].explanation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAnswer !== null && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ marginTop: '1.5rem', width: '100%' }}
                    onClick={nextQuestion}
                  >
                    {currentQuestionIdx < selectedCourse.quiz.length - 1 ? t.common.next : t.common.close}
                  </button>
                )}
              </div>
            )}

            {quizFinished && (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }} className="animate-fade-in">
                {quizScore === selectedCourse.quiz.length ? (
                  <>
                    <div className="badge-reward-glow animate-float" style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: selectedCourse.badge.color,
                      boxShadow: `0 0 30px ${selectedCourse.badge.color}66`,
                      margin: '0 auto 1.5rem auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000'
                    }}>
                      <Award size={40} />
                    </div>
                    <h3 style={{ color: 'var(--color-text)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>{t.training.quizSuccessTitle}</h3>
                    <p style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      Score : {quizScore} / {selectedCourse.quiz.length}
                    </p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      {t.training.quizSuccessDesc}
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1.2rem' }} />
                    <h3 style={{ color: 'var(--color-text)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>{t.training.quizFailTitle}</h3>
                    <p style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      Score : {quizScore} / {selectedCourse.quiz.length}
                    </p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      {t.training.quizFailDesc}
                    </p>
                  </>
                )}
                
                <button className="btn btn-primary" onClick={resetQuiz}>
                  {quizScore === selectedCourse.quiz.length ? t.common.replay : t.common.tryAgain}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
