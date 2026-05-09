"""
Standalone ingestion script. Run once: python ingest.py
"""

import os
import re
import yaml
import math
from pathlib import Path
from openai import OpenAI
from supabase import create_client
import config

REPO_URL = "https://github.com/LennysNewsletter/lennys-newsletterpodcastdata.git"
DATA_DIR = "lenny-data"


def clone_if_needed():
    if not Path(DATA_DIR).exists():
        print(f"Cloning Lenny's data repo...")
        import subprocess

        subprocess.run(["git", "clone", REPO_URL, DATA_DIR], check=True)
        print("Clone complete.")
    else:
        print(f"'{DATA_DIR}' already exists, skipping clone.")


def parse_frontmatter(content: str):
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                meta = yaml.safe_load(parts[1]) or {}
                body = parts[2].strip()
                return meta, body
            except yaml.YAMLError:
                pass
    return {}, content


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    words = text.split()
    chunks = []
    step = chunk_size - overlap
    for i in range(0, max(1, len(words) - overlap), step):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
        if i + chunk_size >= len(words):
            break
    return chunks


def get_embedding(client: OpenAI, text: str) -> list:
    response = client.embeddings.create(
        model=config.EMBED_MODEL, input=text, dimensions=config.EMBED_DIMENSIONS
    )
    return response.data[0].embedding


def main():
    openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

    clone_if_needed()

    count_result = sb.table("lenny_chunks").select("id", count="exact").execute()
    row_count = count_result.count or 0
    if row_count > 0:
        print(f"Already ingested ({row_count} chunks). Skipping.")
        return

    md_files = []
    for folder in ["podcasts", "newsletters"]:
        folder_path = Path(DATA_DIR) / folder
        if folder_path.exists():
            md_files.extend(list(folder_path.glob("*.md")))

    if not md_files:
        print(
            f"No markdown files found in {DATA_DIR}/podcasts/ or {DATA_DIR}/newsletters/"
        )
        return

    total = len(md_files)
    inserted = 0

    for i, filepath in enumerate(md_files, 1):
        raw = filepath.read_text(encoding="utf-8", errors="ignore")
        meta, body = parse_frontmatter(raw)

        doc_type = meta.get("type", "podcast")
        if doc_type == "newsletter":
            guest_name = "Lenny's Newsletter"
        else:
            guest_name = meta.get("guest", meta.get("author", "Unknown"))

        title = meta.get("title", filepath.stem)
        date = str(meta.get("date", ""))
        description = meta.get("description", "")

        chunks = chunk_text(body, chunk_size=500, overlap=100)

        rows = []
        for chunk in chunks:
            embedding = get_embedding(openai_client, chunk)
            rows.append(
                {
                    "content": chunk,
                    "embedding": embedding,
                    "guest_name": guest_name,
                    "title": title,
                    "type": doc_type,
                    "date": date,
                    "description": description,
                }
            )

        if rows:
            sb.table("lenny_chunks").insert(rows).execute()
            inserted += len(rows)

        print(f"Ingested {i}/{total} files... ({filepath.name})")

    print(f"\nDone. Inserted {inserted} chunks from {total} files.")


if __name__ == "__main__":
    main()
