export const translations = {
  fr: {
    nav: {
      verifier: "Vérificateur IA",
      training: "Centre de Formation",
      community: "Communauté",
      kids: "Espace Jeunes",
      dashboard: "Tableau de Bord"
    },
    common: {
      author: "Auteur",
      date: "Date",
      platform: "Plateforme",
      reliability: "Score de Fiabilité",
      loading: "Analyse en cours...",
      share: "Partager l'analyse",
      report: "Signaler à la communauté",
      close: "Fermer",
      submit: "Soumettre",
      cancel: "Annuler",
      points: "points",
      badge: "Badge",
      play: "Jouer",
      level: "Niveau",
      correct: "Correct !",
      incorrect: "Oups, incorrect !",
      explanation: "Pourquoi ce résultat ?",
      tryAgain: "Réessayer",
      replay: "Rejouer",
      next: "Suivant",
      back: "Retour"
    },
    verifier: {
      title: "Détecteur de Vérité Intelligent",
      subtitle: "Soumettez un lien, un texte ou une image. Notre intelligence artificielle ausculte les faits, décortique les pixels et évalue la crédibilité en temps réel.",
      submitBox: "Soumettre un Contenu",
      typeLink: "Lien",
      typeText: "Texte",
      typeImage: "Image",
      inputLinkPlaceholder: "Collez un lien d'article ou de tweet...",
      inputTextPlaceholder: "Collez un texte suspect (rumeur de réseau social, etc.)...",
      uploadTitle: "Cliquez pour importer votre image",
      uploadSub: "Formats : JPG, PNG (Max 10Mo)",
      uploadReady: "Image chargée avec succès !",
      buttonRun: "Lancer l'analyse",
      presetData: "Données de test préconfigurées :",
      waitingTitle: "En attente de soumission",
      waitingDesc: "Sélectionnez un exemple ou remplissez le formulaire pour lancer l'analyse sémantique et visuelle.",
      reportTitle: "Rapport d'Analyse IA",
      verdictLabel: "VERDICT ALGORITHMIQUE",
      detailsLabel: "Détails des indicateurs :",
      credibility: "Crédibilité Source",
      aiSigns: "Signes de génération IA",
      emotional: "Biais Émotionnel",
      incoherence: "Incohérences",
      elaVisual: "Aperçu de l'analyse ELA (Différence de Pixels)",
      elaLegend: "Les zones blanches lumineuses indiquent une divergence de compression (zones potentiellement retouchées ou insérées via IA/Photoshop).",
      relElements: "Éléments de fiabilité",
      susElements: "Éléments suspects",
      analysisLogsTitle: "Scanner TruthLens AI v3.0",
      preset1: "Exemple 1 : Rumeur Santé (Fake)",
      preset2: "Exemple 2 : Photo IA du Pape (Généré)",
      preset3: "Exemple 3 : Annonce Officielle (Fiable)",
      verdictFake: "TROMPEUR / FAKE NEWS",
      verdictAi: "CONTENU GÉNÉRÉ PAR IA",
      verdictReliable: "SÛR ET FIABLE",
      verdictDoubtful: "SUSPECT / DOUTEUX",
      verdictUnverifiable: "NON VÉRIFIABLE PAR LE LIEN"
    },
    training: {
      title: "Académie de l'Information Citoyenne",
      subtitle: "Devenez un rempart contre les fausses nouvelles. Suivez nos modules vidéo, consultez les fiches de révision et débloquez vos badges.",
      begTab: "Débutant",
      intTab: "Intermédiaire",
      advTab: "Avancé",
      moduleLevel: "Niveau",
      validated: "Module Validé",
      videoTitle: "TUTORIEL VIDÉO",
      reviewTitle: "Fiche Pratique de Révision",
      caseTitle: "Cas Pratique Réel",
      lessonLearned: "Leçon apprise :",
      quizTitle: "Évaluation du Module",
      quizDesc: "Répondez correctement à toutes les questions pour débloquer le badge numérique et gagner 100 points.",
      startQuiz: "Démarrer le Quiz",
      watchVideoWarning: "* Veuillez d'abord regarder la vidéo de formation.",
      quizSuccessTitle: "Félicitations !",
      quizSuccessDesc: "Vous avez validé ce module et débloqué le badge !",
      quizFailTitle: "Échec du test",
      quizFailDesc: "Vous devez obtenir un score parfait pour valider ce niveau. Réessayez !"
    },
    community: {
      title: "Espace Communauté TruthLens",
      subtitle: "Unissez vos forces pour analyser les contenus suspects. Signalez une publication, demandez une vérification et échangez sur les indices.",
      filterAll: "Tous",
      filterPending: "En cours / Attente",
      filterFake: "Fake News",
      filterReliable: "Fiables",
      sortByFlags: "Priorité (Signalements)",
      sortByRecent: "Récents",
      btnReport: "Signaler un contenu",
      formTitle: "Signaler un contenu pour vérification",
      formInputTitle: "Titre descriptif du contenu",
      formInputTitlePl: "Ex: Photo d'un pingouin volant...",
      formInputDesc: "Description & Contexte",
      formInputDescPl: "Où l'avez-vous vu ? Pourquoi est-ce louche ?",
      formPlatform: "Plateforme",
      formSubmit: "Publier le Signalement",
      postRequestCheck: "Demander vérification",
      commentsTitle: "commentaires",
      commentPl: "Ajouter un argument ou une preuve...",
      commentBtn: "Commenter",
      sidebarTitle: "Intelligence Collective",
      sidebarDesc: "Le crowdsourcing permet d'identifier à chaud les attaques informationnelles.",
      sidebarPriority: "Signalements Prioritaires :",
      sidebarWeekly: "Vérifications de la semaine :",
      sidebarMods: "Modérateurs en ligne :",
      alertShared: "Ce rapport a été signalé et ajouté à l'espace communauté !",
      alertSharedClip: "Lien du rapport copié dans le presse-papier !"
    },
    kids: {
      title: "L'Arène des Jeunes Détectives",
      subtitle: "Apprends à démasquer les pièges du web en jouant ! Relève les défis, gagne des étoiles et deviens un champion d'Internet.",
      companionTitle: "Choisis ton compagnon :",
      welcomeMsg: "Prêt pour l'aventure ? Choisis un jeu pour t'entraîner !",
      gameLevelTitle: "Choisis ton niveau de jeu :",
      passedBadge: "Réussi !",
      btnPlay: "Jouer",
      btnExit: "← Quitter le jeu",
      playerName: "Joueur :",
      pointsBadge: "Pts",
      kidsCorrect: "Excellent !",
      kidsIncorrect: "Oups, ce n'est pas tout à fait ça !",
      finishedTrophy: "Score Parfait !",
      finishedMedal: "Bien joué !",
      questionsCount: "questions",
      badgeUnlocked: "BADGE DÉBLOQUÉ !",
      badgeUnlockedDesc: "Ce badge a été ajouté à ta collection secrète sur ton tableau de bord !"
    },
    dashboard: {
      title: "Tableau de Bord Personnel",
      subtitle: "Suivez votre impact dans la lutte contre la désinformation et examinez vos récompenses.",
      levelLabel: "NIVEAU ACTUEL",
      pointsLabel: "Points de réputation",
      nextLevel: "Prochain niveau :",
      statVerified: "Contenus analysés",
      statCourses: "Formations validées",
      statQuizzes: "Quiz jeunes réussis",
      statContributions: "Contributions",
      galleryTitle: "Galerie de vos Badges Numériques",
      noBadgesTitle: "Aucun badge débloqué",
      noBadgesDesc: "Répondez aux quiz de formation ou de l'Espace Jeunes pour remporter vos premières récompenses !",
      badgeCertified: "CERTIFIÉ TRUTHLENS",
      weeklyTrend: "+12% cette semaine",
      badgeUnlockedLabel: "Badge débloqué : oui",
      badgeNoneLabel: "Aucun",
      userPointsLabel: "points gagnés",
      modStatus: "Modérateur Aspirant",
      levels: {
        beg: "Apprenti Détecteur",
        begDesc: "Débute son apprentissage sur les mécanismes de la désinformation en ligne.",
        int: "Fact-Checker Junior",
        intDesc: "Vous repérez la plupart des manipulations d'images et biais d'écriture.",
        adv: "Rempart de l'Info",
        advDesc: "Expert Fact-Checker. La communauté s'appuie sur vos analyses méticuleuses."
      }
    }
  },
  en: {
    nav: {
      verifier: "AI Verifier",
      training: "Training Center",
      community: "Community",
      kids: "Youth Arena",
      dashboard: "Personal Dashboard"
    },
    common: {
      author: "Author",
      date: "Date",
      platform: "Platform",
      reliability: "Reliability Score",
      loading: "Analyzing content...",
      share: "Share analysis",
      report: "Report to community",
      close: "Close",
      submit: "Submit",
      cancel: "Cancel",
      points: "points",
      badge: "Badge",
      play: "Play",
      level: "Level",
      correct: "Correct!",
      incorrect: "Oups, incorrect!",
      explanation: "Why this result?",
      tryAgain: "Try Again",
      replay: "Replay",
      next: "Next",
      back: "Back"
    },
    verifier: {
      title: "Smart Truth Detector",
      subtitle: "Submit a link, text, or image. Our AI analyzes facts, inspects pixels, and evaluates credibility in real-time.",
      submitBox: "Submit Content",
      typeLink: "Link",
      typeText: "Text",
      typeImage: "Image",
      inputLinkPlaceholder: "Paste an article or tweet URL...",
      inputTextPlaceholder: "Paste suspicious text (social media rumor, etc.)...",
      uploadTitle: "Click to upload your image",
      uploadSub: "Formats: JPG, PNG (Max 10MB)",
      uploadReady: "Image loaded successfully!",
      buttonRun: "Start Analysis",
      presetData: "Preset Test Cases:",
      waitingTitle: "Awaiting Submission",
      waitingDesc: "Select an example or fill the form to run sementic and visual analysis.",
      reportTitle: "AI Analysis Report",
      verdictLabel: "ALGORITHMIC VERDICT",
      detailsLabel: "Indicator Breakdown:",
      credibility: "Source Credibility",
      aiSigns: "AI-Generation Markers",
      emotional: "Emotional Bias",
      incoherence: "Inconsistencies",
      elaVisual: "Error Level Analysis Preview (Pixel Difference)",
      elaLegend: "Bright white zones indicate compression mismatches (potentially doctored areas, or elements added via AI/Photoshop).",
      relElements: "Reliability Indicators",
      susElements: "Suspicious Indicators",
      analysisLogsTitle: "TruthLens AI Scanner v3.0",
      preset1: "Example 1: Health Rumor (Fake)",
      preset2: "Example 2: AI-Generated Pope (Synthetic)",
      preset3: "Example 3: Official Announcement (Reliable)",
      verdictFake: "MISLEADING / FAKE NEWS",
      verdictAi: "AI-GENERATED CONTENT",
      verdictReliable: "SAFE AND RELIABLE",
      verdictDoubtful: "SUSPECT / DOUBTFUL",
      verdictUnverifiable: "CANNOT BE VERIFIED FROM THE LINK"
    },
    training: {
      title: "Citizen Media Academy",
      subtitle: "Become a shield against fake news. Watch our video courses, read cheat sheets, and unlock official badges.",
      begTab: "Beginner",
      intTab: "Intermediate",
      advTab: "Advanced",
      moduleLevel: "Level",
      validated: "Module Validated",
      videoTitle: "VIDEO TUTORIAL",
      reviewTitle: "Practical Cheat Sheet",
      caseTitle: "Real World Case Study",
      lessons: "Lessons learned:",
      quizTitle: "Module Assessment",
      quizDesc: "Answer all questions correctly to unlock the official badge and earn 100 points.",
      startQuiz: "Start Quiz",
      watchVideoWarning: "* Please watch the training video first.",
      quizSuccessTitle: "Congratulations!",
      quizSuccessDesc: "You passed the module and unlocked the badge!",
      quizFailTitle: "Assessment failed",
      quizFailDesc: "You need a perfect score to validate this level. Try again!"
    },
    community: {
      title: "TruthLens Community Hub",
      subtitle: "Join forces to analyze suspect publications. Flag posts, demand verification, and share insights on manipulation.",
      filterAll: "All",
      filterPending: "Pending / Processing",
      filterFake: "Fake News",
      filterReliable: "Reliable",
      sortByFlags: "Priority (Flag Count)",
      sortByRecent: "Recent",
      btnReport: "Report Content",
      formTitle: "Report content for verification",
      formInputTitle: "Descriptive Title",
      formInputTitlePl: "Ex: Picture of a flying penguin...",
      formInputDesc: "Context & Description",
      formInputDescPl: "Where did you see it? Why is it suspicious?",
      formPlatform: "Platform",
      formSubmit: "Publish Report",
      postRequestCheck: "Request Verification",
      commentsTitle: "comments",
      commentPl: "Add an argument, a source or fact-check...",
      commentBtn: "Comment",
      sidebarTitle: "Collective Intelligence",
      sidebarDesc: "Crowdsourcing identifies informational attacks rapidly.",
      sidebarPriority: "High Priority Cases:",
      sidebarWeekly: "Verifications this week:",
      sidebarMods: "Moderators Online:",
      alertShared: "This report has been published and added to the community board!",
      alertSharedClip: "Report link copied to clipboard!"
    },
    kids: {
      title: "Young Detectives Arena",
      subtitle: "Learn to spot internet traps by playing! Complete challenges, earn stars, and become a web champion.",
      companionTitle: "Choose your companion:",
      welcomeMsg: "Ready for the adventure? Pick a game to train!",
      gameLevelTitle: "Choose your game level:",
      passedBadge: "Completed!",
      btnPlay: "Play",
      btnExit: "← Back to Portal",
      playerName: "Player:",
      pointsBadge: "Pts",
      kidsCorrect: "Excellent!",
      kidsIncorrect: "Oops, that is not quite right!",
      finishedTrophy: "Perfect Score!",
      finishedMedal: "Well played!",
      questionsCount: "questions",
      badgeUnlocked: "BADGE UNLOCKED!",
      badgeUnlockedDesc: "This badge has been added to your secret collection on your dashboard!"
    },
    dashboard: {
      title: "Personal Dashboard",
      subtitle: "Monitor your impact in fighting online disinformation and inspect your achievements.",
      levelLabel: "CURRENT LEVEL",
      pointsLabel: "Reputation Points",
      nextLevel: "Next level at:",
      statVerified: "Analyzed items",
      statCourses: "Modules completed",
      statQuizzes: "Youth quizzes passed",
      statContributions: "Contributions",
      galleryTitle: "Digital Badges Gallery",
      noBadgesTitle: "No badges unlocked yet",
      noBadgesDesc: "Complete courses or Youth Arena quizzes to earn your first badges!",
      badgeCertified: "TRUTHLENS CERTIFIED",
      weeklyTrend: "+12% this week",
      badgeUnlockedLabel: "Badge unlocked: yes",
      badgeNoneLabel: "None",
      userPointsLabel: "points earned",
      modStatus: "Aspiring Moderator",
      levels: {
        beg: "Detective Apprentice",
        begDesc: "Begins training on the core mechanics of online disinformation.",
        int: "Junior Fact-Checker",
        intDesc: "You can successfully spot most photo manipulations and writing biases.",
        adv: "Truth Guardian",
        advDesc: "Expert Fact-Checker. The community relies on your meticulous analysis."
      }
    }
  }
};

