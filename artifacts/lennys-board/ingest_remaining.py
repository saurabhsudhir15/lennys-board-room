import os
import time
import yaml
from openai import OpenAI
from supabase import create_client

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])


def get_ingested_guests():
    result = sb.table("lenny_chunks").select("guest_name").execute()
    return {row["guest_name"] for row in result.data if row["guest_name"]}


def get_ingested_newsletter_titles():
    result = sb.table("lenny_chunks").select("title").eq("type", "newsletter").execute()
    return {row["title"] for row in result.data if row["title"]}


def parse_frontmatter(text):
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            meta = yaml.safe_load(parts[1]) or {}
            body = parts[2].strip()
            return meta, body
    return {}, text


def chunk_text(text, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + size])
        chunks.append(chunk)
        i += size - overlap
    return chunks


def embed(text):
    resp = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
        dimensions=1536
    )
    return resp.data[0].embedding


def ingest_file(filepath, content_type, already_ingested, already_ingested_newsletters=None):
    try:
        with open(filepath, "r") as f:
            raw = f.read()

        meta, body = parse_frontmatter(raw)

        if content_type == "newsletter":
            guest_name = "Lenny Rachitsky"
        else:
            guest_name = meta.get("guest", meta.get("guest_name", ""))

        title = meta.get("title", "")

        if content_type == "newsletter":
            if title in already_ingested_newsletters:
                print(f"Skipping {os.path.basename(filepath)} — newsletter already ingested")
                return 0
        else:
            if not guest_name or guest_name in already_ingested:
                print(f"Skipping {os.path.basename(filepath)} — already ingested or no guest name")
                return 0
        date = str(meta.get("date", ""))
        description = meta.get("description", "")

        chunks = chunk_text(body)
        rows = []
        for chunk in chunks:
            vec = embed(chunk)
            vec_str = "[" + ",".join(str(x) for x in vec) + "]"
            rows.append({
                "content": chunk,
                "guest_name": guest_name,
                "title": title,
                "type": content_type,
                "date": date,
                "description": description,
                "embedding": vec_str
            })

        sb.table("lenny_chunks").insert(rows).execute()
        print(f"Ingested {len(rows)} chunks — {guest_name} ({title})")
        if content_type == "newsletter":
            already_ingested_newsletters.add(title)
        else:
            already_ingested.add(guest_name)

        time.sleep(1)
        return len(rows)

    except Exception as e:
        print(f"ERROR on {os.path.basename(filepath)}: {e}")
        return 0


def main():
    already_ingested = get_ingested_guests()
    already_ingested_newsletters = get_ingested_newsletter_titles()
    print(f"Already ingested: {len(already_ingested)} guests — {sorted(already_ingested)}")
    print(f"Already ingested newsletters: {len(already_ingested_newsletters)}")

    total = 0
    base = "lenny-data"

    for fname in sorted(os.listdir(f"{base}/podcasts")):
        if fname.endswith(".md"):
            total += ingest_file(f"{base}/podcasts/{fname}", "podcast", already_ingested)

    for fname in sorted(os.listdir(f"{base}/newsletters")):
        if fname.endswith(".md"):
            total += ingest_file(f"{base}/newsletters/{fname}", "newsletter", already_ingested, already_ingested_newsletters)

    print(f"\nDone. {total} new chunks ingested.")


if __name__ == "__main__":
    main()
