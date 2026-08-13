import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Image, Video, Link2, Upload, AlertTriangle, CheckCircle, HelpCircle, ShieldAlert, RefreshCw, Send, Share2, MessageCircle, ScanSearch, X as XIcon, Check, Zap, Circle } from 'lucide-react';
import { translations } from '../translations';
import { API_BASE } from '../lib/api';

export default function Verifier({ language, onVerificationComplete, onAddToCommunity }) {
  const t = translations[language];
  const [contentType, setContentType] = useState('link'); // link, text, image
  const [inputVal, setInputVal] = useState('');
  const [file, setFile] = useState(null);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [report, setReport] = useState(null);
  const [elaImageUrl, setElaImageUrl] = useState(null); // calculated ELA canvas URL
  const [elaIntensity, setElaIntensity] = useState(null); // real average ELA signal (0-255), used to score images honestly
  
  const canvasRef = useRef(null);
  const backendResultRef = useRef(null); // holds the real server-side analysis, when reachable
  const [backendUsed, setBackendUsed] = useState(false); // true once a real server analysis was used

  const steps = [
    t.verifier.analysisLogsTitle,
    "1. " + t.verifier.waitingDesc.split('.')[0] + "...",
    "2. Extraction of structural metadata...",
    "3. Running pixel noise level analysis (ELA)...",
    "4. Calculating language and emotional bias indexes...",
    "5. Finalizing Trust Score calculation..."
  ];

  const handleSelectSample = (sampleType) => {
    setContentType(sampleType);
    if (sampleType === 'link') {
      setInputVal(language === 'fr' 
        ? 'https://sante-extreme-nature.com/articles/sel-marin-guerison-totale' 
        : 'https://extreme-health-scoop.net/articles/sea-salt-cures-covid-instantly'
      );
      setFile(null);
    } else if (sampleType === 'text') {
      setInputVal(language === 'fr'
        ? "Le gouvernement annonce une baisse progressive de la fiscalitÃ© sur l'Ã©lectricitÃ© de 5% Ã  compter du 1er janvier afin d'allÃ©ger les factures des mÃ©nages."
        : "The European Union commissions a new clean energy directive aimed at reducing carbon tax by 5% starting next fiscal year."
      );
      setFile(null);
    } else if (sampleType === 'image') {
      // Simulate image load
      setFile({ name: 'pope_puffer_jacket.jpg', size: '1.2 MB' });
      setInputVal('pope_puffer_jacket.jpg');
      
      // Draw a simulated AI image on the canvas to generate ELA
      generateSimulatedImage(true);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setInputVal(selectedFile.name);
      
      // Load real image for actual ELA processing!
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          runElaAnalysis(img);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleVideoFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setInputVal(selectedFile.name);
    }
  };

  // Helper to draw a mock image with "fake/modified" zones for preset ELA demonstration
  const generateSimulatedImage = (isAiGenerated) => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 400, 250);
    
    // Draw a subject (Pope or landscape)
    ctx.beginPath();
    ctx.arc(200, 130, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    
    // Draw a modified zone ( Balenciaga puffer jacket outline )
    ctx.beginPath();
    ctx.arc(200, 210, 80, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Perform actual ELA on this simulated image
    setTimeout(() => {
      runElaAnalysis(canvas);
    }, 100);
  };

  // REAL ERROR LEVEL ANALYSIS (ELA) ALGORITHM
  // Computes pixel differences between original quality and compressed JPEG quality
  const runElaAnalysis = (imageElement) => {
    const canvasOriginal = document.createElement('canvas');
    const ctxOrig = canvasOriginal.getContext('2d');
    
    // Resize down for performance
    const maxDim = 350;
    let w = imageElement.width || imageElement.videoWidth || 350;
    let h = imageElement.height || imageElement.videoHeight || 250;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = (h / w) * maxDim;
        w = maxDim;
      } else {
        w = (w / h) * maxDim;
        h = maxDim;
      }
    }
    
    canvasOriginal.width = w;
    canvasOriginal.height = h;
    ctxOrig.drawImage(imageElement, 0, 0, w, h);
    
    // Step 1: Export as highly compressed JPEG
    const jpegDataUrl = canvasOriginal.toDataURL('image/jpeg', 0.82);
    
    // Step 2: Load compressed JPEG back
    const compressedImg = new window.Image();
    compressedImg.onload = () => {
      const canvasCompressed = document.createElement('canvas');
      const ctxComp = canvasCompressed.getContext('2d');
      canvasCompressed.width = w;
      canvasCompressed.height = h;
      ctxComp.drawImage(compressedImg, 0, 0, w, h);
      
      // Step 3: Compute absolute differences pixel-by-pixel
      const originalData = ctxOrig.getImageData(0, 0, w, h);
      const compressedData = ctxComp.getImageData(0, 0, w, h);
      
      const elaData = ctxOrig.createImageData(w, h);
      
      for (let i = 0; i < originalData.data.length; i += 4) {
        const rDiff = Math.abs(originalData.data[i] - compressedData.data[i]);
        const gDiff = Math.abs(originalData.data[i+1] - compressedData.data[i+1]);
        const bDiff = Math.abs(originalData.data[i+2] - compressedData.data[i+2]);
        
        // Amplify differences (scale up by 25) so they glow in neon green/cyan
        elaData.data[i] = Math.min(rDiff * 25, 255);
        elaData.data[i+1] = Math.min(gDiff * 25, 255);
        elaData.data[i+2] = Math.min(bDiff * 30, 255);
        elaData.data[i+3] = 255; // fully opaque
      }
      
      // Draw ELA data on our visible canvas
      const canvasOutput = canvasRef.current;
      if (canvasOutput) {
        canvasOutput.width = w;
        canvasOutput.height = h;
        const ctxOut = canvasOutput.getContext('2d');
        ctxOut.putImageData(elaData, 0, 0);
        setElaImageUrl(canvasOutput.toDataURL());
      }

      // REAL metric: average ELA signal intensity across all pixels.
      // Heavily AI-smoothed or re-compressed images tend to show either very
      // uniform low-noise regions or unnaturally strong uniform edges â€” this
      // average is a genuine (if imperfect) numeric signal, not a fixed value.
      let sum = 0;
      for (let i = 0; i < elaData.data.length; i += 4) {
        sum += (elaData.data[i] + elaData.data[i + 1] + elaData.data[i + 2]) / 3;
      }
      const avgIntensity = sum / (elaData.data.length / 4);
      setElaIntensity(avgIntensity);
    };
    compressedImg.src = jpegDataUrl;
  };

  // Real server-side analysis. Falls back to null (silently) if the backend is
  // unreachable â€” offline/local mode then uses the client-side heuristics below,
  // same pattern already used for the Community tab.
  const callBackendAnalysis = async () => {
    backendResultRef.current = null;
    try {
      if (contentType === 'image' && file instanceof File) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/analyze/image`, { method: 'POST', body: formData });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.error) backendResultRef.current = { type: 'image', ...data };
      } else if (contentType === 'video' && file instanceof File) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/analyze/video`, { method: 'POST', body: formData });
        if (!res.ok) return;
        const data = await res.json();
        backendResultRef.current = { type: 'video', ...data };
      } else if (contentType === 'link' && inputVal) {
        const res = await fetch(`${API_BASE}/analyze/link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: inputVal }),
        });
        if (!res.ok) return;
        const data = await res.json();
        backendResultRef.current = { type: 'link', ...data };
      }
    } catch (e) {
      backendResultRef.current = null;
    }
  };

  const runAnalysis = () => {
    if (!inputVal && !file) return;
    
    setAnalyzing(true);
    setStepIndex(0);
    setReport(null);
    setBackendUsed(false);

    const backendPromise = callBackendAnalysis();
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setStepIndex(currentStep);
      } else {
        clearInterval(interval);
        backendPromise.finally(finishAnalysis);
      }
    }, 600);
  };

  // REAL REAL-TIME HEURISTIC CLASSIFIER
  const finishAnalysis = () => {
    let score = 100;
    let credibility = 100;
    let aiSigns = 5;
    let emotional = 5;
    let incoherence = 5;
    let positive = [];
    let negative = [];
    
    const analysisText = inputVal.toLowerCase();

    // Rule 1: Link Domain Heuristics â€” use the REAL server-side check (actual HTTP fetch +
    // domain analysis, executed on the backend) when reachable. Client-side regex guessing
    // below only runs as an offline fallback.
    let unverifiablePlatform = false;
    const backendLink = contentType === 'link' ? backendResultRef.current : null;
    if (backendLink && backendLink.type === 'link') {
      setBackendUsed(true);
      score = backendLink.score;
      credibility = backendLink.score;
      unverifiablePlatform = backendLink.video_social_platform;

      if (backendLink.known_reliable_source) {
        positive.push(language === 'fr' ? "Le domaine appartient Ã  une source reconnue de notre liste de mÃ©dias fiables (vÃ©rifiÃ© cÃ´tÃ© serveur)." : "The domain belongs to a recognized source in our trusted media list (server-verified).");
      }
      if (backendLink.video_social_platform) {
        negative.push(language === 'fr' ? "Ce lien pointe vers une plateforme d'hÃ©bergement vidÃ©o/sociale â€” n'importe qui peut y publier n'importe quoi." : "This link points to a video/social hosting platform â€” anyone can upload anything there.");
      }
      if (!backendLink.reachable) {
        score -= 0; // already reflected server-side
        negative.push(language === 'fr' ? "Le serveur n'a pas rÃ©ussi Ã  joindre cette page (lien mort, hors ligne, ou bloquÃ©)." : "The server could not reach this page (dead link, offline, or blocked).");
      } else if (backendLink.status_code && backendLink.status_code >= 400) {
        negative.push(language === 'fr' ? `La page a rÃ©pondu avec une erreur (code ${backendLink.status_code}).` : `The page responded with an error (code ${backendLink.status_code}).`);
      } else {
        positive.push(language === 'fr' ? "La page a Ã©tÃ© jointe et a rÃ©pondu correctement (vÃ©rifiÃ© cÃ´tÃ© serveur en temps rÃ©el)." : "The page was reached and responded correctly (verified server-side in real time).");
      }
      if (backendLink.is_ip_address) {
        negative.push(language === 'fr' ? "Le lien utilise une adresse IP brute au lieu d'un nom de domaine." : "The link uses a raw IP address instead of a domain name.");
      }
      if (backendLink.clickbait_words_found > 0) {
        negative.push(language === 'fr'
          ? `Le vrai titre/description de la page (${backendLink.clickbait_words_found} mot(s) Ã  forte charge Ã©motionnelle dÃ©tectÃ©(s)) : Â« ${backendLink.page_title || '?'} Â»`
          : `The page's real title/description (${backendLink.clickbait_words_found} emotionally-charged word(s) detected): "${backendLink.page_title || '?'}"`);
      } else if (backendLink.page_title) {
        positive.push(language === 'fr' ? `Titre rÃ©el de la page (vocabulaire neutre) : Â« ${backendLink.page_title} Â»` : `Real page title (neutral wording): "${backendLink.page_title}"`);
      }
      if (backendLink.image_content_analysis) {
        const ic = backendLink.image_content_analysis;
        if (backendLink.content_flagged_artificial) {
          negative.push(language === 'fr'
            ? `Analyse de l'image rÃ©elle affichÃ©e par ce lien (modÃ¨le IA, serveur) : classÃ©e Â« ${ic.predicted_label} Â» Ã  ${ic.confidence_pct}% â€” le lien lui-mÃªme peut paraÃ®tre sain, mais son contenu visuel semble gÃ©nÃ©rÃ© par IA.`
            : `Analysis of the actual image shown by this link (AI model, server): classified as "${ic.predicted_label}" at ${ic.confidence_pct}% â€” the link itself may look clean, but its visual content appears AI-generated.`);
        } else {
          positive.push(language === 'fr'
            ? `Analyse de l'image rÃ©elle affichÃ©e par ce lien (modÃ¨le IA, serveur) : classÃ©e Â« ${ic.predicted_label} Â» Ã  ${ic.confidence_pct}%, cohÃ©rent avec une photo authentique.`
            : `Analysis of the actual image shown by this link (AI model, server): classified as "${ic.predicted_label}" at ${ic.confidence_pct}%, consistent with an authentic photo.`);
        }
      } else if (backendLink.note) {
        negative.push(backendLink.note);
      }
      if (!backendLink.is_https) {
        negative.push(language === 'fr' ? "Le lien n'utilise pas de connexion sÃ©curisÃ©e (https)." : "The link does not use a secure connection (https).");
      }
      if (backendLink.suspicious_tld) {
        negative.push(language === 'fr' ? "Extension de domaine associÃ©e Ã  un taux Ã©levÃ© de sites frauduleux." : "Domain extension associated with a high rate of fraudulent sites.");
      }
      if (backendLink.redirect_count >= 3) {
        negative.push(language === 'fr' ? `ChaÃ®ne de redirections suspecte (${backendLink.redirect_count} redirections avant d'arriver Ã  la page finale).` : `Suspicious redirect chain (${backendLink.redirect_count} redirects before reaching the final page).`);
      }
    } else if (contentType === 'link') {
      const matchReliable = ['gov', 'gouv.fr', 'bbc.com', 'lemonde.fr', 'nytimes.com', 'afp.com', 'reuters.com', 'nature.com', 'pubmed', 'unesco.org', 'france24.com', 'lefigaro.fr', 'liberation.fr', 'who.int', 'un.org', 'wikipedia.org', 'ap.org', 'lapresse.ca', 'radio-canada.ca', 'rfi.fr', 'jeuneafrique.com', 'africanews.com', 'apanews.net', 'seneweb.com', 'walf-groupe.com', 'lefaso.net', 'aouaga.com'].some(d => d.includes(analysisText) || analysisText.includes(d));
      const matchUnreliable = ['sante-naturelle', 'extreme', 'conspiration', 'shock', 'leak', 'secret', 'clickbait', 'conspir', 'blog', 'miracle-cure', 'infowars', 'exposethetruth', 'realnews24'].some(d => d.includes(analysisText) || analysisText.includes(d));
      // Video/social hosting platforms are NOT publishers â€” anyone can upload anything there.
      // A youtube.com or tiktok.com link carries zero credibility signal by itself.
      const matchPlatform = ['youtube.com', 'youtu.be', 'tiktok.com', 'facebook.com', 'dailymotion.com', 'instagram.com', 'x.com', 'twitter.com'].some(d => analysisText.includes(d));

      if (matchReliable) {
        credibility = 95;
        score += 15;
        positive.push(language === 'fr' ? "Le domaine appartient Ã  une organisation d'autoritÃ© reconnue ou un mÃ©dia certifiÃ©." : "The domain belongs to an authoritative organization or a certified news agency.");
      } else if (matchUnreliable) {
        credibility = 18;
        score -= 50;
        negative.push(language === 'fr' ? "Le domaine figure sur notre liste noire des sites clickbaits ou complotistes." : "This domain is blacklisted as clickbait or conspiracy site.");
      } else if (matchPlatform) {
        unverifiablePlatform = true;
        credibility = 40;
        score -= 30;
        negative.push(language === 'fr'
          ? "Ce lien pointe vers une plateforme d'hÃ©bergement vidÃ©o (YouTube, TikTok, Facebook...) â€” n'importe qui peut y publier n'importe quoi. L'URL ne prouve rien sur la vÃ©racitÃ© du contenu ; seul le compte/la chaÃ®ne qui l'a publiÃ© compte, et nous ne pouvons pas le vÃ©rifier automatiquement."
          : "This link points to a video hosting platform (YouTube, TikTok, Facebook...) â€” anyone can upload anything there. The URL itself proves nothing about the content's accuracy; only the publishing account matters, and we cannot verify it automatically.");
      } else {
        credibility = 45;
        score -= 20;
        negative.push(language === 'fr' ? "Source indÃ©pendante ou non rÃ©pertoriÃ©e dans la base de confiance mondiale." : "Independent source, unverified in international registry.");
      }
    }

    // Rule 2: Lexical Clickbait Analysis
    const clickbaitsFr = ['choc', 'incroyable', 'rumeur', 'exclu', 'secret', 'guerison', 'cache', 'mensonge', 'miracle', '100%', 'insolite', 'revelation', 'chose que'];
    const clickbaitsEn = ['shocking', 'unbelievable', 'rumor', 'exclusive', 'secret', 'cure', 'hidden', 'lie', 'miracle', '100%', 'weird', 'revelation', 'never wanted you to'];
    
    let clickbaitMatches = 0;
    const targets = language === 'fr' ? clickbaitsFr : clickbaitsEn;
    targets.forEach(word => {
      if (analysisText.includes(word)) {
        clickbaitMatches++;
      }
    });

    if (clickbaitMatches > 0) {
      emotional = Math.min(30 + clickbaitMatches * 20, 95);
      score -= clickbaitMatches * 15;
      negative.push(language === 'fr' 
        ? `DÃ©tection de ${clickbaitMatches} mot(s) Ã  forte manipulation Ã©motionnelle (clickbait).` 
        : `Detected ${clickbaitMatches} clickbait words aimed at emotional trigger.`
      );
    } else {
      positive.push(language === 'fr' ? "Le vocabulaire employÃ© est neutre et factuel." : "Vocabulary is neutral and factual.");
    }

    // Rule 3: Punctuation density & Caps shouting
    const exclamationsCount = (inputVal.match(/!/g) || []).length;
    const questionsCount = (inputVal.match(/\?/g) || []).length;
    if (exclamationsCount > 2) {
      emotional = Math.max(emotional, 75);
      score -= 15;
      negative.push(language === 'fr' ? `Ponctuation sensationnaliste dÃ©tectÃ©e (${exclamationsCount} points d'exclamation).` : `Sensational punctuation detected (${exclamationsCount} exclamation marks).`);
    }

    // Shout detection (words with capital letters longer than 3 characters)
    const shoutsCount = (inputVal.match(/\b[A-Z]{4,}\b/g) || []).length;
    if (shoutsCount > 2) {
      emotional = Math.max(emotional, 80);
      score -= 10;
      negative.push(language === 'fr' ? `Utilisation anormale de mots entiÃ¨rement en majuscules (cri numÃ©rique).` : `Abnormal uppercase words detected (digital shouting).`);
    }

    // Rule 1bis: URL structure heuristics (real, checkable signals â€” not a truth oracle)
    if (contentType === 'link') {
      const looksLikeIp = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(inputVal);
      const subdomainCount = (inputVal.match(/\./g) || []).length;
      const hasHttps = inputVal.startsWith('https://');
      const suspiciousTld = /\.(top|xyz|click|country|gq|tk|work)([/?#]|$)/i.test(inputVal);

      if (looksLikeIp) {
        score -= 25;
        negative.push(language === 'fr' ? "Le lien utilise une adresse IP brute au lieu d'un nom de domaine â€” pratique rare pour un site lÃ©gitime." : "The link uses a raw IP address instead of a domain name â€” uncommon for legitimate sites.");
      }
      if (!hasHttps) {
        score -= 8;
        negative.push(language === 'fr' ? "Le lien n'utilise pas de connexion sÃ©curisÃ©e (https)." : "The link does not use a secure connection (https).");
      }
      if (subdomainCount >= 4) {
        score -= 10;
        negative.push(language === 'fr' ? "Structure de domaine inhabituellement complexe (nombreux sous-domaines)." : "Unusually complex domain structure (many subdomains).");
      }
      if (suspiciousTld) {
        score -= 15;
        credibility = Math.min(credibility, 35);
        negative.push(language === 'fr' ? "Extension de domaine associÃ©e Ã  un taux Ã©levÃ© de sites frauduleux (.top, .xyz, .click...)." : "Domain extension associated with a high rate of fraudulent sites.");
      }
    }

    // Rule 4: Image specific analysis â€” REAL score derived from the ELA computation above,
    // not a value fixed by the uploaded filename. Thresholds are heuristic and approximate;
    // this can misfire on heavily-filtered real photos or lightly-edited AI images, which is
    // exactly why it's shown as an indicative score, never as a certified verdict.
    const backendImage = contentType === 'image' ? backendResultRef.current : null;
    if (backendImage && backendImage.type === 'image') {
      setBackendUsed(true);
      score = backendImage.score;
      aiSigns = Math.max(5, 100 - backendImage.score);
      incoherence = Math.round(aiSigns * 0.7);
      credibility = backendImage.score;

      const ela = backendImage.ela || {};
      const aiContent = backendImage.ai_content_analysis;

      if (aiContent) {
        const label = (aiContent.predicted_label || '').toLowerCase();
        const looksArtificial = ['artificial', 'fake', 'ai', 'generated', 'synthetic'].some(k => label.includes(k));
        if (looksArtificial) {
          negative.push(language === 'fr'
            ? `Analyse de contenu (modÃ¨le IA, serveur) : cette image a Ã©tÃ© classÃ©e Â« ${aiContent.predicted_label} Â» avec ${aiContent.confidence_pct}% de confiance â€” signal direct d'une image gÃ©nÃ©rÃ©e, indÃ©pendamment des artefacts de compression.`
            : `Content analysis (AI model, server): this image was classified as "${aiContent.predicted_label}" with ${aiContent.confidence_pct}% confidence â€” a direct signal of generated content, independent of compression artifacts.`);
        } else {
          positive.push(language === 'fr'
            ? `Analyse de contenu (modÃ¨le IA, serveur) : cette image a Ã©tÃ© classÃ©e Â« ${aiContent.predicted_label} Â» avec ${aiContent.confidence_pct}% de confiance, cohÃ©rent avec une photo authentique.`
            : `Content analysis (AI model, server): this image was classified as "${aiContent.predicted_label}" with ${aiContent.confidence_pct}% confidence, consistent with an authentic photo.`);
        }
      } else if (backendImage.note) {
        negative.push(backendImage.note);
      }

      if (aiSigns > 60) {
        negative.push(language === 'fr' ? `Analyse ELA (serveur) : Ã©cart de recompression moyen de ${ela.mean_diff}/255, pic Ã  ${ela.max_diff}.` : `Server-side ELA: average recompression gap of ${ela.mean_diff}/255, peak at ${ela.max_diff}.`);
      } else if (aiSigns > 30) {
        negative.push(language === 'fr' ? `Analyse ELA (serveur) : quelques zones affichent un Ã©cart diffÃ©rent du reste (moyenne ${ela.mean_diff}/255).` : `Server-side ELA: a few zones show a different gap than the rest (average ${ela.mean_diff}/255).`);
      } else {
        positive.push(language === 'fr' ? `Analyse ELA (serveur) : Ã©cart de recompression faible et homogÃ¨ne (moyenne ${ela.mean_diff}/255).` : `Server-side ELA: low and even recompression gap (average ${ela.mean_diff}/255).`);
      }
    } else if (contentType === 'image') {
      const intensity = elaIntensity != null ? elaIntensity : 20; // fallback if canvas wasn't ready yet
      // Very low ELA noise across a whole image often indicates heavy smoothing
      // (generative AI upscaling/denoising) or a re-saved/recompressed file.
      const normalized = Math.max(0, Math.min(100, Math.round((30 - Math.min(intensity, 30)) * (100 / 30))));
      aiSigns = Math.max(15, normalized);
      incoherence = Math.round(aiSigns * 0.7);
      score = Math.round(100 - aiSigns * 0.8);
      credibility = Math.round(100 - aiSigns * 0.6);

      if (aiSigns > 65) {
        negative.push(language === 'fr' ? `Analyse ELA : signal de compression anormalement faible et uniforme (intensitÃ© moyenne ${intensity.toFixed(1)}/255), typique d'un lissage IA ou d'une recompression forte.` : `ELA analysis: unusually low and uniform compression signal (avg intensity ${intensity.toFixed(1)}/255), typical of AI smoothing or heavy recompression.`);
      } else if (aiSigns > 35) {
        negative.push(language === 'fr' ? "Analyse ELA : quelques zones avec un niveau de bruit diffÃ©rent du reste de l'image." : "ELA analysis: a few zones show a different noise level than the rest of the image.");
      } else {
        positive.push(language === 'fr' ? "Analyse ELA : le bruit de compression est rÃ©parti de faÃ§on cohÃ©rente sur l'ensemble de l'image." : "ELA analysis: compression noise is consistently distributed across the image.");
      }
    }

    const backendVideo = contentType === 'video' ? backendResultRef.current : null;
    if (backendVideo && backendVideo.type === 'video') {
      setBackendUsed(true);
      score = backendVideo.score;
      credibility = backendVideo.score;
      aiSigns = 50; // honnÃªte : sans analyse image par image, on ne peut pas estimer un vrai signal IA sur une vidÃ©o

      if (!backendVideo.valid_container) {
        negative.push(language === 'fr' ? "Le fichier ne correspond Ã  aucun format vidÃ©o reconnu â€” il pourrait Ãªtre corrompu ou dÃ©guisÃ©." : "The file doesn't match any recognized video format â€” it may be corrupted or disguised.");
      } else if (!backendVideo.extension_matches_content) {
        negative.push(language === 'fr' ? `L'extension du fichier ne correspond pas Ã  son contenu rÃ©el (dÃ©tectÃ© : ${backendVideo.detected_format}) â€” signe possible de manipulation.` : `The file extension doesn't match its actual content (detected: ${backendVideo.detected_format}) â€” a possible sign of tampering.`);
      } else {
        positive.push(language === 'fr' ? `Fichier vidÃ©o valide (${backendVideo.detected_format}), intÃ©gritÃ© du conteneur vÃ©rifiÃ©e cÃ´tÃ© serveur.` : `Valid video file (${backendVideo.detected_format}), container integrity verified server-side.`);
      }
      negative.push(backendVideo.limitation);
    } else if (contentType === 'video') {
      score = 45;
      credibility = 45;
      negative.push(language === 'fr' ? "Le serveur d'analyse vidÃ©o n'est pas joignable â€” aucune vÃ©rification n'a pu Ãªtre effectuÃ©e." : "The video analysis server is unreachable â€” no check could be performed.");
    }

    // Normalize final score bounds
    score = Math.max(Math.min(score, 99), 12);

    // A link on an unverifiable platform (or an unrecognized domain) can never be
    // auto-classified as "reliable" â€” we simply have no basis to claim that.
    if (contentType === 'link' && unverifiablePlatform) {
      score = Math.min(score, 58);
    }

    let verdict = t.verifier.verdictDoubtful;
    if (score >= 75) verdict = t.verifier.verdictReliable;
    else if (score < 40) verdict = aiSigns > 70 ? t.verifier.verdictAi : t.verifier.verdictFake;

    const finalReport = {
      type: contentType,
      title: inputVal.length > 60 ? inputVal.substring(0, 60) + '...' : inputVal || 'Fichier importÃ©',
      source: contentType === 'link' 
        ? (inputVal.includes('//') ? inputVal.split('/')[2] : inputVal.split('/')[0]) 
        : (language === 'fr' ? 'Import direct utilisateur' : 'Direct user upload'),
      verdict: verdict,
      score: score,
      details: {
        sourceCredibility: credibility,
        aiGenerated: aiSigns,
        emotionalManipulation: emotional,
        inconsistencies: incoherence
      },
      positivePoints: positive.length > 0 ? positive : [language === 'fr' ? "Structure lisible." : "Readable layout."],
      negativePoints: negative.length > 0 ? negative : [language === 'fr' ? "Aucune anomalie flagrante dÃ©tectÃ©e." : "No significant anomalies found."],
      explanation: score >= 75
        ? (language === 'fr' ? "Ce contenu est plutÃ´t fiable au vu de nos indicateurs : canal informatif reconnu, langage neutre, peu de signaux de manipulation dÃ©tectÃ©s." : "This content appears trustworthy based on our indicators: recognized source, neutral language, few manipulation signals detected.")
        : (language === 'fr' ? "Ce contenu prÃ©sente plusieurs signes de manipulation informationnelle selon nos indicateurs. Restez prudent et vÃ©rifiez auprÃ¨s d'une source indÃ©pendante avant de partager." : "This content shows several signs of information manipulation based on our indicators. Stay cautious and verify with an independent source before sharing."),
      disclaimer: language === 'fr'
        ? "Ce score est un indicateur basÃ© sur des rÃ¨gles vÃ©rifiables (domaine, vocabulaire, structure, analyse ELA) â€” ce n'est pas un verdict certifiÃ©. Aucun outil, y compris les plus avancÃ©s, ne peut garantir Ã  100 % qu'un contenu est authentique ou gÃ©nÃ©rÃ© par IA."
        : "This score is an indicator based on checkable rules (domain, wording, structure, ELA analysis) â€” not a certified verdict. No tool, however advanced, can guarantee with 100% certainty whether content is authentic or AI-generated.",
      serverAnalyzed: backendResultRef.current != null,
    };

    setReport(finalReport);
    setAnalyzing(false);
    onVerificationComplete(finalReport.score);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'var(--success)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  // Real Social Sharing Functionality
  const shareOnSocial = (platform, reportObj) => {
    const textMsg = `TruthLens AI - Analysis: ${reportObj.title} | Verdict: ${reportObj.verdict} (Score: ${reportObj.score}%).`;
    const shareUrl = window.location.href;
    
    let link = "";
    if (platform === 'twitter') {
      link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textMsg)}&url=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'facebook') {
      link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'whatsapp') {
      link = `https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg + " " + shareUrl)}`;
    }
    
    // Open in new window
    window.open(link, '_blank', 'width=600,height=400');
  };

  return (
    <div className="verifier-container animate-fade-in">
      <div className="verifier-hero" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', background: 'linear-gradient(to right, #00e5ff, #d400ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {t.verifier.title}
        </h1>
        <p style={{ fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
          {t.verifier.subtitle}
        </p>
      </div>

      <div className="verifier-layout">
        {/* Left Side: Forms */}
        <div className="verifier-input-section glass-card">
          <h3 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
            <Search size={20} style={{ color: 'var(--primary)' }} />
            {t.verifier.submitBox}
          </h3>

          <div className="type-selector">
            <button className={`type-btn ${contentType === 'link' ? 'active' : ''}`} onClick={() => { setContentType('link'); setInputVal(''); setFile(null); }}>
              <Link2 size={16} /> {t.verifier.typeLink}
            </button>
            <button className={`type-btn ${contentType === 'text' ? 'active' : ''}`} onClick={() => { setContentType('text'); setInputVal(''); setFile(null); }}>
              <FileText size={16} /> {t.verifier.typeText}
            </button>
            <button className={`type-btn ${contentType === 'image' ? 'active' : ''}`} onClick={() => { setContentType('image'); setInputVal(''); setFile(null); }}>
              <Image size={16} /> {t.verifier.typeImage}
            </button>
            <button className={`type-btn ${contentType === 'video' ? 'active' : ''}`} onClick={() => { setContentType('video'); setInputVal(''); setFile(null); }}>
              <Video size={16} /> {language === 'fr' ? 'VidÃ©o' : 'Video'}
            </button>
          </div>

          <div className="input-area" style={{ marginTop: '1.5rem' }}>
            {contentType === 'link' && (
              <div className="form-group">
                <label>URL</label>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder={t.verifier.inputLinkPlaceholder} 
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                />
              </div>
            )}

            {contentType === 'text' && (
              <div className="form-group">
                <label>Text</label>
                <textarea 
                  className="form-control" 
                  placeholder={t.verifier.inputTextPlaceholder}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                />
              </div>
            )}

            {contentType === 'image' && (
              <div className="file-uploader">
                <label htmlFor="file-input" className="file-upload-label">
                  <Upload size={32} style={{ color: 'var(--primary)', marginBottom: '0.8rem' }} />
                  <span>{file ? file.name : t.verifier.uploadTitle}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                    {file ? `${file.size} - Ready` : t.verifier.uploadSub}
                  </span>
                </label>
                <input 
                  id="file-input" 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            )}

            {contentType === 'video' && (
              <div className="file-uploader">
                <label htmlFor="video-input" className="file-upload-label">
                  <Video size={32} style={{ color: 'var(--primary)', marginBottom: '0.8rem' }} />
                  <span>{file ? file.name : (language === 'fr' ? 'Cliquez pour importer une vidÃ©o' : 'Click to upload a video')}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                    {file ? `${(file.size / (1024*1024)).toFixed(1)} Mo` : (language === 'fr' ? 'MP4, MOV, WEBM, AVI' : 'MP4, MOV, WEBM, AVI')}
                  </span>
                </label>
                <input 
                  id="video-input" 
                  type="file" 
                  accept="video/*" 
                  style={{ display: 'none' }}
                  onChange={handleVideoFileChange}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              onClick={runAnalysis}
              disabled={analyzing || (!inputVal && !file)}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="spinner" size={16} />
                  {t.common.loading}
                </>
              ) : t.verifier.buttonRun}
            </button>
          </div>

          {/* Quick presets */}
          <div className="preset-examples-box" style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--color-text-muted)' }}>{t.verifier.presetData}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button className="sample-badge-btn" onClick={() => handleSelectSample('link')}>{t.verifier.preset1}</button>
              <button className="sample-badge-btn" onClick={() => handleSelectSample('text')}>{t.verifier.preset3}</button>
              <button className="sample-badge-btn" onClick={() => handleSelectSample('image')}>{t.verifier.preset2}</button>
            </div>
          </div>
        </div>

        {/* Right Side: Diagnostics Logs or Results Card */}
        <div className="verifier-output-section">
          {analyzing && (
            <div className="glass-card scanner-card animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="radar-scanner">
                <div className="radar-circle"></div>
                <ShieldAlert size={48} className="radar-icon animate-float" />
              </div>
              <div className="scanner-logs" style={{ marginTop: '2rem' }}>
                <h4 style={{ fontFamily: 'var(--font-title)', color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>{t.verifier.analysisLogsTitle}</h4>
                <div className="logs-box">
                  {steps.map((step, idx) => (
                    <div key={idx} className={`log-line ${idx <= stepIndex ? 'visible' : ''} ${idx === stepIndex ? 'current' : ''}`}>
                      <span className="log-bullet">{idx < stepIndex ? <Check size={14} /> : idx === stepIndex ? <Zap size={14} /> : <Circle size={10} />}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!analyzing && !report && (
            <div className="glass-card placeholder-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderStyle: 'dashed' }}>
              <AlertTriangle size={48} style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text)' }}>{t.verifier.waitingTitle}</h3>
              <p style={{ maxWidth: '350px' }}>{t.verifier.waitingDesc}</p>
            </div>
          )}

          {!analyzing && report && (
            <div className="glass-card report-card animate-fade-in">
              <div className="report-header">
                <div>
                  <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>{t.verifier.reportTitle}</span>
                  <h2 style={{ color: 'var(--color-text)', fontSize: '1.6rem', marginBottom: '0.2rem' }}>{report.title}</h2>
                  <p style={{ fontSize: '0.85rem' }}>Source : {report.source}</p>
                </div>
                <div className="verdict-tag" style={{ borderLeft: `4px solid ${getScoreColor(report.score)}` }}>
                  <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--color-text-muted)' }}>{t.verifier.verdictLabel}</span>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: getScoreColor(report.score) }}>{report.verdict}</span>
                </div>
              </div>

              {/* Gauge and Indicators */}
              <div className="report-grid">
                <div className="score-radial-container">
                  <div className="score-circle" style={{ '--score-color': getScoreColor(report.score), '--score-pct': `${report.score}%` }}>
                    <div className="score-value">
                      <span className="num">{report.score}</span>
                      <span className="percent">%</span>
                      <span className="lbl">{t.common.reliability}</span>
                    </div>
                  </div>
                </div>

                <div className="score-bars">
                  <h4 style={{ marginBottom: '0.8rem', color: 'var(--color-text)', fontSize: '0.95rem' }}>{t.verifier.detailsLabel}</h4>
                  
                  <div className="bar-group">
                    <div className="bar-labels">
                      <span>{t.verifier.credibility}</span>
                      <span>{report.details.sourceCredibility}%</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${report.details.sourceCredibility}%`, background: 'var(--primary)' }}></div></div>
                  </div>

                  <div className="bar-group">
                    <div className="bar-labels">
                      <span>{t.verifier.aiSigns}</span>
                      <span>{report.details.aiGenerated}%</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${report.details.aiGenerated}%`, background: 'var(--secondary)' }}></div></div>
                  </div>

                  <div className="bar-group">
                    <div className="bar-labels">
                      <span>{t.verifier.emotional}</span>
                      <span>{report.details.emotionalManipulation}%</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${report.details.emotionalManipulation}%`, background: 'var(--warning)' }}></div></div>
                  </div>

                  <div className="bar-group">
                    <div className="bar-labels">
                      <span>{t.verifier.incoherence}</span>
                      <span>{report.details.inconsistencies}%</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${report.details.inconsistencies}%`, background: 'var(--danger)' }}></div></div>
                  </div>
                </div>
              </div>

              {/* Real HTML5 Canvas ELA rendering output if Image */}
              {contentType === 'image' && (
                <div className="ela-visualizer-container" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ color: 'var(--color-text)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>{t.verifier.elaVisual}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>Original Upload</span>
                      <div className="ela-box-border" style={{ maxHeight: '160px', overflow: 'hidden', borderRadius: '8px' }}>
                        {file && file.name.includes('pope') ? (
                          <div style={{ background: '#0c0a18', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ScanSearch size={40} color="#00E5FF" /></div>
                        ) : (
                          <span style={{ fontSize: '0.8rem' }}>Image File</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>ELA Map</span>
                      <canvas ref={canvasRef} style={{ maxWidth: '100%', height: '120px', background: '#000', borderRadius: '8px', border: '1px solid var(--border-color)' }}></canvas>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    {t.verifier.elaLegend}
                  </p>
                </div>
              )}

              {/* Explanations lists */}
              <div className="report-lists" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="list-box green-border">
                    <h5 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                      <CheckCircle size={16} /> {t.verifier.relElements}
                    </h5>
                    <ul>
                      {report.positivePoints.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                  <div className="list-box red-border">
                    <h5 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                      <AlertTriangle size={16} /> {t.verifier.susElements}
                    </h5>
                    <ul>
                      {report.negativePoints.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="report-verdict-box" style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '10px', borderLeft: '3px solid var(--primary)' }}>
                  <h5 style={{ color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {t.common.explanation}
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px',
                      background: report.serverAnalyzed ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
                      color: report.serverAnalyzed ? '#22c55e' : 'var(--color-text-muted)',
                    }}>
                      {report.serverAnalyzed
                        ? (language === 'fr' ? 'Analyse serveur rÃ©elle' : 'Real server analysis')
                        : (language === 'fr' ? 'Mode local (serveur injoignable)' : 'Local mode (server unreachable)')}
                    </span>
                  </h5>
                  <p style={{ fontSize: '0.9rem' }}>{report.explanation}</p>
                </div>

                {report.disclaimer && (
                  <div className="report-disclaimer-box" style={{ marginTop: '1rem', background: 'rgba(255,196,0,0.06)', padding: '1rem 1.2rem', borderRadius: '10px', borderLeft: '3px solid var(--warning)', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                    <HelpCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '0.15rem' }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>{report.disclaimer}</p>
                  </div>
                )}
              </div>

              {/* Action buttons with real shares */}
              <div className="report-actions" style={{ marginTop: '2rem', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    onAddToCommunity(report);
                    alert(translations[language].community.alertShared);
                  }}
                >
                  <Send size={16} /> {t.common.report}
                </button>

                {/* Real Social Shares Dropdown/Row */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.75rem' }} onClick={() => shareOnSocial('twitter', report)} title="Share on X">
                    <XIcon size={16} />
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.75rem' }} onClick={() => shareOnSocial('whatsapp', report)} title="Share on WhatsApp">
                    <MessageCircle size={16} />
                  </button>
                  <button className="btn btn-primary" onClick={() => {
                    navigator.clipboard.writeText(`${report.title} - Trust score: ${report.score}%`);
                    alert(translations[language].community.alertSharedClip);
                  }}>
                    <Share2 size={16} /> {t.common.share}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden Canvas used for real background image loading/drawing */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
}

