"""
BigQuery Release Notes Parser
Fetches and parses the official Google Cloud BigQuery Atom XML feed.
"""

import time
import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import re

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache
_cache = {
    "data": None,
    "timestamp": 0,
    "ttl": 300  # 5 minutes cache
}

def clean_html_content(raw_html):
    """
    Cleans raw HTML:
    - Normalizes relative URLs to full Google Cloud URLs
    - Ensures links open safely in a new tab
    """
    if not raw_html:
        return "", ""

    soup = BeautifulSoup(raw_html, "html.parser")

    # Fix relative links
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith("/"):
            a["href"] = "https://cloud.google.com" + href
        a["target"] = "_blank"
        a["rel"] = "noopener noreferrer"

    # Fix images if any
    for img in soup.find_all("img", src=True):
        src = img["src"].strip()
        if src.startswith("/"):
            img["src"] = "https://cloud.google.com" + src

    plain_text = " ".join(soup.get_text().split())
    return str(soup), plain_text

def create_tweet_draft(date_title, category, text_snippet, doc_link):
    """
    Generates a pre-composed tweet draft with hashtags and link.
    Twitter limit is 280 characters.
    """
    category_emojis = {
        "Feature": "✨",
        "Change": "🔄",
        "Announcement": "📢",
        "Fixed": "🛠️",
        "Deprecated": "⚠️",
        "Security": "🔒"
    }
    emoji = category_emojis.get(category, "🚀")
    
    # Target length for text snippet: ~130-150 characters to leave room for link and tags
    snippet = text_snippet.strip()
    if len(snippet) > 140:
        snippet = snippet[:137].rsplit(" ", 1)[0] + "..."

    tweet = f"{emoji} [BigQuery Update] {date_title}\n{category}: {snippet}\n\n🔗 {doc_link}\n#BigQuery #GoogleCloud #DataEngineering"
    return tweet

def parse_entry_items(entry_index, date_title, doc_link, raw_content_html):
    """
    Splits an entry HTML into discrete update items based on <h3> tags.
    """
    if not raw_content_html:
        return []

    soup = BeautifulSoup(raw_content_html, "html.parser")
    items = []
    current_category = "Feature"
    current_elements = []

    def flush_item():
        nonlocal current_elements, current_category
        if not current_elements or not any(str(e).strip() for e in current_elements):
            return
        
        item_html_raw = "".join(str(e) for e in current_elements).strip()
        cleaned_html, plain_text = clean_html_content(item_html_raw)

        item_id = f"item_{entry_index}_{len(items)}"
        tweet_draft = create_tweet_draft(date_title, current_category, plain_text, doc_link)

        items.append({
            "id": item_id,
            "category": current_category,
            "date": date_title,
            "doc_link": doc_link,
            "html": cleaned_html,
            "summary": plain_text[:220] + ("..." if len(plain_text) > 220 else ""),
            "full_text": plain_text,
            "tweet_draft": tweet_draft
        })
        current_elements = []

    for elem in soup.contents:
        if getattr(elem, "name", None) == "h3":
            flush_item()
            current_category = elem.get_text(strip=True) or "Feature"
        else:
            current_elements.append(elem)

    flush_item()
    return items

def fetch_and_parse_feed(force_refresh=False):
    """
    Fetches and parses the BigQuery release notes XML feed.
    Uses in-memory caching unless force_refresh is True.
    """
    global _cache
    now = time.time()

    if not force_refresh and _cache["data"] and (now - _cache["timestamp"] < _cache["ttl"]):
        return {
            **_cache["data"],
            "cached": True,
            "cache_age_seconds": int(now - _cache["timestamp"])
        }

    try:
        req = urllib.request.Request(
            FEED_URL,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/atom+xml,application/xml,text/xml"
            }
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()

        root = ET.fromstring(xml_data)
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        feed_title = root.find("atom:title", ns)
        feed_title_text = feed_title.text if feed_title is not None else "BigQuery - Release notes"

        feed_updated = root.find("atom:updated", ns)
        feed_updated_text = feed_updated.text if feed_updated is not None else ""

        entries = root.findall("atom:entry", ns)
        parsed_entries = []
        all_items = []
        category_counts = {}

        for idx, entry in enumerate(entries):
            title_el = entry.find("atom:title", ns)
            date_title = title_el.text.strip() if title_el is not None else "Unknown Date"

            updated_el = entry.find("atom:updated", ns)
            updated_str = updated_el.text.strip() if updated_el is not None else ""

            link_el = entry.find("atom:link", ns)
            doc_link = link_el.attrib.get("href", "") if link_el is not None else "https://cloud.google.com/bigquery/docs/release-notes"

            content_el = entry.find("atom:content", ns)
            raw_content = content_el.text if content_el is not None else ""

            items = parse_entry_items(idx, date_title, doc_link, raw_content)

            for item in items:
                cat = item["category"]
                category_counts[cat] = category_counts.get(cat, 0) + 1
                all_items.append(item)

            parsed_entries.append({
                "entry_index": idx,
                "title": date_title,
                "updated": updated_str,
                "doc_link": doc_link,
                "items": items,
                "item_count": len(items)
            })

        result_data = {
            "success": True,
            "feed_title": feed_title_text,
            "feed_updated": feed_updated_text,
            "total_entries": len(parsed_entries),
            "total_items": len(all_items),
            "categories": category_counts,
            "entries": parsed_entries,
            "items": all_items,
            "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now)),
            "cached": False,
            "error": None
        }

        # Update cache
        _cache["data"] = result_data
        _cache["timestamp"] = now

        return result_data

    except Exception as e:
        # If cache exists on error, return cached data with warning
        if _cache["data"]:
            return {
                **_cache["data"],
                "cached": True,
                "warning": f"Không thể làm mới dữ liệu từ Google: {str(e)}. Sử dụng dữ liệu lưu trong bộ nhớ tạm.",
                "error": None
            }
        return {
            "success": False,
            "feed_title": "BigQuery - Release notes",
            "feed_updated": "",
            "total_entries": 0,
            "total_items": 0,
            "categories": {},
            "entries": [],
            "items": [],
            "fetched_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now)),
            "cached": False,
            "error": f"Lỗi khi tải dữ liệu từ Google: {str(e)}"
        }
