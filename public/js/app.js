// ===== Data =====

// Türkçe ay isimleri
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// Tarihi Türkçe formata çevir (26 Aralık 2025)
function formatDateTR(dateStr) {
    if (!dateStr) return '-';

    // Excel serial number check (e.g., 43763)
    // Excel dates are numbers, typically between 1 (1900) and 50000+ (2030s)
    if (typeof dateStr === 'number' || (!isNaN(dateStr) && dateStr > 1000 && dateStr < 100000)) {
        // Convert Excel serial number to JavaScript Date
        // Excel epoch: January 1, 1900 (but Excel incorrectly treats 1900 as leap year)
        const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
        const days = parseInt(dateStr);
        const jsDate = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
        return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(jsDate);
    }

    // If format is like "12/26/2025" or "2025-12-26"
    // Try to parse Date object
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

const PERIODS = [
    { id: 1, name: 'Periyot 1', start: '12/26/2025', end: '1/22/2026', weeks: 4, quarter: 'Q1' },
    { id: 2, name: 'Periyot 2', start: '1/23/2026', end: '2/19/2026', weeks: 4, quarter: 'Q1' },
    { id: 3, name: 'Periyot 3', start: '2/20/2026', end: '3/26/2026', weeks: 5, quarter: 'Q1' },
    { id: 4, name: 'Periyot 4', start: '3/27/2026', end: '4/23/2026', weeks: 4, quarter: 'Q2' },
    { id: 5, name: 'Periyot 5', start: '4/24/2026', end: '5/21/2026', weeks: 4, quarter: 'Q2' },
    { id: 6, name: 'Periyot 6', start: '5/22/2026', end: '6/25/2026', weeks: 5, quarter: 'Q2' },
    { id: 7, name: 'Periyot 7', start: '6/26/2026', end: '7/23/2026', weeks: 4, quarter: 'Q3' },
    { id: 8, name: 'Periyot 8', start: '7/24/2026', end: '8/20/2026', weeks: 4, quarter: 'Q3' },
    { id: 9, name: 'Periyot 9', start: '8/21/2026', end: '9/24/2026', weeks: 5, quarter: 'Q3' },
    { id: 10, name: 'Periyot 10', start: '9/25/2026', end: '10/22/2026', weeks: 4, quarter: 'Q4' },
    { id: 11, name: 'Periyot 11', start: '10/23/2026', end: '11/19/2026', weeks: 4, quarter: 'Q4' },
    { id: 12, name: 'Periyot 12', start: '11/20/2026', end: '12/31/2026', weeks: 6, quarter: 'Q4' },
];

const API_URL = '/api';
let STORES = [];
let PERIOD_DATA = {}; // Will hold the period data
let TABLE_VISIBILITY = {}; // Will hold table visibility settings


const ITEM_GROUPS = [
    {
        name: 'Net Sales',
        items: ['Actual Net Sales', 'BP-2025 Net Sales', 'Actual vs BP Difference Net Sales', 'Actual vs BP Difference (%) Net Sales']
    },
    { name: 'COGS', items: ['Actual COGS', 'COGS %'] },
    { name: 'Royalty', items: ['Actual Royalty', 'Royalty %'] },
    {
        name: 'Store Margin',
        items: ['Actual Store Margin', 'Store Margin %', 'BP-2025 Store Margin', 'Actual vs BP Difference Store Margin', 'Actual vs BP Difference (%) Store Margin']
    },
    { name: 'Cost of Sales', items: ['Cost of Sales (Others)'] },
    {
        name: 'Operating Margin',
        items: ['Operating Margin', 'Operating Margin %', 'BP-2025 Operating Margin', 'Actual vs BP Difference Operating Margin', 'Actual vs BP Difference (%) Operating Margin']
    },
    {
        name: 'Staff Cost',
        items: ['Staff Cost', 'Staff Cost %', 'BP-2025 Staff Cost', 'Actual vs BP Difference Staff Cost', 'Actual vs BP Difference (%) Staff Cost']
    },
    {
        name: 'Controllables',
        items: ['Controllables', 'Controllables %', 'BP-2025 Controllables', 'Actual vs BP Difference Controllables', 'Actual vs BP Difference (%) Controllables']
    },
    {
        name: 'Rent',
        items: ['Rent', 'Rent %', 'BP-2025 Rent', 'Actual vs BP Difference Rent', 'Actual vs BP Difference (%) Rent']
    },
    {
        name: 'Depreciation',
        items: ['Depreciation', 'Depreciation %', 'BP-2025 Depreciation', 'Actual vs BP Difference Depreciation', 'Actual vs BP Difference (%) Depreciation']
    },
    {
        name: 'Store Contribution',
        items: ['Store Contribution', 'Store Contribution %', 'BP-2025 Store Contribution', 'Actual vs BP Difference Store Contribution', 'Actual vs BP Difference (%) Store Contribution']
    },
    { name: 'Cash +/- Stores', items: ['Cash +/- Stores'] }
];

// Fetch period data from API
async function fetchPeriodData(periodId) {
    try {
        const res = await fetch(`${API_URL}/data/${periodId}`);
        PERIOD_DATA = await res.json();
    } catch (err) {
        console.error('Error loading data:', err);
    }
}

// Data generator that uses real data if available
function getStoreGroupData(storeCode, groupName = 'Net Sales') {
    // If we have real data for the active source (px/ytd)
    const sourceData = PERIOD_DATA[state.dataSource]; // 'px' or 'ytd' array

    if (sourceData && sourceData.length > 0) {
        // Find row for this store
        // Match Store Code inside "EPM Store Name" column
        const row = sourceData.find(r => r['EPM Store Name'] && r['EPM Store Name'].includes(`-${storeCode}-`));

        if (row) {
            // Helper to parse float from comma string
            const parseTR = (val) => {
                if (!val) return 0;
                return parseFloat(val.replace(',', '.'));
            };

            // Map keys based on group name
            let actualPercentKey;

            switch (groupName) {
                case 'Net Sales':
                    actualKey = 'Actual Net Sales';
                    bpKey = 'BP-2025 Net Sales';
                    diffKey = 'Actual vs BP Difference Net sales'; // note lowercase s in sales
                    diffPercentKey = 'Actual vs BP Difference (%) net sales';
                    break;
                case 'COGS':
                    actualKey = 'Actual COGS';
                    actualPercentKey = 'cogs%'; // Direct % column
                    break;
                case 'Royalty':
                    actualKey = 'Actual Royalty';
                    actualPercentKey = 'royalty %'; // Direct % column
                    break;
                case 'Store Margin':
                    actualKey = 'Actual Store Margin';
                    actualPercentKey = 'store margin %';
                    bpKey = 'BP-2025 Store Margin';
                    diffKey = 'Actual vs BP Difference store margin';
                    diffPercentKey = 'Actual vs BP Difference (%) store margin';
                    break;
                case 'Operating Margin':
                    actualKey = 'Operating Margin';
                    actualPercentKey = 'operation margin %';
                    bpKey = 'BP-2025 Operating Margin';
                    diffKey = 'Actual vs BP Difference operation margin';
                    diffPercentKey = 'Actual vs BP Difference (%) operation margin';
                    break;
                case 'Staff Cost':
                    actualKey = 'Staff cost'; // "Staff cost" in CSV
                    actualPercentKey = 'staff cost %'; // Fixed: removed trailing space
                    bpKey = 'BP-2025 Staff Cost';
                    diffKey = 'Actual vs BP Difference staff cost';
                    diffPercentKey = 'Actual vs BP Difference (%) staff cost';
                    break;
                case 'Controllables':
                    actualKey = 'Controllables';
                    actualPercentKey = 'controllables%'; // Fixed: removed trailing space
                    bpKey = 'BP-2025 Controllables';
                    diffKey = 'Actual vs BP Difference controllables';
                    diffPercentKey = 'Actual vs BP Difference (%) controllables';
                    break;
                case 'Rent':
                    actualKey = 'Rent';
                    actualPercentKey = 'rent %';
                    bpKey = 'BP-2025 Rent';
                    diffKey = 'Actual vs BP Difference rent';
                    diffPercentKey = 'Actual vs BP Difference (%) rent';
                    break;
                case 'Depreciation':
                    actualKey = 'Depreciation';
                    actualPercentKey = 'depreciation%';
                    bpKey = 'BP-2025 Depreciation';
                    diffKey = 'Actual vs BP Difference depreciation';
                    diffPercentKey = 'Actual vs BP Difference (%) depreciation';
                    break;
                case 'Store Contribution':
                    actualKey = 'Store Contribution';
                    actualPercentKey = 'store contribution%';
                    bpKey = 'BP-2025 Store Contribution';
                    diffKey = 'Actual vs BP Difference store conribution'; // Typo in CSV "conribution"
                    diffPercentKey = 'Actual vs BP Difference (%) contribution';
                    break;
                case 'Cash +/- Stores':
                    actualKey = 'Cash +/-  Stores'; // Double space in CSV
                    break;
                default:
                    if (groupName === 'Cost of Sales') actualKey = 'Cost of Sales (Others)';
            }

            // Helper to process percentage strings
            // CSV'de yüzde değerleri farklı formatlarda gelebilir:
            // - "0,21" (0.21 = 21%) veya "21" (direkt 21%)
            const processPercent = (key) => {
                if (!key || !row[key]) return '0.0';
                const rawVal = row[key].toString().replace(',', '.');
                const pVal = parseFloat(rawVal);

                // Eğer değer 1'den küçükse (0.21 gibi), 100 ile çarp
                // Eğer değer 1'den büyükse (21 gibi), olduğu gibi kullan
                if (Math.abs(pVal) < 1) {
                    return (pVal * 100).toFixed(1);
                } else {
                    return pVal.toFixed(1);
                }
            };

            return {
                actual: parseTR(row[actualKey]),
                bp: bpKey ? parseTR(row[bpKey]) : 0,
                diff: diffKey ? parseTR(row[diffKey]) : 0,
                diffPercent: processPercent(diffPercentKey),
                actualPercent: actualPercentKey ? processPercent(actualPercentKey) : '0.0'
            };
        }
    }

    // No Data - Return Zeros (No Random!)
    return {
        actual: 0,
        bp: 0,
        diff: 0,
        diffPercent: '0.0',
        actualPercent: '0.0'
    };
}

function generateStoreTableData(groupName) {
    return STORES.map(store => {
        // Check if this group is visible for this store
        const storeSettings = state.allSettings[store.code] || {};
        const periodSettings = storeSettings[state.selectedPeriod?.id] || {};
        const typeSettings = periodSettings[state.dataSource] || {};
        const hiddenGroups = typeSettings.hiddenGroups || [];

        // If hiddenGroups is empty, it means nothing was saved yet (default state)
        // In that case, treat everything as hidden
        const isVisible = hiddenGroups.length === 0 ? false : !hiddenGroups.includes(groupName);

        return {
            ...store,
            ...getStoreGroupData(store.code, groupName),
            hasComment: !!(state.comments && state.comments[`${String(store.code).trim()}_${groupName}`]),
            isVisible: isVisible
        };
    });
}

// ===== State =====
let state = {
    selectedPeriod: null,
    currentMode: 'stores', // 'stores' or 'items'
    dataSource: 'px', // 'px' or 'ytd'
    selectedStore: null,
    tableFilters: {}, // { tableName: 'comment' | 'all' }
    tableSorts: {}, // { tableName: { column: string, direction: 'asc' | 'desc' } }
    expandedTable: null, // Currently expanded accordion table
    comments: {}, // { 'storeCode_tableName': 'comment text' }
    allComments: {}, // All periods comments
    storeSettings: {}, // Current SELECTED store settings
    allSettings: {}, // Cache of ALL store settings { storeCode: settingsObj }
    showAllItems: false // Toggle to show hidden items
};

// ===== DOM Elements =====
const elements = {
    periodSelectorBtn: document.getElementById('periodSelectorBtn'),
    periodText: document.getElementById('periodText'),
    periodModal: document.getElementById('periodModal'),
    closePeriodModal: document.getElementById('closePeriodModal'),
    periodList: document.getElementById('periodList'),
    contentArea: document.getElementById('contentArea'),
    storesTab: document.getElementById('storesTab'),
    itemsTab: document.getElementById('itemsTab'),
    pxTab: document.getElementById('pxTab'),
    ytdTab: document.getElementById('ytdTab'),
    pxLabel: document.getElementById('pxLabel'),
    storesContent: document.getElementById('storesContent'),
    itemsContent: document.getElementById('itemsContent'),
    storesGrid: document.getElementById('storesGrid'),
    storeItemsSection: document.getElementById('storeItemsSection'),
    selectedStoreName: document.getElementById('selectedStoreName'),
    itemGroupsGrid: document.getElementById('itemGroupsGrid'),
    itemsTables: document.getElementById('itemsTables'),
    adminBtn: document.getElementById('adminBtn'),
    commentModal: document.getElementById('commentModal'),
    commentModalTitle: document.getElementById('commentModalTitle'),
    commentModalSubtitle: document.getElementById('commentModalSubtitle'),
    commentItemsList: document.getElementById('commentItemsList'),
    closeCommentModal: document.getElementById('closeCommentModal'),
    commentTextareaContainer: document.getElementById('commentTextareaContainer'),
    savedCommentCard: document.getElementById('savedCommentCard'),
    savedCommentText: document.getElementById('savedCommentText'),
    inlineSaveBtn: document.getElementById('inlineSaveBtn'),
    inlineDeleteBtn: document.getElementById('inlineDeleteBtn'),
    editCommentBtn: document.getElementById('editCommentBtn'),
    deleteCommentBtn: document.getElementById('deleteCommentBtn')
};

// ===== Functions =====

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('tr-TR').format(num);
}

