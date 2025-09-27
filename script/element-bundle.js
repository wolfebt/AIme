/*
    File: element-bundle.js
    Reference: Element Pages Logic
    Creator: Wolfe.BT, TangentLLC
*/

// --- Resizable Columns ---
function initializeResizableColumns() {
    // This functionality is currently disabled in the initializer at the bottom
    // to ensure stability, but the code is here for future implementation.
    const workspace = document.querySelector('.workspace-layout');
    if (!workspace) return;

    const mainColumn = workspace.querySelector('.main-column');
    const sideColumn = workspace.querySelector('.side-column');
    const resizeHandle = workspace.querySelector('.resize-handle');

    let isResizing = false;

    if (!resizeHandle) return;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            resizeHandle.classList.remove('resizing');
        });
        resizeHandle.classList.add('resizing');
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        const containerRect = workspace.getBoundingClientRect();
        const newLeftWidth = e.clientX - containerRect.left;
        let newLeftPercent = (newLeftWidth / containerRect.width) * 100;
        newLeftPercent = Math.max(20, Math.min(80, newLeftPercent));
        mainColumn.style.width = `calc(${newLeftPercent}% - 6px)`;
        sideColumn.style.width = `calc(${100 - newLeftPercent}% - 6px)`;
    }
}


// --- Accordion Logic ---
function initializeAccordions() {
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach(accordion => {
        const header = accordion.querySelector('.accordion-header');
        const content = accordion.querySelector('.accordion-content');
        const chevron = header.querySelector('.accordion-chevron');
        if (!header || !content || !chevron) return;

        header.addEventListener('click', () => {
            const isOpen = header.classList.toggle('active');
            chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            if (isOpen) {
                content.style.padding = '1.5rem';
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
                content.style.padding = '0 1.5rem';
            }
        });
        if (header.classList.contains('active')) {
            content.style.padding = '1.5rem';
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
}

// --- Asset Hub Importer ---
function initializeAssetImporter() {
    const importBtn = document.getElementById('import-asset-btn');
    const fileInput = document.getElementById('asset-upload');
    const assetList = document.getElementById('asset-list');

    if (importBtn && fileInput && assetList) {
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (event) => {
            for (const file of event.target.files) {
                const extension = file.name.split('.').pop().toLowerCase();
                const aimeExtensions = ['persona', 'world', 'setting', 'scene', 'species', 'philosophy', 'technology'];

                if (aimeExtensions.includes(extension)) {
                    addAimeAssetToList(file, assetList);
                } else if (file.type.startsWith('image/')) {
                    addImageAssetToList(file, assetList);
                } else {
                    addTextAssetToList(file, assetList);
                }
            }
        });
    }
}

function addAimeAssetToList(file, assetList) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            const assetItem = document.createElement('div');
            assetItem.className = 'asset-item aime-asset';
            assetItem.dataset.assetData = JSON.stringify({ assetType: data.assetType, traits: data.traits });

            const assetType = data.assetType || 'AIME';
            const assetName = data.traits.name || file.name;

            assetItem.innerHTML = getAssetHTML(assetName, assetType.slice(0, 4), 'aime-asset');
            assetList.appendChild(assetItem);
            assetItem.querySelector('.remove-asset-btn').addEventListener('click', () => assetItem.remove());

        } catch (error) {
            console.error(`Could not parse AIME asset file: ${file.name}`, error);
            addTextAssetToList(file, assetList);
        }
    };
    reader.onerror = () => {
        console.error(`Could not read file: ${file.name}`);
        addTextAssetToList(file, assetList);
    };
    reader.readAsText(file);
}

function addTextAssetToList(file, assetList) {
    const assetItem = document.createElement('div');
    assetItem.className = 'asset-item text-asset';
    assetItem.innerHTML = getAssetHTML(file.name, 'TXT', 'text-asset');
    assetList.appendChild(assetItem);
    assetItem.querySelector('.remove-asset-btn').addEventListener('click', () => assetItem.remove());
}

function addImageAssetToList(file, assetList) {
    const assetItem = document.createElement('div');
    assetItem.className = 'asset-item image-asset';
    const imageURL = URL.createObjectURL(file);
    assetItem.innerHTML = getAssetHTML(file.name, `<img src="${imageURL}" class="asset-thumbnail" alt="${file.name}">`, 'image-asset');
    assetList.appendChild(assetItem);
    assetItem.querySelector('.remove-asset-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        assetItem.remove();
        URL.revokeObjectURL(imageURL);
    });
}

