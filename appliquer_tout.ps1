# ===================================================================
# Applique TOUS les fichiers de cette session en une seule fois
# A executer depuis la racine du projet (ou se trouve package.json)
# ===================================================================

New-Item -ItemType Directory -Force -Path "backend\app" | Out-Null
New-Item -ItemType Directory -Force -Path "src\components" | Out-Null
New-Item -ItemType Directory -Force -Path "src\assets\aivsreal" | Out-Null

@'
"""
Analyse réelle côté serveur — image, vidéo et lien.

Deux niveaux d'analyse pour une image :
1. ELA (Error Level Analysis) — toujours actif, ne nécessite aucune clé.
2. Modèle IA de détection d'images génératives (Hugging Face Inference API) —
   analyse le CONTENU réel de l'image, pas juste ses artefacts de compression.
   Nécessite la variable d'environnement HF_API_TOKEN (le même token gratuit
   Hugging Face déjà utilisé pour IKAN AI). Sans ce token, seule l'ELA tourne
   et le rapport le dit explicitement — jamais de résultat inventé.

Pour un lien : au-delà des vérifications de domaine/HTTPS, on va chercher la
vraie image et le vrai titre de la page (balises Open Graph) et on fait
tourner l'image trouvée dans le même détecteur IA — donc même un lien "propre"
(HTTPS, domaine correct) est signalé si l'image qu'il montre est générée.
"""
import io
import os
import re
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, UploadFile, File
from PIL import Image, ImageChops
from pydantic import BaseModel

router = APIRouter(prefix="/analyze", tags=["analyze"])

HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")
HF_IMAGE_MODEL = "Organika/sdxl-detector"  # détecteur d'images générées (Hugging Face, public)

RELIABLE_DOMAINS = {
    "rfi.fr", "jeuneafrique.com", "africanews.com", "lemonde.fr", "lefigaro.fr",
    "franceinfo.fr", "france24.com", "bbc.com", "bbc.co.uk", "reuters.com",
    "apnews.com", "afp.com", "lepoint.fr", "liberation.fr", "wikipedia.org",
}
VIDEO_SOCIAL_DOMAINS = {
    "youtube.com", "youtu.be", "tiktok.com", "facebook.com", "instagram.com",
    "twitter.com", "x.com", "snapchat.com", "threads.net",
}
SUSPICIOUS_TLDS = (".xyz", ".top", ".click", ".tk", ".ml", ".ga", ".cf")
CLICKBAIT_WORDS_FR = ["choc", "incroyable", "secret", "miracle", "jamais vu", "ils ne veulent pas"]
CLICKBAIT_WORDS_EN = ["shocking", "unbelievable", "secret", "miracle", "never seen", "they don't want you"]


def _domain_matches(domain: str, known: set[str]) -> bool:
    return any(domain == d or domain.endswith("." + d) for d in known)


async def _classify_image_content(image_bytes: bytes):
    """Interroge un vrai modèle de détection d'images générées par IA.
    Retourne None (silencieusement) si HF_API_TOKEN n'est pas configuré ou si
    l'appel échoue — jamais un résultat inventé à la place."""
    if not HF_API_TOKEN:
        return None
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                f"https://api-inference.huggingface.co/models/{HF_IMAGE_MODEL}",
                headers={"Authorization": f"Bearer {HF_API_TOKEN}"},
                content=image_bytes,
            )
        if resp.status_code != 200:
            return None
        data = resp.json()
        if isinstance(data, list) and data:
            best = max(data, key=lambda x: x.get("score", 0))
            return {
                "predicted_label": best.get("label", ""),
                "confidence_pct": round(best.get("score", 0) * 100, 1),
                "all_labels": data,
            }
    except Exception:
        return None
    return None


def _ela_score(raw: bytes):
    try:
        original = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        return None
    buffer = io.BytesIO()
    original.save(buffer, "JPEG", quality=90)
    buffer.seek(0)
    resaved = Image.open(buffer)
    diff = ImageChops.difference(original, resaved)
    extrema = diff.getextrema()
    max_diff = max(ch[1] for ch in extrema)
    total, count = 0, 0
    for band in diff.split():
        hist = band.histogram()
        total += sum(v * n for v, n in enumerate(hist))
        count += sum(hist)
    mean_diff = total / count
    ela_score = 100 - (mean_diff * 7)
    if max_diff > mean_diff * 12:
        ela_score -= 15
    ela_score = max(8, min(96, round(ela_score)))
    return {"score": ela_score, "mean_diff": round(mean_diff, 2), "max_diff": max_diff,
            "width": original.width, "height": original.height}


@router.post("/image")
async def analyze_image(file: UploadFile = File(...)):
    raw = await file.read()
    ela = _ela_score(raw)
    if ela is None:
        return {"error": "image_illisible"}

    ai_content = await _classify_image_content(raw)

    if ai_content:
        label = ai_content["predicted_label"].lower()
        conf = ai_content["confidence_pct"]
        looks_artificial = any(k in label for k in ("artificial", "fake", "ai", "generated", "synthetic"))
        content_score = max(3, round(100 - conf)) if looks_artificial else round(conf)
        # Le modèle de contenu pèse plus lourd que l'ELA — il regarde ce qu'il y a
        # VRAIMENT dans l'image, pas seulement ses artefacts de compression.
        final_score = round(content_score * 0.75 + ela["score"] * 0.25)
        method = "ai_content_model+ela"
    else:
        final_score = ela["score"]
        method = "error_level_analysis_only"

    return {
        "score": max(3, min(97, final_score)),
        "ela": ela,
        "ai_content_analysis": ai_content,
        "method": method,
        "note": None if ai_content else "Analyse de contenu IA non disponible (HF_API_TOKEN non configuré côté serveur) — score basé uniquement sur l'ELA.",
    }


@router.post("/video")
async def analyze_video(file: UploadFile = File(...)):
    """Vérifications réelles mais limitées : intégrité du conteneur, cohérence
    de l'extension. Une vraie détection de deepfake vidéo (image par image,
    cohérence temporelle) demande un modèle spécialisé que ce serveur ne fait
    pas tourner — le score reste donc plafonné et la limite est explicite."""
    raw = await file.read(2_000_000)
    is_mp4_mov = raw[4:8] in (b"ftyp",) if len(raw) >= 8 else False
    is_webm = raw[:4] == b"\x1a\x45\xdf\xa3"
    is_avi = raw[:4] == b"RIFF" and raw[8:12] == b"AVI "
    valid_container = is_mp4_mov or is_webm or is_avi
    detected_format = "mp4/mov" if is_mp4_mov else "webm" if is_webm else "avi" if is_avi else "inconnu"
    ext = (file.filename or "").lower().rsplit(".", 1)[-1] if "." in (file.filename or "") else ""
    ext_matches_content = (
        (detected_format == "mp4/mov" and ext in ("mp4", "mov", "m4v"))
        or (detected_format == "webm" and ext == "webm")
        or (detected_format == "avi" and ext == "avi")
    )
    score = 50
    if not valid_container:
        score = 20
    elif not ext_matches_content:
        score -= 15
    return {
        "score": max(10, min(70, score)),
        "valid_container": valid_container,
        "detected_format": detected_format,
        "extension_matches_content": ext_matches_content,
        "bytes_analyzed": len(raw),
        "method": "container_integrity_only",
        "limitation": "Analyse de contenu vidéo (détection de deepfake image par image) non disponible sur ce serveur — seule l'intégrité du fichier a été vérifiée.",
    }


def _extract_og_tags(html: str):
    def find(prop):
        m = re.search(rf'<meta[^>]+property=["\']og:{prop}["\'][^>]+content=["\']([^"\']*)', html, re.I)
        if not m:
            m = re.search(rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+property=["\']og:{prop}["\']', html, re.I)
        return m.group(1) if m else None
    return {"title": find("title"), "description": find("description"), "image": find("image")}


class LinkIn(BaseModel):
    url: str


@router.post("/link")
async def analyze_link(data: LinkIn):
    url = data.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed = urlparse(url)
    domain = parsed.netloc.lower().replace("www.", "")
    is_https = parsed.scheme == "https"
    is_ip = bool(re.match(r"^\d+\.\d+\.\d+\.\d+$", parsed.netloc.split(":")[0]))
    suspicious_tld = domain.endswith(SUSPICIOUS_TLDS)
    reliable = _domain_matches(domain, RELIABLE_DOMAINS)
    video_social = _domain_matches(domain, VIDEO_SOCIAL_DOMAINS)

    reachable, status_code, redirect_count = False, None, 0
    og = {"title": None, "description": None, "image": None}
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=8.0) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 TruthLensBot"})
            reachable = True
            status_code = resp.status_code
            redirect_count = len(resp.history)
            if "text/html" in resp.headers.get("content-type", ""):
                og = _extract_og_tags(resp.text[:200_000])
    except Exception:
        pass

    text_blob = f"{og['title'] or ''} {og['description'] or ''}".lower()
    clickbait_hits = sum(1 for w in (CLICKBAIT_WORDS_FR + CLICKBAIT_WORDS_EN) if w in text_blob)

    image_content_analysis = None
    if og["image"]:
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                img_resp = await client.get(og["image"])
            if img_resp.status_code == 200:
                image_content_analysis = await _classify_image_content(img_resp.content)
        except Exception:
            pass

    score = 50
    if reliable:
        score = 85
    elif video_social:
        score = min(score, 58)
    if not is_https:
        score -= 15
    if is_ip:
        score -= 30
    if suspicious_tld:
        score -= 20
    if not reachable:
        score -= 25
    elif status_code and status_code >= 400:
        score -= 20
    if redirect_count >= 3:
        score -= 10
    if clickbait_hits > 0:
        score -= clickbait_hits * 12

    content_flagged_artificial = False
    if image_content_analysis:
        label = image_content_analysis["predicted_label"].lower()
        if any(k in label for k in ("artificial", "fake", "ai", "generated", "synthetic")):
            content_flagged_artificial = True
            score = min(score, max(10, round(100 - image_content_analysis["confidence_pct"])))

    score = max(5, min(95, score))

    return {
        "score": score,
        "domain": domain,
        "is_https": is_https,
        "is_ip_address": is_ip,
        "suspicious_tld": suspicious_tld,
        "known_reliable_source": reliable,
        "video_social_platform": video_social,
        "reachable": reachable,
        "status_code": status_code,
        "redirect_count": redirect_count,
        "verdict_capped": video_social,
        "page_title": og["title"],
        "page_description": og["description"],
        "clickbait_words_found": clickbait_hits,
        "image_content_analysis": image_content_analysis,
        "content_flagged_artificial": content_flagged_artificial,
        "note": None if HF_API_TOKEN else "Analyse du contenu visuel réel non disponible (HF_API_TOKEN non configuré) — score basé uniquement sur le domaine et l'accessibilité.",
    }

