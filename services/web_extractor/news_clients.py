import requests
import logging

class GNewsNewsSearchClient:
    def __init__(self, api_key):
        self.logger = self.setLogger()
        self.api_key = api_key

    def setLogger(self):
        log = logging.getLogger('Zaia_GNewsNewsSearchClient')
        log.setLevel(logging.DEBUG)

        fh = logging.FileHandler('zaia.log')
        fh.setLevel(logging.DEBUG)

        ch = logging.StreamHandler()
        ch.setLevel(logging.DEBUG)

        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        fh.setFormatter(formatter)
        ch.setFormatter(formatter)

        log.addHandler(fh)
        log.addHandler(ch)

        return log
    
    def fetch_news(self, keyword, language, max_results, from_date):
        """Fetch news based on UNIX timestamps"""
        
        url = "https://gnews.io/api/v4/search"
        params = {
            "q": keyword,
            "from": from_date,
            "lang": language,
            "max": max_results,
            "token": self.api_key
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        articles = []
        extracted_description = []
        if "articles" in data:
             
            for article in data["articles"]:
                if article['description'] in extracted_description:
                    continue
                articles.append({"title": article['title'], 
                          'published_at': article['publishedAt'],
                          'url': article['url']              })
                extracted_description.append(article['description'])
        else:
            self.logger.error("No articles found or API error:", data)
        return articles