document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Page Loaded');

    // UI Init
    initTabs();

    // Data Init
    loadPeriods();
    loadStoresForSettings();
    setupDropZones();
});

const API_URL = window.location.origin + '/api';
console.log('🔗 API URL:', API_URL);

// --- Tab/Navigation Logic ---
function initTabs() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.view-section');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            if (!targetId) return;

            // Update Menu Active State
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            // Show Target Section
            sections.forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('active');
                }
            });
        });
    });
}

// --- Period Logic ---
async function loadPeriods() {
    try {
        const res = await fetch(`${API_URL}/periods`);
        const periods = await res.json();

        const select = document.getElementById('periodSelect');
        if (!select) return;

        select.innerHTML = periods.map(p =>
            `<option value="${p.id}">${p.name} (${p.start} - ${p.end})</option>`
        ).join('');

        // Initial check
        if (periods.length > 0) {
            checkPeriodStatus();
        }

        // Listen for changes
        select.addEventListener('change', checkPeriodStatus);
    } catch (err) {
        console.error('Error loading periods:', err);
    }
}

async function checkPeriodStatus() {
    const select = document.getElementById('periodSelect');
    if (!select) return;

    const periodId = select.value;
    if (!periodId) return;

    // Reset statuses
    ['px', 'ytd'].forEach(type => {
        const badge = document.getElementById(`${type}Status`);
        if (badge) {
            badge.textContent = 'Yüklenmedi';
            badge.style.color = '#9CA3AF';
            badge.style.background = 'rgba(0,0,0,0.05)';
        }
    });

    try {
        const res = await fetch(`${API_URL}/data/${periodId}`);
        const data = await res.json();

        // Check if data exists
        if (data.px && data.px.length > 0) {
            updateStatusBadge('px', true);
        }

        if (data.ytd && data.ytd.length > 0) {
            updateStatusBadge('ytd', true);
        }
    } catch (err) {
        console.error('Error checking status:', err);
    }
}

function updateStatusBadge(type, isSuccess) {
    const badge = document.getElementById(`${type}Status`);
    if (!badge) return;

    if (isSuccess) {
        badge.innerHTML = `
            <span class="status-check">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Yüklendi
            </span>
        `;
        badge.style.color = 'var(--success)';
        badge.style.background = 'rgba(16, 185, 129, 0.1)';
    } else {
        badge.textContent = 'Yüklenmedi';
        badge.style.color = '#9CA3AF';
        badge.style.background = 'rgba(0,0,0,0.05)';
    }
}

// --- File Upload Logic ---
const filesToUpload = {
    px: null,
    ytd: null
};

function setupDropZones() {
    ['px', 'ytd'].forEach(type => {
        const dropZone = document.getElementById(`${type}DropZone`);
        const fileInput = document.getElementById(`${type}File`);
        const btnId = type === 'px' ? 'uploadPxBtn' : 'uploadYtdBtn';
        const btn = document.getElementById(btnId);

        if (!dropZone || !fileInput || !btn) return;

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('active');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('active');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');
            if (e.dataTransfer.files.length) {
                filesToUpload[type] = e.dataTransfer.files[0];
                handleFileSelect(type, filesToUpload[type]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                filesToUpload[type] = fileInput.files[0];
                handleFileSelect(type, filesToUpload[type]);
            }
        });

        // Upload Button Click
        btn.addEventListener('click', () => uploadFile(type));

        // Delete Button Click
        const delBtn = document.getElementById(type === 'px' ? 'deletePxBtn' : 'deleteYtdBtn');
        if (delBtn) {
            delBtn.addEventListener('click', () => deleteFile(type));
        }
    });
}

