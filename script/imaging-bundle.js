/*
    File: imaging-bundle.js
    Reference: Imaging Studio Logic
    Creator: Wolfe.BT, TangentLLC
*/

// --- Resizable Columns ---
function initializeResizableColumns() {
    const workspace = document.querySelector('.workspace-layout');
    if (!workspace) return;

    const mainColumn = workspace.querySelector('.main-column');
    const sideColumn = workspace.querySelector('.side-column');
    const resizeHandle = workspace.querySelector('.resize-handle');

    if (!mainColumn || !sideColumn || !resizeHandle) return;

    let isResizing = false;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.body.style.cursor = 'default';
            resizeHandle.classList.remove('resizing');
        });
        document.body.style.cursor = 'col-resize';
        resizeHandle.classList.add('resizing');
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        const containerRect = workspace.getBoundingClientRect();
        const newLeftWidth = e.clientX - containerRect.left;
        let newLeftPercent = (newLeftWidth / containerRect.width) * 100;

        newLeftPercent = Math.max(20, Math.min(80, newLeftPercent));

        mainColumn.style.width = `calc(${newLeftPercent}% - 2px)`;
        sideColumn.style.width = `calc(${100 - newLeftPercent}% - 2px)`;
    }
}

// --- Asset Hub Importer ---
let loadedAssets = [];

function initializeAssetImporter() {
    const importBtn = document.getElementById('import-asset-btn');
    const fileInput = document.getElementById('asset-upload');

    if (!importBtn || !fileInput) return;

    importBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (!files.length) return;

        for (const file of files) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const assetData = {
                    id: `asset-${Date.now()}-${Math.random()}`,
                    fileName: file.name,
                    content: e.target.result,
                    importance: 'Typical',
                    annotation: ''
                };

                const extension = file.name.split('.').pop().toLowerCase();
                const aimeExtensions = ['persona', 'world', 'setting', 'scene', 'species', 'philosophy', 'technology', 'universe'];

                if (file.type.startsWith('image/')) {
                    assetData.type = 'image';
                } else if (aimeExtensions.includes(extension) || file.name.endsWith('.json')) {
                    assetData.type = 'json';
                } else {
                    assetData.type = 'text';
                }

                loadedAssets.push(assetData);
                renderAssetList();
            };

            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        }
        event.target.value = null;
    });
}

function renderAssetList() {
    const assetList = document.getElementById('asset-list');
    if (!assetList) return;

    assetList.innerHTML = '';

    loadedAssets.forEach(asset => {
        const assetItem = document.createElement('div');
        assetItem.className = 'asset-item';

        let iconHtml;
        let typeClass = '';

        if (asset.type === 'image') {
            iconHtml = `<img src="${asset.content}" class="asset-thumbnail" alt="${asset.fileName}">`;
            typeClass = 'image-asset';
        } else if (asset.type === 'json') {
            let parsedContent = {};
            try {
                parsedContent = JSON.parse(asset.content);
            } catch (e) {
                console.error(`Failed to parse JSON for asset ${asset.fileName}:`, e);
            }
            const assetType = parsedContent.assetType || 'JSON';
            const isAimeAsset = !!parsedContent.assetType;
            iconHtml = isAimeAsset ? assetType.slice(0, 4) : 'JSON';
            typeClass = isAimeAsset ? 'aime-asset' : 'text-asset';
        } else {
            iconHtml = 'TXT';
            typeClass = 'text-asset';
        }

        const iconSpan = typeClass === 'image-asset' ? iconHtml : `<span class="${typeClass === 'aime-asset' ? 'asset-icon-aime' : 'asset-icon-text'}">${iconHtml}</span>`;

        assetItem.innerHTML = `
            <div class="asset-main-info">
                <div class="asset-info">
                    ${iconSpan}
                    <span class="asset-name">${asset.fileName}</span>
                </div>
                <button class="remove-asset-btn" data-asset-id="${asset.id}">&times;</button>
            </div>
            <div class="asset-controls">
                <select class="asset-importance-selector" data-asset-id="${asset.id}">
                    <option value="Typical" ${asset.importance === 'Typical' ? 'selected' : ''}>Typical Importance</option>
                    <option value="High" ${asset.importance === 'High' ? 'selected' : ''}>High Importance</option>
                    <option value="Low" ${asset.importance === 'Low' ? 'selected' : ''}>Low Importance</option>
                    <option value="Non-Informative" ${asset.importance === 'Non-Informative' ? 'selected' : ''}>Non-Informative</option>
                </select>
                <input type="text" class="asset-annotation-input" data-asset-id="${asset.id}" value="${asset.annotation}" placeholder="Add a directorial note...">
            </div>
        `;
        assetList.appendChild(assetItem);
    });
}

