
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from app.services.crawler_service import CrawlerService
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def run_crawler_job(days: int = 7):
    logger.info("Starting scheduled crawler job...")
    try:
        count = CrawlerService.run_all_crawlers(days)
        logger.info(f"Scheduled crawl finished. Imported {count} new items.")
    except Exception as e:
        logger.error(f"Scheduled crawl failed: {e}")

def init_scheduler():
    # Default job: Run every day at 02:00 AM (local time)
    # We can make this configurable later via API or config
    scheduler.add_job(
        run_crawler_job,
        CronTrigger(hour=2, minute=0),
        id="daily_crawl",
        name="Daily Crawler Job",
        replace_existing=True,
        kwargs={"days": 7}
    )
    
    scheduler.start()
    logger.info("Scheduler started.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler shut down.")
