import fitz  # PyMuPDF
import re

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts structured text from a PDF file provided as bytes.
    Maintains logical document flow and cleans up extra whitespace.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text_content = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        # Using "blocks" or raw text. Raw text is often fine if we just want content for LLM.
        # "text" extracts raw text.
        text = page.get_text("text")
        
        # Clean up some common PDF artifacts
        text = re.sub(r'\n+', '\n', text) # Remove multiple newlines
        text = re.sub(r' +', ' ', text)   # Remove multiple spaces
        text_content.append(text.strip())
        
    doc.close()
    
    return "\n\n".join(text_content)