// Granular delete function
async function deleteFile(type) {
    const periodId = document.getElementById('periodSelect').value;
    if (!periodId) return alert('Periyot seçili değil!');

    if (!confirm(`${type.toUpperCase()} verisini silmek istediğinize emin misiniz?`)) return;

    try {
        const res = await fetch(`${API_URL}/delete-file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ periodId, type })
        });

        if (res.ok) {
            alert('Veri silindi.');
            updateStatusBadge(type, false);

            // Reset UI
            const dropZone = document.getElementById(`${type}DropZone`);
            const p = dropZone.querySelector('p');
            if (p) p.textContent = 'CSV dosyasını sürükleyin';

            const icon = dropZone.querySelector('.upload-icon');
            if (icon) icon.style.color = '';

            // Reset file selection
            filesToUpload[type] = null;
            const fileInput = document.getElementById(`${type}File`);
            if (fileInput) fileInput.value = '';

            const btn = document.getElementById(type === 'px' ? 'uploadPxBtn' : 'uploadYtdBtn');
            if (btn) btn.disabled = true;

            // Check full status
            checkPeriodStatus();
        } else {
            alert('Silme başarısız.');
        }
    } catch (err) {
        console.error(err);
        alert('Hata oluştu.');
    }
}

function handleFileSelect(type, file) {
    const dropZone = document.getElementById(`${type}DropZone`);
    const btn = document.getElementById(type === 'px' ? 'uploadPxBtn' : 'uploadYtdBtn');

    const textElement = dropZone.querySelector('p');
    if (textElement) {
        textElement.textContent = file.name;
        textElement.style.color = 'var(--text-primary)';
    }

    // Change icon color
    const icon = dropZone.querySelector('.upload-icon');
    if (icon) icon.style.color = 'var(--sb-green)';

    if (btn) {
        btn.disabled = false;
    }
}

async function uploadFile(type) {
    const periodId = document.getElementById('periodSelect').value;
    const btn = document.getElementById(type === 'px' ? 'uploadPxBtn' : 'uploadYtdBtn');
    const file = filesToUpload[type];

    if (!file) {
        alert('Lütfen dosya seçin!');
        return;
    }

    if (!periodId) {
        alert('Lütfen periyot seçin!');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('periodId', periodId);
    formData.append('type', type);

    const originalText = btn.textContent;
    btn.textContent = 'Yükleniyor...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (res.ok) {
            updateStatusBadge(type, true);
            loadStoresForSettings();

            // Reset dropzone text
            const dropZone = document.getElementById(`${type}DropZone`);
            const p = dropZone.querySelector('p');
            if (p) p.textContent = 'Dosya yüklendi ✅';

        } else {
            const errorText = await res.text();
            alert(`Yükleme hatası: ${errorText}`);
        }
    } catch (err) {
        console.error(err);
        alert('Bir hata oluştu.');
    } finally {
        btn.textContent = originalText;
        checkPeriodStatus();
    }
}

// ===== SETTINGS & CLEAR LOGIC =====

const ITEM_GROUPS = [
    { name: 'Net Sales', items: ['Actual Net Sales', 'BP-2025 Net Sales', 'Actual vs BP Difference Net Sales', 'Actual vs BP Difference (%) Net Sales'] },
    { name: 'COGS', items: ['Actual COGS', 'COGS %'] },
    { name: 'Royalty', items: ['Actual Royalty', 'Royalty %'] },
    { name: 'Store Margin', items: ['Actual Store Margin', 'Store Margin %', 'BP-2025 Store Margin', 'Actual vs BP Difference Store Margin', 'Actual vs BP Difference (%) Store Margin'] },
    { name: 'Cost of Sales', items: ['Cost of Sales (Others)'] },
    { name: 'Operating Margin', items: ['Operating Margin', 'Operating Margin %', 'BP-2025 Operating Margin', 'Actual vs BP Difference Operating Margin', 'Actual vs BP Difference (%) Operating Margin'] },
    { name: 'Staff Cost', items: ['Staff Cost', 'Staff Cost %', 'BP-2025 Staff Cost', 'Actual vs BP Difference Staff Cost', 'Actual vs BP Difference (%) Staff Cost'] },
    { name: 'Controllables', items: ['Controllables', 'Controllables %', 'BP-2025 Controllables', 'Actual vs BP Difference Controllables', 'Actual vs BP Difference (%) Controllables'] },
    { name: 'Rent', items: ['Rent', 'Rent %', 'BP-2025 Rent', 'Actual vs BP Difference Rent', 'Actual vs BP Difference (%) Rent'] },
    { name: 'Depreciation', items: ['Depreciation', 'Depreciation %', 'BP-2025 Depreciation', 'Actual vs BP Difference Depreciation', 'Actual vs BP Difference (%) Depreciation'] },
    { name: 'Store Contribution', items: ['Store Contribution', 'Store Contribution %', 'BP-2025 Store Contribution', 'Actual vs BP Difference Store Contribution', 'Actual vs BP Difference (%) Store Contribution'] },
    { name: 'Cash +/- Stores', items: ['Cash +/- Stores'] }
];

// Clear Period
document.getElementById('clearPeriodBtn')?.addEventListener('click', async () => {
    const periodId = document.getElementById('periodSelect').value;
    if (!periodId) return alert('Lütfen bir periyot seçin.');

    if (!confirm(`Periyot ${periodId} verilerini silmek istediğinize emin misiniz?`)) return;

    try {
        const res = await fetch(`${API_URL}/clear/${periodId}`, { method: 'POST' });
        if (res.ok) {
            alert('Periyot verileri ve dosyaları silindi.');
            checkPeriodStatus();
            setTimeout(() => location.reload(), 500);
        } else {
            alert('Silme işlemi başarısız.');
        }
    } catch (err) {
        console.error(err);
        alert('Silme işlemi başarısız.');
    }
});

// ===== YENİ SETTINGS LOGIC =====
let ALL_STORES = [];
let ALL_PERIODS = [];
let CURRENT_SETTINGS = {}; // { storeCode: { periodId: { type: { hiddenGroups: [] } } } }
let TABLE_VISIBILITY = {}; // { periodId: { type: { tableName: boolean } } }
let PERIOD_DATA_CACHE = {}; // Cache for period data

// Helper function to load period data
async function loadPeriodDataForSettings(periodId, type) {
    const cacheKey = `${periodId}_${type}`;
    if (PERIOD_DATA_CACHE[cacheKey]) {
        return PERIOD_DATA_CACHE[cacheKey];
    }
    
    try {
        const res = await fetch(`${API_URL}/data/${periodId}`);
        const data = await res.json();
        PERIOD_DATA_CACHE[cacheKey] = data[type] || [];
        return PERIOD_DATA_CACHE[cacheKey];
    } catch (err) {
        console.error('Period data load error:', err);
        return [];
    }
}

// Helper function to get item data for settings
function getItemDataForSettings(storeCode, groupName, itemName, type) {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const cacheKey = `${periodId}_${type}`;
    const sourceData = PERIOD_DATA_CACHE[cacheKey] || [];
    
    if (sourceData.length === 0) {
        return { value: '-' };
    }
    
    // Find row for this store
    const row = sourceData.find(r => r['EPM Store Name'] && r['EPM Store Name'].includes(`-${storeCode}-`));
    
    if (!row) {
        return { value: '-' };
    }
    
    // Helper to parse float from comma string
    const parseTR = (val) => {
        if (!val) return 0;
        return parseFloat(val.replace(',', '.'));
    };
    
    // Helper to format number
    const formatNumber = (num) => {
        if (!num || num === 0) return '0';
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };
    
    // Map item name to CSV column
    let columnKey;
    
    // Direct mapping based on item name
    if (itemName.includes('Actual Net Sales')) columnKey = 'Actual Net Sales';
    else if (itemName.includes('BP-2025 Net Sales')) columnKey = 'BP-2025 Net Sales';
    else if (itemName.includes('Actual vs BP Difference Net Sales') && !itemName.includes('%')) columnKey = 'Actual vs BP Difference Net sales';
    else if (itemName.includes('Actual vs BP Difference (%) Net Sales')) columnKey = 'Actual vs BP Difference (%) net sales';
    else if (itemName.includes('Actual COGS')) columnKey = 'Actual COGS';
    else if (itemName.includes('COGS %')) columnKey = 'cogs%';
    else if (itemName.includes('Actual Royalty')) columnKey = 'Actual Royalty';
    else if (itemName.includes('Royalty %')) columnKey = 'royalty %';
    else if (itemName.includes('Actual Store Margin')) columnKey = 'Actual Store Margin';
    else if (itemName.includes('Store Margin %')) columnKey = 'store margin %';
    else if (itemName.includes('BP-2025 Store Margin')) columnKey = 'BP-2025 Store Margin';
    else if (itemName.includes('Actual vs BP Difference Store Margin') && !itemName.includes('%')) columnKey = 'Actual vs BP Difference store margin';
    else if (itemName.includes('Actual vs BP Difference (%) Store Margin')) columnKey = 'Actual vs BP Difference (%) store margin';
    else if (itemName === 'Cost of Sales (Others)') columnKey = 'Cost of Sales (Others)';
    else if (itemName === 'Operating Margin') columnKey = 'Operating Margin';
    else if (itemName.includes('Operating Margin %')) columnKey = 'operation margin %';
    else if (itemName.includes('BP-2025 Operating Margin')) columnKey = 'BP-2025 Operating Margin';
    else if (itemName.includes('Actual vs BP Difference Operating Margin') && !itemName.includes('%')) columnKey = 'Actual vs BP Difference operation margin';
    else if (itemName.includes('Actual vs BP Difference (%) Operating Margin')) columnKey = 'Actual vs BP Difference (%) operation margin';
    else if (itemName === 'Staff Cost') columnKey = 'Staff cost';
    else if (itemName.includes('Staff Cost %')) columnKey = 'staff cost %';
    else if (itemName.includes('BP-2025 Staff Cost')) columnKey = 'BP-2025 Staff Cost';
    else if (itemName.includes('Actual vs BP Difference Staff Cost') && !itemName.includes('%')) columnKey = 'Actual vs BP Difference staff cost';
    else if (itemName.includes('Actual vs BP Difference (%) Staff Cost')) columnKey = 'Actual vs BP Difference (%) staff cost';
    else if (itemName === 'Controllables') columnKey = 'Controllables';
    else if (itemName.includes('Controllables %')) columnKey = 'controllables%';
    else if (itemName.includes('BP-2025 Controllables')) columnKey = 'BP-2025 Controllables';
    else if (itemName.includes('Actual vs BP Difference Controllables') && !itemName.includes('%')) columnKey = 'Actual vs BP Difference controllables';
    else if (itemName.includes('Actual vs BP Difference (%) Controllables')) columnKey = 'Actual vs BP Difference (%) controllables';
    else if (itemName === 'Rent') columnKey = 'Rent';
    else if (itemName.includes('Rent %')) columnKey = 'rent %';
    else if (itemName.includes('BP-2025 Rent')) columnKey = 'BP-2025 Rent';
    else if (itemName.includes('Actual vs BP Difference Rent') && !itemName.includes('%')) columnKey = 'Actual vs BP Difference rent';
    else if (itemName.includes('Actual vs BP Difference (%) Rent')) columnKey = 'Actual vs BP Difference (%) rent';
    else if (itemName === 'Depreciation') columnKey = 'Depreciation';
    else if (itemName.includes('Depreciation %')) columnKey = 'depreciation%';
    else if (itemName.includes('BP-2025 Depreciation')) columnKey = 'BP-2025 Depreciation';
    else if (itemName.includes('Actual vs BP Difference Depreciation') && !itemName.includes('%')) columnKey = 'Actual vs BP Difference depreciation';
    else if (itemName.includes('Actual vs BP Difference (%) Depreciation')) columnKey = 'Actual vs BP Difference (%) depreciation';
    else if (itemName === 'Store Contribution') columnKey = 'Store Contribution';
    else if (itemName.includes('Store Contribution %')) columnKey = 'store contribution%';
    else if (itemName.includes('BP-2025 Store Contribution')) columnKey = 'BP-2025 Store Contribution';
    else if (itemName.includes('Actual vs BP Difference Store Contribution') && !itemName.includes('%')) columnKey = 'Actual vs BP Difference store conribution';
    else if (itemName.includes('Actual vs BP Difference (%) Store Contribution')) columnKey = 'Actual vs BP Difference (%) contribution';
    else if (itemName.includes('Cash +/- Stores')) columnKey = 'Cash +/-  Stores';
    
    if (!columnKey || !row[columnKey]) {
        return { value: '-' };
    }
    
    const rawValue = row[columnKey];
    
    // Check if it's a percentage
    if (itemName.includes('%')) {
        const pVal = parseFloat(rawValue.toString().replace(',', '.'));
        if (Math.abs(pVal) < 1) {
            return { value: `%${(pVal * 100).toFixed(1)}` };
        } else {
            return { value: `%${pVal.toFixed(1)}` };
        }
    }
    
    // Regular number
    const numValue = parseTR(rawValue);
    return { value: formatNumber(numValue) };
}
function getStoreGroupDataForSettings(storeCode, groupName, type) {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const cacheKey = `${periodId}_${type}`;
    const sourceData = PERIOD_DATA_CACHE[cacheKey] || [];
    
    if (sourceData.length === 0) {
        return {
            actualFormatted: '-',
            diffPercent: 0
        };
    }
    
    // Find row for this store
    const row = sourceData.find(r => r['EPM Store Name'] && r['EPM Store Name'].includes(`-${storeCode}-`));
    
    if (!row) {
        return {
            actualFormatted: '-',
            diffPercent: 0
        };
    }
    
    // Helper to parse float from comma string
    const parseTR = (val) => {
        if (!val) return 0;
        return parseFloat(val.replace(',', '.'));
    };
    
    // Helper to format number
    const formatNumber = (num) => {
        if (!num || num === 0) return '0';
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };
    
    // Map keys based on group name (simplified version)
    let actualKey, diffPercentKey;
    
    switch (groupName) {
        case 'Net Sales':
            actualKey = 'Actual Net Sales';
            diffPercentKey = 'Actual vs BP Difference (%) net sales';
            break;
        case 'COGS':
            actualKey = 'Actual COGS';
            break;
        case 'Royalty':
            actualKey = 'Actual Royalty';
            break;
        case 'Store Margin':
            actualKey = 'Actual Store Margin';
            diffPercentKey = 'Actual vs BP Difference (%) store margin';
            break;
        case 'Cost of Sales':
            actualKey = 'Cost of Sales (Others)';
            break;
        case 'Operating Margin':
            actualKey = 'Operating Margin';
            diffPercentKey = 'Actual vs BP Difference (%) operation margin';
            break;
        case 'Staff Cost':
            actualKey = 'Staff cost';
            diffPercentKey = 'Actual vs BP Difference (%) staff cost';
            break;
        case 'Controllables':
            actualKey = 'Controllables';
            diffPercentKey = 'Actual vs BP Difference (%) controllables';
            break;
        case 'Rent':
            actualKey = 'Rent';
            diffPercentKey = 'Actual vs BP Difference (%) rent';
            break;
        case 'Depreciation':
            actualKey = 'Depreciation';
            diffPercentKey = 'Actual vs BP Difference (%) depreciation';
            break;
        case 'Store Contribution':
            actualKey = 'Store Contribution';
            diffPercentKey = 'Actual vs BP Difference (%) contribution';
            break;
        case 'Cash +/- Stores':
            actualKey = 'Cash +/-  Stores';
            break;
    }
    
    const actual = parseTR(row[actualKey]);
    const diffPercent = diffPercentKey && row[diffPercentKey] ? 
        (parseFloat(row[diffPercentKey].replace(',', '.')) * 100).toFixed(1) : 0;
    
    return {
        actualFormatted: formatNumber(actual),
        diffPercent: parseFloat(diffPercent)
    };
}

async function loadStoresForSettings() {
    try {
        const res = await fetch(`${API_URL}/stores`);
        ALL_STORES = await res.json();

        const perRes = await fetch(`${API_URL}/periods`);
        ALL_PERIODS = await perRes.json();

        // Populate period dropdown with dynamic labels
        const periodSelect = document.getElementById('settingsPeriodSelect');
        if (periodSelect) {
            periodSelect.innerHTML = '<option value="">Periyot seçin...</option>' +
                ALL_PERIODS.map(p => `<option value="${p.id}">P${p.id} - ${p.name}</option>`).join('');
        }

        // Load all settings
        await loadAllSettings();
        
        // Load table visibility settings
        await loadTableVisibility();
        
        // Setup event listeners AFTER elements are loaded
        setupSettingsEventListeners();

    } catch (err) {
        console.error('Mağaza yükleme hatası:', err);
    }
}

// Setup event listeners for settings page
function setupSettingsEventListeners() {
    // Period select handler
    const periodSelect = document.getElementById('settingsPeriodSelect');
    if (periodSelect && !periodSelect.dataset.listenerAttached) {
        periodSelect.dataset.listenerAttached = 'true';
        periodSelect.addEventListener('change', async () => {
            const periodId = periodSelect.value;
            console.log('Period changed to:', periodId);
            
            // Update ONLY the active segment button with period number
            if (periodId) {
                const activeBtn = document.querySelector('#typeSegmentContainer .segment-btn-modern.active');
                if (activeBtn) {
                    const type = activeBtn.dataset.value.toUpperCase();
                    activeBtn.querySelector('.segment-text').textContent = `P${periodId} - ${type}`;
                    
                    // Preload data for active type
                    await loadPeriodDataForSettings(periodId, activeBtn.dataset.value);
                }
            } else {
                // Reset to default
                document.querySelectorAll('#typeSegmentContainer .segment-btn-modern').forEach(btn => {
                    const type = btn.dataset.value.toUpperCase();
                    btn.querySelector('.segment-text').textContent = type;
                });
            }
            
            renderTableVisibilityGrid();
            await renderStoreCards();
        });
    }
    
    // Type toggle handler
    document.querySelectorAll('#typeSegmentContainer .segment-btn-modern').forEach(btn => {
        if (!btn.dataset.listenerAttached) {
            btn.dataset.listenerAttached = 'true';
            btn.addEventListener('click', async () => {
                console.log('Type button clicked:', btn.dataset.value);
                
                document.querySelectorAll('#typeSegmentContainer .segment-btn-modern').forEach(b => {
                    b.classList.remove('active');
                    // Reset non-active buttons to just type name
                    const type = b.dataset.value.toUpperCase();
                    b.querySelector('.segment-text').textContent = type;
                });
                btn.classList.add('active');
                
                // Update ONLY the active segment button text with period number
                const periodId = document.getElementById('settingsPeriodSelect')?.value;
                if (periodId) {
                    const type = btn.dataset.value.toUpperCase();
                    btn.querySelector('.segment-text').textContent = `P${periodId} - ${type}`;
                }
                
                // Wait for data to load before rendering
                const selectedType = btn.dataset.value;
                console.log('Switching to type:', selectedType);
                
                if (periodId) {
                    await loadPeriodDataForSettings(periodId, selectedType);
                }
                
                renderTableVisibilityGrid();
                await renderStoreCards();
            });
        }
    });
}

async function loadTableVisibility() {
    try {
        const res = await fetch(`${API_URL}/table-visibility`);
        if (res.ok) {
            TABLE_VISIBILITY = await res.json();
        } else {
            TABLE_VISIBILITY = {};
        }
    } catch (err) {
        console.error('Table visibility load error:', err);
        TABLE_VISIBILITY = {};
    }
}

function renderTableVisibilityGrid() {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    const grid = document.getElementById('tableVisibilityGrid');
    
    if (!grid || !periodId) return;
    
    // Get visibility for this period + type
    const periodSettings = TABLE_VISIBILITY[periodId] || {};
    const typeSettings = periodSettings[type] || {};
    
    // Check if this is first time (no settings exist)
    const isFirstTime = Object.keys(typeSettings).length === 0;
    
    grid.innerHTML = ITEM_GROUPS.map(group => {
        // Default FALSE (unselected) for first time, otherwise use saved value
        const isVisible = isFirstTime ? false : (typeSettings[group.name] === true);
        
        return `
            <div class="table-visibility-item ${isVisible ? 'checked' : ''}" onclick="toggleTableVisibility('${group.name}')">
                <input type="checkbox" 
                       class="table-visibility-checkbox"
                       id="tbl_${group.name.replace(/\s+/g, '_')}"
                       ${isVisible ? 'checked' : ''}>
                <label class="table-visibility-label">${group.name}</label>
            </div>
        `;
    }).join('');
}

window.toggleTableVisibility = async function(tableName) {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    
    if (!periodId) return;
    
    // Initialize structure if needed
    if (!TABLE_VISIBILITY[periodId]) TABLE_VISIBILITY[periodId] = {};
    if (!TABLE_VISIBILITY[periodId][type]) TABLE_VISIBILITY[periodId][type] = {};
    
    // Toggle the value
    const current = TABLE_VISIBILITY[periodId][type][tableName];
    TABLE_VISIBILITY[periodId][type][tableName] = current === false ? true : false;
    
    // Update UI
    renderTableVisibilityGrid();
    
    // Save to backend
    try {
        await fetch(`${API_URL}/table-visibility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TABLE_VISIBILITY)
        });
        console.log('✅ Table visibility saved!');
    } catch (err) {
        console.error('Table visibility save error:', err);
    }
};

