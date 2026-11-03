#!/usr/bin/env python3
"""Gera data/noticias.json a partir de fontes públicas e preserva dados se houver falha.

Executado pelo GitHub Actions durante o deploy do GitHub Pages.
Requer apenas a biblioteca-padrão de Python 3.11+.
Não publica textos integrais; expõe manchetes, resumos curtos, data e o link original.
"""

from __future__ import annotations

from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

OUT = Path(__file__).resolve().parents[1] / "data" / "noticias.json"

SOURCES = [
    ("lol", "https://soraclee.github.io/riotgames-news-api/data/lol/esportsEn.json"),
    ("val", "https://soraclee.github.io/riotgames-news-api/data/valorant/esportsEn.json"),
    ("cs", "https://www.hltv.org/rss/news"),
]
FALLBACK_IMG = {"lol": "assets/league.svg", "val": "assets/valorant.svg", "cs": "assets/counter-strike.svg"}


class TextOnly(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def clean(raw: object, max_len: int = 180) -> str:
    html = TextOnly()
    html.feed(str(raw or ""))
    txt = re.sub(r"\s+", " ", unescape(" ".join(html.parts))).strip()
    return (txt[: max_len - 1].rstrip() + "…") if len(txt) > max_len else txt


def safe_url(raw: object, hosts: tuple[str, ...] | None = None) -> str:
    if not isinstance(raw, str):
        return ""
    url = raw.strip()
    try:
        parts = urlsplit(url)
    except ValueError:
        return ""
    if parts.scheme != "https" or not parts.netloc or parts.username or parts.password:
        return ""
    if hosts and (parts.hostname or "").lower() not in hosts:
        return ""
    return url


def date_iso(date_text: str) -> str:
    if not date_text:
        return ""
    try:
        # Riot API: ISO 8601. RSS: RFC 2822.
        if "," in date_text:
            dt = parsedate_to_datetime(date_text)
        else:
            dt = datetime.fromisoformat(date_text.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    except (ValueError, TypeError):
        return ""


def request(url: str) -> bytes:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; ArenaGG-Academico/1.0; feed reader)",
        "Accept": "application/json, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read(4_000_000)


def riot_news(topic: str, url: str) -> list[dict]:
    data = json.loads(request(url))
    if not isinstance(data, list):
        raise ValueError("Retorno da Riot não é uma lista JSON")
    output = []
    for item in data:
        if not isinstance(item, dict):
            continue
        link = safe_url((item.get("action") or {}).get("payload", {}).get("url"))
        title = clean(item.get("title"), 160)
        if not link or not title:
            continue
        # Usamos imagens apenas do CDN oficial da Riot (se houver).
        image = safe_url((item.get("media") or {}).get("url"), ("cmsassets.rgpub.io",)) or FALLBACK_IMG[topic]
        desc = item.get("description") or {}
        desc = desc.get("body", "") if isinstance(desc, dict) else desc
        output.append({
            "topic": topic,
            "title": title,
            "description": clean(desc, 160),
            "url": link,
            "image": image,
            "publishedAt": date_iso(str(item.get("publishedAt") or (item.get("analytics") or {}).get("publishDate") or "")),
            "source": "Riot Games",
        })
    return output[:15]


def hltv_image(item: ET.Element) -> str:
    """Seleciona a foto fornecida pelo próprio RSS da HLTV.

    A consulta usa a URL *original*: links do CDN da HLTV podem conter
    assinaturas e parâmetros codificados que não devem ser reformatados.
    """
    allowed_hosts = ("img-cdn.hltv.org", "img.hltv.org", "hltv.org", "www.hltv.org")
    namespace = "http://search.yahoo.com/mrss/"

    # O feed oficial da HLTV fornece fotos como media:content.
    for tag in (f"{{{namespace}}}content", f"{{{namespace}}}thumbnail"):
        for node in item.findall(f".//{tag}"):
            mime = (node.attrib.get("type") or "").lower()
            medium = (node.attrib.get("medium") or "").lower()
            if mime and not mime.startswith("image/") and medium != "image":
                continue
            image = safe_url(node.attrib.get("url"), allowed_hosts)
            if image:
                return image

    # Outros feeds podem utilizar a forma clássica RSS 2.0.
    for enclosure in item.findall("enclosure"):
        if not (enclosure.attrib.get("type") or "").lower().startswith("image/"):
            continue
        image = safe_url(enclosure.attrib.get("url"), allowed_hosts)
        if image:
            return image
    return FALLBACK_IMG["cs"]


def hltv_news(url: str) -> list[dict]:
    root = ET.fromstring(request(url))
    output = []
    for item in root.findall(".//channel/item"):
        link = safe_url(item.findtext("link"), ("www.hltv.org", "hltv.org"))
        title = clean(item.findtext("title"), 160)
        if not title or not link:
            continue
        output.append({
            "topic": "cs",
            "title": title,
            "description": clean(item.findtext("description"), 160),
            "url": link,
            "image": hltv_image(item),
            "publishedAt": date_iso(item.findtext("pubDate") or ""),
            "source": "HLTV",
        })
    return output[:15]


def run() -> None:
    existing = {}
    if OUT.exists():
        try:
            payload = json.loads(OUT.read_text(encoding="utf-8"))
            existing = {t: [x for x in payload.get("articles", []) if x.get("topic") == t] for t, _ in SOURCES}
        except (ValueError, OSError, AttributeError) as exc:
            print("Arquivo anterior inválido:", exc, file=sys.stderr)

    all_articles = []
    failed = []
    for topic, url in SOURCES:
        try:
            news = hltv_news(url) if topic == "cs" else riot_news(topic, url)
            if not news:
                raise ValueError("Feed retornou zero matérias válidas")
            print(f"{topic}: {len(news)} manchetes recuperadas")
        except (urllib.error.URLError, TimeoutError, OSError, ET.ParseError, ValueError, json.JSONDecodeError) as exc:
            failed.append(topic)
            news = existing.get(topic, [])
            print(f"AVISO: feed {topic} falhou ({exc}); mantendo {len(news)} matérias anteriores", file=sys.stderr)
        all_articles.extend(news)

    seen, unique = set(), []
    for entry in sorted(all_articles, key=lambda a: a.get("publishedAt") or "", reverse=True):
        key = entry.get("url")
        if key and key not in seen:
            unique.append(entry)
            seen.add(key)

    # Não marca uma atualização nova se todas as fontes falharem.
    old_update = None
    if OUT.exists():
        try:
            old_update = json.loads(OUT.read_text(encoding="utf-8")).get("updatedAt")
        except (OSError, ValueError):
            pass
    updated = old_update if len(failed) == len(SOURCES) else datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"updatedAt": updated, "articles": unique}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Arquivo salvo: {OUT} | {len(unique)} matérias | fontes indisponíveis: {', '.join(failed) or 'nenhuma'}")


if __name__ == "__main__":
    run()