document.addEventListener('click', (e) => {
    if (e.target.matches('.remove-asset-btn')) {
        const assetId = e.target.dataset.assetId;
        loadedAssets = loadedAssets.filter(asset => asset.id !== assetId);
        renderAssetList();
    }
});

document.addEventListener('change', e => {
    if (e.target.matches('.asset-importance-selector')) {
        const assetId = e.target.dataset.assetId;
        const asset = loadedAssets.find(a => a.id === assetId);
        if (asset) {
            asset.importance = e.target.value;
        }
    }
});

document.addEventListener('input', e => {
    if (e.target.matches('.asset-annotation-input')) {
        const assetId = e.target.dataset.assetId;
        const asset = loadedAssets.find(a => a.id === assetId);
        if (asset) {
            asset.annotation = e.target.value;
        }
    }
});

// --- Guidance Gems ---
let selectedGems = {};

const allGemsData = {
    "IMAGING": {
        "Style": ["Photorealistic", "Illustration", "Anime", "Cartoon", "3D Render", "Abstract", "Oil Painting", "Watercolor", "Pixel Art", "Art Deco", "Steampunk", "Cyberpunk"],
        "Composition": ["Close-up", "Medium Shot", "Long Shot", "Wide Angle", "Dutch Angle", "Symmetrical", "Asymmetrical", "Rule of Thirds", "Bird's Eye View", "Worm's Eye View"],
        "Lighting": ["Cinematic", "Soft Light", "Hard Light", "Golden Hour", "Blue Hour", "Backlit", "Studio Lighting", "Rim Lighting", "High Key", "Low Key"],
        "Color Palette": ["Vibrant", "Monochromatic", "Pastel", "Neon", "Muted", "Warm Tones", "Cool Tones", "Sepia", "Grayscale"],
        "Artist Influence": ["Ansel Adams", "H.R. Giger", "Studio Ghibli", "Greg Rutkowski", "Vincent van Gogh", "Salvador Dalí", "Alphonse Mucha"]
    }
};

let gemsData = {};

