"""
Flask Web Application for BigQuery Release Notes Tracker & Twitter Sharing
"""

import os
import json
from flask import Flask, render_template, jsonify, request
from release_parser import fetch_and_parse_feed

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "bigquery-release-notes-secret-key-2026")

@app.route("/")
def index():
    """
    Renders the main page with preloaded feed data.
    """
    feed_data = fetch_and_parse_feed(force_refresh=False)
    return render_template("index.html", initial_data=feed_data)

@app.route("/api/feed", methods=["GET"])
def get_feed():
    """
    API endpoint to retrieve release notes in JSON format.
    Pass ?refresh=true to bypass cache and re-fetch directly from Google.
    """
    force_refresh = request.args.get("refresh", "false").lower() in ("true", "1", "yes")
    feed_data = fetch_and_parse_feed(force_refresh=force_refresh)
    return jsonify(feed_data)

@app.route("/api/tweet", methods=["POST"])
def post_tweet():
    """
    Optional endpoint for posting directly via Twitter API v2.
    If Twitter API credentials are provided (via request or environment variables),
    attempts to send the tweet; otherwise returns helpful guidance to use the Web Intent.
    """
    data = request.get_json(silent=True) or {}
    tweet_text = data.get("text", "").strip()

    if not tweet_text:
        return jsonify({
            "success": False,
            "error": "Nội dung tweet không được để trống."
        }), 400

    if len(tweet_text) > 280:
        return jsonify({
            "success": False,
            "error": f"Nội dung tweet vượt quá 280 ký tự (hiện có {len(tweet_text)} ký tự)."
        }), 400

    # Check for credentials in payload or environment
    api_key = data.get("api_key") or os.environ.get("TWITTER_API_KEY")
    api_secret = data.get("api_secret") or os.environ.get("TWITTER_API_SECRET")
    access_token = data.get("access_token") or os.environ.get("TWITTER_ACCESS_TOKEN")
    access_token_secret = data.get("access_token_secret") or os.environ.get("TWITTER_ACCESS_TOKEN_SECRET")
    bearer_token = data.get("bearer_token") or os.environ.get("TWITTER_BEARER_TOKEN")

    if not (bearer_token or (api_key and api_secret and access_token and access_token_secret)):
        return jsonify({
            "success": False,
            "can_use_intent": True,
            "error": "Chưa có thông tin xác thực Twitter API v2.",
            "hint": "Bạn có thể sử dụng nút 'Mở Twitter / X để đăng ngay' (Web Intent) mà không cần cấu hình API key!"
        }), 422

    # Attempt Twitter API call if credentials exist
    try:
        import requests
        headers = {
            "Content-Type": "application/json"
        }
        if bearer_token:
            headers["Authorization"] = f"Bearer {bearer_token}"
        
        # Twitter API v2 create tweet endpoint
        resp = requests.post(
            "https://api.twitter.com/2/tweets",
            headers=headers,
            json={"text": tweet_text},
            timeout=10
        )
        if resp.status_code in (200, 201):
            return jsonify({
                "success": True,
                "message": "Đã đăng bài lên Twitter thành công!",
                "data": resp.json()
            })
        else:
            return jsonify({
                "success": False,
                "can_use_intent": True,
                "error": f"Twitter API phản hồi lỗi ({resp.status_code}): {resp.text}"
            }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "can_use_intent": True,
            "error": f"Lỗi khi gọi Twitter API: {str(e)}"
        }), 500

@app.route("/health")
def health():
    return jsonify({"status": "ok", "app": "BigQuery Release Notes Tracker"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Khởi động máy chủ tại http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
