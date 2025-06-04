system_message_explain = 'You are helpful assistent who provides detailed summarization and explanation of the text.'
prompt_short_summary = '''Summarize the text below taken from a webpage. 
    Your response should be short and take into account only the key points from the text.
    Do not include in the summary standard links from the web page, as subscribe, contact, about and son on. Focus only on the main text from the web page.
    Here is the text:
    {text}
    '''
prompt_medium_summary = '''Summarize and explain the text below taken from a webpage. 
    Your response should be longer than a summary but at least 10 times shorter than the text from the link.
    Do not include in the summary standard links from the web page, as subscribe, contact, about and son on. Focus only on the main text from the web page.
    Here is the text:
    {text}
    '''
prompt_long_summary = '''Summarize in details and explain the text below taken from a webpage. 
    Your response should include details about the text, not just summarization. 
    Do not include in the summary standard links from the web page, as subscribe, contact, about and son on. Focus only on the main text from the web page.
    Here is the text:
    {text}
    '''
prompt_midium_summary_combine = '''Here is the summary from the previous part of the text and the new text.
Summarize and explain both texts below. 
    Your response should be longer than a summary but at least 10 times smaller than the text.
    Do not include in the summary standard links from the web page, as subscribe, contact, about and son on. Focus only on the main text from the web page.
    Here is the summary from previous text:
    {summary}
    Here is the new text:
    {subtext}
    '''
system_message_extract = 'You are helpful assistent who provides extractions from the provided text in json format.'

prompts_dict = {
    "short summary": prompt_short_summary,
    "medium summary": prompt_medium_summary,
    "long summary": prompt_long_summary,
    "explain": prompt_medium_summary,
}