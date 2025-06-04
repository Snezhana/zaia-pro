import boto3

import io
import logging

class AmazonTextToSpeech:
    def __init__(self, access_key, secret_key, region, bucket_name):
        self.logger = self.setLogger()
        self.polly_client = boto3.client(
            "polly",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region,
        )
        self.bucket_name = bucket_name

    def setLogger(self):
        log = logging.getLogger('Zaia_AmazonTextToSpeech')
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
    def synthesize_and_upload_to_s3(self, text: str, mp3_filepath: str):
        # Request speech synthesis from Polly
        response = self.polly_client.synthesize_speech(
            Text=text, 
            OutputFormat="mp3", 
            Engine='standard', 
            VoiceId="Joanna"
        )
        
        # Retrieve the audio stream from Polly response
        audio_stream = response['AudioStream']
        
        # Use BytesIO to hold the MP3 data in memory
        audio_data = io.BytesIO(audio_stream.read())
        
        # Upload the MP3 file directly from memory to S3
        self.s3_client.upload_fileobj(audio_data, self.bucket_name, mp3_filepath)
        self.logger.info(f"MP3 file uploaded to S3: {self.bucket_name}/{mp3_filepath}")