async function loadAllSettings() {
    try {
        const promises = ALL_STORES.map(async store => {
            const res = await fetch(`${API_URL}/settings/${store.code}`);
            return { code: store.code, settings: await res.json() };
        });
        const results = await Promise.all(promises);
        
        CURRENT_SETTINGS = {};
        results.forEach(item => {
            CURRENT_SETTINGS[item.code] = item.settings;
        });
    } catch (err) {
        console.error('Settings load error:', err);
    }
}

async function renderStoreCards() {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    
    const wrapper = document.getElementById('storeCardsWrapper');
    const grid = document.getElementById('storeCardsGrid');
    
    if (!periodId || !ALL_STORES.length) {
        wrapper?.classList.add('hidden');
        return;
    }
    
    wrapper?.classList.remove('hidden');
    
    // Render table visibility grid
    renderTableVisibilityGrid();
    
    // Save current expanded states before re-rendering
    const expandedStates = {};
    document.querySelectorAll('.store-card-modern').forEach(storeCard => {
        const storeCode = storeCard.id.replace('store_', '');
        expandedStates[storeCode] = {
            storeExpanded: storeCard.classList.contains('expanded'),
            groups: {}
        };
        storeCard.querySelectorAll('.group-card').forEach(groupCard => {
            const groupName = groupCard.dataset.group;
            expandedStates[storeCode].groups[groupName] = groupCard.classList.contains('expanded');
        });
    });
    
    // Load period data for this period - AWAIT here
    await loadPeriodDataForSettings(periodId, type);
    console.log('Data loaded for:', periodId, type, 'Cache:', PERIOD_DATA_CACHE[`${periodId}_${type}`]?.length || 0, 'rows');
    
    // Render store cards - GROUPED BY ITEM GROUPS
    grid.innerHTML = ALL_STORES.map(store => {
            const storeSettings = CURRENT_SETTINGS[store.code] || {};
            const periodSettings = storeSettings[periodId] || {};
            const typeSettings = periodSettings[type] || {};
            const hiddenGroups = typeSettings.hiddenGroups || [];
            const highlights = typeSettings.highlights || [];
            
            const isFirstTime = Object.keys(periodSettings).length === 0 || !typeSettings.hiddenGroups;
            
            // Count selected groups
            const selectedCount = ITEM_GROUPS.filter(group => {
                if (isFirstTime) return false;
                return !hiddenGroups.includes(group.name);
            }).length;
            
            // Render groups with their items
            const groupCards = ITEM_GROUPS.map(group => {
                const groupChecked = isFirstTime ? false : !hiddenGroups.includes(group.name);
                
                // Render all items for this group
                const items = group.items.map(item => {
                    const itemKey = `${group.name}-${item}`;
                    const itemHighlighted = highlights.includes(itemKey);
                    
                    // Get data for this specific item
                    const itemData = getItemDataForSettings(store.code, group.name, item, type);
                    
                    return `
                        <div class="group-item ${itemHighlighted ? 'highlighted' : ''}" 
                             onclick="event.stopPropagation(); toggleItemHighlight('${store.code}', '${group.name}', '${item}')">
                            <div class="group-item-name">${item.replace(group.name, '').trim() || item}</div>
                            <div class="group-item-value">${itemData.value}</div>
                            ${itemHighlighted ? '<span class="star-icon">⭐</span>' : ''}
                        </div>
                    `;
                }).join('');
                
                return `
                    <div class="group-card ${groupChecked ? 'selected' : ''}" data-group="${group.name}" data-store="${store.code}">
                        <div class="group-card-header" onclick="event.stopPropagation(); toggleGroupSelection('${store.code}', '${group.name}')">
                            <div class="group-card-check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div class="group-card-title">${group.name}</div>
                            <svg class="group-card-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" onclick="event.stopPropagation(); toggleGroupExpand('${store.code}', '${group.name}')">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </div>
                        <div class="group-card-items">
                            ${items}
                        </div>
                    </div>
                `;
            }).join('');
            
            return `
                <div class="store-card-modern" id="store_${store.code}">
                    <div class="store-card-modern-header" onclick="toggleStoreCard('${store.code}')">
                        <div class="store-card-modern-title-wrapper">
                            <div class="store-card-modern-icon">${store.code}</div>
                            <div class="store-card-modern-info">
                                <div class="store-card-modern-name">${store.name}</div>
                                <div class="store-card-modern-code">${store.code}</div>
                            </div>
                        </div>
                        <div class="store-card-modern-actions">
                            <button class="btn-mini" onclick="event.stopPropagation(); selectAllGroups('${store.code}', true)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Tümünü Seç
                            </button>
                            <button class="btn-mini" onclick="event.stopPropagation(); selectAllGroups('${store.code}', false)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Tümünü Kaldır
                            </button>
                            <div class="store-card-modern-count">${selectedCount}/${ITEM_GROUPS.length}</div>
                            <svg class="store-card-modern-toggle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </div>
                    </div>
                    <div class="store-card-modern-content">
                        <div class="groups-grid">
                            ${groupCards}
                        </div>
                    </div>
                </div>
            `;
    }).join('');
    
    // Restore expanded states after rendering
    Object.keys(expandedStates).forEach(storeCode => {
        const storeCard = document.getElementById(`store_${storeCode}`);
        if (storeCard && expandedStates[storeCode].storeExpanded) {
            storeCard.classList.add('expanded');
        }
        
        Object.keys(expandedStates[storeCode].groups).forEach(groupName => {
            const groupCard = storeCard?.querySelector(`.group-card[data-group="${groupName}"]`);
            if (groupCard && expandedStates[storeCode].groups[groupName]) {
                groupCard.classList.add('expanded');
            } else if (groupCard && !expandedStates[storeCode].groups[groupName]) {
                groupCard.classList.remove('expanded');
            }
        });
    });
}

