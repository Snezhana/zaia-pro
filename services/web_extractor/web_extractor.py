import logging
import uuid
import os
import argparse
import time
from pathlib import Path
import json

from  dotenv  import load_dotenv
from pydantic_settings import BaseSettings

from api_client import APIClient
from web_search_extactor import WebSearchExtractor
from TTS_clients import AmazonTextToSpeech

SHARED_DIR = "/data"
SHARED_FILE = "shared.json"

def read_docker_secret(secret_name):
    secret_path = Path(f"/run/secrets/{secret_name}")
    if secret_path.is_file():
        return secret_path.read_text().strip()
    return None

class Settings(BaseSettings):
    API_BASE_URL_LOCAL: str = read_docker_secret("API_BASE_URL_LOCAL")
    API_BASE_URL_CLOUD: str = read_docker_secret("API_BASE_URL_CLOUD")
    API_KEY_GNEWS: str = read_docker_secret("API_KEY_GNEWS")
    API_KEY_GOOGLE: str = read_docker_secret("API_KEY_GOOGLE")
    GOOGLE_CSE_ID: str = read_docker_secret("GOOGLE_CSE_ID")
    API_KEY_OPEN_AI: str = read_docker_secret("API_KEY_OPEN_AI")
    S3_BUCKET_NAME: str = read_docker_secret("S3_BUCKET_NAME")
    S3_ACCESS_KEY: str = read_docker_secret("S3_ACCESS_KEY")
    S3_SECRET_KEY: str = read_docker_secret("S3_SECRET_KEY")
    S3_REGION: str = read_docker_secret("S3_REGION")
    ZAIA_API_USER: str = read_docker_secret("ZAIA_API_USER")
    ZAIA_API_PASSWORD: str = read_docker_secret("ZAIA_API_PASSWORD") 

    class Config:
        env_file = ".env" 

settings = Settings()

frequency_map_in_sec = {
    "daily": 86400,
    "twice a day": 43200,
    "hourly": 3600,
    "weekly": 86400*7,
    "once": 0
}
def get_api_base_url(env):
    
    """Returns API base URL based on the selected environment."""
    if env == "local":
        return settings.API_BASE_URL_LOCAL
    elif env == "cloud":
        return settings.API_BASE_URL_CLOUD
    else:
        raise ValueError("Invalid environment. Use 'local' or 'cloud'.")
# Configure logging
def setLogger():
    log = logging.getLogger('Zaia')
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