function initializeGuidanceGems() {
    const container = document.getElementById('guidance-gems-container');
    if (!container) return;

    const modalOverlay = document.getElementById('gem-selection-modal-overlay');
    const modalTitle = document.getElementById('gem-modal-title');
    const modalOptionsContainer = document.getElementById('gem-modal-options-container');
    const modalSaveBtn = document.getElementById('gem-modal-save-btn');
    const modalCloseBtn = document.getElementById('gem-modal-close-btn');
    const customGemInput = document.getElementById('custom-gem-input');
    const addCustomGemBtn = document.getElementById('add-custom-gem-btn');

    if (!modalOverlay || !modalTitle || !modalOptionsContainer || !modalSaveBtn || !modalCloseBtn || !customGemInput || !addCustomGemBtn) {
        return;
    }

    function addCustomGem() {
        const category = modalOverlay.dataset.currentCategory;
        const value = customGemInput.value.trim();
        if (!category || value === '') return;

        if (gemsData[category] && gemsData[category].map(v => v.toLowerCase()).includes(value.toLowerCase())) {
            customGemInput.value = '';
            return;
        }

        if (!gemsData[category]) {
            gemsData[category] = [];
        }
        gemsData[category].push(value);

        const button = document.createElement('button');
        button.className = 'gem-modal-option-button active';
        button.textContent = value;
        button.dataset.value = value;
        modalOptionsContainer.appendChild(button);
        customGemInput.value = '';
        customGemInput.focus();
    }

    function renderSelectedGems(category) {
        const categoryContainer = container.querySelector(`[data-category="${category}"]`);
        if (!categoryContainer) return;
        const pillContainer = categoryContainer.querySelector('.gem-pill-container');
        pillContainer.innerHTML = '';

        if (selectedGems[category] && selectedGems[category].length > 0) {
            selectedGems[category].forEach(gemText => {
                const pill = document.createElement('span');
                pill.className = 'gem-selected-pill';
                pill.textContent = gemText;
                pillContainer.appendChild(pill);
            });
        } else {
            pillContainer.innerHTML = `<span class="gem-selected-placeholder">None selected</span>`;
        }
    }

    function openGemsModal(category) {
        modalTitle.textContent = `Select ${category}`;
        modalOptionsContainer.innerHTML = '';
        modalOverlay.dataset.currentCategory = category;

        const options = gemsData[category] || [];
        const currentSelections = selectedGems[category] || [];

        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'gem-modal-option-button';
            button.textContent = option;
            button.dataset.value = option;
            if (currentSelections.includes(option)) {
                button.classList.add('active');
            }
            modalOptionsContainer.appendChild(button);
        });

        customGemInput.value = '';
        modalOverlay.classList.remove('hidden');
        customGemInput.focus();
    }

    function closeGemsModal() {
        modalOverlay.classList.add('hidden');
    }

    function saveGemsSelection() {
        const category = modalOverlay.dataset.currentCategory;
        if (!category) return;
        const selectedButtons = modalOptionsContainer.querySelectorAll('.gem-modal-option-button.active');
        selectedGems[category] = Array.from(selectedButtons).map(btn => btn.dataset.value);
        renderSelectedGems(category);
        closeGemsModal();
    }

    const generateButton = document.getElementById('generate-button');
    const elementType = generateButton ? generateButton.dataset.elementType : 'IMAGING';
    gemsData = { ...allGemsData[elementType] };

    container.innerHTML = '';
    for (const category of Object.keys(gemsData)) {
        selectedGems[category] = [];
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'gem-category-container';
        categoryContainer.dataset.category = category;
        categoryContainer.innerHTML = `
            <button class="gem-category-button">${category}</button>
            <div class="gem-pill-container">
                <span class="gem-selected-placeholder">None selected</span>
            </div>
        `;
        container.appendChild(categoryContainer);
    }

    container.addEventListener('click', e => {
        if (e.target.matches('.gem-category-button')) {
            const category = e.target.closest('.gem-category-container').dataset.category;
            openGemsModal(category);
        }
    });

    modalSaveBtn.addEventListener('click', saveGemsSelection);
    modalCloseBtn.addEventListener('click', closeGemsModal);
    modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) closeGemsModal();
    });

    modalOptionsContainer.addEventListener('click', e => {
        if (e.target.matches('.gem-modal-option-button')) {
            e.target.classList.toggle('active');
        }
    });

    addCustomGemBtn.addEventListener('click', addCustomGem);
    customGemInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomGem();
        }
    });
}

// --- Image Generation ---
function gatherPageContext() {
    const mainPrompt = document.getElementById('main-prompt').value.trim();

    let context = {
        prompt: mainPrompt,
        gems: [],
        assets: loadedAssets
    };

    for (const category in selectedGems) {
        if (selectedGems[category].length > 0) {
            context.gems.push(...selectedGems[category]);
        }
    }

    return context;
}