function getAssetHTML(name, iconHTML, typeClass) {
    const iconSpan = typeClass === 'image-asset' ? iconHTML : `<span class="${typeClass === 'aime-asset' ? 'asset-icon-aime' : 'asset-icon-text'}">${iconHTML}</span>`;
    return `
        <div class="asset-main-info">
            <div class="asset-info">
                ${iconSpan}
                <span class="asset-name">${name}</span>
            </div>
            <button class="remove-asset-btn">&times;</button>
        </div>
        <div class="asset-controls">
            <select class="asset-importance-selector">
                <option value="Typical">Typical Importance</option>
                <option value="High">High Importance</option>
                <option value="Low">Low Importance</option>
                <option value="Non-Informative">Non-Informative</option>
            </select>
            <input type="text" class="asset-annotation-input" placeholder="Add a directorial note...">
        </div>
    `;
}


// --- Guidance Gems ---
function initializeGuidanceGems() {
    const container = document.getElementById('guidance-gems-container');
    if (!container) return;

    const gemsData = {
        "Genre": ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Sci-Fi", "Horror", "Mystery", "Romance", "Thriller"],
        "Tone": ["Serious", "Humorous", "Formal", "Informal", "Optimistic", "Pessimistic", "Joyful", "Sad", "Hopeful", "Cynical"],
        "Pacing": ["Fast-paced", "Slow-burn", "Steady", "Urgent", "Relaxed", "Meditative"],
        "Point of View": ["First Person", "Third Person Limited", "Third Person Omniscient", "Second Person"],
        "Literary Devices": ["Metaphor", "Simile", "Personification", "Alliteration", "Symbolism", "Irony", "Foreshadowing"],
        "Structure": ["Linear", "Non-linear", "Episodic", "In Medias Res", "Frame Story"]
    };

    let html = '';
    for (const [title, options] of Object.entries(gemsData)) {
        html += `<div class="gem-category"><h4 class="gem-title">${title}</h4><div class="gem-options">`;
        options.forEach(option => {
            html += `<button class="gem-option">${option}</button>`;
        });
        html += `</div></div>`;
    }
    container.innerHTML = html;
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('gem-option')) {
            e.target.classList.toggle('active');
        }
    });
}

