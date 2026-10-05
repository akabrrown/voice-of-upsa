import fitz # PyMuPDF
import json

doc = fitz.open("public/students-handbook-2018.pdf")
pages = []

for i in range(len(doc)):
    page = doc.load_page(i)
    text = page.get_text("text")
    pages.append({
        "pageNumber": i + 1,
        "content": text
    })

with open("public/handbook_data.json", "w", encoding="utf-8") as f:
    json.dump(pages, f, ensure_ascii=False, indent=2)

print("Saved to public/handbook_data.json")
