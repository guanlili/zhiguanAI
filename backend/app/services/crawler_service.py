
import json
import os
import subprocess
import logging
from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select
from app.core.db import engine
from app.models import RecruitmentAnnouncement

logger = logging.getLogger(__name__)

class CrawlerService:
    CRAWLER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../crawler"))
    
    @staticmethod
    def run_spider(spider_name: str, days: int = 7) -> str:
        """
        Run a specific spider and save output to a JSON file.
        Returns the path to the output file.
        """
        output_file = f"output_{spider_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        output_path = os.path.join(CrawlerService.CRAWLER_DIR, output_file)
        
        # Ensure venv python is used
        python_executable = os.path.join(CrawlerService.CRAWLER_DIR, ".venv/bin/python")
        if not os.path.exists(python_executable):
             # Fallback to system python if venv doesn't exist (though likely it does based on previous context)
             python_executable = "python"

        cmd = [
            python_executable,
            "-m", "scrapy", "crawl", spider_name,
            "-a", f"days={days}",
            "-O", output_file # -O overwrites, which is fine since we use unique filename
        ]
        
        logger.info(f"Starting crawler {spider_name} with command: {' '.join(cmd)}")
        try:
            result = subprocess.run(
                cmd,
                cwd=CrawlerService.CRAWLER_DIR,
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"Crawler {spider_name} finished successfully.")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Crawler {spider_name} failed: {e.stderr}")
            raise Exception(f"Crawler failed: {e.stderr}")

    @staticmethod
    def import_data(file_path: str) -> int:
        """
        Import data from JSON file into database.
        Returns number of new items imported.
        """
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            return 0
            
        count = 0
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            with Session(engine) as session:
                for item in data:
                    url = item.get("url")
                    if not url:
                        continue
                        
                    # Check for duplicates
                    existing = session.exec(select(RecruitmentAnnouncement).where(RecruitmentAnnouncement.url == url)).first()
                    if existing:
                        continue
                    
                    obj = RecruitmentAnnouncement(
                        title=item.get("title"),
                        url=url,
                        publish_date=item.get("publish_date"),
                        source=item.get("source"),
                        category=item.get("category"),
                    )
                    session.add(obj)
                    count += 1
                
                session.commit()
            
            # Clean up file
            os.remove(file_path)
            logger.info(f"Imported {count} items from {file_path} and removed file.")
            return count
            
        except Exception as e:
            logger.error(f"Error importing {file_path}: {e}")
            raise

    @staticmethod
    def run_all_crawlers(days: int = 7):
        """
        Run all known crawlers.
        """
        spiders = ["beijing_rsj", "mohrss"]
        total_imported = 0
        
        for spider in spiders:
            try:
                output_path = CrawlerService.run_spider(spider, days)
                imported = CrawlerService.import_data(output_path)
                total_imported += imported
            except Exception as e:
                logger.error(f"Error running spider {spider}: {e}")
                
        return total_imported
