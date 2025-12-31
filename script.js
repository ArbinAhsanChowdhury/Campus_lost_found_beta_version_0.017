// ======================
// CLOUD STORAGE SETUP
// ======================

// GitHub Gist Configuration
const GIST_ID = 'YOUR_GIST_ID_HERE'; // You'll create this
const GIST_FILENAME = 'lost_found_data.txt';
const GIST_TOKEN = 'https://gist.github.com/ArbinAhsanChowdhury/f870f44f6939f7b2b62c712dcb0e8715'; // Leave empty for public access

// Fallback: If GitHub fails, use localStorage
const LOCAL_STORAGE_KEY = 'campus_lost_found_backup';

// ======================
// APPLICATION STATE
// ======================

let items = [];
let filteredItems = [];
let currentFilter = 'all';

// ======================
// DOM ELEMENTS
// ======================

const elements = {
    itemsList: document.getElementById('itemsList'),
    searchInput: document.getElementById('searchInput'),
    filterType: document.getElementById('filterType'),
    formModal: document.getElementById('formModal'),
    infoModal: document.getElementById('infoModal'),
    itemForm: document.getElementById('itemForm'),
    formTitle: document.getElementById('formTitle'),
    itemType: document.getElementById('itemType'),
    syncStatus: document.getElementById('syncStatus'),
    
    // Stats
    lostCount: document.getElementById('lostCount'),
    foundCount: document.getElementById('foundCount'),
    totalCount: document.getElementById('totalCount'),
    lastSync: document.getElementById('lastSync'),
    
    // Cloud Info
    fileUrl: document.getElementById('fileUrl'),
    cloudTimestamp: document.getElementById('cloudTimestamp'),
    cloudItemCount: document.getElementById('cloudItemCount'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// ======================
// INITIALIZATION
// ======================

document.addEventListener('DOMContentLoaded', async () => {
    // Set today's date in form
    document.getElementById('date').valueAsDate = new Date());
    
    // Initialize form submission
    elements.itemForm.addEventListener('submit', handleFormSubmit);
    
    // Load data from cloud
    await loadDataFromCloud();
    
    // Set up auto-refresh every 30 seconds
    setInterval(async () => {
        await loadDataFromCloud();
    }, 30000);
});

// ======================
// CLOUD FUNCTIONS
// ======================

async function loadDataFromCloud() {
    try {
        updateSyncStatus('Syncing with cloud...', 'syncing');
        
        // Try to load from GitHub Gist first
        const cloudData = await fetchFromGist();
        
        if (cloudData) {
            // Parse data from text file
            items = parseTextData(cloudData);
            showToast(`Loaded ${items.length} items from cloud`, 'success');
            
            // Update cloud info
            updateCloudInfo(cloudData);
            
            // Save backup to localStorage
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } else {
            // Fallback to localStorage
            const backup = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (backup) {
                items = JSON.parse(backup);
                showToast(`Loaded ${items.length} items from backup`, 'warning');
            } else {
                // Load sample data for demo
                items = getSampleData();
                showToast('Using demo data - no cloud connection', 'info');
            }
        }
        
        // Update UI
        updateStats();
        displayItems(items);
        updateSyncStatus('Synced', 'success');
        
    } catch (error) {
        console.error('Error loading data:', error);
        updateSyncStatus('Sync failed', 'error');
        showToast('Could not connect to cloud', 'error');
    }
}

async function saveDataToCloud(newItem) {
    try {
        updateSyncStatus('Saving to cloud...', 'syncing');
        
        // Add new item
        items.push(newItem);
        
        // Convert to text format
        const textData = convertToText(items);
        
        // Save to GitHub Gist
        const success = await saveToGist(textData);
        
        if (success) {
            // Update UI
            updateStats();
            displayItems(items);
            showToast('Item saved to cloud successfully!', 'success');
            updateSyncStatus('Saved', 'success');
            
            // Also save backup to localStorage
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
            
            return true;
        } else {
            // Fallback: save to localStorage only
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
            updateStats();
            displayItems(items);
            showToast('Saved locally (cloud unavailable)', 'warning');
            updateSyncStatus('Saved locally', 'warning');
            
            return false;
        }
        
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Error saving data', 'error');
        updateSyncStatus('Error', 'error');
        return false;
    }
}

// ======================
// GITHUB GIST FUNCTIONS
// ======================

async function fetchFromGist() {
    // For demo purposes, we'll use a public URL
    // In real implementation, you'd use the Gist API
    
    try {
        // Using a public JSON file as fallback
        const response = await fetch('https://api.npoint.io/8f3b5c9c1d1d1d1d1d1d');
        
        if (response.ok) {
            return await response.text();
        }
        
        // Alternative: Fetch from GitHub raw URL
        const githubResponse = await fetch('https://raw.githubusercontent.com/yourusername/lost-found-data/main/data.txt');
        if (githubResponse.ok) {
            return await githubResponse.text();
        }
        
        return null;
        
    } catch (error) {
        console.log('Using fallback data due to:', error);
        return null;
    }
}

async function saveToGist(textData) {
    // This is where you'd implement the GitHub API call
    // For hackathon demo, we'll simulate it
    
    console.log('Simulating save to cloud:', textData.length, 'characters');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, we'll just save to localStorage with cloud timestamp
    const cloudSave = {
        data: textData,
        timestamp: new Date().toISOString(),
        source: 'cloud_simulation'
    };
    
    localStorage.setItem('cloud_simulation', JSON.stringify(cloudSave));
    
    return true; // Simulate success
}

// ======================
// DATA FORMAT FUNCTIONS
// ======================

function parseTextData(text) {
    if (!text) return [];
    
    try {
        // Try parsing as JSON first
        if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
            return JSON.parse(text);
        }
        
        // Parse as CSV/text format
        const lines = text.split('\n').filter(line => line.trim());
        const parsedItems = [];
        
        lines.forEach(line => {
            try {
                const item = JSON.parse(line);
                if (item && item.name) {
                    parsedItems.push(item);
                }
            } catch (e) {
                // Skip invalid lines
            }
        });
        
        return parsedItems;
        
    } catch (error) {
        console.error('Error parsing data:', error);
        return [];
    }
}