export const coursesData = {
  fr: [
    {
      id: "beg-1",
      level: "Débutant",
      title: " Deepfakes — Qu'est-ce que c'est & comment les repérer",
      description: "Apprenez à identifier les trucages vidéo complexes de remplacement de visage (face-swap) et le clonage de voix.",
      duration: "10 min",
      icon: "BookOpen",
      videoUrl: "https://www.youtube.com/embed/9CFxc2Zy5zI",
      sheet: {
        title: "Fiche Pratique : Les Fondations",
        points: [
          "Deepfake : Contenu vidéo/audio généré artificiellement par apprentissage profond.",
          "Face-swap : Superposition du visage d'une personne sur le corps d'une autre.",
          "Indices : Mouvements oculaires anormaux, reflets asymétriques dans la rétine.",
          "Signes audios : Voix monocorde, absence de bruits de respiration."
        ]
      },
      example: {
        title: "Cas Pratique : Le faux appel vidéo de maires européens",
        description: "En 2022, plusieurs maires de capitales européennes ont été trompés par un imposteur utilisant un deepfake en temps réel de Vitali Klitschko.",
        lessons: "Toujours vérifier l'authenticité lors d'appels vidéo sensibles par un second canal de communication."
      },
      quiz: [
        {
          question: "Quel élément physique asymétrique est un indicateur récurrent de deepfake ?",
          options: [
            "La couleur des vêtements",
            "Des boucles d'oreilles ou reflets d'yeux non symétriques",
            "La taille du sujet",
            "Le débit de parole"
          ],
          correct: 1,
          explanation: "Les modèles d'IA génèrent souvent des accessoires ou des reflets de lumière asymétriques entre le côté gauche et le côté droit du visage."
        }
      ],
      badge: {
        id: "badge-beg-1",
        name: "Éclaireur Deepfake",
        description: "Maîtrise les bases de détection des trucages vidéo de visages.",
        color: "#00E5FF",
        icon: "ShieldAlert"
      }
    },
    {
      id: "beg-2",
      level: "Débutant",
      title: " Images générées par IA — Qu'est-ce qui est réel ?",
      description: "Analyser la structure des images générées par Midjourney, DALL-E ou Stable Diffusion.",
      duration: "12 min",
      icon: "Image",
      videoUrl: "https://www.youtube.com/embed/sU26FXjIz08",
      sheet: {
        title: "Fiche Pratique : Reconnaître les images IA",
        points: [
          "Mains & Doigts : L'ordinateur ajoute fréquemment des doigts ou fusionne des membres.",
          "Textes arrières : Les panneaux et écritures en fond sont souvent illisibles ou déformés.",
          "Lissage anormal : Peau cireuse sans pores visibles (effet plastique).",
          "Arrière-plans physiques : Flous artistiques étranges et perspectives distordues."
        ]
      },
      example: {
        title: "Cas Pratique : L'arrestation fictive de Donald Trump",
        description: "Des images photo-réalistes montrant son arrestation musclée ont circulé sur Twitter en 2023. C'était une pure création artificielle.",
        lessons: "Les images spectaculaires doivent être corroborées par des dépêches de presse écrites officielles."
      },
      quiz: [
        {
          question: "Pourquoi le texte en arrière-plan d'une image permet-il de démasquer l'IA ?",
          options: [
            "L'IA n'écrit qu'en anglais",
            "Les caractères sont généralement flous, déformés et incohérents",
            "Le texte est trop gros",
            "Il n'y a jamais de texte sur les images d'IA"
          ],
          correct: 1,
          explanation: "La majorité des générateurs d'images ne savent pas encoder correctement la structure vectorielle des lettres."
        }
      ],
      badge: {
        id: "badge-beg-2",
        name: "Analyseur de Pixels",
        description: "Identifie les anomalies géométriques des images synthétiques.",
        color: "#00E676",
        icon: "Eye"
      }
    },
    {
      id: "int-1",
      level: "Intermédiaire",
      title: " Google DeepMind — Détection avec SynthID",
      description: "Comment le tatouage numérique (watermarking) invisible permet de certifier l'authenticité.",
      duration: "15 min",
      icon: "Cpu",
      videoUrl: "https://www.youtube.com/embed/9btDaOcfIMY",
      sheet: {
        title: "Fiche Pratique : Le tatouage SynthID",
        points: [
          "Tatouage invisible : Insertion de micro-signaux imperceptibles à l'œil nu.",
          "Résistance : Le code reste détectable même après recadrage, compression ou retouche.",
          "Multi-média : Applicable aux images, vidéos, audio (voix) et même au texte.",
          "Transparence : Permet de remonter la trace de création du contenu d'origine."
        ]
      },
      example: {
        title: "Cas Pratique : L'authentification des contenus Google Gemini",
        description: "Toutes les images générées par Imagen 2/3 intègrent automatiquement SynthID pour permettre aux outils comme Search de les marquer comme IA.",
        lessons: "Le marquage à la source est plus fiable que la simple analyse visuelle a posteriori."
      },
      quiz: [
        {
          question: "Quelle est la particularité d'un watermark comme SynthID par rapport aux métadonnées classiques ?",
          options: [
            "Il s'efface quand on ferme l'image",
            "Il est inséré directement dans les pixels et résiste aux modifications",
            "Il ralentit le chargement de la page",
            "Il modifie visiblement les couleurs de l'image"
          ],
          correct: 1,
          explanation: "Les métadonnées EXIF se retirent facilement. SynthID modifie les pixels de façon imperceptible pour persister après retouche."
        }
      ],
      badge: {
        id: "badge-int-1",
        name: "Expert Métadonnées",
        description: "Comprend les techniques modernes de tatouage numérique et cryptographie.",
        color: "#D400FF",
        icon: "Award"
      }
    },
    {
      id: "int-2",
      level: "Intermédiaire",
      title: " This Info is Disinfo — Débusquer la désinformation",
      description: "Identifier les campagnes d'influence et le détournement d'images d'actualité.",
      duration: "15 min",
      icon: "ShieldAlert",
      videoUrl: "https://www.youtube.com/embed/9CFxc2Zy5zI",
      sheet: {
        title: "Fiche Pratique : Repérer la désinformation",
        points: [
          "Détournement d'image : Associer une vraie photo historique à un texte d'actualité mensonger.",
          "Biais de confirmation : Tendance à croire une fausse info simplement parce qu'elle va dans notre sens.",
          "Recherche inversée : Outil crucial pour retrouver l'origine exacte et la date d'une image.",
          "Vérification latérale : Consulter plusieurs médias neutres avant de partager."
        ]
      },
      example: {
        title: "Cas Pratique : Les fausses images de conflits géopolitiques",
        description: "Utilisation d'extraits de jeux vidéo de simulation militaire (comme Arma 3) présentés sur TikTok comme des frappes réelles en direct.",
        lessons: "Les diffusions de conflits sur les réseaux doivent toujours être validées par des correspondants de presse agréés."
      },
      quiz: [
        {
          question: "Quelle méthode permet de retrouver rapidement la date et la source d'une image suspecte ?",
          options: [
            "Zoomer sur l'image",
            "Faire une recherche inversée d'image (Google Lens / TinEye)",
            "Changer le format du fichier",
            "La partager à un ami"
          ],
          correct: 1,
          explanation: "La recherche inversée scanne le web pour lister toutes les occurrences passées de l'image, dévoilant son vrai contexte."
        }
      ],
      badge: {
        id: "badge-int-2",
        name: "Fact-Checker Agrée",
        description: "Maîtrise la recherche inversée et la vérification croisée de sources.",
        color: "#FF9100",
        icon: "CheckCircle"
      }
    },
    {
      id: "adv-1",
      level: "Avancé",
      title: " Deep Future — L'avenir des médias synthétiques",
      description: "Comprendre les implications sociétales et éthiques des voix et vidéos 100% artificielles.",
      duration: "20 min",
      icon: "Sparkles",
      videoUrl: "https://www.youtube.com/embed/sU26FXjIz08",
      sheet: {
        title: "Fiche Pratique : Le futur des médias synthétiques",
        points: [
          "Génération temps réel : Création instantanée d'avatars parlants interactifs.",
          "Risques démocratiques : Manipulation d'élections par diffusion de faux discours à la veille du vote.",
          "Droit à l'image : Usurpation d'identité à grande échelle.",
          "Solutions législatives : Règlements européens sur l'obligation d'étiqueter les contenus IA (AI Act)."
        ]
      },
      example: {
        title: "Cas Pratique : L'appel audio frauduleux de Joe Biden",
        description: "En 2024, un appel automatisé clonant la voix du président américain a incité les électeurs du New Hampshire à ne pas aller voter.",
        lessons: "La voix n'est plus une preuve suffisante d'identité au téléphone."
      },
      quiz: [
        {
          question: "Quel est le principal danger démocratique des deepfakes de politiciens ?",
          options: [
            "Ils parlent trop vite",
            "Ils peuvent diffuser de fausses déclarations critiques à un moment clé pour influencer un vote",
            "Ils sont payés trop cher",
            "Ils refusent de débattre"
          ],
          correct: 1,
          explanation: "La diffusion rapide d'un faux discours de politicien juste avant un scrutin électoral peut manipuler l'opinion sans laisser de temps pour un démenti."
        }
      ],
      badge: {
        id: "badge-adv-1",
        name: "Analyste Info-Guerre",
        description: "Expert en détection de campagnes de manipulation de l'opinion publique.",
        color: "#D500F9",
        icon: "Globe"
      }
    },
    {
      id: "adv-2",
      level: "Avancé",
      title: " Astuces courantes de manipulation des médias",
      description: "Analyser les biais sémantiques et les techniques cognitives pour tromper l'audience.",
      duration: "20 min",
      icon: "Shield",
      videoUrl: "https://www.youtube.com/embed/9CFxc2Zy5zI",
      sheet: {
        title: "Fiche Pratique : Techniques de manipulation sémantique",
        points: [
          "Titre sensationnaliste (Clickbait) : Choquer pour générer des clics, souvent déconnecté du corps de l'article.",
          "Cadrage sélectif : Recadrer une photo pour masquer des éléments clés qui changeraient tout le sens.",
          "Faux experts : Citer des titres universitaires inventés ou hors sujet pour asseoir une autorité.",
          "Statistiques trompeuses : Graphiques aux échelles modifiées pour exagérer une courbe."
        ]
      },
      example: {
        title: "Cas Pratique : Le recadrage d'une manifestation pacifique",
        description: "Une photo recadrée montrant un policier pointant son arme sur un manifestant, masquant le fait qu'il visait en réalité un agresseur armé en retrait.",
        lessons: "Le hors-cadre est aussi important que ce qui est montré à l'image."
      },
      quiz: [
        {
          question: "En quoi consiste la manipulation par 'cadrage sélectif' ?",
          options: [
            "Prendre une photo floue",
            "Exclure volontairement des éléments visuels du contexte pour modifier l'interprétation de la scène",
            "Changer le filtre de l'appareil",
            "Ajouter des couleurs artificielles"
          ],
          correct: 1,
          explanation: "En cadrant serré, on peut faire passer une altercation isolée pour une émeute généralisée, ou masquer une menace."
        }
      ],
      badge: {
        id: "badge-adv-2",
        name: "Gardien de l'Info",
        description: "Maîtrise absolue des biais cognitifs et techniques de manipulation de masse.",
        color: "#FF3D00",
        icon: "Shield"
      }
    }
  ],
  en: [
    {
      id: "beg-1",
      level: "Beginner",
      title: " Deepfakes — What they are & how to spot them",
      description: "Learn to identify face-swaps, synthetic speech cloning, and visual mismatches.",
      duration: "10 min",
      icon: "BookOpen",
      videoUrl: "https://www.youtube.com/embed/LuA__pFzSxM",
      sheet: {
        title: "Cheat Sheet: Deepfake Foundations",
        points: [
          "Deepfake: Synthetic media generated by neural networks.",
          "Face-swap: Replacing a person's head onto someone else's body in video.",
          "Visual cues: Abnormal eye blinking, mismatched iris reflection.",
          "Audio cues: Flat cadence, lack of natural breathing sounds."
        ]
      },
      example: {
        title: "Case Study: European Mayors Scammed by Impostor",
        description: "In 2022, multiple European mayors were tricked during video calls by an actor using a real-time deepfake of Vitali Klitschko.",
        lessons: "Always verify identity via a second communication channel during high-stakes calls."
      },
      quiz: [
        {
          question: "Which visual anomaly is a common telltale sign of a deepfake video?",
          options: [
            "Clothing color shifts",
            "Asymmetric reflections in the eyes or mismatched earrings",
            "The subject's physical height",
            "The overall video bitrate"
          ],
          correct: 1,
          explanation: "Generative neural nets often struggle with geometric symmetry, resulting in mismatching accessory details or lighting."
        }
      ],
      badge: {
        id: "badge-beg-1",
        name: "Deepfake Detective",
        description: "Acquired core skills in identifying face swaps and synthetic video clues.",
        color: "#00E5FF",
        icon: "ShieldAlert"
      }
    },
    {
      id: "beg-2",
      level: "Beginner",
      title: " AI-Generated Images — What’s Really Real?",
      description: "Analyze the structures and artifacts left by Midjourney, DALL-E, or Stable Diffusion.",
      duration: "12 min",
      icon: "Image",
      videoUrl: "https://www.youtube.com/embed/yiXzKN7M2f0",
      sheet: {
        title: "Cheat Sheet: Visual AI Anomalies",
        points: [
          "Hands and limbs: AI frequently merges fingers or draws incorrect numbers of joints.",
          "Background lettering: Text on signs or labels appears distorted or gibberish.",
          "Texture anomalies: Waxy, airbrushed skin tones that lack details or pores.",
          "Geometric perspective: Distorted lines, impossible reflections on windows."
        ]
      },
      example: {
        title: "Case Study: Fake Arrest Photos of Donald Trump",
        description: "Photorealistic photos of his arrest flooded social feeds in 2023. They were generated synthetically by Midjourney.",
        lessons: "Sensational images should be cross-referenced with established news agencies."
      },
      quiz: [
        {
          question: "Why does background text help identify AI-generated images?",
          options: [
            "AI only writes in code",
            "Letters and characters are usually distorted and nonsensical",
            "The text is too large",
            "AI images never feature any text"
          ],
          correct: 1,
          explanation: "Image generator networks excel at textures but struggle to render exact typographic vector structures."
        }
      ],
      badge: {
        id: "badge-beg-2",
        name: "Pixel Inspector",
        description: "Spots geometric inconsistencies in synthetic AI images.",
        color: "#00E676",
        icon: "Eye"
      }
    },
    {
      id: "int-1",
      level: "Intermediate",
      title: " Google DeepMind — Detection with SynthID",
      description: "How invisible digital watermarking helps trace and verify AI-generated files.",
      duration: "15 min",
      icon: "Cpu",
      videoUrl: "https://www.youtube.com/embed/9btDaOcfIMY",
      sheet: {
        title: "Cheat Sheet: SynthID Watermarking",
        points: [
          "Invisible signals: Micro-patterns embedded directly in pixels or soundwaves.",
          "Resilience: The watermark remains detectable even after cropping, filters, or resizing.",
          "Cross-modal: Designed for text, audio, images, and video files.",
          "Provenance: Helps platforms trace origin and transparency markers."
        ]
      },
      example: {
        title: "Case Study: Identifying Google Gemini content",
        description: "Images generated using Google's Gemini/Imagen tools automatically embed SynthID so tools like Search can mark them.",
        lessons: "Source watermarking is far more resilient than analyzing visuals alone."
      },
      quiz: [
        {
          question: "What makes SynthID watermarks superior to standard metadata?",
          options: [
            "They dissolve when the image closes",
            "They are embedded directly into pixels and survive compression or cropping",
            "They make pages load faster",
            "They alter the image colors visibly"
          ],
          correct: 1,
          explanation: "Metadata can be easily stripped. SynthID modifies content pixels imperceptibly to ensure resilience."
        }
      ],
      badge: {
        id: "badge-int-1",
        name: "Metadata Expert",
        description: "Understand digital watermarking and provenance techniques.",
        color: "#D400FF",
        icon: "Award"
      }
    },
    {
      id: "int-2",
      level: "Intermediate",
      title: " This Info is Disinfo — Unmasking Disinformation",
      description: "Expose influence campaigns and news image hijacking.",
      duration: "15 min",
      icon: "ShieldAlert",
      videoUrl: "https://www.youtube.com/embed/yIaUl_CS6Ss",
      sheet: {
        title: "Cheat Sheet: Disinformation Patterns",
        points: [
          "Context hijacking: Associating an old, real photo with a current false headline.",
          "Confirmation bias: Trusting a claim blindly just because it aligns with your beliefs.",
          "Reverse Image Search: A critical tool to trace when and where an image was first posted.",
          "Lateral reading: Cross-checking claims across multiple independent news sites."
        ]
      },
      example: {
        title: "Case Study: Military Simulator Video Presented as Live War",
        description: "Clips from the video game Arma 3 were shared on TikTok as live broadcasts of real missile strikes.",
        lessons: "Social media broadcasts of conflicts must be vetted by accredited news agencies."
      },
      quiz: [
        {
          question: "Which method lets you quickly find the original date and context of an image?",
          options: [
            "Zooming in on pixels",
            "Running a Reverse Image Search (Google Lens / TinEye)",
            "Renaming the file extension",
            "Forwarding it to a friend"
          ],
          correct: 1,
          explanation: "Reverse Image Search scans the web to discover where that image previously appeared, exposing context shifts."
        }
      ],
      badge: {
        id: "badge-int-2",
        name: "Vetted Fact-Checker",
        description: "Mastered reverse search and multi-source verification.",
        color: "#FF9100",
        icon: "CheckCircle"
      }
    },
    {
      id: "adv-1",
      level: "Advanced",
      title: " Deep Future — AI-Generated Synthetic Media",
      description: "Understand the ethical, societal, and political impact of synthetic voices and video avatars.",
      duration: "20 min",
      icon: "Sparkles",
      videoUrl: "https://www.youtube.com/embed/EwOKdk8sqgM",
      sheet: {
        title: "Cheat Sheet: Synthetic Media Ethics",
        points: [
          "Real-time generation: Interactive virtual avatars speaking in real-time.",
          "Democratic threat: Spreading forged statements on the eve of elections to sway votes.",
          "Identity theft: Cloned voices used in cyber-extortion scams.",
          "Regulatory efforts: Requirements to label AI contents (e.g. EU AI Act)."
        ]
      },
      example: {
        title: "Case Study: Robocall Mimicking President Joe Biden",
        description: "In 2024, a cloned voice of Biden was broadcast to voters telling them not to vote in the New Hampshire primary.",
        lessons: "Voice alone is no longer proof of identity over phone calls."
      },
      quiz: [
        {
          question: "What is the primary democratic danger of political deepfakes?",
          options: [
            "They speak too fast",
            "They can deploy fabricated statements at key times to sway voter decisions",
            "They are too expensive",
            "They refuse debates"
          ],
          correct: 1,
          explanation: "Releasing a fake speech right before an election leaves the community no time to check and debunk the lie."
        }
      ],
      badge: {
        id: "badge-adv-1",
        name: "Info-War Analyst",
        description: "Expert in spotting coordinated public opinion manipulation campaigns.",
        color: "#D500F9",
        icon: "Globe"
      }
    },
    {
      id: "adv-2",
      level: "Advanced",
      title: " Common Media Manipulation Tricks",
      description: "Spot framing bias, cherry-picking, and emotional clickbait techniques.",
      duration: "20 min",
      icon: "Shield",
      videoUrl: "https://www.youtube.com/embed/LuA__pFzSxM",
      sheet: {
        title: "Cheat Sheet: Cognitive Bias and Framing",
        points: [
          "Clickbait headlines: Outrageous titles designed for views, often debunked in the article text.",
          "Selective framing: Cropping an image to hide surrounding details that alter its meaning.",
          "Fake experts: Citing unqualified individuals to project scientific authority.",
          "Y-axis scaling: Manipulating chart axes to make a minor difference look enormous."
        ]
      },
      example: {
        title: "Case Study: Cropping peaceful protests",
        description: "A photo cropped tight on an officer pointing a weapon at a crowd, hiding that he was targeting an armed threat behind them.",
        lessons: "What is cropped out is often as important as what is kept in the frame."
      },
      quiz: [
        {
          question: "What is the purpose of 'selective framing' in media?",
          options: [
            "Taking blurry photos",
            "Excluding surrounding visual context to manipulate the message of a scene",
            "Applying color filters",
            "Enlarging the image size"
          ],
          correct: 1,
          explanation: "Cropping out surrounding details can easily turn a defensive stance into an aggressive one, or vice versa."
        }
      ],
      badge: {
        id: "badge-adv-2",
        name: "Guardian of Truth",
        description: "Absolute mastery over cognitive bias and framing manipulation.",
        color: "#FF3D00",
        icon: "Shield"
      }
    }
  ]
};

