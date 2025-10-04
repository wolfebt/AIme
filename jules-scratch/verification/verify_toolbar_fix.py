import os
import base64
from playwright.sync_api import sync_playwright, expect, Page

def create_dummy_image(path: str):
    """Creates a small dummy PNG file for uploading."""
    blue_pixel_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    with open(path, "wb") as f:
        f.write(base64.b64decode(blue_pixel_base64))

def verify_toolbar_visibility(page: Page):
    """
    This script verifies that the image toolbar's visibility is correctly handled.
    1. Navigates to the imaging page.
    2. Verifies the toolbar is hidden initially.
    3. Mocks generation and verifies the toolbar becomes visible.
    4. Clicks "New" and verifies the toolbar is hidden again.
    5. Loads an image and verifies the toolbar is visible again.
    6. Takes a final screenshot.
    """
    # --- Setup ---
    red_pixel_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg=="
    mock_image_url = f"data:image/png;base64,{red_pixel_base64}"

    def handle_route(route):
        response = {"imageUrl": mock_image_url, "revisedPrompt": "mocked prompt"}
        route.fulfill(status=200, content_type="application/json", body=str(response).replace("'", '"'))

    page.route("**/api/image", handle_route)
    page.goto('http://127.0.0.1:5001/pages/imaging.html')

    toolbar = page.locator("#image-toolbar")

    # --- 1. Initial State ---
    expect(toolbar).to_be_hidden()
    print("Test 1 Passed: Toolbar is hidden on initial load.")

    # --- 2. Generate Image ---
    page.locator("#main-prompt").fill("a test prompt")
    page.locator("#generate-button").click()
    expect(toolbar).to_be_visible(timeout=10000)
    print("Test 2 Passed: Toolbar is visible after generating an image.")

    # --- 3. Clear Workspace ---
    page.locator("#new-button").click()
    expect(toolbar).to_be_hidden()
    print("Test 3 Passed: Toolbar is hidden after clicking 'New'.")

    # --- 4. Load Image ---
    dummy_image_path = os.path.join(os.getcwd(), 'jules-scratch', 'verification', 'dummy_image.png')
    create_dummy_image(dummy_image_path)

    with page.expect_file_chooser() as fc_info:
        page.locator("#load-button").click()
    file_chooser = fc_info.value
    file_chooser.set_files(dummy_image_path)

    expect(toolbar).to_be_visible()
    print("Test 4 Passed: Toolbar is visible after loading an image.")

    # --- Final Screenshot ---
    screenshot_path = os.path.join(os.getcwd(), 'jules-scratch', 'verification', 'toolbar_fix_verification.png')
    page.screenshot(path=screenshot_path)
    print(f"Final verification screenshot saved to {screenshot_path}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_toolbar_visibility(page)
        browser.close()

if __name__ == "__main__":
    main()