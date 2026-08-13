import React, { useState, useEffect } from 'react';
import { kidsQuizzesData, translations } from '../translations';
import { Award, ShieldAlert, Sparkles, Smile, Star, ArrowRight, Check, AlertTriangle, RotateCcw, ScanSearch, Link2, Bird, Dog, Cat, Rabbit, X, PartyPopper, Lightbulb, Trophy } from 'lucide-react';
import { ILLUSTRATIONS } from './KidsIllustrations';
import KidsMissionMode from './KidsMissionMode';
import AiOrRealMode from './AiOrRealMode';

const AVATARS = [
  { id: 'owl', name: 'Chouette Savante / Smart Owl', Icon: Bird, color: '#ffb300' },
  { id: 'dog', name: 'Chien DÃ©tective / Dog Detective', Icon: Dog, color: '#00e5ff' },
  { id: 'cat', name: 'Chat Ninja / Cat Ninja', Icon: Cat, color: '#00e676' },
  { id: 'fox', name: 'Renard RusÃ© / Sly Fox', Icon: Rabbit, color: '#ff3d00' }
];

// Maps illustration icon names (from translations.js) to actual lucide components (fallback)
const ILLUSTRATION_ICONS = { Sparkles, ScanSearch, Link2, ShieldAlert };

export default function KidsArena({ language, completedKidsQuizzes, onKidsQuizCompleted, userPoints, onMissionAnswered }) {
  const t = translations[language];
  const kidsQuizzes = kidsQuizzesData[language];
  const [gameMode, setGameMode] = useState('missions'); // 'missions' (new) or 'quizzes' (classic)
  
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  
  // Game states
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  // Sync active quiz when language shifts
  useEffect(() => {
    if (activeQuiz) {
      const currentId = activeQuiz.id;
      const matched = kidsQuizzes.find(q => q.id === currentId);
      if (matched) {
        setActiveQuiz(matched);
      }
    }
  }, [language]);

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQIndex(0);
    setSelectedOpt(null);
    setPointsEarned(0);
    setCorrectAnswersCount(0);
    setQuizFinished(false);
  };

  const handleSelectOption = (oIdx) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(oIdx);
    
    const isCorrect = oIdx === activeQuiz.questions[currentQIndex].correct;
    if (isCorrect) {
      setPointsEarned(prev => prev + 50);
      setCorrectAnswersCount(prev => prev + 1);
    }
  };

  const nextStep = () => {
    setSelectedOpt(null);
    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
      onKidsQuizCompleted(activeQuiz.id, pointsEarned, activeQuiz.badge);
    }
  };

  const leaveArena = () => {
    setActiveQuiz(null);
  };

  return (
    <div className="kids-theme-container animate-fade-in">
      <div className="kids-header-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 238, 85, 0.1)', padding: '0.5rem 1.2rem', borderRadius: '20px', border: '1px solid rgba(255, 238, 85, 0.3)', marginBottom: '1rem' }}>
          <Smile size={18} style={{ color: '#ffee55' }} />
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: '800', color: '#ffee55', fontSize: '0.85rem', letterSpacing: '0.05em' }}>KIDS ARENA</span>
        </div>
        <h1 style={{ fontSize: '2.8rem', color: '#fff', textShadow: '0 0 15px rgba(255, 238, 85, 0.3)', marginBottom: '0.6rem' }}>
          {t.kids.title}
        </h1>
        <p style={{ color: '#d1c4e9', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto' }}>
          {t.kids.subtitle}
        </p>
      </div>

      <div className="tj-mode-switch" style={{ justifyContent: 'center' }}>
        <button className={`tj-mode-btn ${gameMode === 'missions' ? 'active' : ''}`} onClick={() => setGameMode('missions')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ScanSearch size={15} /> {language === 'fr' ? 'Missions DÃ©tective' : 'Detective Missions'}
        </button>
        <button className={`tj-mode-btn ${gameMode === 'quizzes' ? 'active' : ''}`} onClick={() => setGameMode('quizzes')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Award size={15} /> {language === 'fr' ? 'Quiz classiques' : 'Classic quizzes'}
        </button>
        <button className={`tj-mode-btn ${gameMode === 'aiorreal' ? 'active' : ''}`} onClick={() => setGameMode('aiorreal')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={15} /> {language === 'fr' ? 'IA ou RÃ©el' : 'AI or Real'}
        </button>
      </div>

      {gameMode === 'missions' && (
        <KidsMissionMode language={language} userPoints={userPoints} onMissionAnswered={onMissionAnswered} />
      )}

      {gameMode === 'aiorreal' && (
        <AiOrRealMode language={language} />
      )}

      {gameMode === 'quizzes' && (
      <>
      {/* Portal Selection */}
      {!activeQuiz && (
        <div className="kids-portal-grid">
          {/* Avatar card */}
          <div className="glass-card kids-card avatar-card">
            <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1rem' }}>{t.kids.companionTitle}</h3>
            <div className="avatar-grid">
              {AVATARS.map(avatar => (
                <button 
                  key={avatar.id} 
                  className={`avatar-pick-btn ${selectedAvatar.id === avatar.id ? 'active' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  style={{ '--border-glow': avatar.color }}
                >
                  <span className="avatar-emoji"><avatar.Icon size={28} color={avatar.color} /></span>
                  <span className="avatar-name" style={{ fontSize: '0.65rem', textAlign: 'center' }}>
                    {language === 'fr' ? avatar.name.split('/')[0].trim() : avatar.name.split('/')[1].trim()}
                  </span>
                </button>
              ))}
            </div>
            <div className="avatar-welcome-bubble">
              <span className="bubble-emoji"><selectedAvatar.Icon size={32} color={selectedAvatar.color} /></span>
              <p>
                <strong>{language === 'fr' ? selectedAvatar.name.split('/')[0].trim() : selectedAvatar.name.split('/')[1].trim()} :</strong> {t.kids.welcomeMsg}
              </p>
            </div>
          </div>

          {/* Quizzes list */}
          <div className="kids-quizzes-list">
            <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '1.2rem' }}>{t.kids.gameLevelTitle}</h3>
            <div className="quiz-cards-grid">
              {kidsQuizzes.map(quiz => {
                const isPassed = completedKidsQuizzes.includes(quiz.id);
                return (
                  <div key={quiz.id} className="glass-card kids-game-card" style={{ background: quiz.bgColor }}>
                    <div className="game-card-content">
                      <span className="kids-age-badge">{quiz.ageRange}</span>
                      <h4 className="game-title">{quiz.title}</h4>
                      <p className="game-theme">{quiz.theme}</p>
                      
                      <div className="game-rewards">
                        <span className="reward-item"><Star size={14} fill="#fff" /> {quiz.points} {t.common.points}</span>
                        <span className="reward-item"><Award size={14} /> {t.common.badge}</span>
                      </div>
                      
                      <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {isPassed ? (
                          <span className="passed-banner">{t.kids.passedBadge}</span>
                        ) : <span></span>}
                        <button className="btn kids-play-btn" onClick={() => startQuiz(quiz)}>
                          {t.common.play} <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Gameplay */}
      {activeQuiz && (
        <div className="glass-card kids-gameplay-card animate-fade-in">
          <div className="gameplay-header">
            <button className="btn btn-secondary btn-sm" onClick={leaveArena}>
              {t.kids.btnExit}
            </button>
            <div className="gameplay-score">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>{t.kids.playerName} <selectedAvatar.Icon size={16} color={selectedAvatar.color} /> {language === 'fr' ? selectedAvatar.name.split('/')[0].trim() : selectedAvatar.name.split('/')[1].trim()}</span>
              <span className="kids-score-pill"><Star size={13} fill="#ffee55" color="#ffee55" style={{ display: 'inline', verticalAlign: '-2px' }} /> {pointsEarned} {t.kids.pointsBadge}</span>
            </div>
          </div>

          {!quizFinished && (
            <div className="gameplay-active">
              <div className="kids-step-indicator">
                Question {currentQIndex + 1} / {activeQuiz.questions.length}
                <div className="kids-step-track">
                  <div className="kids-step-fill" style={{ width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%` }}></div>
                </div>
              </div>

              <div className="kids-question-box">
                <div className="kids-q-illustration animate-float">
                  {(() => {
                    const key = activeQuiz.questions[currentQIndex].illustration;
                    const DrawnIllustration = ILLUSTRATIONS[key];
                    if (DrawnIllustration) return <DrawnIllustration />;
                    const FallbackIcon = ILLUSTRATION_ICONS[key] || Sparkles;
                    return <FallbackIcon size={56} color="#fff" />;
                  })()}
                </div>
                <h2 className="kids-q-text">
                  {activeQuiz.questions[currentQIndex].question}
                </h2>
              </div>

              <div className="kids-options-grid">
                {activeQuiz.questions[currentQIndex].options.map((opt, oIdx) => {
                  let optClass = 'kids-opt-card';
                  if (selectedOpt !== null) {
                    if (oIdx === activeQuiz.questions[currentQIndex].correct) {
                      optClass += ' kids-correct';
                    } else if (oIdx === selectedOpt) {
                      optClass += ' kids-incorrect';
                    } else {
                      optClass += ' kids-disabled';
                    }
                  }

                  return (
                    <button 
                      key={oIdx}
                      className={optClass}
                      onClick={() => handleSelectOption(oIdx)}
                      disabled={selectedOpt !== null}
                    >
                      <span className="opt-marker">
                        {selectedOpt !== null && oIdx === activeQuiz.questions[currentQIndex].correct && <Check size={16} />}
                        {selectedOpt !== null && oIdx === selectedOpt && oIdx !== activeQuiz.questions[currentQIndex].correct && <X size={16} />}
                        {selectedOpt === null && (oIdx + 1)}
                      </span>
                      <span className="opt-text">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {selectedOpt !== null && (
                <div className="kids-explanation animate-fade-in" style={{
                  background: selectedOpt === activeQuiz.questions[currentQIndex].correct ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 61, 0, 0.15)',
                  border: `3px solid ${selectedOpt === activeQuiz.questions[currentQIndex].correct ? 'var(--success)' : 'var(--danger)'}`
                }}>
                  <div className="explanation-avatar-reaction">
                    {selectedOpt === activeQuiz.questions[currentQIndex].correct ? <PartyPopper size={32} color="var(--success)" /> : <Lightbulb size={32} color="var(--warning)" />}
                  </div>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                      {selectedOpt === activeQuiz.questions[currentQIndex].correct ? t.kids.kidsCorrect : t.kids.kidsIncorrect}
                    </h4>
                    <p style={{ color: '#fff', fontSize: '0.9rem' }}>{activeQuiz.questions[currentQIndex].explanation}</p>
                  </div>
                </div>
              )}

              {selectedOpt !== null && (
                <button className="btn kids-next-btn" onClick={nextStep}>
                  {currentQIndex < activeQuiz.questions.length - 1 ? t.common.next : t.common.close}
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          )}

          {/* Quiz Game Over */}
          {quizFinished && (
            <div className="gameplay-finished text-center animate-fade-in">
              <div className="finished-trophy">
                {correctAnswersCount === activeQuiz.questions.length ? <Trophy size={64} color="#ffee55" /> : <Award size={64} color="#ffee55" />}
              </div>
              <h2 style={{ fontSize: '2rem', color: '#ffee55', marginBottom: '0.5rem' }}>
                {correctAnswersCount === activeQuiz.questions.length ? t.kids.finishedTrophy : t.kids.finishedMedal}
              </h2>
              <p style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
                {language === 'fr' 
                  ? `Tu as rÃ©pondu correctement Ã  ${correctAnswersCount} question(s) sur ${activeQuiz.questions.length} !` 
                  : `You answered ${correctAnswersCount} out of ${activeQuiz.questions.length} questions correctly!`
                }
              </p>

              {correctAnswersCount === activeQuiz.questions.length ? (
                <div className="kids-badge-unlock glass-card">
                  <div className="kids-badge-display" style={{
                    background: activeQuiz.badge.color,
                    boxShadow: `0 0 25px ${activeQuiz.badge.color}66`
                  }}>
                    <Award size={36} style={{ color: '#000' }} />
                  </div>
                  <div>
                    <span className="badge-unlock-alert">{t.kids.badgeUnlocked}</span>
                    <h4 style={{ color: '#fff', fontSize: '1.2rem' }}>{activeQuiz.badge.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#d1c4e9', marginTop: '0.2rem' }}>{t.kids.badgeUnlockedDesc}</p>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#d1c4e9', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  {language === 'fr' 
                    ? 'Essaie encore une fois pour obtenir toutes les bonnes rÃ©ponses et gagner le badge !' 
                    : 'Try again to score a perfect count and earn the badge!'
                  }
                </p>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                <button className="btn kids-play-btn" onClick={() => startQuiz(activeQuiz)}>
                  <RotateCcw size={16} /> {t.common.replay}
                </button>
                <button className="btn btn-secondary" onClick={leaveArena}>
                  {t.common.back}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}