'@ | Out-File -Encoding utf8 "backend\app\analyze.py"
Write-Host "OK: backend\app\analyze.py"

@'
from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .database import init_db, get_session
from .models import Post, Comment, PostCreate, CommentCreate, VoteAction
from .analyze import router as analyze_router

app = FastAPI(title="TruthLens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only — restreindre au domaine du frontend en production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- POSTS (fil de la communauté) ----------

@app.get("/posts", response_model=List[Post])
def list_posts(session: Session = Depends(get_session)):
    posts = session.exec(select(Post).order_by(Post.created_at.desc())).all()
    return posts


@app.post("/posts", response_model=Post)
def create_post(data: PostCreate, session: Session = Depends(get_session)):
    post = Post(**data.dict())
    session.add(post)
    session.commit()
    session.refresh(post)
    return post


@app.get("/posts/{post_id}", response_model=Post)
def get_post(post_id: int, session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post introuvable")
    return post


@app.post("/posts/{post_id}/vote", response_model=Post)
def vote_post(post_id: int, action: VoteAction, session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post introuvable")
    if action.direction == "up":
        post.votes += 1
    elif action.direction == "flag":
        post.flags += 1
    else:
        raise HTTPException(status_code=400, detail="direction doit être 'up' ou 'flag'")
    session.add(post)
    session.commit()
    session.refresh(post)
    return post


# ---------- COMMENTS ----------

@app.get("/posts/{post_id}/comments", response_model=List[Comment])
def list_comments(post_id: int, session: Session = Depends(get_session)):
    comments = session.exec(
        select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at)
    ).all()
    return comments


@app.post("/posts/{post_id}/comments", response_model=Comment)
def add_comment(post_id: int, data: CommentCreate, session: Session = Depends(get_session)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post introuvable")
    comment = Comment(post_id=post_id, **data.dict())
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment

'@ | Out-File -Encoding utf8 "backend\app\main.py"
Write-Host "OK: backend\app\main.py"

@'
fastapi>=0.115
uvicorn[standard]>=0.30
sqlmodel>=0.0.22
pydantic>=2.9
python-multipart>=0.0.9
Pillow>=10.4
httpx>=0.27

'@ | Out-File -Encoding utf8 "backend\requirements.txt"
Write-Host "OK: backend\requirements.txt"

@'
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
        ? "Le gouvernement annonce une baisse progressive de la fiscalité sur l'électricité de 5% à compter du 1er janvier afin d'alléger les factures des ménages."
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
      // uniform low-noise regions or unnaturally strong uniform edges — this
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
  // unreachable — offline/local mode then uses the client-side heuristics below,
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

    // Rule 1: Link Domain Heuristics — use the REAL server-side check (actual HTTP fetch +
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
        positive.push(language === 'fr' ? "Le domaine appartient à une source reconnue de notre liste de médias fiables (vérifié côté serveur)." : "The domain belongs to a recognized source in our trusted media list (server-verified).");
      }
      if (backendLink.video_social_platform) {
        negative.push(language === 'fr' ? "Ce lien pointe vers une plateforme d'hébergement vidéo/sociale — n'importe qui peut y publier n'importe quoi." : "This link points to a video/social hosting platform — anyone can upload anything there.");
      }
      if (!backendLink.reachable) {
        score -= 0; // already reflected server-side
        negative.push(language === 'fr' ? "Le serveur n'a pas réussi à joindre cette page (lien mort, hors ligne, ou bloqué)." : "The server could not reach this page (dead link, offline, or blocked).");
      } else if (backendLink.status_code && backendLink.status_code >= 400) {
        negative.push(language === 'fr' ? `La page a répondu avec une erreur (code ${backendLink.status_code}).` : `The page responded with an error (code ${backendLink.status_code}).`);
      } else {
        positive.push(language === 'fr' ? "La page a été jointe et a répondu correctement (vérifié côté serveur en temps réel)." : "The page was reached and responded correctly (verified server-side in real time).");
      }
      if (backendLink.is_ip_address) {
        negative.push(language === 'fr' ? "Le lien utilise une adresse IP brute au lieu d'un nom de domaine." : "The link uses a raw IP address instead of a domain name.");
      }
      if (backendLink.clickbait_words_found > 0) {
        negative.push(language === 'fr'
          ? `Le vrai titre/description de la page (${backendLink.clickbait_words_found} mot(s) à forte charge émotionnelle détecté(s)) : « ${backendLink.page_title || '?'} »`
          : `The page's real title/description (${backendLink.clickbait_words_found} emotionally-charged word(s) detected): "${backendLink.page_title || '?'}"`);
      } else if (backendLink.page_title) {
        positive.push(language === 'fr' ? `Titre réel de la page (vocabulaire neutre) : « ${backendLink.page_title} »` : `Real page title (neutral wording): "${backendLink.page_title}"`);
      }
      if (backendLink.image_content_analysis) {
        const ic = backendLink.image_content_analysis;
        if (backendLink.content_flagged_artificial) {
          negative.push(language === 'fr'
            ? `Analyse de l'image réelle affichée par ce lien (modèle IA, serveur) : classée « ${ic.predicted_label} » à ${ic.confidence_pct}% — le lien lui-même peut paraître sain, mais son contenu visuel semble généré par IA.`
            : `Analysis of the actual image shown by this link (AI model, server): classified as "${ic.predicted_label}" at ${ic.confidence_pct}% — the link itself may look clean, but its visual content appears AI-generated.`);
        } else {
          positive.push(language === 'fr'
            ? `Analyse de l'image réelle affichée par ce lien (modèle IA, serveur) : classée « ${ic.predicted_label} » à ${ic.confidence_pct}%, cohérent avec une photo authentique.`
            : `Analysis of the actual image shown by this link (AI model, server): classified as "${ic.predicted_label}" at ${ic.confidence_pct}%, consistent with an authentic photo.`);
        }
      } else if (backendLink.note) {
        negative.push(backendLink.note);
      }
      if (!backendLink.is_https) {
        negative.push(language === 'fr' ? "Le lien n'utilise pas de connexion sécurisée (https)." : "The link does not use a secure connection (https).");
      }
      if (backendLink.suspicious_tld) {
        negative.push(language === 'fr' ? "Extension de domaine associée à un taux élevé de sites frauduleux." : "Domain extension associated with a high rate of fraudulent sites.");
      }
      if (backendLink.redirect_count >= 3) {
        negative.push(language === 'fr' ? `Chaîne de redirections suspecte (${backendLink.redirect_count} redirections avant d'arriver à la page finale).` : `Suspicious redirect chain (${backendLink.redirect_count} redirects before reaching the final page).`);
      }
    } else if (contentType === 'link') {
      const matchReliable = ['gov', 'gouv.fr', 'bbc.com', 'lemonde.fr', 'nytimes.com', 'afp.com', 'reuters.com', 'nature.com', 'pubmed', 'unesco.org', 'france24.com', 'lefigaro.fr', 'liberation.fr', 'who.int', 'un.org', 'wikipedia.org', 'ap.org', 'lapresse.ca', 'radio-canada.ca', 'rfi.fr', 'jeuneafrique.com', 'africanews.com', 'apanews.net', 'seneweb.com', 'walf-groupe.com', 'lefaso.net', 'aouaga.com'].some(d => d.includes(analysisText) || analysisText.includes(d));
      const matchUnreliable = ['sante-naturelle', 'extreme', 'conspiration', 'shock', 'leak', 'secret', 'clickbait', 'conspir', 'blog', 'miracle-cure', 'infowars', 'exposethetruth', 'realnews24'].some(d => d.includes(analysisText) || analysisText.includes(d));
      // Video/social hosting platforms are NOT publishers — anyone can upload anything there.
      // A youtube.com or tiktok.com link carries zero credibility signal by itself.
      const matchPlatform = ['youtube.com', 'youtu.be', 'tiktok.com', 'facebook.com', 'dailymotion.com', 'instagram.com', 'x.com', 'twitter.com'].some(d => analysisText.includes(d));

      if (matchReliable) {
        credibility = 95;
        score += 15;
        positive.push(language === 'fr' ? "Le domaine appartient à une organisation d'autorité reconnue ou un média certifié." : "The domain belongs to an authoritative organization or a certified news agency.");
      } else if (matchUnreliable) {
        credibility = 18;
        score -= 50;
        negative.push(language === 'fr' ? "Le domaine figure sur notre liste noire des sites clickbaits ou complotistes." : "This domain is blacklisted as clickbait or conspiracy site.");
      } else if (matchPlatform) {
        unverifiablePlatform = true;
        credibility = 40;
        score -= 30;
        negative.push(language === 'fr'
          ? "Ce lien pointe vers une plateforme d'hébergement vidéo (YouTube, TikTok, Facebook...) — n'importe qui peut y publier n'importe quoi. L'URL ne prouve rien sur la véracité du contenu ; seul le compte/la chaîne qui l'a publié compte, et nous ne pouvons pas le vérifier automatiquement."
          : "This link points to a video hosting platform (YouTube, TikTok, Facebook...) — anyone can upload anything there. The URL itself proves nothing about the content's accuracy; only the publishing account matters, and we cannot verify it automatically.");
      } else {
        credibility = 45;
        score -= 20;
        negative.push(language === 'fr' ? "Source indépendante ou non répertoriée dans la base de confiance mondiale." : "Independent source, unverified in international registry.");
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
        ? `Détection de ${clickbaitMatches} mot(s) à forte manipulation émotionnelle (clickbait).` 
        : `Detected ${clickbaitMatches} clickbait words aimed at emotional trigger.`
      );
    } else {
      positive.push(language === 'fr' ? "Le vocabulaire employé est neutre et factuel." : "Vocabulary is neutral and factual.");
    }

    // Rule 3: Punctuation density & Caps shouting
    const exclamationsCount = (inputVal.match(/!/g) || []).length;
    const questionsCount = (inputVal.match(/\?/g) || []).length;
    if (exclamationsCount > 2) {
      emotional = Math.max(emotional, 75);
      score -= 15;
      negative.push(language === 'fr' ? `Ponctuation sensationnaliste détectée (${exclamationsCount} points d'exclamation).` : `Sensational punctuation detected (${exclamationsCount} exclamation marks).`);
    }

    // Shout detection (words with capital letters longer than 3 characters)
    const shoutsCount = (inputVal.match(/\b[A-Z]{4,}\b/g) || []).length;
    if (shoutsCount > 2) {
      emotional = Math.max(emotional, 80);
      score -= 10;
      negative.push(language === 'fr' ? `Utilisation anormale de mots entièrement en majuscules (cri numérique).` : `Abnormal uppercase words detected (digital shouting).`);
    }

    // Rule 1bis: URL structure heuristics (real, checkable signals — not a truth oracle)
    if (contentType === 'link') {
      const looksLikeIp = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(inputVal);
      const subdomainCount = (inputVal.match(/\./g) || []).length;
      const hasHttps = inputVal.startsWith('https://');
      const suspiciousTld = /\.(top|xyz|click|country|gq|tk|work)([/?#]|$)/i.test(inputVal);

      if (looksLikeIp) {
        score -= 25;
        negative.push(language === 'fr' ? "Le lien utilise une adresse IP brute au lieu d'un nom de domaine — pratique rare pour un site légitime." : "The link uses a raw IP address instead of a domain name — uncommon for legitimate sites.");
      }
      if (!hasHttps) {
        score -= 8;
        negative.push(language === 'fr' ? "Le lien n'utilise pas de connexion sécurisée (https)." : "The link does not use a secure connection (https).");
      }
      if (subdomainCount >= 4) {
        score -= 10;
        negative.push(language === 'fr' ? "Structure de domaine inhabituellement complexe (nombreux sous-domaines)." : "Unusually complex domain structure (many subdomains).");
      }
      if (suspiciousTld) {
        score -= 15;
        credibility = Math.min(credibility, 35);
        negative.push(language === 'fr' ? "Extension de domaine associée à un taux élevé de sites frauduleux (.top, .xyz, .click...)." : "Domain extension associated with a high rate of fraudulent sites.");
      }
    }

    // Rule 4: Image specific analysis — REAL score derived from the ELA computation above,
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
            ? `Analyse de contenu (modèle IA, serveur) : cette image a été classée « ${aiContent.predicted_label} » avec ${aiContent.confidence_pct}% de confiance — signal direct d'une image générée, indépendamment des artefacts de compression.`
            : `Content analysis (AI model, server): this image was classified as "${aiContent.predicted_label}" with ${aiContent.confidence_pct}% confidence — a direct signal of generated content, independent of compression artifacts.`);
        } else {
          positive.push(language === 'fr'
            ? `Analyse de contenu (modèle IA, serveur) : cette image a été classée « ${aiContent.predicted_label} » avec ${aiContent.confidence_pct}% de confiance, cohérent avec une photo authentique.`
            : `Content analysis (AI model, server): this image was classified as "${aiContent.predicted_label}" with ${aiContent.confidence_pct}% confidence, consistent with an authentic photo.`);
        }
      } else if (backendImage.note) {
        negative.push(backendImage.note);
      }

      if (aiSigns > 60) {
        negative.push(language === 'fr' ? `Analyse ELA (serveur) : écart de recompression moyen de ${ela.mean_diff}/255, pic à ${ela.max_diff}.` : `Server-side ELA: average recompression gap of ${ela.mean_diff}/255, peak at ${ela.max_diff}.`);
      } else if (aiSigns > 30) {
        negative.push(language === 'fr' ? `Analyse ELA (serveur) : quelques zones affichent un écart différent du reste (moyenne ${ela.mean_diff}/255).` : `Server-side ELA: a few zones show a different gap than the rest (average ${ela.mean_diff}/255).`);
      } else {
        positive.push(language === 'fr' ? `Analyse ELA (serveur) : écart de recompression faible et homogène (moyenne ${ela.mean_diff}/255).` : `Server-side ELA: low and even recompression gap (average ${ela.mean_diff}/255).`);
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
        negative.push(language === 'fr' ? `Analyse ELA : signal de compression anormalement faible et uniforme (intensité moyenne ${intensity.toFixed(1)}/255), typique d'un lissage IA ou d'une recompression forte.` : `ELA analysis: unusually low and uniform compression signal (avg intensity ${intensity.toFixed(1)}/255), typical of AI smoothing or heavy recompression.`);
      } else if (aiSigns > 35) {
        negative.push(language === 'fr' ? "Analyse ELA : quelques zones avec un niveau de bruit différent du reste de l'image." : "ELA analysis: a few zones show a different noise level than the rest of the image.");
      } else {
        positive.push(language === 'fr' ? "Analyse ELA : le bruit de compression est réparti de façon cohérente sur l'ensemble de l'image." : "ELA analysis: compression noise is consistently distributed across the image.");
      }
    }

    const backendVideo = contentType === 'video' ? backendResultRef.current : null;
    if (backendVideo && backendVideo.type === 'video') {
      setBackendUsed(true);
      score = backendVideo.score;
      credibility = backendVideo.score;
      aiSigns = 50; // honnête : sans analyse image par image, on ne peut pas estimer un vrai signal IA sur une vidéo

      if (!backendVideo.valid_container) {
        negative.push(language === 'fr' ? "Le fichier ne correspond à aucun format vidéo reconnu — il pourrait être corrompu ou déguisé." : "The file doesn't match any recognized video format — it may be corrupted or disguised.");
      } else if (!backendVideo.extension_matches_content) {
        negative.push(language === 'fr' ? `L'extension du fichier ne correspond pas à son contenu réel (détecté : ${backendVideo.detected_format}) — signe possible de manipulation.` : `The file extension doesn't match its actual content (detected: ${backendVideo.detected_format}) — a possible sign of tampering.`);
      } else {
        positive.push(language === 'fr' ? `Fichier vidéo valide (${backendVideo.detected_format}), intégrité du conteneur vérifiée côté serveur.` : `Valid video file (${backendVideo.detected_format}), container integrity verified server-side.`);
      }
      negative.push(backendVideo.limitation);
    } else if (contentType === 'video') {
      score = 45;
      credibility = 45;
      negative.push(language === 'fr' ? "Le serveur d'analyse vidéo n'est pas joignable — aucune vérification n'a pu être effectuée." : "The video analysis server is unreachable — no check could be performed.");
    }

    // Normalize final score bounds
    score = Math.max(Math.min(score, 99), 12);

    // A link on an unverifiable platform (or an unrecognized domain) can never be
    // auto-classified as "reliable" — we simply have no basis to claim that.
    if (contentType === 'link' && unverifiablePlatform) {
      score = Math.min(score, 58);
    }

    let verdict = t.verifier.verdictDoubtful;
    if (score >= 75) verdict = t.verifier.verdictReliable;
    else if (score < 40) verdict = aiSigns > 70 ? t.verifier.verdictAi : t.verifier.verdictFake;

    const finalReport = {
      type: contentType,
      title: inputVal.length > 60 ? inputVal.substring(0, 60) + '...' : inputVal || 'Fichier importé',
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
      negativePoints: negative.length > 0 ? negative : [language === 'fr' ? "Aucune anomalie flagrante détectée." : "No significant anomalies found."],
      explanation: score >= 75
        ? (language === 'fr' ? "Ce contenu est plutôt fiable au vu de nos indicateurs : canal informatif reconnu, langage neutre, peu de signaux de manipulation détectés." : "This content appears trustworthy based on our indicators: recognized source, neutral language, few manipulation signals detected.")
        : (language === 'fr' ? "Ce contenu présente plusieurs signes de manipulation informationnelle selon nos indicateurs. Restez prudent et vérifiez auprès d'une source indépendante avant de partager." : "This content shows several signs of information manipulation based on our indicators. Stay cautious and verify with an independent source before sharing."),
      disclaimer: language === 'fr'
        ? "Ce score est un indicateur basé sur des règles vérifiables (domaine, vocabulaire, structure, analyse ELA) — ce n'est pas un verdict certifié. Aucun outil, y compris les plus avancés, ne peut garantir à 100 % qu'un contenu est authentique ou généré par IA."
        : "This score is an indicator based on checkable rules (domain, wording, structure, ELA analysis) — not a certified verdict. No tool, however advanced, can guarantee with 100% certainty whether content is authentic or AI-generated.",
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
              <Video size={16} /> {language === 'fr' ? 'Vidéo' : 'Video'}
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
                  <span>{file ? file.name : (language === 'fr' ? 'Cliquez pour importer une vidéo' : 'Click to upload a video')}</span>
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
                        ? (language === 'fr' ? 'Analyse serveur réelle' : 'Real server analysis')
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

'@ | Out-File -Encoding utf8 "src\components\Verifier.jsx"
Write-Host "OK: src\components\Verifier.jsx"

@'
import React, { useState, useEffect } from 'react';
import { kidsQuizzesData, translations } from '../translations';
import { Award, ShieldAlert, Sparkles, Smile, Star, ArrowRight, Check, AlertTriangle, RotateCcw, ScanSearch, Link2, Bird, Dog, Cat, Rabbit, X, PartyPopper, Lightbulb, Trophy } from 'lucide-react';
import { ILLUSTRATIONS } from './KidsIllustrations';
import KidsMissionMode from './KidsMissionMode';
import AiOrRealMode from './AiOrRealMode';

const AVATARS = [
  { id: 'owl', name: 'Chouette Savante / Smart Owl', Icon: Bird, color: '#ffb300' },
  { id: 'dog', name: 'Chien Détective / Dog Detective', Icon: Dog, color: '#00e5ff' },
  { id: 'cat', name: 'Chat Ninja / Cat Ninja', Icon: Cat, color: '#00e676' },
  { id: 'fox', name: 'Renard Rusé / Sly Fox', Icon: Rabbit, color: '#ff3d00' }
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
          <ScanSearch size={15} /> {language === 'fr' ? 'Missions Détective' : 'Detective Missions'}
        </button>
        <button className={`tj-mode-btn ${gameMode === 'quizzes' ? 'active' : ''}`} onClick={() => setGameMode('quizzes')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Award size={15} /> {language === 'fr' ? 'Quiz classiques' : 'Classic quizzes'}
        </button>
        <button className={`tj-mode-btn ${gameMode === 'aiorreal' ? 'active' : ''}`} onClick={() => setGameMode('aiorreal')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={15} /> {language === 'fr' ? 'IA ou Réel' : 'AI or Real'}
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
                  ? `Tu as répondu correctement à ${correctAnswersCount} question(s) sur ${activeQuiz.questions.length} !` 
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
                    ? 'Essaie encore une fois pour obtenir toutes les bonnes réponses et gagner le badge !' 
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

'@ | Out-File -Encoding utf8 "src\components\KidsArena.jsx"
Write-Host "OK: src\components\KidsArena.jsx"

@'
import React, { useState } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import houseWaterfallAi from '../assets/aivsreal/house-waterfall-ai.png';
import beachCliffsReal from '../assets/aivsreal/beach-cliffs-real.png';

const TXT = {
  fr: {
    banner: 'À TOI DE JOUER !', title: 'IA OU RÉEL ?', subtitle: 'Laquelle de ces deux photos a été créée par une IA ?',
    choose: 'Choisis A ou B', correct: 'Bonne réponse !', wrong: 'Pas tout à fait...',
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
      fr: "L'image B (la maison flottante) est générée par IA : une île qui flotte dans les airs n'existe pas dans la réalité, et les détails (cascade, éclairage) sont trop parfaitement composés. L'image A est une vraie photo de plage — la lumière et les textures sont naturelles.",
      en: "Image B (the floating house) is AI-generated: a floating island doesn't exist in reality, and the details (waterfall, lighting) are too perfectly composed. Image A is a real beach photo — the light and textures are natural.",
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
              {round.optionA.isAi ? <><Sparkles size={13} /> IA</> : <><Check size={13} /> {language === 'fr' ? 'Réel' : 'Real'}</>}
            </div>
          )}
        </div>
        <div className={`aor-image-card ${answered ? (round.optionB.isAi ? 'is-ai' : 'is-real') : ''}`}>
          <span className="aor-letter-badge letter-b">B</span>
          <img src={round.optionB.img} alt="Option B" />
          {answered && (
            <div className="aor-result-tag">
              {round.optionB.isAi ? <><Sparkles size={13} /> IA</> : <><Check size={13} /> {language === 'fr' ? 'Réel' : 'Real'}</>}
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

'@ | Out-File -Encoding utf8 "src\components\AiOrRealMode.jsx"
Write-Host "OK: src\components\AiOrRealMode.jsx"

@'
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

:root {
  --bg-primary: #06050c;
  --bg-secondary: #0c0b18;
  --bg-card: rgba(15, 14, 28, 0.65);
  --bg-card-hover: rgba(22, 20, 42, 0.85);
  --border-color: rgba(255, 255, 255, 0.08);
  --border-color-hover: rgba(255, 255, 255, 0.18);
  
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  
  /* Brand colors */
  --primary: #00e5ff;
  --primary-glow: rgba(0, 229, 255, 0.4);
  --secondary: #d400ff;
  --secondary-glow: rgba(212, 0, 255, 0.4);
  
  --success: #00e676;
  --success-glow: rgba(0, 230, 118, 0.3);
  --warning: #ffb300;
  --warning-glow: rgba(255, 179, 0, 0.3);
  --danger: #ff3d00;
  --danger-glow: rgba(255, 61, 0, 0.3);
  
  --font-title: 'Outfit', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
}

/* LIGHT MODE OVERRIDES */
body.light-mode {
  --bg-primary: #f8fafc;
  --bg-secondary: #f1f5f9;
  --bg-card: rgba(255, 255, 255, 0.8);
  --bg-card-hover: rgba(255, 255, 255, 0.95);
  --border-color: rgba(15, 23, 42, 0.08);
  --border-color-hover: rgba(15, 23, 42, 0.16);
  
  --color-text: #0f172a;
  --color-text-muted: #475569;
  
  --primary: #009cb3;
  --primary-glow: rgba(0, 156, 179, 0.25);
  
  --secondary: #b600db;
  --secondary-glow: rgba(182, 0, 219, 0.25);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-primary);
  background-image: 
    radial-gradient(at 0% 0%, rgba(212, 0, 255, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(0, 229, 255, 0.12) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(15, 14, 28, 0.6) 0px, transparent 100%);
  background-attachment: fixed;
  color: var(--color-text);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

body.light-mode {
  background-image: 
    radial-gradient(at 0% 0%, rgba(182, 0, 219, 0.08) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(0, 156, 179, 0.07) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(241, 245, 249, 0.5) 0px, transparent 100%);
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg-primary);
}
::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.2);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-title);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

p {
  line-height: 1.6;
  color: var(--color-text-muted);
  max-width: 70ch;
}

/* Common Layout */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem 1.5rem;
}

/* Glassmorphism Card */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2.2rem;
  box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.04),
    transparent
  );
  transition: 0.6s;
  pointer-events: none;
}