window.toggleStoreCard = function(storeCode) {
    const card = document.getElementById(`store_${storeCode}`);
    if (card) {
        card.classList.toggle('expanded');
    }
};

window.toggleGroupCard = function(storeCode, groupName) {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    
    if (!periodId) return;
    
    const storeSettings = CURRENT_SETTINGS[storeCode] || {};
    const periodSettings = storeSettings[periodId] || {};
    const typeSettings = periodSettings[type] || {};
    let hiddenGroups = typeSettings.hiddenGroups || [];
    const highlights = typeSettings.highlights || [];
    
    const index = hiddenGroups.indexOf(groupName);
    if (index > -1) {
        hiddenGroups = hiddenGroups.filter(g => g !== groupName);
    } else {
        hiddenGroups.push(groupName);
    }
    
    fetch(`${API_URL}/settings/${storeCode}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            periodId: String(periodId),
            type,
            data: { hiddenGroups, highlights }
        })
    }).then(() => {
        loadAllSettings().then(() => renderStoreCards());
    });
};

// Separate function for toggling group selection (checkbox)
window.toggleGroupSelection = async function(storeCode, groupName) {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    
    if (!periodId) return;
    
    const storeSettings = CURRENT_SETTINGS[storeCode] || {};
    const periodSettings = storeSettings[periodId] || {};
    const typeSettings = periodSettings[type] || {};
    let hiddenGroups = typeSettings.hiddenGroups || [];
    const highlights = typeSettings.highlights || [];
    
    const index = hiddenGroups.indexOf(groupName);
    if (index > -1) {
        hiddenGroups = hiddenGroups.filter(g => g !== groupName);
    } else {
        hiddenGroups.push(groupName);
    }
    
    await fetch(`${API_URL}/settings/${storeCode}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            periodId: String(periodId),
            type,
            data: { hiddenGroups, highlights }
        })
    });
    
    // Update local cache without full reload
    if (!CURRENT_SETTINGS[storeCode]) CURRENT_SETTINGS[storeCode] = {};
    if (!CURRENT_SETTINGS[storeCode][periodId]) CURRENT_SETTINGS[storeCode][periodId] = {};
    if (!CURRENT_SETTINGS[storeCode][periodId][type]) CURRENT_SETTINGS[storeCode][periodId][type] = {};
    CURRENT_SETTINGS[storeCode][periodId][type].hiddenGroups = hiddenGroups;
    CURRENT_SETTINGS[storeCode][periodId][type].highlights = highlights;
    
    await renderStoreCards();
};

