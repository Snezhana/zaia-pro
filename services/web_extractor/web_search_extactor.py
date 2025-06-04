import datetime
import logging

from prompts import *
from news_clients import GNewsNewsSearchClient
from websearch_clients import CustomGoogleSearchClient
from extractor import ItemExtractor


class WebSearchExtractor:
    def __init__(self, apikey_news, apikey_search, apikey_llm, google_cse_id):
        self.logger = self.setLogger()
        self.apikey_news = apikey_news
        self.apikey_search = apikey_search
        self.apikey_llm = apikey_llm
        self.google_cse_id = google_cse_id
        
    def setLogger(self):
        log = logging.getLogger('Zaia_ws_extractor')
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
    
    def get_search_and_extractions(self, topic: dict, last_extraction_epoch: int, already_extracted_urls: list, language: str="en", max_results: int=10):
        if topic['topic_type'] == 'news':
            news_search_client = GNewsNewsSearchClient(api_key=self.apikey_news)
            from_date = self.unix_to_iso8601(last_extraction_epoch)
            articles = news_search_client.fetch_news(keyword=topic['topic_name'], 
                                                 from_date=from_date,
                                                 language=language,
                                                 max_results=max_results)
        elif topic['topic_type'] == 'web':
            web_search_client = CustomGoogleSearchClient(api_key = self.apikey_search, 
                                                         cse_id=self.google_cse_id)
            articles = web_search_client.fetch_urls(query= topic['topic_name'])
        item_extractor = ItemExtractor(apikey_llm = self.apikey_llm)
        extracted_items_single = []
        extracted_items_multi = []
        
        for artilce in articles:
            if artilce['url'] in already_extracted_urls:
                continue
            already_extracted_urls.append(artilce['url'])
            
            if not topic.get('is_multi_item', False):
                item = topic['items'][0]
                extraction, full_text = item_extractor.extract_single_item_from_url(artilce['url'], 
                                                                                    item_type=item['item_type'])
                if extraction is not None:
                    extracted_items_single.append({"item_name": item['item_name'],
                                            "item_type": item['item_type'], 
                                            "value": extraction,
                                            "url": artilce['url'],
                                            "full_text": full_text,
                                            "title": artilce['title']})
            else:
                extractions, full_text = item_extractor.extract_multiple_items_from_url(artilce['url'], 
                                                                                        items =topic['items'])
                if extractions is not None:
                    items_values = []
                    for item in topic['items']:
                        value = extractions.get(item['item_name'], '')
                        value_string = ''
                        if isinstance(value, list):
                            value_string = "; ".join([str(x) for x in value])
                        elif isinstance(value, str):
                            value_string = value
                        
                        items_values.append({"item_name": item['item_name'], "value": value_string})
                    extracted_items_multi.append({"items": items_values,
                                            "url": artilce['url'],
                                            "full_text": full_text,
                                            "title": artilce['title']})

        return extracted_items_single, extracted_items_multi


    def unix_to_iso8601(self, timestamp):
        """Convert UNIX timestamp to ISO 8601 format (UTC)"""
        return datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')