.glass-card:hover::before {
  left: 150%;
}

.glass-card.hoverable:hover {
  transform: translateY(-4px);
  border-color: var(--border-color-hover);
  box-shadow: 0 15px 45px 0 rgba(0, 0, 0, 0.35);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.6rem;
  border-radius: 12px;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, #00b0ff 100%);
  color: #000;
  box-shadow: 0 5px 15px var(--primary-glow);
}

body.light-mode .btn-primary {
  color: #fff;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 229, 255, 0.55);
  filter: brightness(1.08);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  border: 1px solid var(--border-color);
}

body.light-mode .btn-secondary {
  background: rgba(15, 23, 42, 0.03);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--border-color-hover);
  transform: translateY(-2px);
}

body.light-mode .btn-secondary:hover {
  background: rgba(15, 23, 42, 0.07);
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.8rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.badge-info {
  background: rgba(0, 229, 255, 0.08);
  color: #00e5ff;
  border: 1px solid rgba(0, 229, 255, 0.22);
}

body.light-mode .badge-info {
  color: #00768a;
  background: rgba(0, 156, 179, 0.08);
  border-color: rgba(0, 156, 179, 0.2);
}

.badge-success {
  background: rgba(0, 230, 118, 0.08);
  color: var(--success);
  border: 1px solid rgba(0, 230, 118, 0.22);
}

.badge-warning {
  background: rgba(255, 179, 0, 0.08);
  color: var(--warning);
  border: 1px solid rgba(255, 179, 0, 0.22);
}

.badge-danger {
  background: rgba(255, 61, 0, 0.08);
  color: var(--danger);
  border: 1px solid rgba(255, 61, 0, 0.22);
}

/* Header & Navbar */
header.navbar-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(6, 5, 12, 0.75);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-bottom: 1px solid var(--border-color);
  padding: 1.1rem 2rem;
  transition: background-color 0.3s;
}

