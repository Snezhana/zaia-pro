from typing import Protocol
import json

import openai
import logging

class LLMWrapper(Protocol):
    def get_answer(self, system_message, prompt, model_engine): pass
    def get_prompt_limit(self, model_engine): pass


class OpenAILLMWrapper(LLMWrapper):
    def __init__(self, api_key):
        self.logger = self.setLogger()
        openai.api_key = api_key

    def setLogger(self):
        log = logging.getLogger('Zaia_LLMWrapper')
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
    
    def get_answer(self, system_message, prompt, model_engine):
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]
        try:
            completion = openai.chat.completions.create(model=model_engine,
                                                    messages=messages,
                                                    temperature=0,
                                                    top_p=0.95,
                                                    frequency_penalty=0,
                                                    presence_penalty=0,
                                                    stop=None)
            answer = completion.choices[0].message.content
            usage = completion.usage
            return (answer, usage)
        except Exception as e:
            self.logger.error(e)
            return (None, None)
    
    def get_json(self, system_message, prompt, model_engine):
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]
        try:
            completion = openai.chat.completions.create(model=model_engine,
                                                    messages=messages,
                                                    temperature=0,
                                                    top_p=0.95,
                                                    frequency_penalty=0,
                                                    presence_penalty=0,
                                                    stop=None,
                                                    response_format={"type": "json_object"} 
                                                    )
            answer = completion.choices[0].message.content
            usage = completion.usage
            try:
                extracted_data = json.loads(answer)
                return (extracted_data, usage)

            except json.JSONDecodeError:
                self.logger.error("Failed to parse JSON response")
                return (None, None)
        
        except Exception as e:
            self.logger.error(e)
            return (None, None)       

    def get_prompt_limit(self, model_engine):
        if model_engine == 'gpt-4o-mini':
            return 128000*1.5
        