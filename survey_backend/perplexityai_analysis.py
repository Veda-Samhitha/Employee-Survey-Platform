import os
import json
from openai import OpenAI

# Load your real API key (from .env or environment)
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

client = OpenAI(
    api_key=PERPLEXITY_API_KEY,
    base_url="https://api.perplexity.ai"
)

def analyze_submission(submission_id: str, responses: dict):
    text_parts = []
    if isinstance(responses, dict):
        for key, value in responses.items():
            if isinstance(value, dict):
                for nested_key, nested_value in value.items():
                    if isinstance(nested_value, str):
                        text_parts.append(f"{nested_key}: {nested_value}")
            elif isinstance(value, str):
                text_parts.append(f"{key}: {value}")

    text_feedback = " ".join(text_parts)

    prompt = f"""
    Analyze the following employee feedback for emotional tone and stress levels:

    Feedback: {text_feedback}

    Return valid JSON only with keys:
    emotional_tone, stress_level, burnout_risk, key_concerns, sentiment_score
    """

    try:
        response = client.chat.completions.create(
            model="sonar-pro",
            messages=[
                {"role": "system", "content": "Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )

        response_text = response.choices[0].message.content.strip()
        response_text = response_text.replace("```json", "").replace("```", "").strip()
        analysis = json.loads(response_text)

        return {
            "submission_id": submission_id,
            "analysis": analysis,
            "processed_at": "2025-11-04T12:00:00+05:30",
            "ai_model": "sonar-pro",
            "original_feedback": text_feedback
        }

    except Exception as e:
        print(f"Error during analysis: {e}")
        return {
            "sentiment": "Neutral",
            "burnout_risk": "Low",
            "full_analysis_json": '{"status": "AI analysis failed"}'
        }