body.light-mode header.navbar-header {
  background: rgba(248, 250, 252, 0.82);
  border-bottom-color: rgba(15, 23, 42, 0.06);
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1300px;
  margin: 0 auto;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 1.5rem;
  color: #fff;
  cursor: pointer;
  text-decoration: none;
}

body.light-mode .navbar-logo {
  color: #0f172a;
}

.navbar-logo span {
  background: linear-gradient(to right, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.navbar-menu {
  display: flex;
  gap: 1.2rem;
  align-items: center;
}

.navbar-item {
  color: var(--color-text-muted);
  text-decoration: none;
  font-family: var(--font-title);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
}

.navbar-item:hover, .navbar-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

body.light-mode .navbar-item {
  color: #475569;
}

body.light-mode .navbar-item:hover, body.light-mode .navbar-item.active {
  color: #000;
  background: rgba(15, 23, 42, 0.05);
}

.navbar-item.active {
  border-bottom: 2px solid var(--primary);
  border-radius: 8px 8px 0 0;
  background: rgba(0, 229, 255, 0.05);
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.menu-toggle-btn {
  display: none;
  background: transparent;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  padding: 0.4rem;
  margin-left: 0.6rem;
}

.nav-control-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text);
  transition: all 0.2s;
}

body.light-mode .nav-control-btn {
  background: rgba(15, 23, 42, 0.03);
}

.nav-control-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--border-color-hover);
}

