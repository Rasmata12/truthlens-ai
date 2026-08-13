export const mockCourses = [
  {
    id: "beg-1",
    level: "Débutant",
    title: "Introduction à la Désinformation",
    description: "Comprendre les bases du partage d'informations en ligne et comment naissent les rumeurs.",
    duration: "10 min",
    icon: "BookOpen",
    video: {
      title: "Qu'est-ce que la désinformation ?",
      duration: "2:15",
      summary: "Cette vidéo explique la différence entre la mésinformation (erreur involontaire) et la désinformation (manipulation délibérée pour tromper le public)."
    },
    sheet: {
      title: "Fiche Pratique : Les Fondations",
      points: [
        "Mésinformation : Fausses informations partagées sans mauvaise intention.",
        "Désinformation : Contenu trompeur créé et diffusé volontairement pour nuire ou manipuler.",
        "Malinformation : Informations réelles partagées hors contexte pour causer du tort.",
        "Le réflexe de base : Toujours se demander qui a écrit l'information et quel est son but."
      ]
    },
    example: {
      title: "Exemple Réel : La rumeur de la fausse pénurie",
      description: "En 2022, des publications virales montrant des rayons vides pris à une autre date ont provoqué des achats de panique injustifiés dans plusieurs pays.",
      lessons: "Une simple photo sortie de son contexte temporel peut créer une hystérie collective."
    },
    quiz: [
      {
        question: "Quelle est la différence principale entre mésinformation et désinformation ?",
        options: [
          "L'intention de nuire ou de tromper",
          "Le format (texte ou image)",
          "La vitesse de propagation sur Internet",
          "Le pays d'origine de l'information"
        ],
        correct: 0,
        explanation: "La désinformation est intentionnellement mensongère, tandis que la mésinformation est une erreur partagée de bonne foi."
      },
      {
        question: "Que devez-vous faire en premier en lisant un titre choquant sur les réseaux sociaux ?",
        options: [
          "Le partager immédiatement à vos amis",
          "Prendre du recul, lire l'article complet et vérifier la source",
          "Laisser un commentaire en colère",
          "Signaler le post sans le lire"
        ],
        correct: 1,
        explanation: "Les titres choquants sont conçus pour susciter une réaction émotionnelle immédiate. Il faut toujours lire le contenu et vérifier qui le publie."
      }
    ],
    badge: {
      id: "badge-beg-1",
      name: "Éclaireur Citoyen",
      description: "A acquis les bases fondamentales pour discerner les types de fausses informations.",
      color: "#00E5FF",
      icon: "ShieldAlert"
    }
  },
  {
    id: "int-1",
    level: "Intermédiaire",
    title: "Détecter les Images Générées par IA",
    description: "Reconnaître les signes visuels et physiques laissés par les générateurs d'images Midjourney, DALL-E ou Stable Diffusion.",
    duration: "15 min",
    icon: "Sparkles",
    video: {
      title: "L'œil du détective IA",
      duration: "3:40",
      summary: "Ce tutoriel montre les erreurs anatomiques classiques, les incohérences de lumière et les textures plastiques typiques de l'IA."
    },
    sheet: {
      title: "Fiche Pratique : Indices Visuels de l'IA",
      points: [
        "Les mains et les oreilles : L'IA a du mal à générer le bon nombre de doigts ou des formes d'oreilles réalistes.",
        "Le texte en arrière-plan : Les mots et lettres sont souvent illisibles, déformés ou ressemblent à du faux alphabet.",
        "La texture de la peau : Un aspect trop lisse, cireux, ou des reflets de lumière impossibles sur les yeux.",
        "Les accessoires asymétriques : Boucles d'oreilles différentes, lunettes qui fusionnent avec la tempe."
      ]
    },
    example: {
      title: "Exemple Réel : Le Pape en doudoune blanche",
      description: "Une image montrant le Pape François portant une doudoune de luxe blanche ultra-moderne est devenue virale en mars 2023. Bien que réaliste, elle avait été générée par Midjourney.",
      lessons: "Même les images les plus anodines et réalistes peuvent être fabriquées de toutes pièces pour manipuler notre perception de la réalité."
    },
    quiz: [
      {
        question: "Parmi ces signes, lequel indique souvent qu'une image est générée par IA ?",
        options: [
          "Une résolution très élevée",
          "Des écritures en arrière-plan floues, déformées et illisibles",
          "La présence de plusieurs personnes",
          "L'utilisation du noir et blanc"
        ],
        correct: 1,
        explanation: "Les modèles d'IA générative de texte-à-image peinent à reproduire fidèlement les symboles typographiques et les mots lisibles."
      },
      {
        question: "Pourquoi l'observation des mains est-elle cruciale pour repérer une IA ?",
        options: [
          "L'IA cache toujours les mains",
          "L'IA dessine les mains trop petites",
          "L'IA génère fréquemment 6 doigts, des fusions de doigts ou des membres impossibles",
          "Les mains en IA sont toujours gantées"
        ],
        correct: 2,
        explanation: "La géométrie complexe des mains humaines représente un défi majeur de modélisation 3D pour les générateurs d'images 2D."
      }
    ],
    badge: {
      id: "badge-int-1",
      name: "Viseur de Pixels",
      description: "Capacité prouvée à démasquer les images synthétiques et trompeuses créées par IA.",
      color: "#D400FF",
      icon: "Eye"
    }
  },
  {
    id: "adv-1",
    level: "Avancé",
    title: "Guerre Cognitive et Deepfakes",
    description: "Comprendre les attaques informationnelles coordonnées par des pays ou groupes d'influence et décoder les vidéos clonées.",
    duration: "25 min",
    icon: "ShieldAlert",
    video: {
      title: "Guerre psychologique moderne",
      duration: "5:10",
      summary: "Une plongée dans les usines à trolls, les faux bots automatisés et la technologie de clonage de voix / visage (Deepfake)."
    },
    sheet: {
      title: "Fiche Pratique : Signes de Deepfakes",
      points: [
        "Incohérences oculaires : Le sujet cligne-t-il des yeux de manière naturelle ? Y a-t-il un reflet uniforme dans les deux pupilles ?",
        "Clonage de voix : Des micro-pauses robotiques, l'absence d'intonations émotionnelles réelles, ou des bruits métalliques de fond.",
        "Jonction du cou et du menton : Des flous ou des sauts de pixels à la frontière entre le visage collé et le vrai corps.",
        "Synchronisation labiale : Les mouvements de la bouche ne correspondent pas précisément aux phonèmes prononcés."
      ]
    },
    example: {
      title: "Exemple Réel : Le faux message de Volodymyr Zelensky",
      description: "En mars 2022, une vidéo tronquée montrant le président ukrainien appelant ses soldats à déposer les armes est apparue sur des sites d'actualité piratés. Le deepfake a rapidement été identifié en raison de la rigidité de sa tête et du timbre anormal de sa voix.",
      lessons: "En période de conflit, le deepfake est une arme cyber-militaire utilisée pour déstabiliser le moral des populations."
    },
    quiz: [
      {
        question: "Quel indicateur technique permet d'identifier un deepfake vidéo ?",
        options: [
          "Une vidéo trop courte",
          "Un décalage ou flou à la jonction entre le visage et le cou",
          "Le sujet parle trop lentement",
          "La vidéo est en haute définition"
        ],
        correct: 1,
        explanation: "Les algorithmes de remplacement de visage (face-swap) créent souvent des artéfacts visuels ou des irrégularités de texture à la lisière des zones collées."
      },
      {
        question: "Qu'est-ce qu'une 'usine à trolls' sur les réseaux sociaux ?",
        options: [
          "Un groupe de modérateurs professionnels",
          "Une organisation coordonnée diffusant des fausses informations en masse pour manipuler l'opinion publique",
          "Un forum de fans de jeux de rôles",
          "Un service d'intelligence artificielle hébergé dans le Cloud"
        ],
        correct: 1,
        explanation: "Les usines à trolls (ou fermes d'influence) emploient des agents et des bots pour inonder les réseaux de propagande afin de diviser et d'influencer l'opinion."
      }
    ],
    badge: {
      id: "badge-adv-1",
      name: "Rempart de la Vérité",
      description: "Expert en détection de deepfakes et en analyse de campagnes d'influence géopolitiques.",
      color: "#FF3D00",
      icon: "Cpu"
    }
  }
];