function convertToText(itemsArray) {
    // Convert to JSON string for easy parsing
    return JSON.stringify(itemsArray, null, 2);
}

// ======================
// UI FUNCTIONS
// ======================

function displayItems(itemsToDisplay) {
    if (!itemsToDisplay || itemsToDisplay.length === 0) {
        elements.itemsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox fa-3x"></i>
                <h3>No items found</h3>
                <p>Be the first to report a lost or found item!</p>
                <button class="btn btn-primary" onclick="showForm('lost')">
                    <i class="fas fa-plus"></i> Report First Item
                </button>
            </div>
        `;
        return;
    }
    
    elements.itemsList.innerHTML = itemsToDisplay.map(item => `
        <div class="item-card ${item.type}">
            <div class="item-header">
                <div>
                    <h3>${item.name}</h3>
                    <p class="item-location"><i class="fas fa-map-marker-alt"></i> ${item.location}</p>
                </div>
                <span class="item-type ${item.type}">${item.type.toUpperCase()}</span>
            </div>
            
            <div class="item-details">
                <div class="item-detail">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${formatDate(item.date)}</span>
                </div>
                <div class="item-detail">
                    <i class="fas fa-user"></i>
                    <span>Reported by: ${item.reporterName || 'Anonymous'}</span>
                </div>
                <div class="item-detail">
                    <i class="fas fa-align-left"></i>
                    <span>${item.description}</span>
                </div>
                <div class="item-detail">
                    <i class="fas fa-phone"></i>
                    <span>Contact: ${item.contact}</span>
                </div>
            </div>
            
            <div class="item-meta">
                <small><i class="fas fa-cloud"></i> Synced from cloud</small>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const lost = items.filter(item => item.type === 'lost').length;
    const found = items.filter(item => item.type === 'found').length;
    const total = items.length;
    
    elements.lostCount.textContent = lost;
    elements.foundCount.textContent = found;
    elements.totalCount.textContent = total;
    elements.lastSync.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function updateSyncStatus(message, status) {
    const icon = elements.syncStatus.querySelector('i');
    const text = elements.syncStatus.querySelector('span');
    
    text.textContent = message;
    
    // Update icon based on status
    icon.className = 'fas';
    
    if (status === 'syncing') {
        icon.classList.add('fa-sync-alt', 'spin');
        elements.syncStatus.style.background = 'rgba(52, 152, 219, 0.2)';
    } else if (status === 'success') {
        icon.classList.add('fa-check-circle');
        elements.syncStatus.style.background = 'rgba(46, 204, 113, 0.2)';
    } else if (status === 'error') {
        icon.classList.add('fa-exclamation-circle');
        elements.syncStatus.style.background = 'rgba(231, 76, 60, 0.2)';
    } else if (status === 'warning') {
        icon.classList.add('fa-exclamation-triangle');
        elements.syncStatus.style.background = 'rgba(241, 196, 15, 0.2)';
    }
}

function updateCloudInfo(data) {
    elements.fileUrl.textContent = 'https://cloud.github.com/lost_found_data.txt';
    elements.cloudTimestamp.textContent = new Date().toLocaleString();
    elements.cloudItemCount.textContent = items.length;
}

// ======================
// FORM HANDLING
// ======================

function showForm(type) {
    elements.itemType.value = type;
    elements.formTitle.textContent = `Report ${type.charAt(0).toUpperCase() + type.slice(1)} Item`;
    elements.formModal.style.display = 'flex';
    
    // Reset form
    elements.itemForm.reset();
    document.getElementById('date').valueAsDate = new Date());
}

function closeForm() {
    elements.formModal.style.display = 'none';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const newItem = {
        id: Date.now(),
        type: elements.itemType.value,
        name: document.getElementById('itemName').value.trim(),
        location: document.getElementById('location').value,
        date: document.getElementById('date').value,
        description: document.getElementById('description').value.trim(),
        reporterName: document.getElementById('reporterName').value.trim(),
        contact: document.getElementById('contact').value.trim(),
        timestamp: new Date().toISOString()
    };
    
    // Save to cloud
    const saved = await saveDataToCloud(newItem);
    
    if (saved) {
        closeForm();
    }
}

// ======================
// SEARCH & FILTER
// ======================

function searchItems() {
    const query = elements.searchInput.value.toLowerCase().trim();
    filterItems(query);
}

function filterItems(searchQuery = '') {
    currentFilter = elements.filterType.value;
    
    filteredItems = items.filter(item => {
        // Apply type filter
        if (currentFilter !== 'all' && item.type !== currentFilter) {
            return false;
        }
        
        // Apply search query
        if (searchQuery) {
            const searchText = `${item.name} ${item.description} ${item.location} ${item.reporterName}`.toLowerCase();
            return searchText.includes(searchQuery);
        }
        
        return true;
    });
    
    displayItems(filteredItems);
}

// ======================
// UTILITY FUNCTIONS
// ======================

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    
    // Set color based on type
    if (type === 'success') {
        elements.toast.style.background = '#2ecc71';
    } else if (type === 'error') {
        elements.toast.style.background = '#e74c3c';
    } else if (type === 'warning') {
        elements.toast.style.background = '#f39c12';
    } else if (type === 'info') {
        elements.toast.style.background = '#3498db';
    }
    
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

function refreshData() {
    loadDataFromCloud();
}

function showCloudInfo() {
    elements.infoModal.style.display = 'flex';
    updateCloudInfo();
}

function closeInfo() {
    elements.infoModal.style.display = 'none';
}

// ======================
// SAMPLE DATA FOR DEMO
// ======================

function getSampleData() {
    return [
        {
            id: 1,
            type: 'lost',
            name: 'Student ID Card',
            location: 'Library',
            date: '2023-11-15',
            description: 'Blue cover, 2024 batch, Computer Science',
            reporterName: 'Rahul',
            contact: 'rahul@campus.edu',
            timestamp: '2023-11-15T10:30:00Z'
        },
        {
            id: 2,
            type: 'found',
            name: 'Water Bottle',
            location: 'Cafeteria',
            date: '2023-11-16',
            description: 'Metal, 1L, with Save Earth sticker',
            reporterName: 'Priya',
            contact: 'priya@campus.edu',
            timestamp: '2023-11-16T14:20:00Z'
        },
        {
            id: 3,
            type: 'lost',
            name: 'Calculator',
            location: 'Lab Building',
            date: '2023-11-14',
            description: 'Casio fx-991EX, black, in blue case',
            reporterName: 'Amit',
            contact: 'amit@campus.edu',
            timestamp: '2023-11-14T09:15:00Z'
        }
    ];
}

// ======================
// MAKE FUNCTIONS GLOBAL
// ======================

window.showForm = showForm;
window.closeForm = closeForm;
window.searchItems = searchItems;
window.filterItems = filterItems;
window.refreshData = refreshData;
window.showCloudInfo = showCloudInfo;

window.closeInfo = closeInfo;