.lang-selector-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  padding: 0.45rem 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  color: var(--color-text);
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.85rem;
  transition: all 0.2s;
}

body.light-mode .lang-selector-btn {
  background: rgba(15, 23, 42, 0.03);
}

.lang-selector-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Forms */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-family: var(--font-title);
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.form-control {
  width: 100%;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.9rem 1.1rem;
  color: #fff;
  font-family: var(--font-body);
  font-size: 0.95rem;
  transition: all 0.2s;
}

body.light-mode .form-control {
  background: #fff;
  border-color: rgba(15, 23, 42, 0.12);
  color: #0f172a;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 12px var(--primary-glow);
}

textarea.form-control {
  min-height: 120px;
  resize: vertical;
}


/* ==========================================
   COMPONENTS - VERIFIER STYLES (RESTORED!)
   ========================================== */
.verifier-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2rem;
  align-items: start;
}

.type-selector {
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.4rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  gap: 0.4rem;
  margin-bottom: 1.5rem;
}

body.light-mode .type-selector {
  background: rgba(15, 23, 42, 0.03);
}

.type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  padding: 0.7rem;
  border-radius: 8px;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  color: var(--color-text);
  background: rgba(255, 255, 255, 0.05);
}

body.light-mode .type-btn:hover {
  background: rgba(15, 23, 42, 0.04);
}

.type-btn.active {
  background: var(--primary) !important;
  color: #000 !important;
  box-shadow: 0 4px 12px var(--primary-glow);
}

body.light-mode .type-btn.active {
  color: #fff !important;
}

.file-uploader {
  border: 2px dashed var(--border-color);
  border-radius: 14px;
  padding: 3rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(0, 0, 0, 0.15);
}

.file-uploader:hover {
  border-color: var(--primary);
  background: rgba(0, 229, 255, 0.03);
}

.file-upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  font-family: var(--font-title);
  font-weight: 700;
  color: var(--color-text);
}

/* Preset case buttons (Fixed to look gorgeous and not flat white rows!) */
.preset-examples-box {
  margin-top: 1.5rem;
}

.sample-badge-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--color-text-muted);
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.88rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: block;
}

.sample-badge-btn:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: var(--primary);
  color: var(--color-text);
  transform: translateX(4px);
}

body.light-mode .sample-badge-btn {
  background: rgba(15, 23, 42, 0.02);
  border-color: rgba(15, 23, 42, 0.06);
}

body.light-mode .sample-badge-btn:hover {
  background: rgba(15, 23, 42, 0.05);
  color: #0f172a;
}

/* Radar Scanner */
.radar-scanner {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid var(--primary);
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px var(--primary-glow);
}

.radar-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: var(--primary);
  animation: spin 1.4s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.logs-box {
  background: #020108;
  border: 1px solid var(--border-color);
  padding: 1.2rem;
  border-radius: 10px;
  font-family: monospace;
  font-size: 0.85rem;
  min-height: 160px;
  color: #00e5ff;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.log-line {
  opacity: 0.15;
  transition: opacity 0.3s;
  display: flex;
  gap: 0.6rem;
}

.log-line.visible {
  opacity: 0.95;
}

.log-line.current {
  color: #fff;
  font-weight: bold;
  animation: blink 0.8s infinite alternate;
}

@keyframes blink {
  to { opacity: 0.4; }
}

/* Report results */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.4rem;
  margin-bottom: 1.8rem;
  flex-wrap: wrap;
  gap: 1.2rem;
}

.verdict-tag {
  padding-left: 1.2rem;
}

.report-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 2.2rem;
  align-items: center;
}

.score-circle {
  width: 165px;
  height: 165px;
  border-radius: 50%;
  background: radial-gradient(closest-side, var(--bg-secondary) 79%, transparent 80% 100%),
              conic-gradient(var(--score-color) var(--score-pct), rgba(255,255,255,0.06) 0);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5px 25px rgba(0,0,0,0.3);
}

body.light-mode .score-circle {
  background: radial-gradient(closest-side, #ffffff 79%, transparent 80% 100%),
              conic-gradient(var(--score-color) var(--score-pct), rgba(0,0,0,0.06) 0);
}

.score-value {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-value .num {
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 2.7rem;
  color: #fff;
  line-height: 1;
}

.score-value .percent {
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-text-muted);
}

.score-value .lbl {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-top: 0.2rem;
}

.score-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bar-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  font-family: var(--font-title);
  font-weight: 600;
}

.bar-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  overflow: hidden;
}

body.light-mode .bar-track {
  background: rgba(0,0,0,0.06);
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 1.2s ease-out;
}

.list-box {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 1.2rem;
  background: rgba(0,0,0,0.15);
}

.list-box.green-border { border-left: 3.5px solid var(--success); }
.list-box.red-border { border-left: 3.5px solid var(--danger); }

.list-box ul {
  list-style-type: none;
  padding-left: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.list-box li {
  font-size: 0.85rem;
  line-height: 1.45;
  position: relative;
  padding-left: 1.2rem;
  color: var(--color-text-muted);
}

body.light-mode .list-box li {
  color: var(--color-text);
}

.list-box.green-border li::before {
  content: '•';
  color: var(--success);
  position: absolute;
  left: 0;
  font-size: 1.1rem;
  top: -0.1rem;
}

.list-box.red-border li::before {
  content: '•';
  color: var(--danger);
  position: absolute;
  left: 0;
  font-size: 1.1rem;
  top: -0.1rem;
}


/* ==========================================
   COMPONENTS - TRAINING STYLES
   ========================================== */
.training-tabs-nav {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  margin-bottom: 2.2rem;
}

.level-tab-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color);
  color: var(--color-text-muted);
  padding: 0.85rem 1.7rem;
  border-radius: 12px;
  font-family: var(--font-title);
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.2s;
}

.level-tab-btn:hover, .level-tab-btn.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

body.light-mode .level-tab-btn {
  background: rgba(15, 23, 42, 0.02);
  border-color: rgba(15, 23, 42, 0.06);
}

body.light-mode .level-tab-btn:hover, body.light-mode .level-tab-btn.active {
  color: #000;
  background: rgba(15, 23, 42, 0.05);
}

.level-tab-btn.active {
  border-color: var(--primary) !important;
  box-shadow: 0 0 15px var(--primary-glow);
  background: rgba(0, 229, 255, 0.05) !important;
}

.training-layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 2.2rem;
  align-items: start;
}

.video-player-container {
  background: #000;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  margin-bottom: 1.8rem;
}

.video-controls {
  background: #0b0a12;
  display: flex;
  align-items: center;
  padding: 0.8rem 1.2rem;
  border-top: 1px solid var(--border-color);
}

body.light-mode .video-controls {
  background: #f1f5f9;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.sheet-points {
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.sheet-points li {
  font-size: 0.86rem;
  position: relative;
  padding-left: 1.3rem;
  color: var(--color-text-muted);
}

body.light-mode .sheet-points li {
  color: var(--color-text);
}

.sheet-points li::before {
  content: '→';
  color: var(--primary);
  position: absolute;
  left: 0;
  font-weight: bold;
}

.lesson-box {
  background: rgba(212, 0, 255, 0.04);
  border-left: 3.5px solid var(--secondary);
  padding: 0.9rem;
  border-radius: 8px;
  font-size: 0.82rem;
  margin-top: 0.6rem;
}

.quiz-progress-bar {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.quiz-progress-track {
  height: 5px;
  background: rgba(255,255,255,0.06);
  border-radius: 99px;
  overflow: hidden;
}

.quiz-progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.3s;
}

.quiz-options-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: 1.5rem;
}

.quiz-opt-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  padding: 1.1rem;
  border-radius: 12px;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.92rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all 0.25s ease;
}

.quiz-opt-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--primary);
  transform: translateX(4px);
}

.quiz-opt-btn.correct {
  background: rgba(0, 230, 118, 0.12) !important;
  border-color: var(--success) !important;
  color: var(--success) !important;
  font-weight: 700;
}

.quiz-opt-btn.incorrect {
  background: rgba(255, 61, 0, 0.12) !important;
  border-color: var(--danger) !important;
  color: var(--danger) !important;
  font-weight: 700;
}


/* ==========================================
   COMPONENTS - COMMUNITY STYLES
   ========================================== */
