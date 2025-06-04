import logging
import uuid
import os
import argparse
import time
import json

from  dotenv  import load_dotenv


from services.web_extractor.api_client import APIClient
from services.web_extractor.extractor import ItemExtractor


def get_api_base_url(env):
    
    """Returns API base URL based on the selected environment."""
    if env == "local":
        return os.getenv("API_BASE_URL_LOCAL")
    elif env == "cloud":
        return os.getenv("API_BASE_URL_CLOUD")
    else:
        raise ValueError("Invalid environment. Use 'local' or 'cloud'.")
# Configure logging
def setLogger():
    log = logging.getLogger('Zaia1')
    log.setLevel(logging.DEBUG)

    fh = logging.FileHandler('zaia1.log')
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

def extract_bookmarks(bookmark_tree, bookmark_folder, folder='main' ):
    bookmarks = []
    for item in bookmark_tree:
        if item.get('type') == 'url' and folder == bookmark_folder:
            bookmarks.append({'url': item['url'], 'title': item['name']})
        elif item.get('type') == 'folder':
            folder = item.get('name')
            bookmarks.extend(extract_bookmarks(item['children'], bookmark_folder, folder))
    return bookmarks

def get_brave_bookmarks(bookmark_folder):
    bookmarks_path = os.path.join(os.getenv('LOCALAPPDATA'), 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'Bookmarks')
    with open(bookmarks_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return extract_bookmarks(data['roots']['bookmark_bar']['children'], bookmark_folder)

if __name__ == "__main__":
    bookmark_folder = 'news_week_12_2' 
    item_type ="short summary"
    user = "Snezhana"
    topic_id ="4729ee87-751f-4e44-8cdd-b9fef4b1330f"
    item_name ='short summary'

    try: 
        load_dotenv()
        logger = setLogger()
        parser = argparse.ArgumentParser(description="Run Bookmark Extraction Temp Service")
        parser.add_argument("env", choices=["local", "cloud"], help="Environment to use (local/cloud)")
        args = parser.parse_args()
        api_base_url = get_api_base_url(args.env)
        logger.info(f'Base API url: {api_base_url}')
      
        api = APIClient(base_url=api_base_url, username=os.getenv("ZAIA_API_USER"), password=os.getenv("ZAIA_API_PASSWORD"))
        
        item_extractor = ItemExtractor(os.getenv('API_KEY_OPEN_AI'))
        extracted_bookmarks = api.get_data('items', { "user": user})
        extracted_bookmarks_urls = [x['source'].split('?')[0] for x in extracted_bookmarks]
        logger.info(f"Already extracted : {extracted_bookmarks_urls}")
        bookmarks = get_brave_bookmarks(bookmark_folder)
        logger.info(f"Number of bookmarks is : {len(bookmarks)}")
        batch_size=5
        for i in range(0, len(bookmarks), batch_size):
            
            sub_bookmarks = bookmarks[i:i+batch_size]
            extracted_items_to_insert = []
            for bm in sub_bookmarks:
                try:
                    url  = bm['url'].split('?')[0]
                    if url in extracted_bookmarks_urls:
                        logger.info(f'Already exracted url: {url}')
                        continue

                    logger.info(bm['url'])
                    answer, _  = item_extractor.extract_single_item_from_url(url, item_type)
                    if answer is not None:              
                        extracted_bookmarks_urls.append(url)
                        # logger.info(answer)
                        now = time.time()
                        id = str(uuid.uuid4())
                        audio_name = id + '.mp3'
                        extracted_items_to_insert.append({
                                "id": id,
                                "topic_id": topic_id,
                                "item_name": item_name,
                                "source": url,
                                "title": bm['title'],
                                "value": answer,
                                "audio_name": audio_name,
                                "comments": [],
                                "done": False,
                                "created_on": int(now),
                                "modified_on": int(now),
                                })
                    else:
                        logger.error(f"Answer is None for {url}")

                except Exception as e:
                    logger.error(f"Error summarizing {bm}: {e}")
            
            
            logger.info(extracted_items_to_insert)
            if len(extracted_items_to_insert):
                api.post_data("insert_items", payload=extracted_items_to_insert)
            logger.info(f'Finished for {i}:{i+batch_size}')
                        
                        
            
    except Exception as e:
        logger.error(f"Error on running service: {e}")
        
   
