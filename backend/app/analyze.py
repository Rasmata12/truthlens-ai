"""
Analyse rÃ©elle cÃ´tÃ© serveur â€” image, vidÃ©o et lien.

Deux niveaux d'analyse pour une image :
1. ELA (Error Level Analysis) â€” toujours actif, ne nÃ©cessite aucune clÃ©.
2. ModÃ¨le IA de dÃ©tection d'images gÃ©nÃ©ratives (Hugging Face Inference API) â€”
   analyse le CONTENU rÃ©el de l'image, pas juste ses artefacts de compression.
   NÃ©cessite la variable d'environnement HF_API_TOKEN (le mÃªme token gratuit
   Hugging Face dÃ©jÃ  utilisÃ© pour IKAN AI). Sans ce token, seule l'ELA tourne
   et le rapport le dit explicitement â€” jamais de rÃ©sultat inventÃ©.

Pour un lien : au-delÃ  des vÃ©rifications de domaine/HTTPS, on va chercher la
vraie image et le vrai titre de la page (balises Open Graph) et on fait
tourner l'image trouvÃ©e dans le mÃªme dÃ©tecteur IA â€” donc mÃªme un lien "propre"
(HTTPS, domaine correct) est signalÃ© si l'image qu'il montre est gÃ©nÃ©rÃ©e.
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
HF_IMAGE_MODEL = "Organika/sdxl-detector"  # dÃ©tecteur d'images gÃ©nÃ©rÃ©es (Hugging Face, public)

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
    """Interroge un vrai modÃ¨le de dÃ©tection d'images gÃ©nÃ©rÃ©es par IA.
    Retourne None (silencieusement) si HF_API_TOKEN n'est pas configurÃ© ou si
    l'appel Ã©choue â€” jamais un rÃ©sultat inventÃ© Ã  la place."""
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
        # Le modÃ¨le de contenu pÃ¨se plus lourd que l'ELA â€” il regarde ce qu'il y a
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
        "note": None if ai_content else "Analyse de contenu IA non disponible (HF_API_TOKEN non configurÃ© cÃ´tÃ© serveur) â€” score basÃ© uniquement sur l'ELA.",
    }


@router.post("/video")
async def analyze_video(file: UploadFile = File(...)):
    """VÃ©rifications rÃ©elles mais limitÃ©es : intÃ©gritÃ© du conteneur, cohÃ©rence
    de l'extension. Une vraie dÃ©tection de deepfake vidÃ©o (image par image,
    cohÃ©rence temporelle) demande un modÃ¨le spÃ©cialisÃ© que ce serveur ne fait
    pas tourner â€” le score reste donc plafonnÃ© et la limite est explicite."""
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
        "limitation": "Analyse de contenu vidÃ©o (dÃ©tection de deepfake image par image) non disponible sur ce serveur â€” seule l'intÃ©gritÃ© du fichier a Ã©tÃ© vÃ©rifiÃ©e.",
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
        "note": None if HF_API_TOKEN else "Analyse du contenu visuel rÃ©el non disponible (HF_API_TOKEN non configurÃ©) â€” score basÃ© uniquement sur le domaine et l'accessibilitÃ©.",
    }