.community-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.2rem;
}

.filter-group-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.sidebar-stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.sidebar-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-stat-item:last-child { border-bottom: none; padding-bottom: 0; }

.pill-btn {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-color);
  color: var(--color-text-muted);
  padding: 0.55rem 1.4rem;
  border-radius: 9999px;
  cursor: pointer;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.88rem;
  transition: all 0.2s;
}

body.light-mode .pill-btn {
  background: rgba(15, 23, 42, 0.02);
  border-color: rgba(15, 23, 42, 0.06);
}

.pill-btn:hover, .pill-btn.active {
  color: #fff;
  background: rgba(255,255,255,0.08);
  border-color: var(--primary);
}

body.light-mode .pill-btn:hover, body.light-mode .pill-btn.active {
  color: #000;
  background: rgba(15, 23, 42, 0.05);
}

.pill-btn.active {
  background: var(--primary) !important;
  color: #000 !important;
  box-shadow: 0 4px 10px var(--primary-glow);
}

body.light-mode .pill-btn.active {
  color: #fff !important;
}

.sort-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 10px;
}

body.light-mode .sort-box {
  background: #fff;
  border-color: rgba(15, 23, 42, 0.08);
}

.sort-select {
  background: transparent;
  border: none;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.88rem;
  cursor: pointer;
}

.sort-select:focus {
  outline: none;
}

.community-layout {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr;
  gap: 2.2rem;
  align-items: start;
}

.post-card {
  margin-bottom: 1.8rem;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-author-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.95rem;
  color: #000;
}

.post-meta-row {
  display: flex;
  gap: 0.9rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.2rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.flag-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 61, 0, 0.05);
  border: 1px solid rgba(255, 61, 0, 0.15);
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  cursor: pointer;
  color: var(--danger);
  font-weight: 700;
  font-size: 0.78rem;
  transition: all 0.2s;
}

.flag-btn:hover {
  background: rgba(255, 61, 0, 0.12);
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vote-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.15);
  color: var(--primary);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 0.88rem;
  transition: all 0.2s;
}

.vote-btn:hover {
  background: rgba(0, 229, 255, 0.15);
}

.comments-count {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.comments-box {
  background: rgba(0,0,0,0.18);
  border-radius: 12px;
  padding: 1.2rem;
  border: 1px solid rgba(255,255,255,0.03);
}

body.light-mode .comments-box {
  background: rgba(15, 23, 42, 0.02);
  border-color: rgba(15, 23, 42, 0.05);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-bottom: 0.9rem;
}

.comment-item {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  padding-bottom: 0.7rem;
}

.comment-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.comment-author-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comment-details {
  flex: 1;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.2rem;
}

.comment-author {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-text);
}

.comment-date {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.comment-text {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  line-height: 1.35;
}

body.light-mode .comment-text {
  color: var(--color-text);
}

.add-comment-row {
  display: flex;
  gap: 0.6rem;
}

.add-comment-row input {
  flex: 1;
  padding: 0.6rem 0.9rem;
  font-size: 0.85rem;
}


/* ==========================================
   COMPONENTS - KIDS ARENA STYLES
   ========================================== */
.kids-theme-container {
  /* The kids section is a fixed dark "arcade" theme by design — it does not
     follow the site-wide light/dark toggle. Without this, the hardcoded
     white text used throughout (options, questions, explanations) becomes
     invisible whenever the site is in light mode, since this container had
     no background of its own and simply inherited the page's. */
  background: radial-gradient(circle at 20% 0%, #241a4d 0%, #150f30 55%, #0d0a20 100%);
  border-radius: 24px;
  padding: 1.5rem;
}

.kids-portal-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 2.2rem;
  align-items: start;
}

.kids-card {
  border-color: rgba(255, 238, 85, 0.18) !important;
}

.avatar-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
  margin-bottom: 1.8rem;
}

.avatar-pick-btn {
  background: rgba(255,255,255,0.02);
  border: 2px solid var(--border-color);
  border-radius: 14px;
  padding: 1rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.avatar-pick-btn:hover {
  background: rgba(255,255,255,0.06);
  transform: translateY(-3px);
}

.avatar-pick-btn.active {
  border-color: var(--border-glow);
  box-shadow: 0 0 18px var(--border-glow);
  background: rgba(255,255,255,0.08);
}

.avatar-emoji {
  font-size: 2.4rem;
}

.avatar-welcome-bubble {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 1.2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.kids-quizzes-list {
  display: flex;
  flex-direction: column;
}

.quiz-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.kids-game-card {
  padding: 1.8rem;
  border: none !important;
  box-shadow: 0 12px 24px rgba(0,0,0,0.3);
}

.kids-age-badge {
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 800;
  font-family: var(--font-title);
}

.game-title {
  font-size: 1.6rem;
  color: #fff;
  margin-top: 0.8rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.game-theme {
  color: rgba(255,255,255,0.9);
  font-size: 0.95rem;
  margin-top: 0.2rem;
}

.game-rewards {
  display: flex;
  gap: 1rem;
  margin-top: 0.9rem;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #fff;
  background: rgba(0,0,0,0.25);
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
  font-weight: 700;
}

.kids-play-btn {
  background: #ffee55 !important;
  color: #000 !important;
  box-shadow: 0 4px 12px rgba(255, 238, 85, 0.45) !important;
  border-radius: 10px !important;
}

.kids-play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(255, 238, 85, 0.7) !important;
}

.kids-step-track {
  height: 8px;
  background: rgba(255,255,255,0.06);
  border-radius: 99px;
  overflow: hidden;
}

.kids-step-fill {
  height: 100%;
  background: #ffee55;
  box-shadow: 0 0 10px rgba(255, 238, 85, 0.4);
}

.kids-question-box {
  text-align: center;
  margin-bottom: 2.2rem;
}

.kids-q-illustration {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.kids-q-text {
  font-size: 1.7rem;
  color: #fff;
}

.kids-options-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
  margin-bottom: 1.8rem;
}

.kids-opt-card {
  background: rgba(255,255,255,0.02);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 1.3rem;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-body);
  font-weight: 700;
  color: #fff;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 1.1rem;
  transition: all 0.25s ease;
}

.kids-opt-card:hover:not(:disabled) {
  border-color: #ffee55;
  background: rgba(255, 238, 85, 0.05);
  transform: translateY(-3px);
}

.opt-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-title);
  font-weight: 800;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.kids-opt-card.kids-correct {
  background: rgba(0, 230, 118, 0.16) !important;
  border-color: var(--success) !important;
}

.kids-opt-card.kids-correct .opt-marker {
  background: var(--success);
  color: #000;
}

.kids-opt-card.kids-incorrect {
  background: rgba(255, 61, 0, 0.16) !important;
  border-color: var(--danger) !important;
}

.kids-opt-card.kids-incorrect .opt-marker {
  background: var(--danger);
  color: #fff;
}

.kids-explanation {
  border-radius: 14px;
  padding: 1.4rem;
  margin-bottom: 1.8rem;
  display: flex;
  gap: 1.1rem;
  align-items: flex-start;
}

.kids-next-btn {
  width: 100%;
  background: #ffee55 !important;
  color: #000 !important;
  font-size: 1.15rem !important;
  padding: 1.1rem !important;
  box-shadow: 0 4px 15px rgba(255, 238, 85, 0.4) !important;
  border-radius: 12px !important;
}


/* ==========================================
   COMPONENTS - DASHBOARD STYLES
   ========================================== */
.level-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2.2rem;
  align-items: center;
}

.level-badge-visual {
  width: 85px;
  height: 85px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-progress-bar {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.level-progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  font-family: var(--font-title);
  font-weight: 700;
  color: var(--color-text-muted);
}

.level-track {
  height: 7px;
  background: rgba(255,255,255,0.06);
  border-radius: 99px;
  overflow: hidden;
}

body.light-mode .level-track {
  background: rgba(0,0,0,0.06);
}

.level-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.8rem;
}

.stat-item-card {
  display: flex;
  flex-direction: column;
  padding: 1.6rem;
}

.stat-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.2rem;
}

.stat-val {
  font-family: var(--font-title);
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1;
}

.stat-lbl {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  margin-top: 0.3rem;
  margin-bottom: 0.8rem;
}

.mini-trend {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.mini-trend.green {
  color: var(--success);
}

.badges-shelf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 1.8rem;
}

.badge-item-card {
  padding: 1.6rem;
  border-color: rgba(255,255,255,0.06);
}

.badge-item-card:hover {
  border-color: var(--badge-glow-color) !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.45), 0 0 20px rgba(255, 255, 255, 0.02);
}

