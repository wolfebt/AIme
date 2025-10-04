import os
import base64
from playwright.sync_api import sync_playwright, expect, Page

def create_dummy_image(path: str):
    """Creates a small dummy PNG file for uploading."""
    # A base64 encoded 1x1 blue pixel
    blue_pixel_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    with open(path, "wb") as f:
        f.write(base64.b64decode(blue_pixel_base64))
    print(f"Created dummy image at {path}")

def verify_all_imaging_functions(page: Page):
    """
    This script verifies the entire imaging workflow:
    1. Mocks and verifies image generation.
    2. Verifies the save image functionality.
    3. Verifies the load image functionality.
    """
    # --- 1. Test Mocked Image Generation ---
    red_pixel_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg=="
    mock_image_url = f"data:image/png;base64,{red_pixel_base64}"

    def handle_route(route):
        response = {"imageUrl": mock_image_url, "revisedPrompt": "mocked prompt"}
        route.fulfill(status=200, content_type="application/json", body=str(response).replace("'", '"'))

    page.route("**/api/image", handle_route)

    page.goto('http://127.0.0.1:5001/pages/imaging.html')

    prompt_textarea = page.locator("#main-prompt")
    expect(prompt_textarea).to_be_visible()
    prompt_textarea.fill("a test prompt")

    generate_button = page.locator("#generate-button")
    generate_button.click()

    image_element = page.locator('#image-container img')
    expect(image_element).to_be_visible(timeout=10000)
    expect(image_element).to_have_attribute('src', mock_image_url)
    print("Generation test passed.")

    # --- 2. Test Save Image Functionality ---
    # Listen for the download event
    with page.expect_download() as download_info:
        # Click the save button in the main controls
        page.locator("#save-button").click()

    download = download_info.value
    assert download.suggested_filename == "a_test_prompt.png"
    print(f"Save test passed. Suggested filename: {download.suggested_filename}")

    # --- 3. Test Load Image Functionality ---
    dummy_image_path = os.path.join(os.getcwd(), 'jules-scratch', 'verification', 'dummy_image.png')
    create_dummy_image(dummy_image_path)

    # Listen for the file chooser event
    with page.expect_file_chooser() as fc_info:
        page.locator("#load-button").click()
    file_chooser = fc_info.value
    file_chooser.set_files(dummy_image_path)

    # Assert that the new (blue pixel) image is displayed
    # The src will be a new base64 string for the blue pixel
    expect(image_element).to_be_visible()
    expect(image_element).to_have_attribute('src', re.compile(r'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='))
    print("Load test passed.")

    # --- Final Screenshot ---
    screenshot_path = os.path.join(os.getcwd(), 'jules-scratch', 'verification', 'imaging_fixes_verification.png')
    page.screenshot(path=screenshot_path)
    print(f"Final verification screenshot saved to {screenshot_path}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_all_imaging_functions(page)
        browser.close()

if __name__ == "__main__":
    # Add re import for the main script execution
    import re
    main()