# -*- coding: utf-8 -*-
"""
人社部招聘公告爬虫
采集网站: https://www.mohrss.gov.cn/SYrlzyhshbzb/fwyd/SYkaoshizhaopin/zyhgjjgsydwgkzp/zpgg/
"""
import scrapy
from scrapy_playwright.page import PageMethod
import re
from .base_spider import BaseGovJobSpider

class MohrssSpider(BaseGovJobSpider):
    name = "mohrss"
    allowed_domains = ["mohrss.gov.cn"]
    # Provide index.html explicitly to match pattern logic
    start_urls = ["https://www.mohrss.gov.cn/SYrlzyhshbzb/fwyd/SYkaoshizhaopin/zyhgjjgsydwgkzp/zpgg/index.html"]
    
    custom_settings = {
        "DOWNLOAD_HANDLERS": {
            "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },
        "TWISTED_REACTOR": "twisted.internet.asyncioreactor.AsyncioSelectorReactor",
        "PLAYWRIGHT_BROWSER_TYPE": "chromium",
        "PLAYWRIGHT_LAUNCH_OPTIONS": {
            "headless": True,
            "args": ["--ignore-certificate-errors", "--no-sandbox"]
        },
    }

    # Inherits __init__ from BaseGovJobSpider

    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(
                url,
                meta={
                    "playwright": True,
                    "playwright_include_page": True,
                    "playwright_context_kwargs": {
                        "ignore_https_errors": True,
                    },
                    "playwright_page_methods": [
                        PageMethod("wait_for_selector", "a[href^='./202'][title]", timeout=30000),
                    ],
                },
                callback=self.parse,
                errback=self.errback,
            )

    async def parse(self, response):
        page = response.meta.get("playwright_page")
        try:
            # Extract data
            jobs_data = await page.evaluate("""
                () => {
                    const jobs = [];
                    const links = document.querySelectorAll("a[href^='./202'][title]");
                    links.forEach(link => {
                        const li = link.parentElement;
                        const dateSpan = li ? li.querySelector('span') : null;
                        jobs.push({
                            title: link.getAttribute('title') || link.textContent.trim(),
                            url: link.href,
                            date: dateSpan ? dateSpan.textContent.trim() : ''
                        });
                    });
                    return jobs;
                }
            """)
            
            self.logger.info(f"成功采集 {len(jobs_data)} 条招聘公告")
            
            should_continue = True
            for job in jobs_data:
                item = {
                    "title": self.clean_title(job.get("title", "")),
                    "url": job.get("url", ""),
                    "publish_date": job.get("date", ""),
                    "source": "人力资源和社会保障部",
                    "category": "中央和国家机关事业单位公开招聘"
                }

                if self.should_stop_crawl(item.get("publish_date")):
                    should_continue = False
                    continue 
                yield item
            
            # Pagination Logic
            if should_continue:
                # Check if next button/link exists
                has_next = await page.evaluate("""
                    () => {
                         const links = Array.from(document.querySelectorAll('a'));
                         return links.some(a => a.textContent.includes('下一页') || a.textContent.includes('下页'));
                    }
                """)
                
                if has_next:
                    # Construct next URL manually 
                    curr_url = response.url
                    next_url = None
                    if "index.html" in curr_url and "index_" not in curr_url:
                        next_url = curr_url.replace("index.html", "index_1.html")
                    elif "index_" in curr_url:
                        # index_1.html -> index_2.html
                        match = re.search(r'index_(\d+)\.html', curr_url)
                        if match:
                            curr_idx = int(match.group(1))
                            next_url = curr_url.replace(f"index_{curr_idx}.html", f"index_{curr_idx+1}.html")
                    
                    if next_url:
                         self.logger.info(f"Navigating to next page: {next_url}")
                         yield scrapy.Request(
                            next_url,
                            meta={
                                "playwright": True,
                                "playwright_include_page": True,
                                "playwright_context_kwargs": {
                                    "ignore_https_errors": True,
                                },
                                "playwright_page_methods": [
                                    PageMethod("wait_for_selector", "a[href^='./202'][title]", timeout=30000),
                                ],
                            },
                            callback=self.parse,
                            errback=self.errback,
                        )
            else:
                self.logger.info("Reached cutoff date. Stopping crawl.")

        finally:
            await page.close()

    async def errback(self, failure):
        self.logger.error(f"请求失败: {failure}")
        page = failure.request.meta.get("playwright_page")
        if page:
            await page.close()
