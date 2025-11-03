from openai import OpenAI
import json

client = OpenAI(
    api_key="PERPLEXITY_API_KEY",
    base_url="https://api.perplexity.ai"
)
def analyze_submission(submission_id: str, responses: dict):
    # Extract text feedback from responses
    text_parts = []
    
    # Handle nested response structure
    if isinstance(responses, dict):
        for key, value in responses.items():
            if isinstance(value, dict):
                # Extract nested values
                for nested_key, nested_value in value.items():
                    if isinstance(nested_value, str):
                        text_parts.append(f"{nested_key}: {nested_value}")
            elif isinstance(value, str):
                text_parts.append(f"{key}: {value}")
    
    text_feedback = " ".join(text_parts)
    
    # AI prompt for analysis
    prompt = f"""
    Analyze the following employee feedback for emotional tone and stress levels:
    
    Feedback: {text_feedback}
    
    Provide a JSON response with:
    1. emotional_tone: (positive/neutral/negative)
    2. stress_level: (0.0 to 1.0)
    3. burnout_risk: (low/medium/high)
    4. key_concerns: (list of main concerns as an array)
    5. sentiment_score: (-1.0 to 1.0)
    
    Return ONLY valid JSON format without any markdown or explanation.
    """
    
    try:
        response = client.chat.completions.create(
            model="sonar-pro",  # Perplexity's model
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert in analyzing employee wellbeing and burnout risk. Always respond with valid JSON only."
	   
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        # Extract and parse the response
        response_text = response.choices[0].message.content
        
        # Clean response if it contains markdown code blocks
        if '```json' in response_text:
            response_text = response_text.split('``````')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```').split('```')
            
        
        analysis = json.loads(response_text)
        
        # Add metadata
        analysis_result = {
            "submission_id": submission_id,
            "analysis": analysis,
            "processed_at": "2025-10-31T12:16:00+05:30",
            "ai_model": "sonar-pro",
            "original_feedback": text_feedback
        }
        
        print("Analysis Result:")
        print(json.dumps(analysis_result, indent=2))
        
        # Store results in database (implement this function)
        # save_analysis_to_db(submission_id, analysis_result)
        
        return analysis_result
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"Raw response: {response_text}")
        return None
    except Exception as e:
        print(f"Error during analysis: {e}")
        return None


