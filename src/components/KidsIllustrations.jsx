import React from 'react';
import sharkEiffelPhoto from '../assets/missions/shark-eiffel.png';

// Petites illustrations dessinées à la main (SVG), pensées pour les enfants :
// des formes rondes, des couleurs vives, pas de photoréalisme. Chacune remplace
// un ancien emoji par un vrai petit dessin animable en CSS (voir .kids-q-illustration).

export function CatOnCloud() {
  return (
    <svg viewBox="0 0 200 140" width="180" height="126" role="img" aria-label="Un chat imaginaire fait du vélo sur un nuage">
      <ellipse cx="100" cy="105" rx="70" ry="22" fill="#ffffff" opacity="0.9" />
      <circle cx="55" cy="95" r="24" fill="#ffffff" opacity="0.9" />
      <circle cx="145" cy="95" r="24" fill="#ffffff" opacity="0.9" />
      {/* vélo */}
      <circle cx="70" cy="90" r="16" fill="none" stroke="#ff8a65" strokeWidth="4" />
      <circle cx="130" cy="90" r="16" fill="none" stroke="#ff8a65" strokeWidth="4" />
      <line x1="70" y1="90" x2="100" y2="60" stroke="#ff8a65" strokeWidth="4" />
      <line x1="130" y1="90" x2="100" y2="60" stroke="#ff8a65" strokeWidth="4" />
      <line x1="100" y1="60" x2="86" y2="90" stroke="#ff8a65" strokeWidth="4" />
      {/* chat */}
      <circle cx="100" cy="45" r="18" fill="#ffb74d" />
      <polygon points="88,32 84,18 96,30" fill="#ffb74d" />
      <polygon points="112,32 116,18 104,30" fill="#ffb74d" />
      <circle cx="94" cy="44" r="2.5" fill="#3a2a1a" />
      <circle cx="106" cy="44" r="2.5" fill="#3a2a1a" />
      <path d="M96 51 Q100 55 104 51" fill="none" stroke="#3a2a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function MagnifyingHands() {
  return (
    <svg viewBox="0 0 200 140" width="180" height="126" role="img" aria-label="Une loupe qui inspecte une main dessinée">
      <circle cx="90" cy="60" r="38" fill="none" stroke="#00e5ff" strokeWidth="8" />
      <line x1="118" y1="88" x2="150" y2="120" stroke="#00e5ff" strokeWidth="10" strokeLinecap="round" />
      <g transform="translate(60,35)">
        <path d="M20 50 Q10 20 20 5 Q26 -2 30 5 Q34 -4 40 4 Q45 -3 50 6 Q55 0 58 8 Q62 25 55 50 Z"
          fill="#ffd699" stroke="#c88a4a" strokeWidth="2" />
      </g>
      <circle cx="150" cy="30" r="10" fill="#ffee55" opacity="0.9" />
    </svg>
  );
}

export function SuspiciousLink() {
  return (
    <svg viewBox="0 0 200 140" width="180" height="126" role="img" aria-label="Un message avec un lien suspect et un pingouin étonné">
      <rect x="30" y="20" width="140" height="70" rx="14" fill="#ffffff" opacity="0.95" />
      <rect x="45" y="35" width="90" height="8" rx="4" fill="#cbd5e1" />
      <rect x="45" y="50" width="70" height="8" rx="4" fill="#cbd5e1" />
      <rect x="45" y="65" width="55" height="14" rx="7" fill="#ff5252" />
      <text x="72" y="75" fontSize="9" fill="#fff" fontFamily="sans-serif">clique ici !</text>
      {/* pingouin */}
      <ellipse cx="100" cy="118" rx="20" ry="16" fill="#37474f" />
      <ellipse cx="100" cy="122" rx="12" ry="10" fill="#ffffff" />
      <circle cx="100" cy="106" r="12" fill="#37474f" />
      <circle cx="96" cy="104" r="2" fill="#fff" />
      <circle cx="104" cy="104" r="2" fill="#fff" />
      <polygon points="98,110 102,110 100,115" fill="#ff9800" />
    </svg>
  );
}

export function ScamGift() {
  return (
    <svg viewBox="0 0 200 140" width="180" height="126" role="img" aria-label="Un cadeau piège avec un point d'exclamation d'alerte">
      <rect x="70" y="55" width="60" height="55" rx="6" fill="#ff8a65" />
      <rect x="70" y="55" width="60" height="16" fill="#ffab91" />
      <rect x="95" y="55" width="10" height="55" fill="#fff3e0" />
      <path d="M100 55 Q80 35 65 45 Q65 55 85 55 Z" fill="#ffcc80" />
      <path d="M100 55 Q120 35 135 45 Q135 55 115 55 Z" fill="#ffcc80" />
      <circle cx="150" cy="35" r="20" fill="#ffee55" />
      <text x="145" y="43" fontSize="24" fontWeight="bold" fill="#c62828" fontFamily="sans-serif">!</text>
    </svg>
  );
}

export function ShadowClue() {
  return (
    <svg viewBox="0 0 200 140" width="180" height="126" role="img" aria-label="Deux personnages dont les ombres pointent dans des directions différentes">
      <circle cx="160" cy="25" r="14" fill="#ffee55" />
      <ellipse cx="100" cy="118" rx="80" ry="10" fill="#ffffff" opacity="0.5" />
      {/* character 1 */}
      <circle cx="60" cy="75" r="14" fill="#ffb74d" />
      <rect x="50" y="88" width="20" height="28" rx="6" fill="#4fc3f7" />
      <polygon points="60,116 30,122 60,120" fill="#1a1a2e" opacity="0.6" />
      {/* character 2 */}
      <circle cx="135" cy="75" r="14" fill="#ff8a65" />
      <rect x="125" y="88" width="20" height="28" rx="6" fill="#ba68c8" />
      <polygon points="135,116 175,110 135,120" fill="#1a1a2e" opacity="0.6" />
      <text x="30" y="16" fontSize="18" fill="#ff5252" fontFamily="sans-serif">?</text>
    </svg>
  );
}

export function FishPhoto() {
  return (
    <svg viewBox="0 0 200 140" width="180" height="126" role="img" aria-label="Un poisson géant photographié à côté de villageois">
      <rect x="20" y="20" width="160" height="100" rx="10" fill="#ffffff" opacity="0.9" />
      <rect x="30" y="30" width="140" height="80" rx="6" fill="#4fc3f7" opacity="0.3" />
      <ellipse cx="100" cy="75" rx="55" ry="22" fill="#42a5f5" />
      <polygon points="150,75 175,60 175,90" fill="#1e88e5" />
      <circle cx="65" cy="70" r="4" fill="#fff" />
      <circle cx="140" cy="100" r="10" fill="#ffb74d" />
      <circle cx="140" cy="93" r="6" fill="#ffb74d" />
    </svg>
  );
}

export function PhoneScam() {
  return (
    <svg viewBox="0 0 200 140" width="180" height="126" role="img" aria-label="Un téléphone qui reçoit un appel suspect">
      <rect x="70" y="15" width="60" height="110" rx="12" fill="#ffffff" opacity="0.95" />
      <rect x="78" y="28" width="44" height="72" rx="4" fill="#42a5f5" opacity="0.25" />
      <circle cx="100" cy="112" r="6" fill="#cbd5e1" />
      <circle cx="100" cy="60" r="20" fill="#ff5252" />
      <text x="93" y="67" fontSize="18" fontWeight="bold" fill="#fff" fontFamily="sans-serif">!</text>
      <path d="M55 45 Q45 60 55 75" fill="none" stroke="#ffee55" strokeWidth="4" strokeLinecap="round" />
      <path d="M145 45 Q155 60 145 75" fill="none" stroke="#ffee55" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function RobotVoice() {
  return (
    <svg viewBox="0 0 200 140" width="180" height="126" role="img" aria-label="Une enceinte robotique qui émet des ondes sonores">
      <rect x="70" y="35" width="60" height="70" rx="14" fill="#78909c" />
      <circle cx="100" cy="60" r="14" fill="#37474f" />
      <circle cx="100" cy="60" r="7" fill="#00e5ff" />
      <rect x="85" y="82" width="30" height="10" rx="5" fill="#37474f" />
      <path d="M138 50 Q150 60 138 70" fill="none" stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" />
      <path d="M150 42 Q168 60 150 78" fill="none" stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      <path d="M62 50 Q50 60 62 70" fill="none" stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// ---- Mission Mode illustrations (Vrai/Faux detective game) ----

export function SharkEiffelPhoto() {
  return <img src={sharkEiffelPhoto} alt="Un requin bondissant devant une tour, image générée" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
}

export function DoubleRainbow() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Un double arc-en-ciel après la pluie">
      <rect width="300" height="200" fill="#90caf9" />
      <path d="M20 170 A130 130 0 0 1 280 170" fill="none" stroke="#ef5350" strokeWidth="8" />
      <path d="M35 170 A115 115 0 0 1 265 170" fill="none" stroke="#ffb300" strokeWidth="8" />
      <path d="M50 170 A100 100 0 0 1 250 170" fill="none" stroke="#66bb6a" strokeWidth="8" />
      <path d="M65 170 A85 85 0 0 1 235 170" fill="none" stroke="#42a5f5" strokeWidth="8" />
      <circle cx="245" cy="35" r="22" fill="#ffee58" />
      <ellipse cx="80" cy="60" rx="35" ry="18" fill="#eceff1" />
      <rect y="168" width="300" height="32" fill="#81c784" />
    </svg>
  );
}

export function GiantSpiderCar() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Une araignée géante à côté d'une voiture">
      <rect width="300" height="200" fill="#3e2723" opacity="0.15" />
      <rect x="40" y="145" width="90" height="30" rx="8" fill="#e53935" />
      <circle cx="60" cy="178" r="10" fill="#212121" />
      <circle cx="112" cy="178" r="10" fill="#212121" />
      <rect x="55" y="130" width="45" height="20" rx="6" fill="#e53935" />
      <ellipse cx="210" cy="150" rx="35" ry="25" fill="#3e2723" />
      <circle cx="205" cy="140" r="6" fill="#ff5252" />
      <circle cx="218" cy="140" r="6" fill="#ff5252" />
      <line x1="185" y1="160" x2="150" y2="185" stroke="#3e2723" strokeWidth="5" />
      <line x1="190" y1="170" x2="160" y2="195" stroke="#3e2723" strokeWidth="5" />
      <line x1="235" y1="160" x2="270" y2="185" stroke="#3e2723" strokeWidth="5" />
      <line x1="230" y1="170" x2="265" y2="195" stroke="#3e2723" strokeWidth="5" />
    </svg>
  );
}

export function AstronautCat() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Un chat astronaute dans l'espace">
      <rect width="300" height="200" fill="#0d1b2a" />
      <circle cx="40" cy="30" r="2" fill="#fff" />
      <circle cx="90" cy="60" r="2" fill="#fff" />
      <circle cx="250" cy="40" r="2" fill="#fff" />
      <circle cx="270" cy="120" r="2" fill="#fff" />
      <circle cx="30" cy="150" r="2" fill="#fff" />
      <circle cx="200" cy="170" r="3" fill="#fff" />
      <circle cx="150" cy="100" r="45" fill="#eceff1" />
      <circle cx="150" cy="100" r="34" fill="#0d1b2a" />
      <circle cx="150" cy="105" r="26" fill="#ffb74d" />
      <polygon points="130,88 122,72 140,84" fill="#ffb74d" />
      <polygon points="170,88 178,72 160,84" fill="#ffb74d" />
      <circle cx="142" cy="102" r="3" fill="#1a1a2e" />
      <circle cx="158" cy="102" r="3" fill="#1a1a2e" />
      <path d="M144 112 Q150 116 156 112" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function FloatingIsland() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Une île flottant au-dessus de l'océan">
      <rect width="300" height="200" fill="#4fc3f7" />
      <rect y="150" width="300" height="50" fill="#0288d1" />
      <ellipse cx="150" cy="95" rx="70" ry="30" fill="#8d6e63" />
      <ellipse cx="150" cy="80" rx="55" ry="22" fill="#66bb6a" />
      <ellipse cx="150" cy="140" rx="60" ry="10" fill="#ffffff" opacity="0.6" />
      <circle cx="240" cy="30" r="18" fill="#ffee58" />
    </svg>
  );
}