export const mockCommunityPosts = [
  {
    id: "post-1",
    author: "Sophie Dubois",
    avatar: "SD",
    avatarColor: "#00E5FF",
    date: "Il y a 10 min",
    platform: "Twitter / X",
    title: "Vidéo d'une soucoupe volante survolant Paris hier soir",
    content: "Cette vidéo circule partout ce matin. On y voit un disque argenté planer au-dessus de la Tour Eiffel avec des lumières clignotantes. Les gens paniquent en commentaires ! Quelqu'un peut confirmer si c'est un montage 3D ?",
    flags: 42,
    status: "En cours d'analyse",
    comments: [
      {
        id: "c1",
        author: "Jean-Marc L.",
        avatar: "JM",
        date: "Il y a 5 min",
        content: "C'est visiblement un effet spécial de Blender. Si vous regardez le reflet sur la structure métallique de la tour, il ne correspond pas aux mouvements de la soucoupe."
      },
      {
        id: "c2",
        author: "Sarah Becker (Modératrice)",
        avatar: "SB",
        date: "Il y a 2 min",
        content: "Nous avons envoyé le fichier à notre détecteur de manipulation 3D. Le rapport sera disponible dans quelques instants. Restez prudents."
      }
    ],
    votes: 89
  },
  {
    id: "post-2",
    author: "Marc Vasseur",
    avatar: "MV",
    avatarColor: "#FFC400",
    date: "Il y a 1 heure",
    platform: "Facebook",
    title: "Article prétendant que le sel de mer guérit le COVID-19 en 24h",
    content: "Mon oncle a partagé un lien vers un site appelé 'Sante-Naturelle-Extreme.com' affirmant que gargariser de l'eau tiède salée élimine 100% du virus. Cela me semble très dangereux de laisser tourner ça.",
    flags: 128,
    status: "Vérifié - Fake News",
    comments: [
      {
        id: "c3",
        author: "Docteur Diallo",
        avatar: "DD",
        date: "Il y a 45 min",
        content: "Aucune étude scientifique ne prouve cela. Le virus se réplique dans les cellules des voies respiratoires supérieures et profondes, le sel ne peut l'éradiquer. C'est une fake news médicale dangereuse."
      }
    ],
    votes: 215
  },
  {
    id: "post-3",
    author: "Lucas Martin",
    avatar: "LM",
    avatarColor: "#00E676",
    date: "Il y a 3 heures",
    platform: "TikTok",
    title: "Image d'une tortue géante de 15 mètres de long en Indonésie",
    content: "L'image montre des villageois debout sur le dos d'une tortue gigantesque. C'est super impressionnant, mais est-ce que c'est une vraie espèce de tortue préhistorique oubliée ou du Photoshop ?",
    flags: 15,
    status: "Vérifié - Fake News",
    comments: [
      {
        id: "c4",
        author: "Elena R.",
        avatar: "ER",
        date: "Il y a 2 heures",
        content: "C'est généré par IA ! Regardez le pied du garçon à gauche, il s'enfonce bizarrement dans la carapace de la tortue comme s'il passait à travers. Et les visages en arrière-plan n'ont pas d'yeux bien formés."
      }
    ],
    votes: 34
  },
  {
    id: "post-4",
    author: "Clara Garcia",
    avatar: "CG",
    avatarColor: "#FF3D00",
    date: "Il y a 5 heures",
    platform: "Lien Direct",
    title: "Déclaration officielle sur la baisse des impôts en 2027",
    content: "J'ai reçu ce communiqué de presse par email. Le document ressemble à un PDF officiel du ministère des finances, mais le ton est bizarrement informel sur certains paragraphes. Quelqu'un pour valider ?",
    flags: 5,
    status: "Vérifié - Fiable",
    comments: [
      {
        id: "c5",
        author: "Admin TruthLens",
        avatar: "AT",
        date: "Il y a 4 heures",
        content: "Après vérification de la signature électronique du PDF et comparaison avec les archives du Journal Officiel, ce communiqué est authentique. Il correspond à l'annonce du ministre du 11 août."
      }
    ],
    votes: 18
  }
];