// New function for toggling group expand/collapse
window.toggleGroupExpand = function(storeCode, groupName) {
    const storeCard = document.getElementById(`store_${storeCode}`);
    if (!storeCard) return;
    
    const groupCard = storeCard.querySelector(`.group-card[data-group="${groupName}"]`);
    if (!groupCard) return;
    
    groupCard.classList.toggle('expanded');
};

window.toggleItemHighlight = async function(storeCode, groupName, itemName) {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    
    if (!periodId) return;
    
    const storeSettings = CURRENT_SETTINGS[storeCode] || {};
    const periodSettings = storeSettings[periodId] || {};
    const typeSettings = periodSettings[type] || {};
    const hiddenGroups = typeSettings.hiddenGroups || [];
    let highlights = typeSettings.highlights || [];
    
    const itemKey = `${groupName}-${itemName}`;
    const index = highlights.indexOf(itemKey);
    
    if (index > -1) {
        highlights = highlights.filter(h => h !== itemKey);
    } else {
        highlights.push(itemKey);
    }
    
    await fetch(`${API_URL}/settings/${storeCode}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            periodId: String(periodId),
            type,
            data: { hiddenGroups, highlights }
        })
    });
    
    // Update local cache without full reload
    if (!CURRENT_SETTINGS[storeCode]) CURRENT_SETTINGS[storeCode] = {};
    if (!CURRENT_SETTINGS[storeCode][periodId]) CURRENT_SETTINGS[storeCode][periodId] = {};
    if (!CURRENT_SETTINGS[storeCode][periodId][type]) CURRENT_SETTINGS[storeCode][periodId][type] = {};
    CURRENT_SETTINGS[storeCode][periodId][type].hiddenGroups = hiddenGroups;
    CURRENT_SETTINGS[storeCode][periodId][type].highlights = highlights;
    
    await renderStoreCards();
};

window.selectAllGroups = async function(storeCode, selectAll) {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    
    if (!periodId) return;
    
    const storeSettings = CURRENT_SETTINGS[storeCode] || {};
    const periodSettings = storeSettings[periodId] || {};
    const typeSettings = periodSettings[type] || {};
    const highlights = typeSettings.highlights || [];
    
    let hiddenGroups = [];
    if (!selectAll) {
        // Deselect all - add all groups to hidden
        hiddenGroups = ITEM_GROUPS.map(g => g.name);
    }
    // If selectAll, hiddenGroups stays empty
    
    await fetch(`${API_URL}/settings/${storeCode}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            periodId: String(periodId),
            type,
            data: { hiddenGroups, highlights }
        })
    });
    
    // Update local cache without full reload
    if (!CURRENT_SETTINGS[storeCode]) CURRENT_SETTINGS[storeCode] = {};
    if (!CURRENT_SETTINGS[storeCode][periodId]) CURRENT_SETTINGS[storeCode][periodId] = {};
    if (!CURRENT_SETTINGS[storeCode][periodId][type]) CURRENT_SETTINGS[storeCode][periodId][type] = {};
    CURRENT_SETTINGS[storeCode][periodId][type].hiddenGroups = hiddenGroups;
    CURRENT_SETTINGS[storeCode][periodId][type].highlights = highlights;
    
    await renderStoreCards();
};

