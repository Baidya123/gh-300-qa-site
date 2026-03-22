import os
import re
import json
import requests
from urllib.parse import urlparse

# Path to the JSON file
JSON_FILE = "az-900.json"
# Directory to save images
IMG_DIR = os.path.join("resources", "images")

# Ensure the image directory exists
os.makedirs(IMG_DIR, exist_ok=True)

# Regex to find all img src="..."
IMG_SRC_RE = re.compile(r'<img src=\\?"(https?://[^"]+)')

def get_image_urls_from_json(json_data):
    urls = set()
    for q in json_data.get("questions", []):
        # Search in question text
        if isinstance(q.get("question"), str):
            urls.update(IMG_SRC_RE.findall(q["question"]))
        # Search in correct_answer (list of strings)
        if isinstance(q.get("correct_answer"), list):
            for ans in q["correct_answer"]:
                if isinstance(ans, str):
                    urls.update(IMG_SRC_RE.findall(ans))
    return urls

def download_image(url, dest_folder):
    filename = os.path.basename(urlparse(url).path)
    dest_path = os.path.join(dest_folder, filename)
    if os.path.exists(dest_path):
        print(f"Already exists: {filename}")
        return
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": url  # Sometimes the image host requires the referer to be the image URL or the page URL
    }
    try:
        resp = requests.get(url, timeout=10, headers=headers)
        resp.raise_for_status()
        with open(dest_path, "wb") as f:
            f.write(resp.content)
        print(f"Downloaded: {filename}")
    except Exception as e:
        print(f"Failed: {url} ({e})")

def main():
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    urls = get_image_urls_from_json(data)
    print(f"Found {len(urls)} unique image URLs.")
    import time
    for url in urls:
        download_image(url, IMG_DIR)
        time.sleep(0.5)  # 0.5 second delay to reduce chance of being blocked

if __name__ == "__main__":
    main()

