import os                                                                                                                                                                                                           
import yaml                                                                                                                                                                                                         
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"])                                                                                                                                   
PODCASTS_DIR = "lenny-data/podcasts"

updated = 0                                                                                                                                                                                                         
for filename in os.listdir(PODCASTS_DIR):
    if not filename.endswith(".md"):                                                                                                                                                                                
        continue     
    with open(os.path.join(PODCASTS_DIR, filename)) as f:
        text = f.read()                                                                                                                                                                                             
    if not text.startswith("---"):
        continue                                                                                                                                                                                                    
    parts = text.split("---", 2)
    if len(parts) < 3:                                                                                                                                                                                              
        continue     
    meta = yaml.safe_load(parts[1]) or {}
    guest = meta.get("guest")
    title = meta.get("title")                                                                                                                                                                                       
    if not guest or not title:
        continue                                                                                                                                                                                                    
    # Trim to part before "|" if present
    short_title = title.split("|")[0].strip()                                                                                                                                                                       
    sb.table("lenny_chunks").update({"title": short_title}).eq("guest_name", guest).execute()                                                                                                               
    print(f"Updated: {guest} → {short_title[:60]}...")                                                                                                                                                              
    updated += 1                                                                                                                                                                                                    

print(f"\nDone. {updated} guests updated.")   