// --- Element Generation Logic ---
async function generateElementContent(button) {
    const elementType = button.dataset.elementType;
    const responseContainer = document.getElementById('response-container');
    
    const apiKey = localStorage.getItem('AIME_API_KEY');
    if (!apiKey) {
        alert('API Key not found. Please set it in the settings.');
        return;
    }

    button.disabled = true;
    button.textContent = 'Generating...';
    responseContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="loading-spinner"></div>
            <p class="loading-text">AIME is forging your Element...</p>
        </div>`;

    const superPrompt = craftSuperPrompt(elementType);
    
    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: superPrompt }] }] };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            responseContainer.innerHTML = `<div class="response-content">${text.replace(/\n/g, '<br>')}</div>`;
        } else {
            responseContainer.innerHTML = `<p class="error-text">Received an empty response from the AI.</p>`;
        }
    } catch (error) {
        console.error('Error generating content:', error);
        responseContainer.innerHTML = `<p class="error-text">An error occurred. Check the console for details.</p>`;
    } finally {
        button.disabled = false;
        button.textContent = 'Generate';
    }
}

function craftSuperPrompt(elementType) {
    let prompt = `You are AIME, an AI world-building assistant. The user wants to generate details for a "${elementType}" Element. Use the provided information to create a rich, detailed, and creative description.\n\n`;

    // --- 1. Current Element's Traits ---
    prompt += "--- PRIMARY ELEMENT: " + elementType + " ---\n";
    const inputs = document.querySelectorAll('.form-section .input-field');
    let hasPrimaryTraits = false;
    inputs.forEach(input => {
        const label = input.previousElementSibling ? input.previousElementSibling.textContent : input.id;
        if (input.value.trim()) {
            prompt += `${label}: ${input.value.trim()}\n`;
            hasPrimaryTraits = true;
        }
    });
    if (!hasPrimaryTraits) {
        prompt += "No specific traits provided for this element. Please generate creatively.\n";
    }

    // --- 2. Guidance Gems ---
    const activeGems = document.querySelectorAll('#guidance-gems-container .gem-option.active');
    if (activeGems.length > 0) {
        prompt += "\n--- GUIDANCE GEMS (STYLISTIC DIRECTION) ---\n";
        activeGems.forEach(gem => prompt += `- ${gem.textContent.trim()}\n`);
    }

    // --- 3. Contextual Assets with Importance and Annotations ---
    const assetItems = document.querySelectorAll('#asset-list .asset-item');
    if (assetItems.length > 0) {
        prompt += "\n--- CONTEXTUAL ASSETS (REFERENCE LORE) ---\n";
        assetItems.forEach(item => {
            const importance = item.querySelector('.asset-importance-selector')?.value || 'Typical';
            const annotation = item.querySelector('.asset-annotation-input')?.value.trim() || '';

            if (importance === 'Non-Informative') return; // Skip this asset entirely

            let assetEntry = '';
            if (item.classList.contains('aime-asset') && item.dataset.assetData) {
                try {
                    const data = JSON.parse(item.dataset.assetData);
                    assetEntry += `\n[Reference Asset: ${data.assetType} | Importance: ${importance}]\n`;
                    if (annotation) assetEntry += `  - Director's Note: ${annotation}\n`;
                    for (const [key, value] of Object.entries(data.traits)) {
                        assetEntry += `  - ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
                    }
                } catch (e) {
                    const assetName = item.querySelector('.asset-name')?.textContent || 'Unnamed Asset';
                    assetEntry += `\n[Reference Asset: Plain Text | Importance: ${importance}]\n- Filename: ${assetName}\n`;
                    if (annotation) assetEntry += `  - Director's Note: ${annotation}\n`;
                }
            } else {
                const assetName = item.querySelector('.asset-name')?.textContent || 'Unnamed Asset';
                const assetType = item.classList.contains('image-asset') ? 'Image' : 'Generic';
                assetEntry += `\n[Reference Asset: ${assetType} | Importance: ${importance}]\n- Filename: ${assetName}\n`;
                if (annotation) assetEntry += `  - Director's Note: ${annotation}\n`;
            }
            prompt += assetEntry;
        });
    }

    prompt += `\n--- TASK ---\nGenerate the content for the primary "${elementType}" Element. Use the Guidance Gems for style. Critically, use the Contextual Assets for lore, background, and specific direction, paying close attention to their specified Importance and Director's Notes. Be descriptive, imaginative, and ensure the output is consistent with all provided data. Format the output clearly with headings.`;
    
    console.log("Super Prompt:", prompt);
    return prompt;
}

// --- Asset Saving Logic ---
function saveElementAsset() {
    const generateButton = document.getElementById('generate-button');
    if (!generateButton) {
        console.error('Generate button not found, cannot determine element type.');
        return;
    }
    const elementType = generateButton.dataset.elementType; // e.g., PERSONA
    const extension = elementType.toLowerCase(); // e.g., persona

    const assetData = {
        assetType: elementType,
        timestamp: new Date().toISOString(),
        traits: {}
    };

    const inputs = document.querySelectorAll('.form-section .input-field');
    inputs.forEach(input => {
        const fieldId = input.dataset.fieldId;
        if (fieldId && input.value.trim() !== '') {
            assetData.traits[fieldId] = input.value.trim();
        }
    });

    // Use the 'name' field for the filename, otherwise default to 'Untitled'
    const assetName = assetData.traits.name || 'Untitled';
    const filename = `${assetName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assetData, null, 2));

    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode); // Required for Firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}


function initializeGeneration() {
    const generateButton = document.getElementById('generate-button');
    if (generateButton) {
        generateButton.addEventListener('click', () => generateElementContent(generateButton));
    }
}

function initializeSaveButton() {
    const saveButton = document.getElementById('save-asset-button');
    if (saveButton) {
        saveButton.addEventListener('click', saveElementAsset);
    }
}

function initializeClearButton() {
    const clearButton = document.getElementById('clear-fields-button');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            const inputs = document.querySelectorAll('.form-section .input-field');
            inputs.forEach(input => input.value = '');
            const responseContainer = document.getElementById('response-container');
            if (responseContainer) responseContainer.innerHTML = '';
        });
    }
}

// --- DOMContentLoaded Initializer ---
document.addEventListener('DOMContentLoaded', () => {
    // initializeResizableColumns(); // Intentionally disabled for stability
    initializeAccordions();
    initializeGuidanceGems();
    initializeAssetImporter();
    initializeGeneration();
    initializeSaveButton();
    initializeClearButton();
});

