import fitz # PyMuPDF
import json

doc = fitz.open("public/students-handbook-2018.pdf")
pages = []

for i in range(len(doc)):
    page = doc.load_page(i)
    blocks = page.get_text("blocks")
    
    # Filter only text blocks (type == 0)
    text_blocks = []
    for b in blocks:
        if b[6] == 0: # text block
            text = b[4].strip()
            if text:
                text_blocks.append(text)
    
    pages.append({
        "pageNumber": i + 1,
        "blocks": text_blocks
    })

with open("public/handbook_data.json", "w", encoding="utf-8") as f:
    json.dump(pages, f, ensure_ascii=False, indent=2)

print("Saved to public/handbook_data.json")
