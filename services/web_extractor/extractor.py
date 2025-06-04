import requests
from bs4 import BeautifulSoup

import logging

from services.web_extractor.prompts import *
from services.web_extractor.llm_wrappers import OpenAILLMWrapper

class ItemExtractor:
    def __init__(self, apikey_llm):
        self.model_engine = 'gpt-4o-mini'
        self.logger = self.setLogger()
        self.llm_wrapper = OpenAILLMWrapper(api_key =apikey_llm)
        

    def setLogger(self):
        log = logging.getLogger('Zaia_ItemExtractor')
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
    
  

    
    def extract_single_item_from_url(self, url, item_type, return_full_text=False):
        self.logger.info(url)
        text = self.get_text(url)
        if len(text)==0:
            self.logger.error('Text was not extracted')
            return None, ""
        summary = self.get_summary(text, item_type)
        if return_full_text:
            return summary, text
        else:
            return summary, ""
    
    def extract_multiple_items_from_url(self, url, items, return_full_text=False):
        self.logger.info(url)
        text = self.get_text(url)
        if len(text)==0:
            self.logger.error('Text was not extracted')
            return None, ""
        item_extraction = self.extract_items(text, items)
        if return_full_text:
            return item_extraction, text
        else:
            return item_extraction, ""

    def get_text(self, url):
        if 'arxiv.org' in url:
            url = url.replace('pdf', 'html')
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        clean_text = ''
        try:
            response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
            response.raise_for_status()
            content = response.text
            soup = BeautifulSoup(content, "html.parser")
            clean_text = soup.get_text(separator="\n", strip=True)
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error: {e}")
        
        return clean_text
    
    def get_summary(self, text: str, type: str):
        answer = None
        limit = int(self.llm_wrapper.get_prompt_limit(self.model_engine))
        # if type == 'explain':
            # if len(text) > self.llm_wrapper.get_prompt_limit(self.model_engine):
            #     answer = self.split_and_combine_summary(text)
            # elif len(text) > 1000:
        prompt = prompts_dict[type].format(text=text[:limit])
        answer, _ = self.llm_wrapper.get_answer(system_message=system_message_explain,
                                                        prompt=prompt,
                                                        model_engine=self.model_engine)
            
        return answer

    def extract_items(self, text, items):
        items_names = [x['item_name'] for x in items]
        prompt = self.generate_prompt(text, items_names)
        extractions, _ = self.llm_wrapper.get_json(system_message=system_message_extract,
                                                      prompt=prompt,
                                                      model_engine=self.model_engine)
        return extractions
    
    
    def generate_prompt(self, text, items):
        """
        Generates a formatable prompt for extracting specified items from a text.
        
        Args:
            text (str): The input text containing the data.
            items (list): List of item names to extract.

        Returns:
            str: The formatted prompt.
        """
        text_items = "\n".join(f"- {item}" for item in items)

        # Generate a JSON template dynamically with placeholders
        json_structure = "{\n" + ",\n".join(f'  "{item}": "..."' for item in items) + "\n}"

        # Create the formatable prompt
        prompt_template = """Extract the following items from the given text and return them as a valid JSON object:
    {text_items}

    Text:
    \"\"\"
    {text}
    \"\"\"

    Output JSON:
    {json_structure}
    """

        # Format the prompt dynamically
        return prompt_template.format(text=text, text_items=text_items, json_structure=json_structure)
   
    def split_and_combine_summary(self, text: str):
   
        split_texts = []
        text_lenght = len(text)
        chunks = int(text_lenght/self.llm_wrapper.get_prompt_limit(self.model_engine)) + 1
        max_tokens = int(text_lenght/chunks)
        curren_index = 0
        for i in range (0, chunks):
            split_texts.append(text[i*max_tokens: (i+1)*max_tokens])
        # while curren_index+max_tokens <= text_lenght:
        #     index_of_new_line = text[curren_index+max_tokens-100:].find('\n')+(curren_index+max_tokens-100)+2
        #     split_texts.append(text[curren_index:index_of_new_line])
        #     curren_index = index_of_new_line
        # split_texts.append(text[curren_index:])
        sub_answer, _ = self.llm_wrapper.get_answer(system_message=system_message_explain,
                                                      prompt= prompt_medium_summary.format(text=split_texts[0]),
                                                      model_engine=self.model_engine)
        if sub_answer is None:
            return None
        for subtext in split_texts[1:]:
            sub_answer, _ = self.llm_wrapper.get_answer(system_message=system_message_explain,
                                                      prompt= prompt_midium_summary_combine.format(subtext=subtext, summary = sub_answer),
                                                      model_engine=self.model_engine)
            if sub_answer is None:
                return None
        
        return sub_answer