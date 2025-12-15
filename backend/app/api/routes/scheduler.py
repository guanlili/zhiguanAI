
from typing import Any
from fastapi import APIRouter
from pydantic import BaseModel

from app.api.deps import CurrentUser, SessionDep
from app.core.scheduler import scheduler, run_crawler_job
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

router = APIRouter(prefix="/scheduler", tags=["scheduler"])

class JobConfig(BaseModel):
    days: int = 7
    hours: int = 24  # Interval in hours, used if type is interval
    cron_hour: int = 2 # Hour of day, used if type is cron
    type: str = "cron" # "cron" or "interval"

@router.post("/run-now")
def run_now(
    current_user: CurrentUser,
    days: int = 7
) -> Any:
    """
    Trigger the crawler job immediately in the background.
    """
    if not current_user.is_superuser:
        return {"error": "Not authorized"}
        
    scheduler.add_job(run_crawler_job, kwargs={"days": days})
    return {"message": "Crawler job triggered successfully"}

@router.post("/configure")
def configure_schedule(
    config: JobConfig,
    current_user: CurrentUser,
) -> Any:
    """
    Configure the crawler schedule.
    """
    if not current_user.is_superuser:
        return {"error": "Not authorized"}
    
    if config.type == "interval":
        trigger = IntervalTrigger(hours=config.hours)
    else:
        trigger = CronTrigger(hour=config.cron_hour, minute=0)
        
    scheduler.reschedule_job("daily_crawl", trigger=trigger)
    # Update args as well - reschedule_job doesn't update args easily in one go for some versions,
    # so we might need to modify the job.
    scheduler.modify_job("daily_crawl", func=run_crawler_job, kwargs={"days": config.days})
    
    return {"message": f"Schedule updated to {config.type} trigger"}

@router.get("/status")
def get_status(
    current_user: CurrentUser,
) -> Any:
    """
    Get scheduler status and next run time.
    """
    job = scheduler.get_job("daily_crawl")
    if not job:
        return {"status": "Job not found"}
        
    return {
        "next_run_time": job.next_run_time,
        "trigger": str(job.trigger),
        "kwargs": job.kwargs
    }