export const kidsQuizzesData = {
  fr: [
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
          illustration: "Sparkles",
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
          illustration: "ScanSearch",
          explanation: "Exact ! Les intelligences artificielles font très souvent des erreurs sur les mains : elles dessinent parfois 6 doigts, des doigts tordus ou collés."
        },
              {
          question: "Sur une photo, le texte écrit en arrière-plan (une pancarte, un livre) est flou et illisible, presque comme un faux alphabet. Que peut-on en déduire ?",
          options: [
            "C'est juste une photo floue, rien d'anormal",
            "C'est un signe fréquent qu'une intelligence artificielle a généré cette image",
            "Le photographe a fait exprès"
          ],
          correct: 1,
          illustration: "ScanSearch",
          explanation: "Bien vu ! Les IA génératrices d'images ont beaucoup de mal à reproduire du texte lisible — c'est un indice classique à repérer."
        },
              {
          question: "In a photo, the text in the background (a sign, a book) is blurry and unreadable, almost like a fake alphabet. What can you conclude?",
          options: [
            "It's just a blurry photo, nothing unusual",
            "It's a common sign that an AI generated this image",
            "The photographer did it on purpose"
          ],
          correct: 1,
          illustration: "ScanSearch",
          explanation: "Well spotted! AI image generators really struggle with readable text — that's a classic clue to look for."
        },
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
          illustration: "Link2",
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
          illustration: "ShieldAlert",
          explanation: "Tout à fait ! Personne ne donne de téléphone gratuit comme ça. C'est un piège publicitaire."
        },
              {
          question: "Un article affirme un fait choquant mais ne cite aucune source ni aucun nom précis. Que fais-tu ?",
          options: [
            "Je le crois quand même, c'est écrit donc c'est vrai",
            "Je reste prudent : un vrai article sérieux cite toujours ses sources",
            "Je le partage immédiatement à tout le monde"
          ],
          correct: 1,
          illustration: "Link2",
          explanation: "Exactement ! Un article fiable explique toujours d'où vient l'information. Sans source, il faut rester prudent."
        },
              {
          question: "An article claims a shocking fact but names no source and no one in particular. What do you do?",
          options: [
            "I believe it anyway, it's written so it must be true",
            "I stay cautious: a real serious article always names its sources",
            "I share it with everyone right away"
          ],
          correct: 1,
          illustration: "Link2",
          explanation: "Exactly! A trustworthy article always explains where the information comes from. Without a source, stay cautious."
        },
      ],
      badge: {
        id: "badge-kids-2",
        name: "Gardien du Net",
        icon: "Shield",
        color: "#FF3D00"
      }
    },
    {
      id: "kids-3",
      title: "Photo Truquée ou Pas ?",
      ageRange: "8-12 ans",
      theme: "Repérer les photos modifiées",
      points: 120,
      icon: "ScanSearch",
      bgColor: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      questions: [
        {
          question: "Sur une photo, tu vois deux personnes côte à côte, mais leurs ombres pointent dans des directions complètement différentes. Qu'est-ce que ça veut dire ?",
          options: [
            "Rien, c'est normal, chacun a sa propre ombre",
            "C'est un indice que la photo a probablement été truquée ou assemblée",
            "Il y avait deux soleils ce jour-là"
          ],
          correct: 1,
          illustration: "ShadowClue",
          explanation: "Bien vu ! En vrai, toutes les ombres d'une même photo pointent dans la même direction, car il n'y a qu'une seule source de lumière (le soleil). Des ombres différentes trahissent souvent un montage."
        },
        {
          question: "Une photo montre un poisson géant aussi long qu'un bus. Comment vérifier si c'est vrai ?",
          options: [
            "Je fais confiance, une photo ne ment jamais",
            "Je regarde si d'autres sites sérieux (musées, scientifiques) en parlent aussi",
            "Je demande au poisson directement"
          ],
          correct: 1,
          illustration: "FishPhoto",
          explanation: "Exactement ! Avant de croire une photo impressionnante, on vérifie si des sources sérieuses (scientifiques, journaux connus) confirment l'information."
        },
              {
          question: "Sur une photo, une personne a une main avec 6 doigts au lieu de 5. Qu'est-ce que ça peut indiquer ?",
          options: [
            "Une maladie très rare",
            "Un signe fréquent d'image générée par une IA",
            "Rien de particulier, c'est courant"
          ],
          correct: 1,
          illustration: "ScanSearch",
          explanation: "Tout à fait ! Les mains sont un des plus grands défis pour les IA génératrices d'images — comptez toujours les doigts !"
        },
              {
          question: "In a photo, a person has a hand with 6 fingers instead of 5. What could that indicate?",
          options: [
            "A very rare medical condition",
            "A common sign of an AI-generated image",
            "Nothing unusual, it happens often"
          ],
          correct: 1,
          illustration: "ScanSearch",
          explanation: "Exactly! Hands are one of the biggest challenges for AI image generators — always count the fingers!"
        },
      ],
      badge: {
        id: "badge-kids-3",
        name: "Œil de Lynx",
        icon: "Eye",
        color: "#D400FF"
      }
    },
    {
      id: "kids-4",
      title: "Voix Mystère",
      ageRange: "9-13 ans",
      theme: "Voix imitées par IA",
      points: 130,
      icon: "ShieldAlert",
      bgColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      questions: [
        {
          question: "Tu reçois un message vocal qui ressemble à la voix de ta maman, disant : 'Envoie vite de l'argent, c'est urgent !' Que fais-tu ?",
          options: [
            "J'envoie tout de suite, c'est ma maman",
            "Je raccroche et j'appelle directement maman sur son vrai numéro pour vérifier",
            "Je réponds par message uniquement"
          ],
          correct: 1,
          illustration: "PhoneScam",
          explanation: "Très bon réflexe ! Des IA peuvent aujourd'hui imiter une voix familière. En cas de doute, on raccroche et on rappelle la personne directement sur son vrai numéro."
        },
        {
          question: "Une voix dans une vidéo parle sans jamais reprendre son souffle et sonne un peu bizarre, comme robotique. Que peux-tu en déduire ?",
          options: [
            "La personne est juste très en forme",
            "Ça peut être une voix générée ou clonée par une intelligence artificielle",
            "C'est impossible à savoir"
          ],
          correct: 1,
          illustration: "RobotVoice",
          explanation: "Bonne observation ! Les voix génées par IA ont parfois un rythme de respiration ou une intonation légèrement étrange — un indice à surveiller."
        },
              {
          question: "Dans une vidéo, la bouche de la personne ne bouge pas exactement au même rythme que les mots qu'on entend. Que peux-tu en déduire ?",
          options: [
            "C'est normal, ça arrive souvent dans toutes les vidéos",
            "Ça peut être un signe de deepfake vidéo (visage truqué)",
            "La personne a juste un accent différent"
          ],
          correct: 1,
          illustration: "RobotVoice",
          explanation: "Bien vu ! Un décalage entre les lèvres et le son est un des indices les plus connus pour repérer un deepfake vidéo."
        },
      ],
      badge: {
        id: "badge-kids-4",
        name: "Oreille Fine",
        icon: "ShieldAlert",
        color: "#00E5FF"
      }
    }
  ],
  en: [
    {
      id: "kids-1",
      title: "Image Detective",
      ageRange: "7-11 years old",
      theme: "Real vs AI Image",
      points: 100,
      icon: "Camera",
      bgColor: "linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)",
      questions: [
        {
          question: "You see an image of a cat riding a bicycle on a cloud. In your opinion, it is:",
          options: [
            "A real photo taken by a professional cat photographer!",
            "An imaginary picture drawn by a computer (an AI)",
            "A very athletic breed of cats"
          ],
          correct: 1,
          illustration: "Sparkles",
          explanation: "Great job! Cats can't ride bikes and can't walk on clouds. The computer made up this funny scene!"
        },
        {
          question: "To see if a character photo is made by an AI, which body part should you check closely?",
          options: [
            "The knees",
            "The hair",
            "The hands and fingers"
          ],
          correct: 2,
          illustration: "ScanSearch",
          explanation: "Correct! AIs frequently make mistakes on hands: they draw 6 fingers, or weirdly bent/fused fingers."
        }
      ],
      badge: {
        id: "badge-kids-1",
        name: "Visual Detective Junior",
        icon: "Eye",
        color: "#00E676"
      }
    },
    {
      id: "kids-2",
      title: "Fake News Hunter",
      ageRange: "9-13 years old",
      theme: "Internet Traps",
      points: 150,
      icon: "ShieldAlert",
      bgColor: "linear-gradient(135deg, #f857a6 0%, #ff5858 100%)",
      questions: [
        {
          question: "A friend sends you a message saying: 'School is closed tomorrow because of a penguin invasion! Click here!' What do you do?",
          options: [
            "Click on it immediately and forward it to everyone",
            "It's funny but unlikely. I ask my parents or check the school official website",
            "Put on my winter hat and prepare to play with penguins!"
          ],
          correct: 1,
          illustration: "Link2",
          explanation: "Excellent reflex! Weird messages with strange links are often traps to steal passwords or invent fake news."
        },
        {
          question: "An ad on a gaming website says: 'Congratulations! You won a free iPhone, enter your address!' Is it true?",
          options: [
            "Yes, websites are very generous with kids",
            "No, it's a phishing scam to steal my parents info. Nothing is free this way!",
            "Yes, if I type fast"
          ],
          correct: 1,
          illustration: "ShieldAlert",
          explanation: "Indeed! Nobody gives out free phones like that. It's a marketing scam or phishing trap."
        }
      ],
      badge: {
        id: "badge-kids-2",
        name: "Net Guardian",
        icon: "Shield",
        color: "#FF3D00"
      }
    },
    {
      id: "kids-3",
      title: "Faked Photo or Not?",
      ageRange: "8-12 years old",
      theme: "Spotting edited photos",
      points: 120,
      icon: "ScanSearch",
      bgColor: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
      questions: [
        {
          question: "In a photo, two people stand side by side, but their shadows point in completely different directions. What does that mean?",
          options: [
            "Nothing, that's normal, everyone has their own shadow",
            "It's a clue the photo was probably faked or combined from different images",
            "There were two suns that day"
          ],
          correct: 1,
          illustration: "ShadowClue",
          explanation: "Well spotted! In real photos, all shadows point the same direction because there's only one light source (the sun). Mismatched shadows often reveal a composite."
        },
        {
          question: "A photo shows a giant fish as long as a bus. How can you check if it's real?",
          options: [
            "Just trust it, a photo never lies",
            "Check if serious sources (museums, scientists) also report it",
            "Ask the fish directly"
          ],
          correct: 1,
          illustration: "FishPhoto",
          explanation: "Exactly! Before believing an impressive photo, check whether serious sources (scientists, known news outlets) confirm the story."
        }
      ],
      badge: {
        id: "badge-kids-3",
        name: "Eagle Eye",
        icon: "Eye",
        color: "#D400FF"
      }
    },
    {
      id: "kids-4",
      title: "Mystery Voice",
      ageRange: "9-13 years old",
      theme: "AI-cloned voices",
      points: 130,
      icon: "ShieldAlert",
      bgColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      questions: [
        {
          question: "You get a voice message that sounds like your mom, saying: 'Send money right now, it's urgent!' What do you do?",
          options: [
            "Send it right away, it's my mom",
            "Hang up and call mom directly on her real number to check",
            "Only reply by text"
          ],
          correct: 1,
          illustration: "PhoneScam",
          explanation: "Great reflex! AI can now imitate a familiar voice. When in doubt, hang up and call the person back directly on their real number."
        },
        {
          question: "A voice in a video never seems to breathe and sounds a bit robotic. What could that mean?",
          options: [
            "The person is just in great shape",
            "It could be a voice generated or cloned by AI",
            "There's no way to know"
          ],
          correct: 1,
          illustration: "RobotVoice",
          explanation: "Good catch! AI-generated voices sometimes have an odd breathing rhythm or intonation — a clue worth watching for."
        },
        {
          question: "In a video, the person's mouth doesn't move exactly in sync with the words you hear. What can you conclude?",
          options: [
            "That's normal, it happens in every video",
            "It can be a sign of a video deepfake (a faked face)",
            "The person just has a different accent"
          ],
          correct: 1,
          illustration: "RobotVoice",
          explanation: "Well spotted! A mismatch between lips and sound is one of the best-known clues to spot a video deepfake."
        }
      ],
      badge: {
        id: "badge-kids-4",
        name: "Sharp Ear",
        icon: "ShieldAlert",
        color: "#00E5FF"
      }
    }
  ]
};
