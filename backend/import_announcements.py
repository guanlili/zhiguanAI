
import json
import os
import sys
from sqlmodel import Session, select

# Add logical path of backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.core.db import engine
from app.models import RecruitmentAnnouncement

def import_data():
    files = [
        "../crawler/output.json",
        "../crawler/output_beijing.json"
    ]
    
    with Session(engine) as session:
        for file_path in files:
            full_path = os.path.join(os.path.dirname(__file__), file_path)
            if not os.path.exists(full_path):
                print(f"File not found: {full_path}")
                continue
                
            print(f"Importing from {file_path}...")
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    
                count = 0
                for item in data:
                    # Check for duplicates based on URL
                    existing = session.exec(select(RecruitmentAnnouncement).where(RecruitmentAnnouncement.url == item["url"])).first()
                    if existing:
                        continue
                    
                    obj = RecruitmentAnnouncement(
                        title=item.get("title"),
                        url=item.get("url"),
                        publish_date=item.get("publish_date"),
                        source=item.get("source"),
                        category=item.get("category"),
                    )
                    session.add(obj)
                    count += 1
                
                session.commit()
                print(f"Imported {count} items.")
            except Exception as e:
                print(f"Error importing {file_path}: {e}")

if __name__ == "__main__":
    import_data()