export const mockKidsQuizzes = [
  {
    id: "kids-1",
    title: "Détective d'Images",
    ageRange: "7-11 ans",
    theme: "Vrai vs Image IA",
    points: 100,
    icon: "Camera",
    bgColor: "linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)",
    questions: [
      {
        question: "Tu vois une image d'un chat qui fait du vélo sur un nuage. À ton avis, c'est :",
        options: [
          "Une vraie photo prise par un photographe de chats !",
          "Une image imaginaire dessinée par un ordinateur (une IA)",
          "Une race de chats très sportifs"
        ],
        correct: 1,
        illustration: "",
        explanation: "Bravo ! Les chats ne savent pas faire de vélo et ne peuvent pas marcher sur les nuages. C'est l'ordinateur qui a inventé cette scène amusante !"
      },
      {
        question: "Pour savoir si une image de personnage est faite par une IA, quel endroit du corps faut-il inspecter avec sa loupe ?",
        options: [
          "Les genoux",
          "Les cheveux",
          "Les mains et les doigts"
        ],
        correct: 2,
        illustration: "",
        explanation: "Exact ! Les intelligences artificielles font très souvent des erreurs sur les mains : elles dessinent parfois 6 doigts, des doigts tordus ou collés."
      }
    ],
    badge: {
      id: "badge-kids-1",
      name: "Jeune Détective Visuel",
      icon: "Eye",
      color: "#00E676"
    }
  },
  {
    id: "kids-2",
    title: "Chasseur de Fake News",
    ageRange: "9-13 ans",
    theme: "Les pièges du Web",
    points: 150,
    icon: "ShieldAlert",
    bgColor: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",
    questions: [
      {
        question: "Un copain t'envoie un message disant : 'Le collège sera fermé demain à cause d'une invasion de pingouins ! Clique vite ici !' Que fais-tu ?",
        options: [
          "Je clique sur le lien tout de suite et je l'envoie à tous mes copains",
          "C'est drôle mais improbable. Je demande à mes parents ou je vérifie sur le site officiel du collège",
          "Je prépare mon bonnet pour aller jouer avec les pingouins !"
        ],
        correct: 1,
        illustration: "",
        explanation: "Super réflexe ! Les messages bizarres avec des liens étranges sont souvent des pièges pour voler des informations ou inventer des fausses nouvelles."
      },
      {
        question: "Une publicité sur un site de jeux te dit : 'Félicitations ! Tu as gagné un iPhone gratuit, donne ton adresse !' Est-ce vrai ?",
        options: [
          "Oui, les sites internet sont très généreux avec les enfants",
          "Non, c'est une arnaque pour voler les informations de mes parents. Rien n'est jamais gratuit de cette façon !",
          "Oui, si je réponds vite"
        ],
        correct: 1,
        illustration: "",
        explanation: "Tout à fait ! Personne ne donne de téléphone gratuit comme ça. C'est un piège publicitaire ou du phishing."
      }
    ],
    badge: {
      id: "badge-kids-2",
      name: "Gardien du Net",
      icon: "Shield",
      color: "#FF3D00"
    }
  }
];