// Bulk actions for table visibility
document.getElementById('btnSelectAllTables')?.addEventListener('click', () => {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    
    if (!periodId) return;
    
    if (!TABLE_VISIBILITY[periodId]) TABLE_VISIBILITY[periodId] = {};
    if (!TABLE_VISIBILITY[periodId][type]) TABLE_VISIBILITY[periodId][type] = {};
    
    ITEM_GROUPS.forEach(group => {
        TABLE_VISIBILITY[periodId][type][group.name] = true;
    });
    
    renderTableVisibilityGrid();
    
    fetch(`${API_URL}/table-visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TABLE_VISIBILITY)
    });
});

document.getElementById('btnDeselectAllTables')?.addEventListener('click', () => {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    
    if (!periodId) return;
    
    if (!TABLE_VISIBILITY[periodId]) TABLE_VISIBILITY[periodId] = {};
    if (!TABLE_VISIBILITY[periodId][type]) TABLE_VISIBILITY[periodId][type] = {};
    
    ITEM_GROUPS.forEach(group => {
        TABLE_VISIBILITY[periodId][type][group.name] = false;
    });
    
    renderTableVisibilityGrid();
    
    fetch(`${API_URL}/table-visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TABLE_VISIBILITY)
    });
});





// Global bulk actions for ALL stores
document.getElementById('btnSelectAllStores')?.addEventListener('click', async () => {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    
    if (!periodId) return;
    
    // Select all groups for ALL stores
    const promises = ALL_STORES.map(store => {
        const storeSettings = CURRENT_SETTINGS[store.code] || {};
        const periodSettings = storeSettings[periodId] || {};
        const typeSettings = periodSettings[type] || {};
        const highlights = typeSettings.highlights || [];
        
        return fetch(`${API_URL}/settings/${store.code}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                periodId: String(periodId),
                type,
                data: { hiddenGroups: [], highlights } // Empty hiddenGroups = all selected
            })
        });
    });
    
    await Promise.all(promises);
    await loadAllSettings();
    renderStoreCards();
});

document.getElementById('btnDeselectAllStores')?.addEventListener('click', async () => {
    const periodId = document.getElementById('settingsPeriodSelect')?.value;
    const type = document.querySelector('#typeSegmentContainer .segment-btn-modern.active')?.dataset.value || 'px';
    
    if (!periodId) return;
    
    // Deselect all groups for ALL stores
    const allHidden = ITEM_GROUPS.map(g => g.name);
    
    const promises = ALL_STORES.map(store => {
        const storeSettings = CURRENT_SETTINGS[store.code] || {};
        const periodSettings = storeSettings[periodId] || {};
        const typeSettings = periodSettings[type] || {};
        const highlights = typeSettings.highlights || [];
        
        return fetch(`${API_URL}/settings/${store.code}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                periodId: String(periodId),
                type,
                data: { hiddenGroups: allHidden, highlights } // All groups hidden = none selected
            })
        });
    });
    
    await Promise.all(promises);
    await loadAllSettings();
    renderStoreCards();
});
