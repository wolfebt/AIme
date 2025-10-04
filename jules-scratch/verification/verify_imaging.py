import os
from playwright.sync_api import sync_playwright, expect, Page
import re

def verify_imaging_page(page: Page):
    """
    This script verifies the imaging page functionality.
    1. Navigates to the imaging page.
    2. Sets a dummy API key in localStorage.
    3. Enters a prompt.
    4. Clicks the generate button.
    5. Waits for the placeholder image to be displayed.
    6. Takes a screenshot.
    """
    # 1. Navigate to the page
    page.goto('http://127.0.0.1:5001/pages/imaging.html')

    # 2. Set localStorage *after* navigation
    page.evaluate("() => localStorage.setItem('AIME_API_KEY', 'DUMMY_KEY')")

    # 3. Enter a prompt
    prompt_textarea = page.locator("#main-prompt")
    expect(prompt_textarea).to_be_visible()
    prompt_textarea.fill("a futuristic cityscape at sunset, epic, cinematic lighting")

    # 4. Click the generate button
    generate_button = page.locator("#generate-button")
    generate_button.click()

    # 5. Wait for the placeholder image to appear
    image_element = page.locator('#image-container img')
    expect(image_element).to_be_visible(timeout=10000)
    expect(image_element).to_have_attribute('src', re.compile(r'https://placehold\.co/.*'))

    # 6. Take a screenshot
    # Define the path inside the function where it's used
    current_dir = os.getcwd()
    screenshot_path = os.path.join(current_dir, 'jules-scratch', 'verification', 'imaging_verification.png')
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_imaging_page(page)
        browser.close()

if __name__ == "__main__":
    main()