export function TwoMoonsEarth() {
  return (
    <svg viewBox="0 0 300 200" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="La Terre avec deux lunes">
      <rect width="300" height="200" fill="#0d1b2a" />
      <circle cx="30" cy="40" r="2" fill="#fff" />
      <circle cx="270" cy="60" r="2" fill="#fff" />
      <circle cx="250" cy="150" r="2" fill="#fff" />
      <circle cx="120" cy="170" r="50" fill="#42a5f5" />
      <ellipse cx="105" cy="155" rx="18" ry="10" fill="#66bb6a" />
      <ellipse cx="140" cy="185" rx="14" ry="8" fill="#66bb6a" />
      <circle cx="220" cy="70" r="20" fill="#cfd8dc" />
      <circle cx="212" cy="64" r="3" fill="#90a4ae" />
      <circle cx="225" cy="78" r="4" fill="#90a4ae" />
      <circle cx="250" cy="120" r="10" fill="#eceff1" />
      <circle cx="248" cy="117" r="2" fill="#b0bec5" />
    </svg>
  );
}

export const MISSIONS = [
  { id: 'm1', Illustration: SharkEiffelPhoto, isTrue: false,
    claim: { fr: "Un requin géant a été aperçu dans le fleuve à Paris hier soir !", en: "A giant shark was spotted in the Paris river last night!" },
    explanation: { fr: "Faux ! Les requins ne vivent pas dans l'eau douce de la Seine. Cette image est un photomontage — regarde comme l'eau autour de l'aileron ne bouge pas naturellement.", en: "False! Sharks don't live in the Seine's fresh water. This image is a composite — notice how the water around the fin doesn't move naturally." },
    clues: {
      image: { fr: "L'éclairage sur le requin ne correspond pas à celui du pont en arrière-plan.", en: "The lighting on the shark doesn't match the bridge in the background." },
      source: { fr: "Cette image circule sans lien vers aucun média officiel parisien.", en: "This image circulates without any link to an official Paris news outlet." },
      ai: { fr: "Les bords de l'aileron sont anormalement lisses, typique d'un montage.", en: "The fin's edges are unusually smooth, typical of a composite image." },
    }
  },
  { id: 'm2', Illustration: DoubleRainbow, isTrue: true,
    claim: { fr: "Un double arc-en-ciel est apparu dans le ciel juste après une averse.", en: "A double rainbow appeared in the sky right after a rain shower." },
    explanation: { fr: "Vrai ! Les doubles arcs-en-ciel sont un vrai phénomène naturel — la lumière se réfléchit deux fois à l'intérieur des gouttes de pluie. Pas besoin d'un piège, la nature est parfois spectaculaire !", en: "True! Double rainbows are a real natural phenomenon — light reflects twice inside raindrops. No trick needed, nature can be spectacular on its own!" },
    clues: {
      image: { fr: "Les couleurs sont inversées entre les deux arcs — exactement comme en vrai.", en: "The colors are reversed between the two arcs — exactly like in real double rainbows." },
      source: { fr: "Des centaines de personnes ont partagé des photos similaires ce jour-là.", en: "Hundreds of people shared similar photos that same day." },
      ai: { fr: "Aucun signe de montage : le grain et la lumière sont cohérents partout.", en: "No signs of editing: grain and lighting are consistent everywhere." },
    }
  },
  { id: 'm3', Illustration: GiantSpiderCar, isTrue: false,
    claim: { fr: "Une araignée aussi grande qu'une voiture a été filmée dans une forêt.", en: "A spider as big as a car was filmed in a forest." },
    explanation: { fr: "Faux ! Aucune araignée de cette taille n'existe sur Terre. Ce genre d'image utilise souvent un vrai objet (comme une voiture) pour donner une fausse impression d'échelle.", en: "False! No spider that size exists on Earth. This kind of image often uses a real object (like a car) to create a false sense of scale." },
    clues: {
      image: { fr: "L'ombre de l'araignée ne correspond pas à la direction de la lumière sur la voiture.", en: "The spider's shadow doesn't match the light direction on the car." },
      source: { fr: "Aucun scientifique ni musée n'a jamais confirmé une telle découverte.", en: "No scientist or museum has ever confirmed such a discovery." },
      ai: { fr: "Les poils de l'araignée sont répétés de façon identique — un signe de génération par IA.", en: "The spider's hairs repeat identically — a sign of AI generation." },
    }
  },
  { id: 'm4', Illustration: AstronautCat, isTrue: true,
    claim: { fr: "Un vrai chat a déjà été envoyé dans l'espace par une agence spatiale.", en: "A real cat has actually been sent to space by a space agency." },
    explanation: { fr: "Vrai ! En 1963, la France a envoyé une chatte nommée Félicette dans l'espace. Elle est revenue saine et sauve. Parfois, la réalité est aussi surprenante que la fiction !", en: "True! In 1963, France sent a cat named Félicette to space. She returned safely. Sometimes reality is just as surprising as fiction!" },
    clues: {
      image: { fr: "Il existe de vraies photos d'archive de cette mission dans les musées.", en: "Real archival photos of this mission exist in museums." },
      source: { fr: "Cet événement est documenté par des agences spatiales officielles.", en: "This event is documented by official space agencies." },
      ai: { fr: "Ce fait historique est confirmé par plusieurs sources indépendantes.", en: "This historical fact is confirmed by several independent sources." },
    }
  },
  { id: 'm5', Illustration: FloatingIsland, isTrue: false,
    claim: { fr: "Une île flotte librement au milieu de l'océan Atlantique.", en: "An island floats freely in the middle of the Atlantic Ocean." },
    explanation: { fr: "Faux ! Les îles reposent sur la croûte terrestre, elles ne peuvent pas flotter comme un bateau. Cette image utilise un montage numérique pour donner cette illusion.", en: "False! Islands sit on the Earth's crust, they can't float like a boat. This image uses digital editing to create that illusion." },
    clues: {
      image: { fr: "L'ombre sous l'île ne correspond pas à sa hauteur apparente au-dessus de l'eau.", en: "The shadow under the island doesn't match its apparent height above the water." },
      source: { fr: "Aucune agence scientifique n'a jamais recensé d'île flottante naturelle.", en: "No scientific agency has ever recorded a naturally floating island." },
      ai: { fr: "Le contour de l'île est trop net comparé au flou naturel de l'eau autour.", en: "The island's edge is too sharp compared to the natural blur of the water around it." },
    }
  },
  { id: 'm6', Illustration: TwoMoonsEarth, isTrue: true,
    claim: { fr: "La Terre a parfois une deuxième 'mini-lune' temporaire capturée par sa gravité.", en: "Earth sometimes has a temporary second 'mini-moon' captured by its gravity." },
    explanation: { fr: "Vrai ! De petits astéroïdes sont parfois capturés temporairement par la gravité terrestre avant de repartir dans l'espace — ça s'est déjà produit plusieurs fois, documenté par des astronomes.", en: "True! Small asteroids are sometimes temporarily captured by Earth's gravity before drifting back into space — this has happened several times, documented by astronomers." },
    clues: {
      image: { fr: "Les images de télescopes montrent bien deux objets distincts en orbite.", en: "Telescope images clearly show two distinct objects in orbit." },
      source: { fr: "Ce phénomène est publié dans des revues d'astronomie sérieuses.", en: "This phenomenon is published in serious astronomy journals." },
      ai: { fr: "Rien à voir avec une IA ici — c'est de l'astronomie confirmée par calcul.", en: "Nothing to do with AI here — this is astronomy confirmed by calculation." },
    }
  },
];

export const ILLUSTRATIONS = {
  Sparkles: CatOnCloud,
  ScanSearch: MagnifyingHands,
  Link2: SuspiciousLink,
  ShieldAlert: ScamGift,
  ShadowClue,
  FishPhoto,
  PhoneScam,
  RobotVoice,
};
