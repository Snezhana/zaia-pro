
from MongoDBLayer import  MongoDBLayer

import os
import secrets
import hashlib
import logging
import math
import time
import json
from pathlib import Path
import datetime
from datetime import  timedelta
import uuid

from passlib.context import CryptContext
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from jose import  jwt
from deepgram import (
    DeepgramClient,
    PrerecordedOptions,
    FileSource,
)

REFRESH_TOKEN_EXPIRE_DAYS_IN_SEC = 7*86400
SHARED_DIR = "/data"
SHARED_FILE = "shared.json"
load_dotenv()

ACCESS_TOKEN_EXPIRE_MINUTES = 60
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



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
    MONGO_URL: str = read_docker_secret("MONGO_URL")
    DB_NAME: str = read_docker_secret("DB_NAME")
    ZAIA_SECRET_KEY: str = read_docker_secret("ZAIA_SECRET_KEY")
    DEEPGRAM_API_KEY: str = read_docker_secret("DEEPGRAM_API_KEY")
    LOGIN_CODE: str = read_docker_secret("LOGIN_CODE")

    class Config:
        env_file = ".env" 


class MainApp:
    def __init__(self):
        self.logger = self.setLogger()
        self.settings = Settings()
        self.create_data_manager()
        self.algorithm = "HS256"
        
        os.makedirs(SHARED_DIR, exist_ok=True)

    def setLogger(self):
        log = logging.getLogger('Zaia')
        log.setLevel(logging.INFO)

        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)

        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        ch.setFormatter(formatter)


        log.addHandler(ch)

        return log
    
    def create_data_manager(self):
        try:
            self.logger.info('here')
            uri = self.settings.MONGO_URL
            db_name = self.settings.DB_NAME
            self.data_manager = MongoDBLayer(uri, db_name)
            self.logger.info('here1')
        except Exception as e:
            self.logger.error(f"Connection failed: {e}")
    
    def closeConnection(self):
        self.data_manager.close_connection()

    def sanitize_data(self, data):
        for record in data:
            for key, value in record.items():
                if isinstance(value, float):
                    if math.isnan(value) or math.isinf(value):
                        record[key] = None  # Or set to a default value
        return data
   
    def get_items(self, user, search_term, topic_id, is_marked, only_with_comments):
        if user == '':
            return []
        filter_params = {"$or": [
        {"is_deleted": False},
        {"is_deleted": {"$exists": False}}
        ]}
        if topic_id is not None:
            filter_params["topic_id"] = topic_id
        else:
            topics = self.get_topics_without_items(user=user, topic_type="")
            topics_ids = [x['id'] for x in topics ]
            filter_params["topic_id"] = {"$in": topics_ids}
        if is_marked is not None:
            filter_params["is_marked"] = is_marked
        if only_with_comments:
            filter_params['comments'] =  {"$ne": []}
        data = self.data_manager.searchText("Extraction", filter_params , "value", search_term)
        
        result = []
        for doc in data:
            doc["_id"] = str(doc["_id"])  
            result.append(doc)

        result = self.sanitize_data(result)
        return result
    
    def get_multi_items(self, user, search_term, topic_id, is_marked):
        if user == '':
            return []
        filter_params = {"$or": [
        {"is_deleted": False},
        {"is_deleted": {"$exists": False}}
        ]}
        if topic_id is not None:
            filter_params["topic_id"] = topic_id
        if is_marked is not None:
            filter_params["is_marked"] = is_marked
        data = self.data_manager.searchText(collection_name = "Extraction_Multi", 
                                            filter_query = filter_params , 
                                           text_field = "items.value", 
                                           search_text = search_term)
        
        result = []
        for doc in data:
            doc["_id"] = str(doc["_id"]) 
            result.append(doc)
      
        if topic_id is None:
            topics = self.get_topics_without_items(user=user, topic_type="")
            topics_ids = [x['id'] for x in topics ]
        
            result = [x for x in result if x['topic_id'] in topics_ids]

  
        result = self.sanitize_data(result)
        return result
    
    def get_journals(self, user):
        if user == '':
            return []
        filter_params = {"$or": [
        {"is_deleted": False},
        {"is_deleted": {"$exists": False}}
        ]}
        filter_params['user'] = user
        data = self.data_manager.searchDocument(collection_name = "Journal", 
                                    query = filter_params)
        
        result = []
        for doc in data:
            doc["_id"] = str(doc["_id"]) 
            result.append(doc)
        
        return result

    def update_comment(self, id: str, comments): 
        self.data_manager.updateDocument(collection_name="Extraction", 
                                         query={"audio_name": id+".mp3"}, 
                                         update={"comments": comments, 
                                                   "modified_on": int(time.time())})
    
    def update_done(self, id: str, is_done: bool): 
        self.data_manager.updateDocument(collection_name="Extraction", 
                                        query= {"audio_name": id+".mp3"}, 
                                        update={"done": is_done, "modified_on": int(time.time())})

    def update_marked(self, id: str, is_marked: bool): 
        self.data_manager.updateDocument(collection_name="Extraction", 
                                         query={"audio_name": id+".mp3"}, 
                                         update={"is_marked": is_marked, "modified_on": int(time.time())})

   
    
    def get_topics_without_items(self, topic_type: str = "", user = ""):
        if user == '':
            return []
        params = {"$or": [
        {"is_deleted": False},
        {"is_deleted": {"$exists": False}}
        ]}
        if topic_type != "":
            params["topic_type"] = topic_type
        if user != "":
            params["user"] = user
        data = self.data_manager.searchDocument(collection_name = "Topic", 
                                                query = params)
        result = []
        for doc in data:
            doc["_id"] = str(doc["_id"])  
            result.append(doc)
        return result
    
    def get_topics(self, topic_type, user):
        pipeline = [ 
        {
            "$match": { 
                "user": user,
                "$or": [
                    { "is_deleted": False },  # Explicitly False
                    { "is_deleted": { "$exists": False } }  # Field does not exist
                ]
            }
        },
        {
            "$lookup": {
                "from": "Extraction",         
                "localField": "id",      
                "foreignField": "topic_id", 
                "as": "extracted_items"        
            },
        },
         {
        "$lookup": {
            "from": "Extraction_Multi",         
            "localField": "id",      
            "foreignField": "topic_id", 
            "as": "extracted_multi_items"        
        }
    }]
        topics = self.data_manager.fetchTopicWithPipeline(pipeline=pipeline, 
                                                        collection_name='Topic')
        data = []
        for topic in topics:
            items = [x for x in topic['extracted_items'] if not x.get('is_deleted', False)]
            total_items = len(items)
            done_items = len([x for x in items if x.get('done', False)])
            total_multi_items = len([x for x in topic['extracted_multi_items'] if not x.get('is_deleted', False)])
            del topic['extracted_items']
            del topic['extracted_multi_items']
            data.append({**topic, **{"total_items": total_items, "done_items": done_items, "total_multi_items": total_multi_items}})
        
        result = []
        for doc in data:
            doc["_id"] = str(doc["_id"])  
            result.append(doc)
        return result
      

    def get_all_topics(self):
        params = {"$or": [
        {"is_deleted": False},
        {"is_deleted": {"$exists": False}}
        ]}
        data = self.data_manager.searchDocument(collection_name = "Topic", 
                                                query = params)
        result = []
        for doc in data:
            doc["_id"] = str(doc["_id"])  # Convert ObjectId to string
            result.append(doc)
        return result


    def insert_items(self, items):
        data = self.data_manager.insertDocuments(collection_name="Extraction", 
                                                 documents=items)
        return data
    
    def insert_multi_items(self, items):
        data = self.data_manager.insertDocuments(collection_name="Extraction_Multi", 
                                                 documents=items)
        return data
    
    def update_topic(self, id: str, frequency: str, items:list, last_extraction_epoch: int, topic_name: str,topic_type: str):
        params =  {}
        if frequency is not None:
            params["frequency"] = frequency
        if items is not None:
            params["items"] = items
        if last_extraction_epoch is not None:
            params["last_extraction_epoch"] = last_extraction_epoch    
        if topic_name is not None:
            params["topic_name"] = topic_name    
        if topic_type is not None:
            params["topic_type"] = topic_type
        params["modified_on"] = int(time.time())   
        self.data_manager.updateDocument(collection_name="Topic", 
                                         query={"id": id}, 
                                         update=params)
        self.write_last_time_topics_changed()


    
    def insert_topic(self, topic):
        self.data_manager.insertDocuments(collection_name = "Topic", 
                                          documents = topic)
        self.write_last_time_topics_changed()

    def delete_item(self, id, is_multi_item):
        if is_multi_item:
            self.data_manager.updateDocument(collection_name = "Extraction_Multi", 
                                             query = {"id": id}, 
                                             update = {"is_deleted": True,  "modified_on": int(time.time())})
        else:
            self.data_manager.updateDocument(collection_name = "Extraction", 
                                             query = {"audio_name": id+'.mp3'}, 
                                             update = {"is_deleted": True, "modified_on": int(time.time())})

    def delete_topic(self, id):
        self.data_manager.updateDocument(collection_name = "Topic", 
                                         query = {"id": id}, 
                                         update = {"is_deleted": True, "modified_on": int(time.time())})
        
    def delete_journal_item(self, id):
        self.data_manager.updateDocument(collection_name = "Journal", 
                                         query = {"id": id}, 
                                         update = {"is_deleted": True, "modified_on": int(time.time())})

    def update_journal_item(self, id, updated_text):
        self.data_manager.updateDocument(collection_name = "Journal", 
                                         query = {"id": id}, 
                                         update = {"transcript": updated_text, "modified_on": int(time.time())})

    def write_last_time_topics_changed(self):
        data = {"last_time_topics_changed": int(time.time())}
        file_path = os.path.join(SHARED_DIR, SHARED_FILE)
        print('Writting to the file')
        try:
            with open(file_path, "w") as f:
                json.dump(data, f)
            return {"message": "JSON file written successfully"}
        except Exception as e:
            print(f"Error with writting to the file: {e}")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def authenticate_user(self,username: str, password: str):
        user = self.get_user(username)
        if not user or not self.verify_password(password, user["password"]):
            return False
        return user

    def create_access_token(self,data: dict, expires_delta: timedelta = None):
        to_encode = data.copy()
        expire = datetime.datetime.now(datetime.timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.settings.ZAIA_SECRET_KEY, algorithm=self.algorithm)
    
    
    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)
    
    def get_user(self, username: str):
        user = self.data_manager.searchDocument(collection_name='User', 
                                                query={"username": username})
        if len(user)>0:
            return user[0]
        
        return None

    def create_user(self, username: str, password: str):
        """Save user to the database with hashed password"""
        hashed_password = pwd_context.hash(password)
        self.data_manager.insertDocuments('User', {"username": username, "password": hashed_password})
        access_token = self.create_access_token(data={"sub": username})
        refresh_token = self.create_refresh_token(username)
        return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}
       
    def hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    def create_refresh_token(self, username):
        refresh_token = secrets.token_urlsafe(64) 
        hashed_token = self.hash_token(refresh_token)
        self.data_manager.insertDocuments(collection_name='RefreshToken', 
                                          documents = {"refresh_token": hashed_token,
                                              "username": username,
                                              "expires_on": int(time.time())+REFRESH_TOKEN_EXPIRE_DAYS_IN_SEC})
        return refresh_token
    
    def validate_refresh_token(self, refresh_token: str) -> str:
        hashed_token = self.hash_token(refresh_token)
        token_entry = self.data_manager.searchDocument(collection_name='RefreshToken', 
                                                       query={"refresh_token": hashed_token})
        if len(token_entry)>0:
            token_entry = token_entry[0]
            if  token_entry["expires_on"] > time.time():
                return token_entry["username"] 
        
        return None 
    
    def update_password(self, username: str, password: str):
        user = self.get_user(username)
        if user:
            hashed_password = pwd_context.hash(password)
            self.data_manager.updateDocument(collection_name = 'User',
                                             query = {"username": username}, 
                                             update = {"password": hashed_password})
            access_token = self.create_access_token(data={"sub": username})
            refresh_token = self.create_refresh_token(username)
            return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}
        else:
            return {}
    
    def speech_to_text(self, user, audio_bytes):
        try:
            deepgram = DeepgramClient(self.settings.DEEPGRAM_API_KEY)

            payload: FileSource = {
                "buffer": audio_bytes,
            }

            options = PrerecordedOptions(
                model="nova-3",
                smart_format=True,
            )

            response = deepgram.listen.rest.v("1").transcribe_file(payload, options)

            transcript = response.results.channels[0].alternatives[0].transcript
            if len(transcript) == 0:
                return {"id": "", "transcript": ""}
            journal_id = self.insert_journal(user, transcript)


            return {"id": journal_id, "transcript": transcript}

        except Exception as e:
            print(f"Exception: {e}")
            return {"id": "", "transcript": ""}
        
    
    def insert_journal(self, user, text):
        now = time.time()
        journal = { "id": str(uuid.uuid4()),
                     "user": user, 
                     "transcript" : text,
                    'created_on':  int(now),
                     'modified_on': int(now),
                    'is_deleted':  False
                    }
        self.data_manager.insertDocuments(collection_name = "Journal", 
                                          documents = journal)
        return journal['id']