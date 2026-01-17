import sys
import os
import json
import uuid
from google import genai
from PyPDF2 import PdfReader

def extract_text(source):
    """
    Handles PDF files or raw text strings.
    """
    if source.lower().endswith('.pdf'):
        try:
            reader = PdfReader(source)
            text_parts = []
            for page in reader.pages:
                part = page.extract_text()
                if part:
                    text_parts.append(part)
            return " ".join(text_parts)
        except Exception as e:
            # Print to stderr so Node.js can capture the specific error
            sys.stderr.write(f"DEBUG: Error reading PDF: {str(e)}\n")
            return None
    return source

def run():
    """
    Main execution logic called by the Node.js Backend.
    Expected Arguments (sys.argv):
    1: Input Source (Path to PDF or Raw Text)
    2: Generation Type ('quiz' or 'flashcards')
    3: Target Directory (GenAI internal path: /app/Courses/...)
    4: Topic Label
    5: Item Count
    """
    
    # 1. Validate Arguments
    if len(sys.argv) < 6:
        print(json.dumps({"success": False, "error": "Insufficient arguments sent to Python."}))
        return

    input_source = sys.argv[1]
    gen_type = sys.argv[2]
    target_dir = sys.argv[3]
    topic_label = sys.argv[4]
    item_count = sys.argv[5]

    # 2. Extract and Validate Content
    content = extract_text(input_source)
    
    # Lowered threshold to 10 for testing flexibility
    if not content or len(content.strip()) < 10:
        print(json.dumps({"success": False, "error": "Source content too short or unreadable."}))
        return

    # 3. Initialize Gemini Client
    api_key = os.environ.get("GEMINI_KEY")
    if not api_key:
        print(json.dumps({"success": False, "error": "GEMINI_KEY missing in environment."}))
        return

    client = genai.Client(api_key=api_key)

    # 4. Construct Strict Prompts
    if gen_type == 'quiz':
        prompt = f"""
        Act as an academic professor. Generate a {item_count} question multiple choice quiz about '{topic_label}'.
        Use this source material: {content[:15000]}
        
        Return a JSON array where each object has:
        "question": string,
        "options": array of exactly 4 strings,
        "answer": string matching one of the options,
        "explanation": string
        """
    else:
        prompt = f"""
        Act as a study tutor. Generate {item_count} flashcards for '{topic_label}'.
        Use this source material: {content[:15000]}
        
        Return a JSON array where each object has:
        "front": string (concept),
        "back": string (definition)
        """

    # 5. AI Generation with JSON Enforcement
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",  # Ensure no 'models/' prefix
            contents=prompt,
            config={
                'response_mime_type': 'application/json'
            }
        )
        
        # Log the raw text to stderr for Docker visibility
        sys.stderr.write(f"DEBUG: Gemini Response Received.\n")
        
        generated_data = json.loads(response.text)

        # 6. File System Materialization (Scholar Drive)
        uid = f"ai-{uuid.uuid4().hex[:8]}"
        file_name = f"{uid}-{gen_type}.json"
        
        # Path for internal GenAI writing
        full_path_genai = os.path.join(target_dir, file_name)
        os.makedirs(target_dir, exist_ok=True)

        # Save to shared volume
        with open(full_path_genai, 'w', encoding='utf-8') as f:
            json.dump({
                "uid": uid,
                "title": f"✨ AI: {topic_label}",
                "data": generated_data 
            }, f, indent=2)

        # 7. Path Translation for Node.js
        # Node sees /usr/src/app/Courses while Python sees /app/Courses
        full_path_node = full_path_genai.replace('/app/Courses', '/usr/src/app/Courses')

        # 8. Success Output for Node.js
        print(json.dumps({
            "success": True,
            "uid": uid,
            "filePath": full_path_node,
            "data": generated_data 
        }))

    except Exception as e:
        sys.stderr.write(f"DEBUG: Gemini Execution Failure: {str(e)}\n")
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    run()