.badge-visual-circle {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-acquired-tag {
  display: inline-block;
  font-size: 0.65rem;
  font-family: var(--font-title);
  font-weight: 800;
  color: var(--color-text-muted);
  letter-spacing: 0.06em;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  padding: 0.2rem 0.5rem;
  margin-top: 1.1rem;
}


/* ==========================================
   RESPONSIVENESS ADJUSTMENTS
   ========================================== */
@media (max-width: 900px) {
  .verifier-layout,
  .training-layout,
  .community-layout,
  .kids-portal-grid {
    grid-template-columns: 1fr !important;
    gap: 1.8rem;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }

  .report-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .score-radial-container {
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .type-selector {
    flex-direction: column;
    padding: 0.5rem;
  }
  
  .type-btn {
    padding: 0.5rem;
  }

  /* Large hero titles are written as inline styles (fontSize: '2.5rem' etc.) in the
     React components — CSS class rules can't override those without !important. */
  h1 { font-size: 1.7rem !important; line-height: 1.25 !important; }
  h2 { font-size: 1.25rem !important; }

  .main-content { padding: 1.5rem 1rem 3.5rem 1rem; }
  .glass-card { padding: 1.3rem; }
  header.navbar-header { padding: 0.8rem 1rem; }
}

/* Mobile navigation: real collapsing menu (the toggle button existed but had no styling before) */
@media (max-width: 860px) {
  .navbar-container { flex-wrap: wrap; }

  .menu-toggle-btn { display: flex; align-items: center; justify-content: center; order: 3; }

  .navbar-menu {
    display: none;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 0.4rem;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding: 1rem 1.2rem 1.2rem;
    background: rgba(6, 5, 12, 0.96);
    backdrop-filter: blur(15px);
    border-bottom: 1px solid var(--border-color);
  }
  body.light-mode .navbar-menu { background: rgba(248, 250, 252, 0.98); }

  .navbar-menu.open { display: flex; }

  .navbar-item { width: 100%; padding: 0.75rem 1rem; }
  .navbar-item.active { border-bottom: none; background: rgba(0, 229, 255, 0.1); }

  .nav-controls { order: 2; }
}

/* ===================== TruthLens Junior — Mission Mode ===================== */
.tj-shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.2rem;
  background: linear-gradient(160deg, #1a1240 0%, #2d1b5e 50%, #3b1f6b 100%);
  border-radius: 24px;
  padding: 1.2rem;
  min-height: 640px;
  box-shadow: 0 20px 60px rgba(88, 28, 135, 0.35);
}

.tj-sidebar {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 1.2rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tj-brand { display: flex; align-items: center; gap: 0.6rem; padding: 0 0.4rem; }
.tj-brand-icon {
  width: 38px; height: 38px; border-radius: 12px;
  background: linear-gradient(135deg, #00e5ff, #d400ff);
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.tj-brand-name { font-weight: 800; color: #fff; font-size: 0.95rem; line-height: 1.1; }
.tj-brand-sub { font-size: 0.7rem; color: #ffd54f; font-weight: 700; letter-spacing: 0.05em; }

.tj-nav { display: flex; flex-direction: column; gap: 0.3rem; }
.tj-nav-item {
  display: flex; align-items: center; gap: 0.7rem;
  padding: 0.7rem 0.8rem; border-radius: 12px;
  color: #c7bfe8; font-size: 0.85rem; font-weight: 600;
  cursor: default; transition: background 0.15s ease;
}
.tj-nav-item.active { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; }

.tj-main { display: flex; flex-direction: column; gap: 1rem; }

.tj-topbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem; }
.tj-topbar-left, .tj-topbar-right { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }

.tj-crown-pill {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: linear-gradient(135deg, #ffd54f, #ffa726);
  color: #4a2a00; font-weight: 800; font-size: 0.85rem;
  padding: 0.45rem 0.9rem; border-radius: 999px;
}

.tj-level-pill {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background: rgba(255,255,255,0.08); color: #fff; font-size: 0.8rem; font-weight: 700;
  padding: 0.4rem 0.9rem; border-radius: 999px;
}
.tj-level-track { width: 70px; height: 6px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden; }
.tj-level-fill { height: 100%; background: linear-gradient(90deg, #ffd54f, #ff9800); }

.tj-topbar-btn {
  display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
  color: #e0d9fb; font-size: 0.65rem; font-weight: 600;
}
.tj-avatar-dot { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #ff8a65, #ffb74d); }

.tj-mission-header {
  display: flex; align-items: flex-start; gap: 1rem;
  background: rgba(255,255,255,0.06); border-radius: 18px; padding: 1rem 1.2rem;
}
.tj-detective-badge {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, #7c3aed, #4c1d95);
  display: flex; align-items: center; justify-content: center; color: #ffd54f;
}
.tj-mission-header h2 { color: #fff; font-size: 1.15rem; margin-bottom: 0.3rem; letter-spacing: 0.02em; }
.tj-mission-header p { color: #c7bfe8; font-size: 0.85rem; margin: 0; max-width: none; }

.tj-content-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem; }
@media (max-width: 820px) {
  .tj-content-grid { grid-template-columns: 1fr; }
  .tj-shell { grid-template-columns: 1fr; min-height: auto; padding: 0.8rem; }
  .tj-mode-switch { flex-wrap: wrap; }
  .tj-mission-image { height: 200px; }
}

.tj-mission-card { background: #fff; border-radius: 20px; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.tj-mission-image {
  position: relative; border-radius: 14px; overflow: hidden; height: 260px;
  background: #bde4f0; display: flex; align-items: center; justify-content: center;
}
.tj-mission-image svg { width: 100%; height: 100%; }
.tj-mission-image img { width: 100%; height: 100%; object-fit: contain; display: block; }
.tj-to-verify-badge {
  position: absolute; top: 10px; left: 10px; z-index: 2;
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: #ef4444; color: #fff; font-size: 0.7rem; font-weight: 800;
  padding: 0.3rem 0.7rem; border-radius: 999px;
}
.tj-mission-claim { color: #1e293b; font-size: 1.05rem; font-weight: 700; text-align: center; line-height: 1.4; max-width: none; }

.tj-vrai-faux-row { display: flex; gap: 0.8rem; }
.tj-btn-vrai, .tj-btn-faux {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.85rem; border: none; border-radius: 14px; font-weight: 800; font-size: 0.95rem;
  cursor: pointer; color: #fff; transition: transform 0.1s ease;
}
.tj-btn-vrai { background: linear-gradient(135deg, #22c55e, #16a34a); }
.tj-btn-faux { background: linear-gradient(135deg, #ef4444, #dc2626); }
.tj-btn-vrai:hover, .tj-btn-faux:hover { transform: translateY(-2px); }

.tj-feedback { border-radius: 14px; padding: 1rem; text-align: center; }
.tj-feedback.correct { background: rgba(34, 197, 94, 0.12); color: #15803d; }
.tj-feedback.wrong { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }
.tj-feedback p { max-width: none; color: inherit; margin: 0.5rem 0 0.8rem; font-size: 0.9rem; }
.tj-btn-next {
  background: #4c1d95; color: #fff; border: none; padding: 0.6rem 1.2rem;
  border-radius: 999px; font-weight: 700; cursor: pointer;
}

.tj-tools-card { background: rgba(255,255,255,0.06); border-radius: 20px; padding: 1.1rem; display: flex; flex-direction: column; gap: 0.9rem; }
.tj-tools-card h3 { color: #fff; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem; }
.tj-tool-row { display: flex; align-items: center; gap: 0.7rem; background: rgba(255,255,255,0.05); border-radius: 14px; padding: 0.7rem; }
.tj-tool-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tj-tool-text { flex: 1; min-width: 0; }
.tj-tool-text strong { color: #fff; font-size: 0.82rem; display: block; }
.tj-tool-text p { color: #b8b0dd; font-size: 0.72rem; margin: 0.15rem 0 0; max-width: none; line-height: 1.35; }
.tj-tool-btn { border: none; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 0.45rem 0.8rem; border-radius: 999px; cursor: pointer; flex-shrink: 0; }

.tj-progress-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.tj-dot { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.tj-dot.done { background: #22c55e; color: #fff; }
.tj-dot.current { background: linear-gradient(135deg, #ffd54f, #ff9800); color: #4a2a00; box-shadow: 0 0 0 4px rgba(255, 213, 79, 0.25); }
.tj-dot.locked { background: rgba(255,255,255,0.1); color: #6b6690; }
.tj-progress-label { color: #c7bfe8; font-size: 0.8rem; font-weight: 600; margin-left: 0.4rem; }

.tj-shell-nosidebar { grid-template-columns: 1fr; }
.tj-mode-switch { display: flex; gap: 0.6rem; margin-bottom: 1.2rem; }
.tj-mode-btn {
  padding: 0.6rem 1.2rem; border-radius: 999px; border: 1px solid var(--border-color);
  background: var(--bg-card); color: var(--color-text); font-weight: 700; font-size: 0.85rem; cursor: pointer;
}
.tj-mode-btn.active { background: linear-gradient(135deg, #7c3aed, #4c1d95); color: #fff; border-color: transparent; }

/* ===================== AI or Real — image guessing game ===================== */
.aor-shell {
  background: linear-gradient(160deg, #fdf6e3 0%, #f7ecc9 100%);
  border-radius: 24px;
  padding: 1.8rem 1.5rem 2rem;
  text-align: center;
  box-shadow: 0 20px 50px rgba(120, 90, 20, 0.15);
  border: 1px solid #f0dfa8;
}
.aor-banner {
  display: inline-block;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: #fff; font-weight: 800; font-size: 0.8rem; letter-spacing: 0.05em;
  padding: 0.4rem 1.1rem; border-radius: 999px; margin-bottom: 0.8rem;
  box-shadow: 0 4px 12px rgba(245, 124, 0, 0.35);
}
.aor-title { color: #4a3413; font-size: 1.6rem; font-weight: 800; margin-bottom: 0.3rem; }
.aor-subtitle { color: #7a6335; font-size: 0.95rem; margin-bottom: 1.4rem; }

.aor-images-row { display: flex; gap: 1.2rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1.4rem; }
.aor-image-card {
  position: relative; width: 260px; height: 200px; border-radius: 16px; overflow: hidden;
  border: 3px solid #fff; box-shadow: 0 8px 24px rgba(120, 90, 20, 0.2); transition: transform 0.15s ease;
}
.aor-image-card img { width: 100%; height: 100%; object-fit: cover; display: block; }
.aor-letter-badge {
  position: absolute; top: 8px; left: 8px; z-index: 2;
  width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 0.85rem; color: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}
.letter-a { background: #22c55e; }
.letter-b { background: #7c3aed; }
.aor-result-tag {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.65); color: #fff; font-size: 0.75rem; font-weight: 700;
  padding: 0.35rem; display: flex; align-items: center; justify-content: center; gap: 0.3rem;
}
.aor-image-card.is-ai { outline: 3px solid #a855f7; }
.aor-image-card.is-real { outline: 3px solid #22c55e; }

.aor-choose-label { color: #4a3413; font-weight: 700; margin-bottom: 0.8rem; }
.aor-choice-row { display: flex; gap: 1rem; justify-content: center; }
.aor-btn-a, .aor-btn-b {
  width: 90px; padding: 0.75rem; border: none; border-radius: 14px;
  font-weight: 800; font-size: 1.1rem; color: #fff; cursor: pointer; transition: transform 0.1s ease;
}
.aor-btn-a { background: linear-gradient(135deg, #22c55e, #16a34a); }
.aor-btn-b { background: linear-gradient(135deg, #a855f7, #7c3aed); }
.aor-btn-a:hover, .aor-btn-b:hover { transform: translateY(-2px); }

.aor-feedback { max-width: 480px; margin: 0 auto; border-radius: 14px; padding: 1.1rem 1.3rem; }
.aor-feedback.correct { background: rgba(34,197,94,0.12); color: #15803d; }
.aor-feedback.wrong { background: rgba(239,68,68,0.12); color: #b91c1c; }
.aor-feedback p { margin: 0.5rem 0 0.9rem; font-size: 0.9rem; color: #4a3413; }
.aor-btn-next { background: #4a3413; color: #fff; border: none; padding: 0.6rem 1.3rem; border-radius: 999px; font-weight: 700; cursor: pointer; }

@media (max-width: 600px) {
  .aor-image-card { width: 100%; max-width: 320px; height: 220px; }
}

'@ | Out-File -Encoding utf8 "src\index.css"
Write-Host "OK: src\index.css"

@'
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
      verdictDoubtful: "SUSPECT / DOUTEUX"
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
      verdictDoubtful: "SUSPECT / DOUBTFUL"
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

'@ | Out-File -Encoding utf8 "src\translations.js"
Write-Host "OK: src\translations.js"

$b64 = @"
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
"@
[IO.File]::WriteAllBytes("src\assets\aivsreal\house-waterfall-ai.png", [Convert]::FromBase64String($b64.Replace("`n","").Replace("`r","")))
Write-Host "OK (image): src\assets\aivsreal\house-waterfall-ai.png"

$b64 = @"
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
2p+8ePWPX7z6ieevfOL5y5984conn7/yxy9e+9SLVz/1wuU/fh5w6ZPPAy5+4rkLH3/u0se/efGPvnnxk89d+uRzFz/xzcsff/bSH33z0sefvfzJ567+yQvX
/+TFa598/urHv3n1j569/EfPXvn4c1c+/vzlP37h8p+8ePlTL13547zxq598/sonnrv8ieeu/PHz1z7xwrWPP3/lD5+7/MlvXvjT58998blv/MWzX/uzly5+
Muff+NRLNz79yrUvvfr8l174zDPP/8Xnnn3qC998+gtff/oL33j6z7/8F5/76hc+/fmP/+lnP/4nX/jTz3zps3/21a9+6rlX/+L1i3/+7HN//o2vf+a51//0
uTOf/Orrf/jMy3/w+a//0Re/+cwLL1y99Eow3NRZDF9ULLVU5lgprTXiDJsZYmsaf0S55+BNABwHMGbJ0wfKTFlksnTQ6/3PF8c//UX+Jy+W/n+n679+rvmr
55u/eq71/03hY5da/+Vi89Prs6cnS1/YXvhvV+c+enH2P56f/Y/n5n/l3ALgP5xbzuH80r8/t/Qfzi39u7OL//7s4r87vfBvTi/861OA+V8+NfevT8398qkF
wL/K8SLwvzoFvPgvTy38yzfmfgnw+uy/eG32X7w6889faf2zl5v/7KUG8D99uflPX2n+vy83/vHLjX/0UvMfvdj4hy82f/GFxj94vvGLzzV/8XnQwI1feK7+
C+A8X/+HLzQBv/hCPZd5sf4PXqj/g+drv/h8FfALz1V+4dkq4P/5RvXnv175ua+Vfv5rxZ//mv9zXy38/Ff8n/uK/7Nfdn8O8BX3578qf+bL/LNfTP/dn3zp
b/7x6k9+lv/W5/Xf+bz6W59N/s6f93/ljz/1Lz7x0i/+9lf/3u984xd/76u/8LE//JVPfPJf/db//k8f/7Nf+4P/849/9X/84q/99s/+2h/+zG9/9W9/auun
f/e5v/ux3/07/+G//K1//19/+rde+1ufHv/sZyc/94drP/eZyc9+Zu/f/dFHf+FX/tHFy89Fk45RkcvpjG+iTBljpo4ibHCgiJmwvU2ByBjHJMcrhtJQp8nN
3eEvPW99cq3US+xhwqOE+glNMhkoEebYGsTCsrA0275rLVadimdplom2EiNjLWIjEyNSIzNjZaC1TLRIlEyMBDMxIpfRImcCg0lWSijKqyQaRC6ZGCs2eYOJ
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
cF1H68Aq3FTRBsVbKgKxqYEhCdel15JOo7BrpV2Tdq10qtJtlI4BhSqvVTrN0q7nPClFrbRqhVXNeSythrRq0qkBl1Zd2jVp15VVL+1qISoZi3Nen2UOqhSP
cwqls1aI1lLHoxmTdhsjSks/VUnG6pnVzL1LbP0L3rXftOo3iQmtVJEtzrpP0+Xc81zBcdwpTCJmceul+k53Nvjf+3/zN92fnRZn3KaD2ezp/rPZyRECQUp5
nN64vPtv3v/OX/zeD/7rD/7tf/t3f/Zf/uhP/uJP/+zP//hP/vMf/+l/+sM/+vM//pP/+K//4N//7g/+5Tf/xe9/+Lu/9/7vfuet77392m98963vvffGB2/e
fe+bX/zWe2++/8add99+/f1vv/Pbv/nWd7/86jeu737plVe/dfPm+6+++uGN29/cvPSFG/c+uHL7/c6Vr23efHf37vu7dz5Yu/qVzu0P2zc+7Nz+7tq9327c
/V79pW/Xbn+7cuu3qjffr99+P9z6XHTpVa+24VUbQa3Zfvmblbvfq9z9fvXl36nf+53avd+u3vvnlTsGkpe+G936bnjz2+H134pufiu68WF4/VvB1Q/Ca98K
r30YXvsguv6Bv/sN//J7/s6v+dvveNvvuJe+6m297W5+2cDWW87mV9zNr/iX3vYvvxNe+bq/++vB7teDq+9GNz8Mb7wf3Xg/gOTK1yDxr37dv/I198q7wZV3
w6vvJTfer9z5sHb3N+Mb34hufjMx8F545a3KjXfX3vx+dPWrweWvNF7+VvO17ya3fyO+/l5y/ddE2NZSaixeJdPJydnRg7OTPt7f/SAQyBuZlcctrR+c3P+7
3k/PF6dK5tjLY8+53tmale5B9/h0//FyNCzxvlLmSKSUucSvUAWuTBk2LlkulcyULAC6zLXMlcyNDoRFLstClkbfbCn5siyWZZmuaiFMV6zRKV80yVFVlnlZ
ZrLMTG2elvlS5gtcsEBAIovlqvccBiWqwOapLNISLhk2VQXYhcznMl+oYiENzGU2L7OZzGdlBvmsXNXKfFHmC/UrGiygvGBhtljqYmUNDoMoQS+NcrYyUizV
C1i8IFYKq+7gIWpTmadlnqpyCULCCKBIy3wJIbxdEXDASKTZSIuyLHCjUS9wKouVkWKZz8/HvSfDvV8Ojp77gZfUqq7nMEYMyStV3p/t7U32izItZaZ1IZhO
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
fQ2VAAAAAElFTkSuQmCC
"@
[IO.File]::WriteAllBytes("src\assets\aivsreal\beach-cliffs-real.png", [Convert]::FromBase64String($b64.Replace("`n","").Replace("`r","")))
Write-Host "OK (image): src\assets\aivsreal\beach-cliffs-real.png"

Write-Host ""
Write-Host "Verification syntaxe Python..." -ForegroundColor Cyan
python -c "import ast; ast.parse(open('backend/app/analyze.py', encoding='utf-8').read()); print('analyze.py OK')"
python -c "import ast; ast.parse(open('backend/app/main.py', encoding='utf-8').read()); print('main.py OK')"

git add backend\app\analyze.py backend\app\main.py backend\requirements.txt src\components\Verifier.jsx src\components\KidsArena.jsx src\components\AiOrRealMode.jsx src\index.css src\translations.js src\assets\aivsreal\house-waterfall-ai.png src\assets\aivsreal\beach-cliffs-real.png
git commit -m "Backend reel + video + jeu IA-Reel + analyse de contenu + correctifs mobile/quiz"
git push

Write-Host ""
Write-Host "Pensez a ajouter HF_API_TOKEN dans Environment sur Render." -ForegroundColor Yellow