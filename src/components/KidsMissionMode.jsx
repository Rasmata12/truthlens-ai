import React, { useState } from 'react';
import { Shield, Image as ImageIcon, Globe2, Bot, Check, X, Sparkles } from 'lucide-react';
import { MISSIONS } from './KidsIllustrations';

const TXT = {
  fr: {
    brand: 'Junior', nav: ['Accueil', 'Jeux', 'Apprendre', 'Défis', 'Amis'],
    leaderboard: 'Classement', rewards: 'Récompenses', profile: 'Profil',
    missionTitle: 'MISSION : DÉTECTIVE DU VRAI !',
    missionDesc: 'Regarde attentivement et décide : cette information est-elle vraie ou fausse ?',
    toVerify: 'À vérifier', vrai: 'VRAI', faux: 'FAUX',
    toolsTitle: 'OUTILS DU DÉTECTIVE',
    tool1: 'Analyser l\u2019image', tool1Desc: 'Cherche les indices cachés dans l\u2019image.', tool1Btn: 'Analyser',
    tool2: 'Vérifier la source', tool2Desc: 'Découvre d\u2019où vient cette information.', tool2Btn: 'Vérifier',
    tool3: 'Détecter l\u2019IA', tool3Desc: 'L\u2019IA a-t-elle créé cette image ?', tool3Btn: 'Scanner',
    mission: 'Mission', correctFeedback: 'Bonne réponse !', wrongFeedback: 'Pas tout à fait...',
    next: 'Mission suivante', allDone: 'Toutes les missions sont terminées, bravo détective !',
    level: 'NIVEAU',
  },
  en: {
    brand: 'Junior', nav: ['Home', 'Games', 'Learn', 'Challenges', 'Friends'],
    leaderboard: 'Leaderboard', rewards: 'Rewards', profile: 'Profile',
    missionTitle: 'MISSION: TRUTH DETECTIVE!',
    missionDesc: 'Look closely and decide: is this information true or false?',
    toVerify: 'To check', vrai: 'TRUE', faux: 'FALSE',
    toolsTitle: 'DETECTIVE TOOLS',
    tool1: 'Analyze the image', tool1Desc: 'Look for hidden clues in the image.', tool1Btn: 'Analyze',
    tool2: 'Check the source', tool2Desc: 'Find out where this info comes from.', tool2Btn: 'Check',
    tool3: 'Detect AI', tool3Desc: 'Did AI create this image?', tool3Btn: 'Scan',
    mission: 'Mission', correctFeedback: 'Correct answer!', wrongFeedback: 'Not quite...',
    next: 'Next mission', allDone: 'All missions complete, great job detective!',
    level: 'LEVEL',
  }
};

export default function KidsMissionMode({ language, onMissionAnswered }) {
  const s = TXT[language] || TXT.fr;
  const [missionIdx, setMissionIdx] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
  const [revealedClues, setRevealedClues] = useState({ image: false, source: false, ai: false });

  const mission = MISSIONS[missionIdx];

  const handleAnswer = (userSaysTrue) => {
    if (answered) return;
    const correct = userSaysTrue === mission.isTrue;
    setAnswered(correct ? 'correct' : 'wrong');
    onMissionAnswered(correct);
  };

  const goNext = () => {
    setAnswered(null);
    setRevealedClues({ image: false, source: false, ai: false });
    setMissionIdx(prev => (prev + 1) % MISSIONS.length);
  };

  const toggleClue = (key) => setRevealedClues(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="tj-shell tj-shell-nosidebar">
      <div className="tj-main">
        <div className="tj-mission-header">
          <div className="tj-detective-badge"><Shield size={28} /></div>
          <div>
            <h2>{s.missionTitle}</h2>
            <p>{s.missionDesc}</p>
          </div>
        </div>

        <div className="tj-content-grid">
          {/* Mission card */}
          <div className="tj-mission-card">
            <div className="tj-mission-image">
              <span className="tj-to-verify-badge"><Sparkles size={12} /> {s.toVerify}</span>
              <mission.Illustration />
            </div>
            <p className="tj-mission-claim">{mission.claim[language] || mission.claim.fr}</p>

            {!answered ? (
              <div className="tj-vrai-faux-row">
                <button className="tj-btn-vrai" onClick={() => handleAnswer(true)}><Check size={18} /> {s.vrai}</button>
                <button className="tj-btn-faux" onClick={() => handleAnswer(false)}><X size={18} /> {s.faux}</button>
              </div>
            ) : (
              <div className={`tj-feedback ${answered}`}>
                <strong>{answered === 'correct' ? s.correctFeedback : s.wrongFeedback}</strong>
                <p>{mission.explanation[language] || mission.explanation.fr}</p>
                <button className="tj-btn-next" onClick={goNext}>{s.next}</button>
              </div>
            )}
          </div>

          {/* Tools panel */}
          <div className="tj-tools-card">
            <h3><Sparkles size={16} /> {s.toolsTitle}</h3>

            {[
              { key: 'image', Icon: ImageIcon, label: s.tool1, desc: s.tool1Desc, btn: s.tool1Btn, color: '#22c55e' },
              { key: 'source', Icon: Globe2, label: s.tool2, desc: s.tool2Desc, btn: s.tool2Btn, color: '#3b82f6' },
              { key: 'ai', Icon: Bot, label: s.tool3, desc: s.tool3Desc, btn: s.tool3Btn, color: '#a855f7' },
            ].map(tool => (
              <div key={tool.key} className="tj-tool-row">
                <div className="tj-tool-icon" style={{ background: `${tool.color}22`, color: tool.color }}>
                  <tool.Icon size={20} />
                </div>
                <div className="tj-tool-text">
                  <strong>{tool.label}</strong>
                  <p>{revealedClues[tool.key] ? (mission.clues[tool.key][language] || mission.clues[tool.key].fr) : tool.desc}</p>
                </div>
                <button className="tj-tool-btn" style={{ background: tool.color }} onClick={() => toggleClue(tool.key)}>
                  {tool.btn}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
