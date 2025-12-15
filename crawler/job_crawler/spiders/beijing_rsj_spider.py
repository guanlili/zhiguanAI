# -*- coding: utf-8 -*-
"""
北京市人力资源和社会保障局招聘公告爬虫
采集网站: https://rsj.beijing.gov.cn/xxgk/gkzp/index.html
"""
import scrapy
import subprocess
from scrapy.http import HtmlResponse
import re
from datetime import datetime, timedelta

class BeijingRsjSpider(scrapy.Spider):
    name = "beijing_rsj"
    start_urls = ["https://rsj.beijing.gov.cn/xxgk/gkzp/index.html"]
    
    custom_settings = {
        "ROBOTSTXT_OBEY": False,
        "CONCURRENT_REQUESTS": 1,
    }

    def __init__(self, days=None, *args, **kwargs):
        super(BeijingRsjSpider, self).__init__(*args, **kwargs)
        self.days = int(days) if days else None
        if self.days:
            self.cutoff_date = datetime.now() - timedelta(days=self.days)
            self.logger.info(f"Only crawling items published after {self.cutoff_date.strftime('%Y-%m-%d')}")
        else:
            self.cutoff_date = None

    def start_requests(self):
        # Due to SSL/TLS issues with Python/Twisted on this environment for this specific site,
        # we use system curl to fetch the pages.
        current_url = self.start_urls[0]
        page_count = 0
        max_pages = 50 # Safety limit
        
        while current_url and page_count < max_pages:
            self.logger.info(f"Fetching {current_url} via curl...")
            content = self.fetch_with_curl(current_url)
            
            if not content:
                self.logger.error(f"Failed to fetch {current_url}")
                break
                
            # Create a Scrapy Response object manually
            response = HtmlResponse(url=current_url, body=content, encoding='utf-8')
            
            # Check if we got a valid page (not a 404 disguised as 200, though curl -f helps)
            if response.status != 200 and response.status != 0: # 0 because HtmlResponse defaults to 200 usually, but let's be safe
                break
                
            items = list(self.parse_items(response))
            if not items:
                self.logger.info("No items found on this page. Stopping.")
                break
                
            should_continue = True
            for item in items:
                if self.should_stop_crawl(item):
                    should_continue = False
                    break
                yield item
            
            if not should_continue:
                self.logger.info("Reached cutoff date. Stopping crawl.")
                break

            page_count += 1
            next_url = self.get_next_url(current_url)
            current_url = next_url

    def should_stop_crawl(self, item):
        if not self.cutoff_date:
            return False
            
        date_str = item.get("publish_date")
        if not date_str:
            return False
            
        try:
            # Try to parse date in YYYY-MM-DD format
            item_date = datetime.strptime(date_str, "%Y-%m-%d")
            # If item_date is older than cutoff_date (item_date < cutoff_date), we can stop 
            # assuming the list is ordered by date descending.
            if item_date < self.cutoff_date:
                return True
        except ValueError:
            pass
            
        return False

    def fetch_with_curl(self, url):
        try:
            # -f triggers failure on HTTP errors (404, etc)
            cmd = [
                "curl", "-L", "-s", "-f",
                "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
                url
            ]
            result = subprocess.run(cmd, capture_output=True)
            if result.returncode == 0:
                return result.stdout
            else:
                self.logger.warning(f"Curl failed for {url} with code {result.returncode}")
                return None
        except Exception as e:
            self.logger.error(f"Error executing curl: {e}")
            return None

    def get_next_url(self, current_url):
        # Logic: index.html -> index_1.html -> index_2.html
        if "index.html" in current_url and "_" not in current_url:
            return current_url.replace("index.html", "index_1.html")
        elif "index_" in current_url:
            match = re.search(r'index_(\d+)\.html', current_url)
            if match:
                curr_idx = int(match.group(1))
                return current_url.replace(f"index_{curr_idx}.html", f"index_{curr_idx+1}.html")
        return None

    def parse_items(self, response):
        job_items = response.css(".listBox ul.list li")
        self.logger.info(f"Parsed {len(job_items)} items from {response.url}")
        
        for li in job_items:
            # 提取标题和链接
            link_el = li.css("a")
            # Usually href is relative like ./202512/t20251215_4342086.html
            href = link_el.css("::attr(href)").get()
            title = link_el.css("::attr(title)").get() or link_el.css("::text").get()
            
            if href and title:
                url = response.urljoin(href)
                date = li.css("span::text").get()
                
                yield {
                    "title": title.strip(),
                    "url": url,
                    "publish_date": date.strip() if date else "",
                    "source": "北京市人力资源和社会保障局",
                    "category": "事业单位公开招聘"
                }
