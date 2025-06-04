from main_app import MainApp

from typing import List, Dict
import os
from io import BytesIO
import uuid
import time


from pydantic import BaseModel, Field
from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import boto3


class CommentUpdateRequest(BaseModel):
    id: str
    comments: List[Dict]

class DoneUpdateRequest(BaseModel):
    id: str
    is_done: bool

class MarkedUpdateRequest(BaseModel):
    id: str
    is_marked: bool

class Item(BaseModel):
    id: str
    topic_id: str
    item_name: str
    source: str
    title: str
    value: str
    audio_name: str
    comments: list
    done: bool
    created_on: float
    modified_on: float

class MultiItem(BaseModel):
    id: str
    topic_id: str
    items: list
    source: str
    title: str
    comments: list
    done: bool
    created_on: float
    modified_on: float

class TopicUpdateRequest(BaseModel):
    id: str
    frequency: str = None
    items:list = None
    last_extraction_epoch:int = None
    topic_name: str = None
    topic_type: str = None

class TopicItem(BaseModel):
    item_name: str   
    item_type: str
    value_type: str 
    num_values: int = 1
      

class Topic(BaseModel):
    user: str
    frequency: str = Field(..., description="Frequency of the topic", example="hourly")  # Dropdown choices
    items: List[TopicItem]
    topic_name: str
    topic_type: str  # Dropdown choices
    is_multi_item: bool

class UserCreate(BaseModel):
    username: str
    password: str
    code: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class JournalUpdateRequest(BaseModel):
    id: str
    updated_text: str

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
def get_current_user(token: str = Depends(oauth2_scheme)):
    """Authenticate the user from the token"""
    try:
        payload = jwt.decode(token, main_app.settings.ZAIA_SECRET_KEY, algorithms=[main_app.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username  # Or return a user object if needed
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
app = FastAPI()
main_app = MainApp()

router = APIRouter(dependencies=[Depends(get_current_user)])


# API Endpoints
@app.post("/signup")
def signup(user: UserCreate):
    code = main_app.settings.LOGIN_CODE
    if user.code != code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to create user",
        )
    if main_app.get_user(user.username):
        raise HTTPException(status_code=400, detail="User already exists")
    
    return main_app.create_user(user.username, user.password)

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = main_app.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token = main_app.create_access_token(data={"sub": user["username"]})
    refresh_token = main_app.create_refresh_token(user["username"])
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

@app.put("/update_password")
def update_password(user: UserCreate):
    code = main_app.settings.LOGIN_CODE
    if user.code != code:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to change the password",
        )
    result = main_app.update_password(user.username, user.password)
    if len(result)==0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to change the password",
        )
    
    return result

@router.get("/items/")
def get_items(user: str, search_term: str=None, topic_id: str = None, is_marked: bool = None, only_with_comments: bool = None):
    """Fetch items from the database based on a search term."""
    return main_app.get_items(user = user,
                              search_term= search_term, 
                              topic_id = topic_id, 
                              is_marked = is_marked,
                              only_with_comments = only_with_comments)

@router.get("/multi_items/")
def get_multi_items(user: str, search_term: str=None, topic_id: str = None, is_marked: bool = None):
    """Fetch items from the database based on a search term."""
    return main_app.get_multi_items(user = user,
                              search_term= search_term, 
                              topic_id = topic_id, 
                              is_marked = is_marked)

@router.get("/items_old/")
def get_items_old(user: str, search_term: str=None, topic_id: int = None, is_marked: bool = None, only_with_comments: bool = None):
    """Fetch items from the database based on a search term."""
    return main_app.get_items(user = user,
                              search_term= search_term, 
                              topic_id = topic_id, 
                              is_marked = is_marked,
                              only_with_comments = only_with_comments)

@router.put("/update_comment/")
def update_comment(request: CommentUpdateRequest):
    """Update a comment for a specific id."""
    main_app.update_comment(request.id, request.comments)
    return {"status": "Comment updated successfully"}

@router.put("/update_journal_item/")
def update_journal_item(request: JournalUpdateRequest):
    """Update a journal for a specific id."""
    main_app.update_journal_item(request.id, request.updated_text)
    return {"status": "Journal updated successfully"}

@router.put("/update_done/")
def update_done(request: DoneUpdateRequest):
    """Mark tasks as done."""
    main_app.update_done(request.id, request.is_done)
    return {"status": "Task marked as done"}

@router.on_event("shutdown")
def shutdown_event():
    """Close database connection when the API shuts down."""
    main_app.closeConnection()


# Path to the folder containing MP3 files
MP3_FOLDER = os.path.join(os.path.dirname(__file__), "All")