function renderPeriodList() {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    let html = '';

    quarters.forEach(quarter => {
        const quarterPeriods = PERIODS.filter(p => p.quarter === quarter);
        html += `
            <div class="period-quarter">
                <div class="period-quarter-title">${quarter} - ${quarter === 'Q1' ? '2025/2026' : '2026'}</div>
                ${quarterPeriods.map(period => `
                    <div class="period-item" data-period-id="${period.id}">
                        <div class="period-number">${period.id}</div>
                        <div class="period-info">
                            <div class="period-name">${period.name}</div>
                            <div class="period-dates">${formatDateTR(period.start)} – ${formatDateTR(period.end)}</div>
                        </div>
                        <div class="period-weeks">${period.weeks} hafta</div>
                    </div>
                `).join('')}
            </div>
        `;
    });

    elements.periodList.innerHTML = html;

    // Add click handlers
    document.querySelectorAll('.period-item').forEach(item => {
        item.addEventListener('click', () => {
            const periodId = parseInt(item.dataset.periodId);
            selectPeriod(periodId);
        });
    });
}

async function selectPeriod(periodId) {
    state.selectedPeriod = PERIODS.find(p => p.id === periodId);

    // Load ALL settings to determine visibility
    try {
        const res = await fetch(`${API_URL}/stores`); // Get list of stores to iterate? Or fetch settings dump?
        // Actually /api/settings/:code gives one. We need bulk?
        // Or we loop. Looping 15 stores is okay.
        // Better: Fetch stores, then fetch settings for all concurrently.
        const storesRes = await fetch(`${API_URL}/stores`);
        const stores = await storesRes.json();
        STORES = stores;

        // Parallel fetch settings
        const settingsPromises = stores.map(async s => {
            try {
                const r = await fetch(`${API_URL}/settings/${s.code}`);
                return { code: s.code, settings: await r.json() };
            } catch (e) { return { code: s.code, settings: {} }; }
        });

        const settingsResults = await Promise.all(settingsPromises);
        state.allSettings = {};
        settingsResults.forEach(item => {
            state.allSettings[item.code] = item.settings;
        });

    } catch (err) { console.error("Settings load error", err); }

    // Fetch data for this period
    await fetchPeriodData(periodId);

    // Load comments for this period
    await loadComments();

    // Update UI
    elements.periodText.textContent = state.selectedPeriod.name;
    elements.periodSelectorBtn.classList.add('active');

    // Update PX label to show period name
    elements.pxLabel.textContent = state.selectedPeriod.name;

    // Update active state in list
    document.querySelectorAll('.period-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.periodId) === periodId);
    });

    closePeriodModal();
    elements.contentArea.classList.remove('hidden');
    renderContent();
}

