import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.auth
import google.auth.transport.requests

load_dotenv()

# Serve static files from the project root directory (one level up from /server)
app = Flask(__name__, static_folder='..', static_url_path='')
# Apply CORS to all routes, allowing all origins for the /api/ path
CORS(app, resources={r"/api/*": {"origins": "*"}})

# The target URL for the AI service, allowing for dynamic model selection
AI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/"

@app.route('/api/proxy', methods=['POST', 'OPTIONS'])
def proxy():
    if request.method == 'OPTIONS':
        # Handle preflight request
        return '', 200

    # Get the user's API key from the request header, if it exists
    user_api_key = request.headers.get('X-AIME-API-Key')

    # Get the default API key from environment variables
    default_api_key = os.getenv('API_KEY')

    # Use the user's key if provided, otherwise use the default key
    api_key_to_use = user_api_key or default_api_key

    if not api_key_to_use:
        return jsonify({"error": "API key is not configured on the server and was not provided by the user."}), 500

    # Get the JSON body from the incoming request
    request_data = request.get_json()

    # Extract the model from the request data, with a fallback
    model = request_data.pop('model', 'gemini-1.5-flash-latest')

    # Determine the correct endpoint based on the model name
    if 'imagen' in model:
        endpoint = 'predict'
    else:
        endpoint = 'generateContent'

    api_url = f"{AI_API_BASE_URL}{model}:{endpoint}"


    # Set up the headers for the request to the AI service
    headers = {
        'Content-Type': 'application/json',
    }

    # Set up the query parameters, including the API key
    params = {
        'key': api_key_to_use
    }

    try:
        # Forward the request to the AI service
        response = requests.post(api_url, params=params, headers=headers, json=request_data)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

        # Return the JSON response from the AI service to the client
        return jsonify(response.json()), response.status_code

    except requests.exceptions.RequestException as e:
        # Handle network errors or bad responses from the AI service
        error_message = f"Failed to connect to AI service: {e}"
        # Try to get more specific error info from the response if available
        try:
            error_details = e.response.json()
            error_message = error_details.get("error", {}).get("message", error_message)
        except (ValueError, AttributeError):
            pass # No JSON in response, stick with the original error.

        return jsonify({"error": error_message}), getattr(e.response, 'status_code', 500)

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        # Handle preflight request
        return '', 200

    data = request.get_json()
    message = data.get('message')
    context = data.get('context')

    if not message:
        return jsonify({"error": "Message is required."}), 400

    # Construct a more sophisticated prompt
    prompt = f"""
You are AIME, an AI co-author. Your goal is to assist a user in their creative writing project.
You must be helpful, encouraging, and provide insightful suggestions.
The user is currently working on the following part of their project:
---
{context}
---
The user's message is: "{message}"
Please provide a helpful and context-aware response.
"""

    # Get the user's API key from the request header, if it exists
    user_api_key = request.headers.get('X-AIME-API-Key')
    default_api_key = os.getenv('API_KEY')
    api_key_to_use = user_api_key or default_api_key

    if not api_key_to_use:
        return jsonify({"error": "API key not configured."}), 500

    # Use the latest gemini-1.5-flash model for chat
    model = "gemini-1.5-flash-latest"
    api_url = f"{AI_API_BASE_URL}{model}:generateContent"

    headers = {'Content-Type': 'application/json'}
    params = {'key': api_key_to_use}

    # Structure the request body for the AI service
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    try:
        response = requests.post(api_url, params=params, headers=headers, json=payload)
        response.raise_for_status()

        ai_response = response.json()

        # Extract the text from the response
        # The structure is response['candidates'][0]['content']['parts'][0]['text']
        chat_content = ai_response.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'Sorry, I could not generate a response.')

        return jsonify({"reply": chat_content})

    except requests.exceptions.RequestException as e:
        error_message = f"Failed to connect to AI service: {e}"
        return jsonify({"error": error_message}), 500
    except (KeyError, IndexError) as e:
        return jsonify({"error": "Failed to parse AI response."}), 500

@app.route('/api/image', methods=['POST', 'OPTIONS'])
def image():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.get_json()
    prompt = data.get('prompt')
    gems = data.get('gems', [])
    assets = data.get('assets', [])

    # --- Superprompt Crafting ---
    superprompt = prompt
    if gems:
        superprompt += ", " + ", ".join(gems)
    asset_info = [asset.get('fileName', 'unnamed asset') for asset in assets]
    if asset_info:
        superprompt += ", featuring elements from: " + ", ".join(asset_info)
    superprompt = ", ".join(filter(None, [s.strip() for s in superprompt.split(',')]))

    print(f"Crafted Superprompt for ImageGen: {superprompt}")

    # --- Authentication using google-auth ---
    try:
        credentials, project_id_from_auth = google.auth.default(scopes=['https://www.googleapis.com/auth/cloud-platform'])
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        access_token = credentials.token
    except google.auth.exceptions.DefaultCredentialsError:
        return jsonify({"error": "Google Cloud authentication failed. Please configure Application Default Credentials."}), 500

    # --- Image Model API Call ---
    project_id = os.getenv('GOOGLE_PROJECT_ID') or project_id_from_auth
    if not project_id:
        return jsonify({"error": "GOOGLE_PROJECT_ID is not configured on the server or found in credentials."}), 500

    api_url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/imagen@006:predict"

    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    payload = {
        "instances": [{"prompt": superprompt}],
        "parameters": {"sampleCount": 1}
    }

    try:
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()

        # Check for the 'error' key in the response, which Vertex AI sometimes sends on success status codes
        if 'error' in result:
             raise requests.exceptions.RequestException(result['error'].get('message', 'Unknown API error'))

        base64_image = result.get('predictions', [{}])[0].get('bytesBase64Encoded')

        if not base64_image:
            raise KeyError("Could not find 'bytesBase64Encoded' in API response.")

        image_url = f"data:image/png;base64,{base64_image}"

        return jsonify({
            "imageUrl": image_url,
            "revisedPrompt": superprompt
        })

    except requests.exceptions.RequestException as e:
        error_message = f"Failed to connect to AI service: {e}"
        try:
            # Attempt to parse a more specific error from the JSON response body
            error_details = response.json()
            error_message = error_details.get("error", {}).get("message", str(e))
        except (ValueError, AttributeError):
            # If parsing fails or response is not set, use the original exception message
             error_message = str(e)
        return jsonify({"error": error_message}), getattr(e, 'response', {}).get('status_code', 500)
    except (KeyError, IndexError) as e:
        return jsonify({"error": f"Failed to parse AI response: {e}"}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)