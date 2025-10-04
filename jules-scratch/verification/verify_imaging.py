import os
import re
from playwright.sync_api import sync_playwright, expect, Page

def verify_imaging_page_with_mock(page: Page):
    """
    This script verifies the imaging page's frontend logic by mocking the API response.
    1. Sets up a mock route for the /api/image endpoint.
    2. Navigates to the imaging page.
    3. Enters a prompt and clicks generate.
    4. Asserts that the frontend correctly displays the mocked image data.
    5. Takes a screenshot.
    """
    # A base64 encoded 1x1 red pixel
    red_pixel_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg=="
    mock_image_url = f"data:image/png;base64,{red_pixel_base64}"

    # 1. Set up the mock route before navigating
    def handle_route(route):
        print(f"Intercepted request to {route.request.url}")
        response = {
            "imageUrl": mock_image_url,
            "revisedPrompt": "mocked prompt"
        }
        route.fulfill(
            status=200,
            content_type="application/json",
            body=str(response).replace("'", '"') # Ensure valid JSON
        )

    page.route("**/api/image", handle_route)

    # 2. Navigate to the page
    page.goto('http://127.0.0.1:5001/pages/imaging.html')

    # Set a dummy API key so the frontend doesn't block the request
    page.evaluate("() => localStorage.setItem('AIME_API_KEY', 'DUMMY_KEY')")

    # 3. Enter a prompt and click generate
    prompt_textarea = page.locator("#main-prompt")
    expect(prompt_textarea).to_be_visible()
    prompt_textarea.fill("a test prompt that will be ignored by the mock")

    generate_button = page.locator("#generate-button")
    generate_button.click()

    # 4. Assert that the mocked image is displayed
    image_element = page.locator('#image-container img')
    expect(image_element).to_be_visible(timeout=10000)
    expect(image_element).to_have_attribute('src', mock_image_url)

    # 5. Take a screenshot for visual verification
    current_dir = os.getcwd()
    screenshot_path = os.path.join(current_dir, 'jules-scratch', 'verification', 'imaging_verification_live.png')
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_imaging_page_with_mock(page)
        browser.close()

if __name__ == "__main__":
    main()