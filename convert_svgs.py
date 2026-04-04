import sqlite3
import os
import shutil
from pathlib import Path

# --- CONFIGURATION ---
# Default Chrome History path for Windows
history_path = Path(os.path.expandvars(r"%LocalAppData%\Google\Chrome\User Data\Default\History"))
temp_history = "history_temp.db"

# Indicators used to identify blog content
BLOG_INDICATORS = ['xvi']

def list_blog_urls():
    if not history_path.exists():
        print(f"Error: Could not find history at {history_path}")
        return

    # 1. Copy history file to bypass 'database is locked' error while Chrome is open
    shutil.copyfile(history_path, temp_history)
    
    try:
        conn = sqlite3.connect(temp_history)
        cursor = conn.cursor()

        # 2. Query the 'urls' table for URL and Title
        cursor.execute("SELECT url, title FROM urls")
        rows = cursor.fetchall()

        print(f"{'URL':<60} | {'TITLE'}")
        print("-" * 100)

        count = 0
        for url, title in rows:
            # Simple heuristic filtering for blogs
            if any(indicator in url.lower() for indicator in BLOG_INDICATORS):
                print(f"{url[:60]:<60} | {title}")
                count += 1

        print("-" * 100)
        print(f"Total blog entries found: {count}")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()
        # 3. Clean up the temporary file
        if os.path.exists(temp_history):
            os.remove(temp_history)

if __name__ == "__main__":
    list_blog_urls()
