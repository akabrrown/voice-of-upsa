
from bs4 import BeautifulSoup

def inspect_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    print("--- Meta Tags ---")
    meta_tags = soup.find_all('meta')
    for tag in meta_tags:
        name = tag.get('name') or tag.get('property')
        content = tag.get('content')
        if name:
            print(f"{name}: {content}")
            
    print("\n--- Title ---")
    title = soup.find('title')
    print(title.text if title else "No title found")

if __name__ == "__main__":
    inspect_html('article_debug_3.html')