@router.get("/download_mp3/{mp3_file}")
def download_mp3(mp3_file: str):
    s3_client = boto3.client(
    "s3",
    aws_access_key_id=main_app.settings.S3_ACCESS_KEY,
    aws_secret_access_key=main_app.settings.S3_SECRET_KEY,
    region_name=main_app.settings.S3_REGION,
)
    try:
        # Try to retrieve the file from S3
        response = s3_client.get_object(Bucket=main_app.settings.S3_BUCKET_NAME, Key=f"All/{mp3_file}")
        
        # Get the file content and create a BytesIO object to stream it
        file_content = response['Body'].read()
        file_stream = BytesIO(file_content)
        
        # Return the file as a streaming response
        return StreamingResponse(file_stream, media_type="audio/mpeg", headers={"Content-Disposition": f"attachment; filename={mp3_file}"})
    
    except s3_client.exceptions.NoSuchKey:
        # If the file does not exist in S3, raise a 404 error
        raise HTTPException(status_code=404, detail="File not found in S3")

@router.get("/journals/")
def get_journals(user: str = ""):
    """Fetch journals from the database based on a user."""
    return main_app.get_journals(user)    

@router.get("/topics/")
def get_topics(topic_type: str = "", user: str = ""):
    """Fetch topics from the database based on a type and user."""
    return main_app.get_topics(topic_type, user)

@router.get("/all_topics/")
def get_all_topics():
    """Fetch topics from the database based on a type and user."""
    return main_app.get_all_topics()

@router.post("/insert_items/")
def insert_items(items: list[Item]):
    """Insert  items for a specific source."""
    items_dict = [item.model_dump() for item in items]
    items_dict_with_isDeleted = [{**item, **{'is_deleted': False}} for item in items_dict] 
    main_app.insert_items(items_dict_with_isDeleted)
    return {"status": "Items updated successfully"}

@router.post("/insert_multi_items/")
def insert_multi_items(items: list[MultiItem]):
    """Insert multi items"""
    items_dict = [item.model_dump() for item in items]
    items_dict_with_isDeleted = [{**item, **{'is_deleted': False}} for item in items_dict] 
    main_app.insert_multi_items(items_dict_with_isDeleted)
    return {"status": "Items updated successfully"}

@router.put("/update_topic/")
def update_topic(request: TopicUpdateRequest):
    """Update a topic for a specific topic id."""
    main_app.update_topic(id= request.id,
                          frequency=request.frequency,
                          items = request.items,
                          last_extraction_epoch=request.last_extraction_epoch,
                          topic_name = request.topic_name,
                          topic_type = request.topic_type

                            )
    return {"status": "Topic updated successfully"}

@router.put("/mark_for_reading/")
def mark_for_reading(request: MarkedUpdateRequest):
    """Mark tasks as done."""
    main_app.update_marked(request.id, request.is_marked)
    return {"status": "Task marked"}

@router.post("/insert_topic/")
def insert_topic(topic:Topic):
    """Insert  topic """
  
    topic_dic = topic.model_dump()

    now = time.time()
    topic_dic['id']= str(uuid.uuid4())
    topic_dic['created_on'] =  int(now)
    topic_dic['modified_on'] = int(now)
    topic_dic['is_deleted'] = False
    main_app.insert_topic(topic_dic)
    return {"status": "Items updated successfully"}


@router.put("/delete_item/")
def delete_item(id: str):
    """delete_item."""
    main_app.delete_item(id, is_multi_item=False)
    return {"status": "Item deleted"}

@router.put("/delete_multi_item/")
def delete_multi_item(id: str):
    """delete_item."""
    main_app.delete_item(id, is_multi_item=True)
    return {"status": "Item deleted"}

@router.put("/delete_topic/")
def delete_topic(id: str):
    """delete_topic."""
    main_app.delete_topic(id)
    return {"status": "Topic deleted"}

@router.put("/delete_journal_item/")
def delete_journal_item(id: str):
    """delete_topic."""
    main_app.delete_journal_item(id)
    return {"status": "Journal deleted"}

@router.put("/upload_audio/")
async def upload_audio(user: str = Form(...), audio: UploadFile = File(...)):
    try:
        audio_data = await audio.read()
        
        response = main_app.speech_to_text(user, audio_data)
        print(response)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/refresh")
def refresh_access_token(request: RefreshTokenRequest):
    username = main_app.validate_refresh_token(request.refresh_token)
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    
    new_access_token = main_app.create_access_token(
        data={"sub": username}
    )
    
    return {"access_token": new_access_token, "token_type": "bearer"}


app.include_router(router)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000)