async function generateImage() {
    const button = document.getElementById('generate-button');
    const imageDisplayArea = document.getElementById('image-display-area');
    const imageToolbar = document.getElementById('image-toolbar');

    const context = gatherPageContext();
    if (!context.prompt) {
        showToast("Please enter a prompt to generate an image.", "error");
        return;
    }

    button.disabled = true;
    button.textContent = 'Generating...';
    imageDisplayArea.innerHTML = `
        <div class="loading-indicator">
            <div class="loading-spinner"></div>
            <p class="loading-text">AIME is dreaming up your image...</p>
        </div>`;
    imageToolbar.classList.add('hidden');

    try {
        const response = await fetch('http://127.0.0.1:5001/api/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(context)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.imageUrl) {
            imageDisplayArea.innerHTML = `<img src="${result.imageUrl}" alt="${result.revisedPrompt || context.prompt}">`;
            imageToolbar.classList.remove('hidden');
        } else {
            throw new Error("API response did not contain an image URL.");
        }

    } catch (error) {
        console.error('Error generating image:', error);
        imageDisplayArea.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Generate';
    }
}

function saveImage() {
    const imageDisplayArea = document.getElementById('image-display-area');
    const imageElement = imageDisplayArea.querySelector('img');

    if (!imageElement || !imageElement.src.startsWith('data:image')) {
        showToast("No generated image to save.", "error");
        return;
    }

    const link = document.createElement('a');
    link.href = imageElement.src;

    const prompt = document.getElementById('main-prompt').value.trim();
    const filename = prompt ? `${prompt.replace(/[^a-z0-9]/gi, '_').slice(0, 50)}.png` : `aime-image-${Date.now()}.png`;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Image saved!");
}

function loadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = event => {
            const imageDisplayArea = document.getElementById('image-display-area');
            const imageToolbar = document.getElementById('image-toolbar');
            imageDisplayArea.innerHTML = `<img src="${event.target.result}" alt="${file.name}">`;
            imageToolbar.classList.remove('hidden');
            showToast("Image loaded successfully!");
        };
        reader.readAsDataURL(file);
    }

    input.click();
}

function initializeGenerationControls() {
    const generateButton = document.getElementById('generate-button');
    const newButton = document.getElementById('new-button');
    const saveButton = document.getElementById('save-button');
    const loadButton = document.getElementById('load-button');

    if (generateButton) {
        generateButton.addEventListener('click', generateImage);
    }

    if (newButton) {
        newButton.addEventListener('click', () => {
            document.getElementById('main-prompt').value = '';
            loadedAssets = [];
            renderAssetList();
            selectedGems = {};
            initializeGuidanceGems();
            document.getElementById('image-display-area').innerHTML = '<p class="placeholder-text">Your generated image will appear here.</p>';
            document.getElementById('image-toolbar').classList.add('hidden');
            showToast("Workspace cleared.");
        });
    }

    if (saveButton) {
        saveButton.addEventListener('click', saveImage);
    }

    if (loadButton) {
        loadButton.addEventListener('click', loadImage);
    }
}


// --- DOMContentLoaded Initializer ---
document.addEventListener('DOMContentLoaded', () => {
    // The modal HTML is not present on imaging.html yet. We need to add it.
    // For now, let's create it dynamically if it doesn't exist.
    if (!document.getElementById('gem-selection-modal-overlay')) {
        const modalHtml = `
        <div id="gem-selection-modal-overlay" class="modal-overlay hidden">
            <div class="modal-content glass-panel">
                <div class="modal-header">
                    <h3 id="gem-modal-title">Select Options</h3>
                    <button id="gem-modal-close-btn" class="modal-close-btn">&times;</button>
                </div>
                <div id="gem-modal-options-container" class="modal-body"></div>
                <div class="gem-modal-custom-input-area">
                    <input type="text" id="custom-gem-input" class="input-field" placeholder="Add a custom option...">
                    <button id="add-custom-gem-btn" class="action-btn">Add</button>
                </div>
                <div class="modal-footer">
                    <button id="gem-modal-save-btn" class="generate-btn-large">Save Selections</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    initializeResizableColumns();
    initializeGuidanceGems();
    initializeAssetImporter();
    initializeGenerationControls();
});