if __name__ == "__main__": 
    logger = setLogger()
    load_dotenv()

    last_time_topics_changed_local = 0
    last_time_run = 0
    sec_between_scheduled_runs = 3600
    s3_prefix = 'All'
    parser = argparse.ArgumentParser(description="Run WS Extraction Service service")
    parser.add_argument("env", choices=["local", "cloud"], help="Environment to use (local/cloud)")
    args = parser.parse_args()
    api_base_url = get_api_base_url(args.env)
    logger.info(f'Base API url: {api_base_url}')
    api = APIClient(base_url=api_base_url, username=settings.ZAIA_API_USER, password=settings.ZAIA_API_PASSWORD)
    tts = AmazonTextToSpeech(access_key=settings.S3_ACCESS_KEY,
                             secret_key=settings.S3_SECRET_KEY,
                             region=settings.S3_REGION,
                             bucket_name=settings.S3_BUCKET_NAME)
    while True:
        try: 
            shouldRunService = False
            if last_time_run + sec_between_scheduled_runs < time.time():
                shouldRunService = True
                last_time_topics_changed_local = time.time()
                logger.info('Will run the service on schedule')
            else: 
                file_path = os.path.join(SHARED_DIR, SHARED_FILE)
                if os.path.exists(file_path):
                    try:
                        with open(file_path, "r") as f:
                            data = json.load(f)
                        last_time_topics_changed = data['last_time_topics_changed']
                        if last_time_topics_changed > last_time_topics_changed_local:
                            shouldRunService = True
                            logger.info('Will run the service on trigger')
                            last_time_topics_changed_local = last_time_topics_changed
                    except:
                        logger.error('Cannot open the file')
                
            
            if shouldRunService:

                topics = api.get_data("all_topics")
                ws_extractor = WebSearchExtractor(apikey_news=settings.API_KEY_GNEWS,
                                                apikey_search=settings.API_KEY_GOOGLE,
                                                google_cse_id=settings.GOOGLE_CSE_ID,
                                                apikey_llm=settings.API_KEY_OPEN_AI )
                if topics is None:
                    time.sleep(3600)
                    continue
                for topic in topics:
                    if topic['topic_type'] not in ["web", "news"]:
                        continue
                    if "last_extraction_epoch" in topic and  topic['topic_type']=='web':
                        continue
                    logger.info(f"Topic: {topic}")
                    last_extraction_epoch = topic.get("last_extraction_epoch", time.time()-31*86400)
                    frequency = frequency_map_in_sec.get(topic['frequency'], 0)
                    if time.time() > last_extraction_epoch + frequency:
                        extracted_urls = api.get_data('items', {"topic_id": topic['id'], "user": topic['user']})
                        extracted_urls = [x['source'].split('?')[0] for x in extracted_urls]
                        extracted_items_single, extracted_items_multi = ws_extractor.get_search_and_extractions(topic, last_extraction_epoch, extracted_urls)
                       
                        extracted_items_to_insert_single = []
                        extracted_items_to_insert_multi = []
                        
                        # inser for summary (single item)
                        for res in extracted_items_single:
                            
                            now = int(time.time())
                            id = str(uuid.uuid4())
                            audio_name = id + '.mp3'
                            extracted_items_to_insert_single.append({
                                "id": id,
                                "topic_id": topic['id'],
                                "item_name": res['item_name'],#in list
                                "source": res['url'],
                                "title": res['title'],
                                "value": res['value'],#in list
                                "audio_name": audio_name,#in list
                                "comments": [],
                                "done": False,
                                "created_on": now,
                                "modified_on": now,
                                })
                        if len(extracted_items_to_insert_single)  > 0:
                            logger.info(f"extracted_items_to_insert_single: {len(extracted_items_to_insert_single)}")
                            api.post_data("insert_items", payload=extracted_items_to_insert_single)
                            for item in extracted_items_to_insert_single:
                                try: 
                                    s3_bucket_name = f"{s3_prefix}/{item['audio_name']}"
                                    text_for_tts = f"Title: \n {item['title']} \n"
                                    text_for_tts += f"Summary: \n {item['value']} \n"
                                    tts.synthesize_and_upload_to_s3(text = text_for_tts, 
                                                                    mp3_filepath=s3_bucket_name)
                                except Exception  as e:
                                    logger.error(f'Problem with TTS: {e}')

                        else:
                            logger.info('Zero results for items')
                        
                        # insert for extraction (multi item)
                        for res in extracted_items_multi:
                   
                            now = int(time.time())
                            id = str(uuid.uuid4())
                            extracted_items_to_insert_multi.append({
                                "id": id,
                                "topic_id": topic['id'],
                                "items": res["items"],
                                "source": res['url'],
                                "title": res['title'],
                                "comments": [],
                                "done": False,
                                "created_on": now,
                                "modified_on": now,
                                })
                        if len(extracted_items_to_insert_multi)  > 0:
                            logger.info(f"extracted_items_to_insert_multi: {len(extracted_items_to_insert_multi)}")
                            api.post_data("insert_multi_items", payload=extracted_items_to_insert_multi)
                            
                        else:
                            logger.info('Zero results for multiitems')
                        api.put_data("update_topic", payload={"id": topic['id'], "last_extraction_epoch": int(time.time())})
                        logger.info('Finished for topics')
                logger.info('Setting last_time_run')
                last_time_run = int(time.time())
        except Exception as e:
            logger.error(f"Error on running service: {e}")
        logger.info('Finished round')
        
        time.sleep(60)
   
