import requests
import logging
class CustomGoogleSearchClient:
    def __init__(self, api_key, cse_id):
        self.logger = self.setLogger()
        self.api_key = api_key
        self.cse_id = cse_id


    def setLogger(self):
        log = logging.getLogger('Zaia_CustomGoogleSearchClient')
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
    
    def fetch_urls(self, query, from_date=None, to_date=None):

        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": self.api_key,
            "cx": self.cse_id,
            "q": query
        }
        
        if from_date and to_date:
            params["dateRestrict"] = f"d{from_date}:d{to_date}"
        results = []
        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if 'items' in data:
                for item in data['items']:
                    results.append({"title": item['title'], 
                                'url': item['link'] })
        except:
            self.logger.error('Problem doiring search')
        
        return results