function openPeriodModal() {
    elements.periodModal.classList.add('active');
}

function closePeriodModal() {
    elements.periodModal.classList.remove('active');
}

function switchMode(mode) {
    state.currentMode = mode;
    state.selectedStore = null;

    elements.storesTab.classList.toggle('active', mode === 'stores');
    elements.itemsTab.classList.toggle('active', mode === 'items');

    elements.storesContent.classList.toggle('hidden', mode !== 'stores');
    elements.itemsContent.classList.toggle('hidden', mode !== 'items');

    elements.storeItemsSection.classList.add('hidden');
    renderContent();
}

async function switchDataSource(source) {
    state.dataSource = source;
    elements.pxTab.classList.toggle('active', source === 'px');
    elements.ytdTab.classList.toggle('active', source === 'ytd');

    // Reload comments for new source specific to period
    await loadComments();

    deselectStore();
    renderContent();
}

function renderContent() {
    if (state.currentMode === 'stores') {
        renderStoresGrid();
    } else {
        renderItemsTables();
    }
}

function renderStoresGrid() {
    // Don't render if no period selected
    if (!state.selectedPeriod) {
        elements.storesGrid.innerHTML = '';
        return;
    }

    elements.storesGrid.classList.remove('has-selection');

    // Filter stores for display, but keep STORES array complete
    const visibleStores = STORES.filter(store => {
        const storeSettings = state.allSettings[store.code] || {};
        const periodSettings = storeSettings[state.selectedPeriod.id] || {};
        const typeSettings = periodSettings[state.dataSource] || {};

        // If no settings exist for this period+type, don't show the store
        if (!typeSettings || typeSettings.hiddenGroups === undefined) {
            return false;
        }

        const hiddenGroups = typeSettings.hiddenGroups || [];
        const totalGroups = ITEM_GROUPS.length;
        const visibleCount = totalGroups - hiddenGroups.length;
        return visibleCount > 0;
    });

    // Show empty state if no stores are visible
    if (visibleStores.length === 0) {
        elements.storesGrid.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 7h-9"></path>
                    <path d="M14 17H5"></path>
                    <circle cx="17" cy="17" r="3"></circle>
                    <circle cx="7" cy="7" r="3"></circle>
                </svg>
                <h3>Periyot Henüz Tamamlanmadı</h3>
                <p>Bu periyot için henüz mağaza seçimi yapılmamış. Admin panelinden mağaza kalemlerini seçerek başlayabilirsiniz.</p>
            </div>
        `;
        return;
    }

    elements.storesGrid.innerHTML = visibleStores.map(store => {
        return `
        <div class="store-card" data-store-code="${store.code}">
            <div class="store-card-header">
                <div class="store-name-wrapper">
                    <div class="store-name-only">${store.name.replace(/^STA\s*[-–]?\s*/i, '')}</div>
                    <div class="store-info">
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Açılış: ${formatDateTR(store.openingDate)}
                        </span>
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            </svg>
                            Alan: ${store.area || 0} m²
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');

    document.querySelectorAll('.store-card').forEach(card => {
        card.addEventListener('click', () => {
            const storeCode = card.dataset.storeCode;
            selectStore(storeCode);
        });
    });
}

async function selectStore(storeCode) {
    // Toggle selection
    if (state.selectedStore === storeCode) {
        deselectStore();
    } else {
        // Select new
        state.selectedStore = storeCode;
        const store = STORES.find(s => s.code === storeCode);
        elements.selectedStoreName.textContent = store ? store.name : '';
        state.expandedTable = null; // Reset accordions

        // Update cards visual state (New Animation Logic)
        document.querySelectorAll('.store-card').forEach(c => {
            if (c.dataset.storeCode === storeCode) {
                c.classList.add('active');
                c.classList.remove('dimmed');
                c.classList.remove('hidden-store'); // Ensure visible
            } else {
                c.classList.remove('active');
                // V4: Completely Hide
                c.classList.add('hidden-store');
                // c.classList.add('dimmed'); // Deprecated for V4
            }
        });
        elements.storesGrid.classList.add('has-selection');

        // Fetch settings for this store
        try {
            const res = await fetch(`${API_URL}/settings/${storeCode}`);
            state.storeSettings = await res.json();
        } catch (err) {
            console.error('Settings fetch error:', err);
            state.storeSettings = {};
        }

        // Show items section
        renderItemGroups();
        elements.storeItemsSection.classList.remove('hidden');
        elements.storeItemsSection.classList.add('animate-slide-in');

        // Scroll to items
        setTimeout(() => {
            elements.storeItemsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
}

// Helper to get granular settings
function getGranularSettings() {
    if (!state.storeSettings || !state.selectedPeriod) return { hiddenGroups: [], highlights: [], hasSettings: false };
    const periodSettings = state.storeSettings[state.selectedPeriod.id] || {};
    const typeSettings = periodSettings[state.dataSource] || {};

    // Check if settings exist for this period+type
    const hasSettings = typeSettings && typeSettings.hiddenGroups !== undefined;

    return {
        hiddenGroups: typeSettings.hiddenGroups || [],
        highlights: typeSettings.highlights || [],
        hasSettings: hasSettings
    };
}

function deselectStore() {
    state.selectedStore = null;
    elements.selectedStoreName.textContent = '';
    state.expandedTable = null;
    state.storeSettings = {};

    document.querySelectorAll('.store-card').forEach(c => {
        c.classList.remove('active');
        c.classList.remove('dimmed');
        c.classList.remove('hidden-store'); // Show all again
    });
    elements.storesGrid.classList.remove('has-selection');

    elements.storeItemsSection.classList.add('hidden');
    elements.storeItemsSection.classList.remove('animate-slide-in');
}


function renderItemGroups() {
    if (!state.selectedStore) return;

    // Get settings (Granular)
    const { hiddenGroups = [], highlights = [], hasSettings = false } = getGranularSettings();

    // If no settings exist for this period+type, show empty state
    if (!hasSettings) {
        elements.itemGroupsGrid.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="12" x2="15" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <h3>Henüz Kalem Seçilmedi</h3>
                <p>Bu mağaza için henüz kalem seçimi yapılmamış. Admin panelinden kalem gruplarını seçerek başlayabilirsiniz.</p>
            </div>
        `;
        return;
    }

    // Filter visible groups
    const visibleGroups = ITEM_GROUPS.filter(group => {
        return !hiddenGroups.includes(group.name) || state.showAllItems;
    });

    // Show empty state if no groups are visible
    if (visibleGroups.length === 0) {
        elements.itemGroupsGrid.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="12" x2="15" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <h3>Henüz Kalem Seçilmedi</h3>
                <p>Bu mağaza için henüz kalem seçimi yapılmamış. Admin panelinden kalem gruplarını seçerek başlayabilirsiniz.</p>
            </div>
        `;
        return;
    }

    elements.itemGroupsGrid.innerHTML = ITEM_GROUPS.map(group => {
        // Check visibility
        if (hiddenGroups.includes(group.name) && !state.showAllItems) return '';

        // Generate stats for this specific group/store context
        const stats = getStoreGroupData(state.selectedStore, group.name);

        // Helper to get value based on item text
        const getValueForItem = (itemText) => {
            // Check for highlights
            // Key format must match admin.js: GroupName-ItemName
            const itemKey = `${group.name}-${itemText}`;
            const isHighlighted = highlights.includes(itemKey);
            const highlightClass = isHighlighted ? 'highlight-yellow' : '';

            if (itemText.includes('Difference (%)') || itemText.includes('%')) {
                // If it is a difference percentage, use diffPercent
                // If it is a standard percentage (Store Margin %, etc.), use actualPercent
                const displayVal = itemText.includes('Difference') ? stats.diffPercent : stats.actualPercent;

                return `<span class="value ${parseFloat(displayVal) >= 0 ? 'positive' : 'negative'} ${highlightClass}">%${displayVal}</span>`;
            }
            if (itemText.includes('Difference') || itemText.includes('Fark')) {
                return `<span class="value ${stats.diff >= 0 ? 'positive' : 'negative'} ${highlightClass}">${formatNumber(stats.diff)}</span>`;
            }
            if (itemText.includes('BP-2025')) return `<span class="value ${highlightClass}">${formatNumber(stats.bp)}</span>`;
            if (itemText.includes('Actual') || itemText === group.name) return `<span class="value ${highlightClass}">${formatNumber(stats.actual)}</span>`;

            return `<span class="value ${highlightClass}">-</span>`;
        };

        const listItems = group.items.slice(0, 5).map(item => `
            <div class="item-group-row">
                <span class="label">${item.replace(group.name, '').trim() || item}</span>
                ${getValueForItem(item)}
            </div>
        `).join('');

        return `
            <div class="item-group-card" data-group-name="${group.name}">
                <div class="item-group-name">${group.name}</div>
                <div class="item-group-detail-list">
                    ${listItems}
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers to open comment modal
    document.querySelectorAll('.item-group-card').forEach(card => {
        card.addEventListener('click', () => {
            const groupName = card.dataset.groupName;
            openCommentModal(state.selectedStore, groupName);
        });
    });
}



function renderItemsTables() {
    // Remove Show All Toggle if exists (deprecated)
    let toggleContainer = document.getElementById('itemsToggleContainer');
    if (toggleContainer) {
        toggleContainer.remove();
    }

    // BP'siz kalemler (sadece Actual ve %)
    const noBpItems = ['COGS', 'Royalty', 'Cost of Sales', 'Cash +/- Stores'];

    const tablesHtml = ITEM_GROUPS
        .filter(group => {
            // Filter out hidden tables based on admin settings (period + type specific)
            return isTableVisible(group.name);
        })
        .map((group, index) => {
            const filter = state.tableFilters[group.name] || 'comment'; // Default: yorum
            state.tableFilters[group.name] = filter;

            const tableData = generateStoreTableData(group.name);

            // Filter Logic
            let filteredData = tableData;

            if (filter === 'all') {
                // "Hepsi": Show ALL 15 stores (no filtering)
                filteredData = tableData;
            } else if (filter === 'comment') {
                // "Yorum": Show stores with comments REGARDLESS of visibility settings
                filteredData = tableData.filter(storeData => {
                    return storeData.hasComment;
                });
            }

            // Check if any store has comments for this table
            const hasAnyComments = tableData.some(s => s.hasComment);

            const hasBp = !noBpItems.includes(group.name);
            const isExpanded = state.expandedTable === group.name;

            // Apply sorting
            const sort = state.tableSorts[group.name];
            if (sort) {
                filteredData.sort((a, b) => {
                    let aVal = a[sort.column];
                    let bVal = b[sort.column];

                    // For numeric columns, parse as numbers
                    if (sort.column === 'actual' || sort.column === 'bp' || sort.column === 'diff' || sort.column === 'diffPercent') {
                        aVal = parseFloat(aVal) || 0;
                        bVal = parseFloat(bVal) || 0;
                    } else if (sort.column === 'percent') {
                        // For percent column, remove % sign and parse as number
                        aVal = parseFloat(String(aVal).replace('%', '').replace(',', '.')) || 0;
                        bVal = parseFloat(String(bVal).replace('%', '').replace(',', '.')) || 0;
                    } else if (typeof aVal === 'string') {
                        aVal = aVal.toLowerCase();
                        bVal = bVal.toLowerCase();
                    }

                    if (sort.direction === 'asc') {
                        return aVal > bVal ? 1 : -1;
                    } else {
                        return aVal < bVal ? 1 : -1;
                    }
                });
            } else {
                // Default sort by diffPercent (worst performers first)
                filteredData.sort((a, b) => a.diffPercent - b.diffPercent);
            }

            // Tablo başlıkları - BP olan ve olmayan için farklı
            const tableHeaders = hasBp ? `
            <th class="sortable" data-column="index">#</th>
            <th class="sortable" data-column="code">Mağaza</th>
            <th class="sortable number-cell" data-column="actual">Actual</th>
            <th class="sortable number-cell" data-column="bp">BP-2025</th>
            <th class="sortable number-cell" data-column="diff">Fark</th>
            <th class="sortable number-cell" data-column="diffPercent">% Fark</th>
        ` : `
            <th class="sortable" data-column="index">#</th>
            <th class="sortable" data-column="code">Mağaza</th>
            <th class="sortable number-cell" data-column="actual">Actual</th>
            <th class="sortable number-cell" data-column="percent">%</th>
        `;

            // Tablo satırları - sıra numarası ekle
            const tableRows = hasBp ? filteredData.map((row, idx) => `
            <tr class="clickable-row" data-store-code="${row.code}" data-table-name="${group.name}">
                <td class="number-cell" data-label="#">${idx + 1}</td>
                <td class="store-cell" data-label="Mağaza">${row.name}</td>
                <td class="number-cell" data-label="Actual">${formatNumber(row.actual)}</td>
                <td class="number-cell" data-label="BP-2025">${formatNumber(row.bp)}</td>
                <td class="number-cell ${row.diff >= 0 ? 'positive' : 'negative'}" data-label="Fark">${formatNumber(row.diff)}</td>
                <td class="number-cell ${row.diffPercent >= 0 ? 'positive' : 'negative'}" data-label="% Fark">${row.diffPercent}%</td>
            </tr>
        `).join('') : filteredData.map((row, idx) => {
                const percent = (15 + Math.random() * 10).toFixed(1);
                return `
                <tr class="clickable-row" data-store-code="${row.code}" data-table-name="${group.name}">
                    <td class="number-cell" data-label="#">${idx + 1}</td>
                    <td class="store-cell" data-label="Mağaza">${row.name}</td>
                    <td class="number-cell" data-label="Actual">${formatNumber(row.actual)}</td>
                    <td class="number-cell" data-label="%">${percent}%</td>
                </tr>
            `;
            }).join('');

            const colSpan = hasBp ? 6 : 4;

            return `
            <div class="items-table-container ${isExpanded ? 'expanded' : ''} ${hasAnyComments ? 'has-comments' : ''}" data-table-name="${group.name}">
                <div class="table-header" data-table-toggle="${group.name}">
                    <div class="table-title-wrapper">
                        <svg class="table-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                        <div class="table-title">${group.name.toUpperCase()}</div>
                    </div>
                    <div class="table-info">
                        <span class="table-count">${filteredData.length} mağaza</span>
                        <div class="table-filters" onclick="event.stopPropagation()">
                            <button class="filter-btn ${filter === 'comment' ? 'active' : ''}" data-filter="comment">Yorum</button>
                            <button class="filter-btn ${filter === 'all' ? 'active' : ''}" data-filter="all">Hepsi</button>
                        </div>
                    </div>
                </div>
                <div class="table-content">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${tableHeaders}
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredData.length > 0 ? tableRows : `
                                <tr>
                                    <td colspan="${colSpan}" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                                        ${filter === 'comment' ? 'Henüz yorum yapılmadı' : 'Veri bulunamadı'}
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        }).join('');

    elements.itemsTables.innerHTML = tablesHtml;

    // Add accordion toggle handlers
    document.querySelectorAll('.table-header[data-table-toggle]').forEach(header => {
        header.addEventListener('click', (e) => {
            // Don't toggle if clicking on filters
            if (e.target.closest('.table-filters')) return;

            const tableName = header.dataset.tableToggle;
            toggleAccordion(tableName);
        });
    });

    // Add scroll detection for mobile fade effect
    document.querySelectorAll('.table-content').forEach(tableContent => {
        tableContent.addEventListener('scroll', function () {
            // Mark as scrolled (to hide scroll hint)
            this.classList.add('scrolled');

            // Check if scrolled to end (to hide fade effect)
            const isScrolledToEnd = this.scrollLeft + this.clientWidth >= this.scrollWidth - 5;
            if (isScrolledToEnd) {
                this.classList.add('scrolled-end');
            } else {
                this.classList.remove('scrolled-end');
            }
        });
    });

    // Add filter handlers
    document.querySelectorAll('.table-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tableName = e.target.closest('.items-table-container').dataset.tableName;
            const filter = e.target.dataset.filter;
            state.tableFilters[tableName] = filter;
            renderItemsTables();
        });
    });

    // Add sort handlers
    document.querySelectorAll('.data-table th.sortable').forEach(th => {
        th.addEventListener('click', (e) => {
            const tableName = e.target.closest('.items-table-container').dataset.tableName;
            const column = e.target.dataset.column;
            const currentSort = state.tableSorts[tableName];

            if (currentSort && currentSort.column === column) {
                state.tableSorts[tableName] = {
                    column,
                    direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
                };
            } else {
                state.tableSorts[tableName] = { column, direction: 'desc' };
            }

            renderItemsTables();
        });
    });

    // Add row click handlers for comment modal
    document.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', () => {
            const storeCode = row.dataset.storeCode;
            const tableName = row.dataset.tableName;
            openCommentModal(storeCode, tableName);
        });
    });
}

// Accordion toggle function
function toggleAccordion(tableName) {
    if (state.expandedTable === tableName) {
        // Collapse if already expanded
        state.expandedTable = null;
    } else {
        // Expand this one (will auto-collapse others)
        state.expandedTable = tableName;
    }

    // Update UI without full re-render for smoother animation
    document.querySelectorAll('.items-table-container').forEach(container => {
        if (container.dataset.tableName === state.expandedTable) {
            container.classList.add('expanded');
        } else {
            container.classList.remove('expanded');
        }
    });
}

// Comment modal state
let currentCommentKey = null;

// Open comment modal with store and item group info
async function openCommentModal(storeCode, tableName) {
    const store = STORES.find(s => s.code === storeCode);
    const group = ITEM_GROUPS.find(g => g.name === tableName);

    if (!store || !group) return;

    currentCommentKey = `${storeCode}_${tableName}`;

    // Set modal titles
    elements.commentModalTitle.textContent = store.name;
    elements.commentModalSubtitle.textContent = group.name;

    // Get store data for this group
    const storeData = getStoreGroupData(storeCode, tableName);

    // Render item list with highlights and REAL DATA
    const storeSettings = await fetch(`${API_URL}/settings/${storeCode}`).then(r => r.json());
    const periodSettings = storeSettings[state.selectedPeriod.id] || {};
    const typeSettings = periodSettings[state.dataSource] || {};
    const highlights = typeSettings.highlights || [];

    // Create grid with real data - her item için doğru değer
    const itemsHtml = group.items.map(item => {
        const itemKey = `${tableName}-${item}`;
        const isHighlighted = highlights.includes(itemKey);

        // Her item için doğru değeri ve renk sınıfını bul
        let displayValue = '-';
        let valueColorClass = '';

        // Item ismini kontrol et ve ona göre değer ata
        const itemLower = item.toLowerCase();

        if (itemLower.includes('actual') && !itemLower.includes('bp') && !itemLower.includes('difference')) {
            // Actual değeri
            if (itemLower.includes('%')) {
                displayValue = (storeData.actualPercent && storeData.actualPercent !== '0.0')
                    ? `${storeData.actualPercent}%`
                    : '-';
            } else {
                displayValue = formatNumber(storeData.actual);
            }
        } else if (itemLower.includes('bp-2025') || itemLower.includes('bp 2025')) {
            // BP değeri
            displayValue = formatNumber(storeData.bp);
        } else if (itemLower.includes('difference') && itemLower.includes('%')) {
            // Fark yüzdesi - renklendirme uygula
            displayValue = `${storeData.diffPercent}%`;
            const numVal = parseFloat(storeData.diffPercent);
            if (!isNaN(numVal)) valueColorClass = numVal >= 0 ? 'positive' : 'negative';
        } else if (itemLower.includes('difference') || itemLower.includes('fark')) {
            // Fark değeri - renklendirme uygula
            displayValue = formatNumber(storeData.diff);
            valueColorClass = storeData.diff >= 0 ? 'positive' : 'negative';
        } else if (item === group.name) {
            // Grup adının kendisi - Actual değeri göster
            displayValue = formatNumber(storeData.actual);
        } else if (itemLower.includes('%')) {
            // Sadece % içeren diğer itemler
            displayValue = (storeData.actualPercent && storeData.actualPercent !== '0.0')
                ? `${storeData.actualPercent}%`
                : '-';
        }

        return `
            <div class="comment-item ${isHighlighted ? 'highlighted' : ''}">
                <span class="comment-item-bullet"></span>
                <span class="comment-item-label">${item}</span>
                <span class="comment-item-value ${valueColorClass}">${displayValue}</span>
            </div>
        `;
    }).join('');

    elements.commentItemsList.innerHTML = `
        <h3>Kalem Başlıkları</h3>
        <div class="comment-items-grid">
            ${itemsHtml}
        </div>
    `;

    // Load existing comment
    const commentData = state.comments[currentCommentKey];
    const existingComment = getCommentText(commentData);

    const textarea = document.getElementById('commentMainTextarea');
    const charCounter = document.getElementById('commentCharCounter');
    const deleteBtn = document.getElementById('inlineDeleteBtn');
    const container = document.getElementById('commentTextareaContainer');

    // Always show textarea (enabled)
    showTextareaMode();
    if (textarea) {
        textarea.value = existingComment;
        textarea.disabled = false;
        updateCharCounter(textarea, charCounter);
        autoResizeTextarea(textarea);

        // Add keydown listener for Enter behavior
        textarea.removeEventListener('keydown', handleTextareaKeydown);
        textarea.addEventListener('keydown', handleTextareaKeydown);

        // Add focus listener to reactivate after save
        textarea.removeEventListener('focus', handleTextareaFocus);
        textarea.addEventListener('focus', handleTextareaFocus);
    }

    // Show/hide delete button based on existing comment
    if (deleteBtn) {
        if (existingComment) {
            deleteBtn.classList.remove('hidden');
            deleteBtn.style.display = 'inline-flex';

            // Eğer yorum kaydedilmişse ve modal açıldıysa, yine de textarea göster (düzenlenebilir)
            // showSavedCommentCard(commentData); <--- BU SATIR KALDIRILDI
            showTextareaMode();
        } else {
            deleteBtn.classList.add('hidden');
            deleteBtn.style.display = 'none';
        }
    }

    // Container başlangıç durumu - eğer içerik varsa has-content, yoksa inactive
    if (container) {
        if (existingComment.trim().length > 0) {
            container.classList.add('has-content');
            container.classList.remove('inactive');
        } else {
            container.classList.remove('has-content');
            container.classList.add('inactive');
        }
    }

    // Show modal
    elements.commentModal.classList.add('active');
}

// Auto-resize textarea as user types
function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 400) + 'px';
}

// Helper to get text from comment (string or object)
function getCommentText(comment) {
    if (!comment) return '';
    if (typeof comment === 'object') return comment.text || '';
    return comment;
}

// Show saved comment card
function showSavedCommentCard(commentData) {
    elements.savedCommentCard.classList.remove('hidden');
    elements.commentTextareaContainer.classList.add('hidden');

    const text = getCommentText(commentData);
    const author = (typeof commentData === 'object' && commentData.author) ? commentData.author : '';
    const dateStr = (typeof commentData === 'object' && commentData.timestamp) ?
        new Date(commentData.timestamp).toLocaleString('tr-TR') : '';

    let html = `<div class="comment-text">${text}</div>`;

    if (author) {
        html += `
            <div class="comment-meta" style="margin-top: 0.5rem; font-size: 0.75rem; color: #666; display: flex; justify-content: space-between;">
                <span class="comment-author"><strong>${author}</strong></span>
                <span class="comment-date">${dateStr}</span>
            </div>
        `;
    }

    elements.savedCommentText.innerHTML = html;
}

// Show textarea mode
function showTextareaMode() {
    elements.savedCommentCard.classList.add('hidden');
    elements.commentTextareaContainer.classList.remove('hidden');
}

// Update character counter and save icon visibility
function updateCharCounter(textarea, counter) {
    if (counter) {
        const length = textarea.value.length;
        counter.textContent = `${length}`;
    }

    // Auto-resize textarea
    autoResizeTextarea(textarea);

    // Show/hide save icon based on content
    const container = document.getElementById('commentTextareaContainer');
    if (!container) return;

    if (textarea.value.trim().length > 0) {
        container.classList.add('has-content');
        container.classList.remove('inactive');
    } else {
        container.classList.remove('has-content');
        container.classList.add('inactive');
    }
}

// Handle textarea keydown for Enter behavior
function handleTextareaKeydown(e) {
    // Shift+Enter: Save comment (optional - can be removed if you only want button save)
    if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        saveComment();
    }
    // Enter alone: Allow new line (default behavior - do nothing)
}

// Get current comment text from single textarea
function getCurrentCommentText() {
    const textarea = document.getElementById('commentMainTextarea');
    return textarea ? textarea.value.trim() : '';
}

// Save comment
async function saveComment() {
    try {
        const commentText = getCurrentCommentText();

        if (!currentCommentKey) {
            alert('Hata: Yorum anahtarı bulunamadı. Lütfen sayfayı yenileyin.');
            return;
        }

        if (!commentText) {
            return;
        }

        if (!state.selectedPeriod) {
            alert('Hata: Periyot seçili değil.');
            return;
        }

        // Local Storage'dan kullanıcı adını al - ARTIK ZORUNLU DEĞİL
        let username = localStorage.getItem('pnl_comment_author') || 'Misafir';

        // Prompt kaldırıldı - Kullanıcı adı istemiyoruz.

        const commentObj = {
            key: currentCommentKey,
            text: commentText,
            author: username,
            timestamp: new Date().toISOString(),
            periodId: state.selectedPeriod.id, // YENİ: Periyot ID
            type: state.dataSource // YENİ: Veri Tipi (px/ytd)
        };

        // Save to backend
        const res = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commentObj)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error('Save failed: ' + errorText);
        }

        const result = await res.json();

        // Update local state - store full object
        state.comments[currentCommentKey] = commentObj;

        // EKRAN DEĞİŞİKLİĞİNİ ENGELLE - Saved Card yerine Textarea kalsın
        // showSavedCommentCard(commentObj); <--- BU SATIRI KALDIRDIK

        // Animate save icon
        const saveBtn = document.getElementById('inlineSaveBtn');
        const deleteBtn = document.getElementById('inlineDeleteBtn');

        if (saveBtn) {
            saveBtn.classList.add('saving');
            // İkonu geçici olarak onay işaretine çevir
            const originalHTML = saveBtn.innerHTML;
            saveBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="width: 18px; height: 18px; display: block;">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            `;

            setTimeout(() => {
                saveBtn.classList.remove('saving');
                saveBtn.innerHTML = originalHTML;
            }, 1500);
        }

        // Show delete button
        if (deleteBtn) {
            deleteBtn.classList.remove('hidden');
            deleteBtn.style.display = 'inline-flex';
        }

        // Re-render to update comment indicators (arkaplanda)
        setTimeout(async () => {
            if (state.currentMode === 'items') {
                await loadComments(); // Refresh current period comments
                renderItemsTables();
            }
        }, 400);

    } catch (err) {
        console.error('❌ Comment save error:', err);
        alert('Yorum kaydedilemedi: ' + err.message);
    }
}

// Edit comment
function editComment() {
    const commentData = state.comments[currentCommentKey];
    const commentText = getCommentText(commentData);
    const textarea = document.getElementById('commentMainTextarea');
    const charCounter = document.getElementById('commentCharCounter');
    const container = document.getElementById('commentTextareaContainer');

    if (textarea) {
        textarea.value = commentText;
        textarea.disabled = false;
        updateCharCounter(textarea, charCounter);

        // Add input listener for char counter
        textarea.removeEventListener('input', handleTextareaInput);
        textarea.addEventListener('input', handleTextareaInput);

        // Add focus listener
        textarea.removeEventListener('focus', handleTextareaFocus);
        textarea.addEventListener('focus', handleTextareaFocus);
    }

    // Container'ı aktif yap
    if (container && commentText.trim().length > 0) {
        container.classList.remove('inactive');
        container.classList.add('has-content');
    }

    showTextareaMode();
    setTimeout(() => textarea.focus(), 100);
}

// Delete comment (inline button)
function deleteInlineComment() {
    if (!currentCommentKey) return;

    // Show custom delete confirmation modal
    const deleteModal = document.getElementById('deleteConfirmModal');
    if (deleteModal) {
        deleteModal.classList.add('active');
    }
}

// Confirm delete action
async function confirmDelete() {
    if (!currentCommentKey) return;

    try {
        if (!state.selectedPeriod) return;

        // Delete from backend
        // Query params ile periodId ve type gönderiyoruz
        const params = new URLSearchParams({
            periodId: state.selectedPeriod.id,
            type: state.dataSource
        });

        const res = await fetch(`${API_URL}/comments/${currentCommentKey}?${params.toString()}`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error('Delete failed');

        // Delete from local state
        delete state.comments[currentCommentKey];

        // Clear textarea and hide delete button
        const textarea = document.getElementById('commentMainTextarea');
        const charCounter = document.getElementById('commentCharCounter');
        const deleteBtn = document.getElementById('inlineDeleteBtn');

        if (textarea) {
            textarea.value = '';
            textarea.disabled = false;
            updateCharCounter(textarea, charCounter);
        }

        if (deleteBtn) {
            deleteBtn.classList.add('hidden');
            deleteBtn.style.display = 'none';
        }

        // Close delete modal
        closeDeleteModal();

        // Re-render to update comment indicators
        if (state.currentMode === 'items') {
            await loadComments(); // Refresh current period comments
            renderItemsTables();
        }
    } catch (err) {
        console.error('Comment delete error:', err);
        alert('Yorum silinemedi. Lütfen tekrar deneyin.');
        closeDeleteModal();
    }
}

// Close delete confirmation modal
function closeDeleteModal() {
    const deleteModal = document.getElementById('deleteConfirmModal');
    if (deleteModal) {
        deleteModal.classList.remove('active');
    }
}

// Handle textarea input
function handleTextareaInput() {
    const textarea = document.getElementById('commentMainTextarea');
    const charCounter = document.getElementById('commentCharCounter');
    if (textarea && charCounter) {
        updateCharCounter(textarea, charCounter);
    }
}

// Handle textarea focus - inactive durumunu kaldır
function handleTextareaFocus() {
    const container = document.getElementById('commentTextareaContainer');
    const textarea = document.getElementById('commentMainTextarea');

    if (container && textarea) {
        // Eğer içerik varsa, inactive'i kaldır ve has-content ekle
        if (textarea.value.trim().length > 0) {
            container.classList.remove('inactive');
            container.classList.add('has-content');
        }
    }
}

// Close comment modal
function closeCommentModal() {
    elements.commentModal.classList.remove('active');
    currentCommentKey = null;

    // Reset to textarea mode
    showTextareaMode();
}

// Load comments from backend
async function loadComments() {
    if (!state.selectedPeriod) return;

    try {
        // Query params ile periodId ve type gönderiyoruz
        const params = new URLSearchParams({
            periodId: state.selectedPeriod.id,
            type: state.dataSource
        });

        const res = await fetch(`${API_URL}/comments?${params.toString()}`);
        if (res.ok) {
            const comments = await res.json();
            state.comments = comments || {};
        } else {
            state.comments = {};
        }

        // Render update if needed
        if (state.currentMode === 'items') {
            renderItemsTables();
        }

    } catch (error) {
        state.comments = {};
    }
}

// Load ALL comments for filtering across periods
async function loadAllComments() {
    try {
        const res = await fetch(`${API_URL}/comments`); // No params = get all
        if (res.ok) {
            const comments = await res.json();
            state.allComments = comments || {};
        } else {
            console.warn('Failed to load all comments');
            state.allComments = {};
        }
    } catch (error) {
        console.error('All comments load error:', error);
        state.allComments = {};
    }
}

// ===== Event Listeners =====
elements.periodSelectorBtn.addEventListener('click', openPeriodModal);
elements.closePeriodModal.addEventListener('click', closePeriodModal);
elements.periodModal.addEventListener('click', (e) => {
    if (e.target === elements.periodModal) {
        closePeriodModal();
    }
});

elements.storesTab.addEventListener('click', () => switchMode('stores'));
elements.itemsTab.addEventListener('click', () => switchMode('items'));

elements.pxTab.addEventListener('click', () => switchDataSource('px'));
elements.ytdTab.addEventListener('click', () => switchDataSource('ytd'));

elements.adminBtn.addEventListener('click', () => {
    window.location.href = 'admin.html';
});

// Comment modal event listeners
elements.closeCommentModal.addEventListener('click', closeCommentModal);
elements.commentModal.addEventListener('click', (e) => {
    if (e.target === elements.commentModal) {
        closeCommentModal();
    }
});

// Inline action buttons
elements.inlineSaveBtn.addEventListener('click', saveComment);
elements.inlineDeleteBtn.addEventListener('click', deleteInlineComment);

// Edit and delete buttons (saved card)
elements.editCommentBtn.addEventListener('click', editComment);
elements.deleteCommentBtn.addEventListener('click', deleteInlineComment);

// Textarea input listener
const commentTextarea = document.getElementById('commentMainTextarea');
if (commentTextarea) {
    commentTextarea.addEventListener('input', handleTextareaInput);
}

// Textarea input listener (for char counter)
const textarea = document.getElementById('commentMainTextarea');
if (textarea) {
    textarea.addEventListener('input', handleTextareaInput);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePeriodModal();
        closeCommentModal();
    }
});

// ===== Initialize =====
// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadStores(); // Load stores from API
    loadComments();
    loadAllComments();
    renderPeriodList();
    loadSystemStatus();
});

async function loadSystemStatus() {
    try {
        const res = await fetch(`${API_URL}/status`);
        if (res.ok) {
            const data = await res.json();
            const date = new Date(data.lastUpdated);
            const formatted = date.toLocaleString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const el = document.getElementById('lastUpdatedInfo');
            if (el) el.textContent = `Son Güncelleme: ${formatted}`;
        }
    } catch (err) {
        console.error('Status load error:', err);
    }
}

async function loadStores() {
    try {
        const res = await fetch(`${API_URL}/stores`);
        const data = await res.json();
        // Filter visible stores if we had that logic, for now use all
        STORES = data.length > 0 ? data : [];

        // Load table visibility settings
        await loadTableVisibility();

        // If no stores from API (first run), maybe show empty state or keep empty
        // Re-render
        renderStoresGrid();
    } catch (err) {
        console.error('Error loading stores:', err);
    }
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

function isTableVisible(tableName) {
    if (!state.selectedPeriod) return false; // Default hidden if no period selected

    const periodId = state.selectedPeriod.id;
    const type = state.dataSource; // 'px' or 'ytd'

    const periodSettings = TABLE_VISIBILITY[periodId] || {};
    const typeSettings = periodSettings[type] || {};

    // Check if settings exist for this period+type
    const hasSettings = Object.keys(typeSettings).length > 0;

    // If no settings exist, default to HIDDEN (false)
    // If settings exist, use the saved value (default true if not explicitly set to false)
    if (!hasSettings) {
        return false;
    }

    return typeSettings[tableName] !== false;
}

// Delete confirmation modal listeners
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDelete);
}

if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
}

if (deleteConfirmModal) {
    deleteConfirmModal.addEventListener('click', (e) => {
        if (e.target === deleteConfirmModal) {
            closeDeleteModal();
        }
    });
}
