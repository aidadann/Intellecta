import fitz
import re

def extract_text_from_pdf(pdf_bytes: bytes, pages_per_chunk=2) -> list:
    """
    Extracts text from a PDF file in chunks of pages.
    Returns a list of strings, where each string is the text of a chunk.
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        chunks = []
        current_chunk_text = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            
            # Basic cleaning
            text = re.sub(r'\n+', '\n', text)
            text = re.sub(r' +', ' ', text)
            
            current_chunk_text.append(text.strip())
            
            if (page_num + 1) % pages_per_chunk == 0:
                chunks.append("\n\n--- PAGE BREAK ---\n\n".join(current_chunk_text))
                current_chunk_text = []
                
        # Append remaining pages
        if current_chunk_text:
            chunks.append("\n\n--- PAGE BREAK ---\n\n".join(current_chunk_text))
            
        doc.close()
        
        if not chunks:
            return ["No text found in document."]
            
        return chunks
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")
