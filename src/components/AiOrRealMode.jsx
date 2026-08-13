import React, { useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import houseWaterfallAi from '../assets/aivsreal/house-waterfall-ai.png';
import beachCliffsReal from '../assets/aivsreal/beach-cliffs-real.png';

const TXT = {
  fr: {
    banner: 'Ã€ TOI DE JOUER !', title: 'IA OU RÃ‰EL ?', subtitle: 'Laquelle de ces deux photos a Ã©tÃ© crÃ©Ã©e par une IA ?',
    choose: 'Choisis A ou B', correct: 'Bonne rÃ©ponse !', wrong: 'Pas tout Ã  fait...',
    next: 'Round suivant', round: 'Round',
  },
  en: {
    banner: 'GAME TIME!', title: 'AI OR REAL?', subtitle: 'Which of these two pictures was created by AI?',
    choose: 'Choose A or B', correct: 'Correct!', wrong: 'Not quite...',
    next: 'Next round', round: 'Round',
  },
};

const ROUNDS = [
  {
    id: 'r1',
    optionA: { img: beachCliffsReal, isAi: false },
    optionB: { img: houseWaterfallAi, isAi: true },
    explanation: {
      fr: "L'image B (la maison flottante) est gÃ©nÃ©rÃ©e par IA : une Ã®le qui flotte dans les airs n'existe pas dans la rÃ©alitÃ©, et les dÃ©tails (cascade, Ã©clairage) sont trop parfaitement composÃ©s. L'image A est une vraie photo de plage â€” la lumiÃ¨re et les textures sont naturelles.",
      en: "Image B (the floating house) is AI-generated: a floating island doesn't exist in reality, and the details (waterfall, lighting) are too perfectly composed. Image A is a real beach photo â€” the light and textures are natural.",
    },
  },
];

export default function AiOrRealMode({ language }) {
  const s = TXT[language] || TXT.fr;
  const [roundIdx, setRoundIdx] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
  const round = ROUNDS[roundIdx % ROUNDS.length];

  const handleChoose = (letter) => {
    if (answered) return;
    const chosenIsAi = letter === 'A' ? round.optionA.isAi : round.optionB.isAi;
    setAnswered(chosenIsAi ? 'correct' : 'wrong');
  };

  const goNext = () => {
    setAnswered(null);
    setRoundIdx((prev) => prev + 1);
  };

  return (
    <div className="aor-shell">
      <div className="aor-banner">{s.banner}</div>
      <h2 className="aor-title">{s.title}</h2>
      <p className="aor-subtitle">{s.subtitle}</p>

      <div className="aor-images-row">
        <div className={`aor-image-card ${answered ? (round.optionA.isAi ? 'is-ai' : 'is-real') : ''}`}>
          <span className="aor-letter-badge letter-a">A</span>
          <img src={round.optionA.img} alt="Option A" />
          {answered && (
            <div className="aor-result-tag">
              {round.optionA.isAi ? <><Sparkles size={13} /> IA</> : <><Check size={13} /> {language === 'fr' ? 'RÃ©el' : 'Real'}</>}
            </div>
          )}
        </div>
        <div className={`aor-image-card ${answered ? (round.optionB.isAi ? 'is-ai' : 'is-real') : ''}`}>
          <span className="aor-letter-badge letter-b">B</span>
          <img src={round.optionB.img} alt="Option B" />
          {answered && (
            <div className="aor-result-tag">
              {round.optionB.isAi ? <><Sparkles size={13} /> IA</> : <><Check size={13} /> {language === 'fr' ? 'RÃ©el' : 'Real'}</>}
            </div>
          )}
        </div>
      </div>

      {!answered ? (
        <>
          <p className="aor-choose-label">{s.choose}</p>
          <div className="aor-choice-row">
            <button className="aor-btn-a" onClick={() => handleChoose('A')}>A</button>
            <button className="aor-btn-b" onClick={() => handleChoose('B')}>B</button>
          </div>
        </>
      ) : (
        <div className={`aor-feedback ${answered}`}>
          <strong>{answered === 'correct' ? s.correct : s.wrong}</strong>
          <p>{round.explanation[language] || round.explanation.fr}</p>
          <button className="aor-btn-next" onClick={goNext}>{s.next}</button>
        </div>
      )}
    </div>
  );
}

