
import scrapy
from datetime import datetime, timedelta
import re
import logging

class BaseGovJobSpider(scrapy.Spider):
    """
    Base Spider for Government Job Announcements.
    Handles common logic like:
    - parsing 'days' argument for incremental crawling
    - date cutoff checks
    - standardizing item output
    """
    
    # Default category, can be overridden
    default_category = "事业单位公开招聘"
    
    def __init__(self, days=None, *args, **kwargs):
        super(BaseGovJobSpider, self).__init__(*args, **kwargs)
        self.days = int(days) if days else None
        self.cutoff_date = None
        
        if self.days:
            self.cutoff_date = datetime.now() - timedelta(days=self.days)
            self.logger.info(f"[{self.name}] Only crawling items published after {self.cutoff_date.strftime('%Y-%m-%d')}")
        else:
            self.logger.info(f"[{self.name}] Crawling all available items (no date limit)")

    def should_stop_crawl(self, item_date_str):
        """
        Check if the item's date is older than the cutoff date.
        Returns True if we should STOP processing/crawling this item (and potentially subsequent ones).
        """
        if not self.cutoff_date or not item_date_str:
            return False
            
        try:
            # Clean up date string
            date_str = item_date_str.strip()
            # Remove common noise: brackets [], parentheses (), spaces
            date_str = re.sub(r'[\[\]\(\)\s]', '', date_str)
            
            # Identify format. Most gov sites use YYYY-MM-DD.
            # We can add more formats here if needed.
            item_date = datetime.strptime(date_str, "%Y-%m-%d")
            
            if item_date < self.cutoff_date:
                # Item is older than cutoff
                return True
        except ValueError:
            # If date parse fails, we generally be safe and NOT stop, 
            # or log a warning.
            self.logger.warning(f"Could not parse date: {item_date_str}")
            return False
            
        return False

    def clean_title(self, title):
        if not title:
            return ""
        return title.strip()
