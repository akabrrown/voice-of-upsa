
import requests
from bs4 import BeautifulSoup
import sys

def inspect_meta(url):
    headers = {
        'User-Agent': 'WhatsApp/2.21.12.21 A'
    }
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        soup = BeautifulSoup(response.text, 'html.parser')
        
        print("\n--- Meta Tags in Head ---")
        for meta in soup.find_all('meta'):
            props = meta.attrs
            if 'property' in props or 'name' in props:
                print(f"{props}")
        
        print("\n--- Title ---")
        print(soup.title.string if soup.title else "No title tag")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        inspect_meta(sys.argv[1])
    else:
        inspect_meta("https://voiceofupsa.com/articles/beyond-the-lecture-hall-how-upsa-students-are-redefining-success")
