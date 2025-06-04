from typing import Protocol
import os
import atexit

from TTS.api import TTS
import boto3
import torch
from botocore.exceptions import ClientError

from services.web_extractor.api_client import APIClient
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

def read_docker_secret(secret_name):
    secret_path = Path(f"/run/secrets/{secret_name}")
    if secret_path.is_file():
        return secret_path.read_text().strip()
    return None


class Settings(BaseSettings):
    S3_BUCKET_NAME: str = read_docker_secret("S3_BUCKET_NAME")
    S3_ACCESS_KEY: str = read_docker_secret("S3_ACCESS_KEY")
    S3_SECRET_KEY: str = read_docker_secret("S3_SECRET_KEY")
    S3_REGION: str = read_docker_secret("S3_REGION")
    DB_NAME: str = read_docker_secret("DB_NAME")
    API_BASE_URL_LOCAL: str = read_docker_secret("API_BASE_URL_LOCAL")
    API_BASE_URL_CLOUD: str = read_docker_secret("API_BASE_URL_CLOUD")
    API_KEY_OPEN_AI: str = read_docker_secret("API_KEY_OPEN_AI")
    ZAIA_API_USER: str = read_docker_secret("ZAIA_API_USER")
    ZAIA_API_PASSWORD: str = read_docker_secret("ZAIA_API_PASSWORD") 


    class Config:
        env_file = ".env" 

settings = Settings()

created_on = 1742570087   
folder_name='mp3_files'
s3_prefix = 'All'

class TextToSpeechClient(Protocol):
    def text_to_speech(self, text, file_path):
        pass

class TTSTextToSpeechClient(TextToSpeechClient):
   
    def preprocess_text(self, text):
        abbrev_dict = {
            "AI": "A.I.",
            "SDK": "S.D.K",
            "DNS": "D.N.S",
            "TCP": "T.C.P",
            "UDP": "U.D.P",
            "LLM": "L.L.M.",
            "GPT": "G.P.T"
        }
        
        # Replace abbreviations with their expanded forms
        for abbrev, expanded in abbrev_dict.items():
            text = text.replace(abbrev, expanded)
        
        return text

    def text_to_speech(self, text , output_path):
        device = "cuda" if torch.cuda.is_available() else "cpu"
        processed_text = self.preprocess_text(text_for_tts)
        # logger.info(processed_text)
        tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC_ph", progress_bar=False).to(device)
        tts.tts_to_file(text=processed_text, file_path=output_path)
        # logger.info(f"Audio generated and saved to {output_path}")

if __name__ == "__main__": 
    
    api_client = APIClient(base_url=settings.API_BASE_URL_CLOUD, username=settings.ZAIA_API_USER, password=settings.ZAIA_API_PASSWORD)
    print('data_manager = MongoDBLayer(uri, db_name)')
    all_topics = api_client.get_data("all_topics")
    print('all_topics = data_manager.searchDocument("Topic", {})')
    all_items = []
    for topic in all_topics:
        print(topic)
        topic_items =api_client.get_data("items", {"topic_id": topic['id'], "user": topic["user"]})
        topic_items = [x for x in topic_items if x['created_on'] > created_on]
        all_items.extend(topic_items)
    print(len(all_items))
    # Initialize a session using AWS credentials
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION,
    )


    # List objects in the S3 bucket
    response = s3_client.list_objects_v2(Bucket=settings.S3_BUCKET_NAME, Prefix='All')
    # Extract the file names
    if 'Contents' in response:
        file_names = [item['Key'].split('/')[-1]  for item in response['Contents']]
        print(file_names)
        for item in all_items:
            if item['audio_name'] not in file_names:
                print(item)
                try:
                    mp3_file_path = os.path.join(folder_name,item['audio_name'])
                    text_for_tts = f"Title: \n {item['title']} \n"
                    text_for_tts += f"Summary: \n {item['value']} \n"
                    TTSTextToSpeechClient().text_to_speech(text=text_for_tts,
                                                        output_path=mp3_file_path)
                    if os.path.exists(mp3_file_path):
                        print(mp3_file_path)
                        s3_bucket_name = f"{s3_prefix}/{item['audio_name']}"
                        try:
                            s3_client.upload_file(mp3_file_path, settings.S3_BUCKET_NAME, s3_bucket_name)
                            print("Upload successful.")
                        except ClientError as e:
                            print(f"Upload failed: {e}")
                    else:
                        print(f'does not exist for {item["audio_name"]}')
                except Exception as e:
                    print(f'Problem with TTS or S3 Bucket: {e} for {item["audio_name"]} ')
       
    else:
        print("No files found.")
        
    
