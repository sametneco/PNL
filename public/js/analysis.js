document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check Removed - Public Access Allowed
    checkAuthStatus();

    // Init
    loadPeriods();
    setupListeners();
});

// Check auth status for header button
function checkAuthStatus() {
    const token = localStorage.getItem('pnl_auth_token');
    const adminBtn = document.querySelector('.admin-btn');
    if (adminBtn) {
        if (token) {
            // Logged in -> Go to Admin Panel
            adminBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                Admin Panel
            `;
            adminBtn.onclick = () => window.location.href = 'admin.html';
        } else {
            // Not logged in -> Go to Login
            adminBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Yönetici Girişi
            `;
            adminBtn.onclick = () => window.location.href = 'login.html?return=analysis.html';
        }
    }
}

const API_URL = '/api';
let ALL_DATA = { px: {}, ytd: {} };
let SELECTED_METRIC = 'Actual Net Sales';
let FILTER_STORE_LIST = []; // Stores list for dropdown index matching

// Map Item Names to CSV Columns
function getColumnKey(metricName) {
    const map = {
        'Actual Net Sales': 'Actual Net Sales',
        'Actual COGS': 'Actual COGS',
        'Actual Royalty': 'Actual Royalty',
        'Actual Store Margin': 'Actual Store Margin',
        'Cost of Sales (Others)': 'Cost of Sales (Others)',
        'Operating Margin': 'Operating Margin',
        'Staff Cost': 'Staff cost', // Lowercase 'c' common in CSV
        'Staff cost': 'Staff cost',
        'Controllables': 'Controllables',
        'Rent': 'Rent',
        'Depreciation': 'Depreciation',
        'Store Contribution': 'Store Contribution'
    };
    // Trim and normalize lookup
    return map[metricName] || map[metricName.trim()] || metricName;
}

// Helper to intelligently parse float (supports "1.234,56" TR and "1,234.56" US)
function parseMoney(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;

    let str = val.toString().trim();
    if (!str) return 0;

    // Detect format:
    // If contains ',' but no '.' -> TR format (likely) -> replace , with .
    // If contains '.' but no ',' -> US format (likely) -> keep as is
    // If contains both: determine which is last (decimal separator)

    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');

    if (lastComma > -1 && lastDot > -1) {
        if (lastComma > lastDot) {
            // TR format: 1.234,56
            str = str.replace(/\./g, '').replace(',', '.');
        } else {
            // US format: 1,234.56
            str = str.replace(/,/g, '');
        }
    } else if (lastComma > -1) {
        // Only comma: 1234,56 -> 1234.56
        str = str.replace(',', '.');
    } else if (lastDot > -1) {
        // Only dot: could be 1.234 (thousand) or 1.23 (decimal)
        // Ambiguous. BUT usually in this context data is decimal.
        // However, if we have 1.234 it might be 1234.
        // Let's assume US format for safety if only dots are present, OR check if multiple dots
        const dotCount = (str.match(/\./g) || []).length;
        if (dotCount > 1) {
            // 1.234.567 -> TR thousands -> remove all dots
            str = str.replace(/\./g, '');
        }
        // else 123.45 -> keep
    }

    // Creating a clean float
    // Standardize to US format then parse
    return parseFloat(str) || 0;
}

function formatMoney(val) {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
}

function formatPercent(val) {
    return `%${val.toFixed(1)}`;
}

function calculateDiff(a, b) {
    const diff = b - a;
    const percent = a !== 0 ? (diff / a) * 100 : (b !== 0 ? 100 : 0);
    return { diff, percent };
}

async function loadPeriods() {
    try {
        const res = await fetch(`${API_URL}/periods`);
        const periods = await res.json();

        const options = periods.map(p =>
            `<option value="${p.id}">Periyot ${p.id} (${p.name})</option>`
        ).join('');

        document.getElementById('periodASelect').innerHTML += options;
        document.getElementById('periodBSelect').innerHTML += options;
    } catch (err) {
        console.error('Periods load error:', err);
    }
}

function setupListeners() {
    // Run Button
    document.getElementById('runAnalysisBtn').addEventListener('click', runAnalysis);

    // Type Toggles
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (!document.getElementById('analysisContent').classList.contains('hidden')) {
                runAnalysis();
            }
        });
    });

    // Metric Select
    const metricSelect = document.getElementById('metricSelect');
    if (metricSelect) {
        metricSelect.addEventListener('change', (e) => {
            SELECTED_METRIC = e.target.value;
            const periodA = document.getElementById('periodASelect').value;
            const periodB = document.getElementById('periodBSelect').value;
            const type = document.querySelector('.type-btn.active').dataset.type;

            if (periodA && periodB && ALL_DATA[type][periodA] && ALL_DATA[type][periodB]) {
                // Re-run not needed, just update view if data exists
                updateView();
            }
        });
    }

    // Store Filter Change
    const storeFilter = document.getElementById('storeFilterSelect');
    if (storeFilter) {
        storeFilter.addEventListener('change', () => {
            updateView();
        });
    }
}

async function runAnalysis() {
    const periodA = document.getElementById('periodASelect').value;
    const periodB = document.getElementById('periodBSelect').value;
    const type = document.querySelector('.type-btn.active').dataset.type;

    if (!periodA || !periodB) {
        alert('Lütfen her iki periyodu da seçiniz.');
        return;
    }

    const btn = document.getElementById('runAnalysisBtn');
    btn.textContent = 'Hesaplanıyor...';
    btn.disabled = true;

    try {
        // Load data if not cached
        if (!ALL_DATA[type][periodA]) await loadPeriodData(periodA, type);
        if (!ALL_DATA[type][periodB]) await loadPeriodData(periodB, type);

        const dataA = ALL_DATA[type][periodA];
        const dataB = ALL_DATA[type][periodB];

        // Populate Store Filter
        loadStoresForFilter(dataA, dataB);

        // Render View (Filtered)
        updateView();

        document.getElementById('analysisContent').classList.remove('hidden');
        document.getElementById('emptyState').classList.add('hidden');

        // Update Headers
        // Update Headers
        const headerA = document.getElementById('headerPeriodA');
        const headerB = document.getElementById('headerPeriodB');
        if (headerA) headerA.textContent = `P${periodA}`;
        if (headerB) headerB.textContent = `P${periodB}`;

        // Update Data Type Display
        const typeDisplay = document.getElementById('activeDataTypeDisplay');
        if (typeDisplay) {
            typeDisplay.textContent = type === 'px' ? 'AYLIK (PX)' : 'KÜMÜLATİF (YTD)';
            typeDisplay.style.color = type === 'px' ? '#00704A' : '#d62b20'; // Green vs Red indicator
        }

    } catch (err) {
        console.error('Analysis error:', err);
        alert('Analiz sırasında bir hata oluştu.');
    } finally {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Analizi Çalıştır`;
        btn.disabled = false;
    }
}

function loadStoresForFilter(dataA, dataB) {
    const select = document.getElementById('storeFilterSelect');
    // const currentVal = select.value; // Index based, hard to keep selection on re-run, reset is better

    const storeNames = new Set([
        ...(dataA || []).map(r => r['EPM Store Name']),
        ...(dataB || []).map(r => r['EPM Store Name'])
    ]);

    // Sort alphabetically and modify global list
    FILTER_STORE_LIST = Array.from(storeNames).filter(Boolean).sort();

    select.innerHTML = '<option value="">Tüm Mağazalar</option>';
    FILTER_STORE_LIST.forEach((store, index) => {
        const option = document.createElement('option');
        option.value = index.toString(); // Use Index
        // Display name cleanup if needed
        const parts = store.split('-');
        option.textContent = parts.length > 2 ? parts.slice(2).join('-').trim() : store;
        select.appendChild(option);
    });
}

function updateView() {
    const periodA = document.getElementById('periodASelect').value;
    const periodB = document.getElementById('periodBSelect').value;
    const type = document.querySelector('.type-btn.active')?.dataset.type || 'px';
    const selectedIndex = document.getElementById('storeFilterSelect').value;

    // Get store name from index
    const selectedStore = selectedIndex !== "" ? FILTER_STORE_LIST[parseInt(selectedIndex)] : null;

    // DEBUG: Alert for user
    if (selectedIndex !== "") {
        // alert(`DEBUG: Seçilen Index: ${selectedIndex}, Mağaza: ${selectedStore}, Eşleşen Veri Sayısı (A): ${dataA.filter(r => r['EPM Store Name'] === selectedStore).length}`);
    }

    if (!periodA || !periodB || !ALL_DATA[type] || !ALL_DATA[type][periodA]) return;

    const dataA = ALL_DATA[type][periodA];
    const dataB = ALL_DATA[type][periodB];

    // DEBUG: Alert for user - REMOVED
    // if (selectedIndex !== "") {
    //     alert(`DEBUG: ...`);
    // }

    const filterFn = r => !selectedStore || r['EPM Store Name'] === selectedStore;
    const filteredA = dataA.filter(filterFn);
    const filteredB = dataB.filter(filterFn);

    renderKPIs(filteredA, filteredB);
    renderMetricsComparison(filteredA, filteredB);
}

async function loadPeriodData(periodId, type) {
    const res = await fetch(`${API_URL}/data/${periodId}`);
    const json = await res.json();
    ALL_DATA[type][periodId] = json[type] || [];
}

function renderKPIs(dataA, dataB) {
    const calcTotal = (data, key) => data.reduce((sum, row) => sum + parseMoney(row[key]), 0);

    // 1. Net Sales
    const salesA = calcTotal(dataA, 'Actual Net Sales');
    const salesB = calcTotal(dataB, 'Actual Net Sales');
    const salesDiff = calculateDiff(salesA, salesB);

    // 2. Store Margin
    const marginA = calcTotal(dataA, 'Actual Store Margin');
    const marginB = calcTotal(dataB, 'Actual Store Margin');
    const marginDiff = calculateDiff(marginA, marginB);

    // 3. Operating Margin
    const opA = calcTotal(dataA, 'Operating Margin');
    const opB = calcTotal(dataB, 'Operating Margin');
    const opDiff = calculateDiff(opA, opB);

    // 4. Total Expenses (Sales - Operating Margin)
    const costA = salesA - opA;
    const costB = salesB - opB;
    const costDiff = calculateDiff(costA, costB);

    // Render Values
    updateKPI('Sales', salesDiff);
    updateKPI('Margin', marginDiff);
    updateKPI('Op', opDiff);
    updateKPI('Cost', costDiff);
}

function updateKPI(id, { diff, percent }) {
    const valEl = document.getElementById(`kpi${id}Diff`);
    const subEl = document.getElementById(`kpi${id}Percent`);

    if (valEl && subEl) {
        valEl.textContent = formatMoney(diff);
        valEl.className = `kpi-value ${diff >= 0 ? 'value-pos' : 'value-neg'}`;
        subEl.textContent = formatPercent(percent);
        subEl.className = `kpi-sub ${percent >= 0 ? 'value-pos' : 'value-neg'}`;
    }
}

// Deprecated: Store comparison table removed as per new request
function renderStoreComparison(dataA, dataB) {
    // Empty function or removed logic
    const tbody = document.getElementById('storeComparisonBody');
    if (tbody) tbody.innerHTML = '';
}

function renderMetricsComparison(dataA, dataB) {
    const metrics = [
        'Actual Net Sales', 'Actual COGS', 'Actual Royalty', 'Actual Store Margin',
        'Cost of Sales (Others)', 'Operating Margin', 'Staff Cost', 'Controllables',
        'Rent', 'Depreciation', 'Store Contribution'
    ];

    const tbody = document.getElementById('metricsBody');
    tbody.innerHTML = '';

    metrics.forEach(metric => {
        const colKey = getColumnKey(metric);
        const totalA = (dataA || []).reduce((sum, row) => sum + parseMoney(row[colKey]), 0);
        const totalB = (dataB || []).reduce((sum, row) => sum + parseMoney(row[colKey]), 0);

        const { diff, percent } = calculateDiff(totalA, totalB);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${metric}</td>
            <td class="text-right">${formatMoney(totalA)}</td>
            <td class="text-right">${formatMoney(totalB)}</td>
            <td class="text-right ${diff >= 0 ? 'value-pos' : 'value-neg'}">${formatMoney(diff)}</td>
            <td class="text-right ${percent >= 0 ? 'value-pos' : 'value-neg'}">${formatPercent(percent)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Store Detail Modal Logic ---

function createStoreDetailModal() {
    const modalHtml = `
    <div id="storeDetailModal" class="modal-overlay hidden">
        <div class="store-detail-modal">
            <div class="modal-header">
                <div>
                    <h3 id="storeDetailTitle" style="margin:0;">Mağaza Detayı</h3>
                    <div class="modal-subtitle" style="font-size: 0.9em; color: #666; margin-top: 4px;">
                        <span id="detailHeaderA">P-A</span> vs <span id="detailHeaderB">P-B</span>
                    </div>
                </div>
                <button class="modal-close-btn" onclick="closeStoreDetailModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="detail-kpi-row">
                    <div class="kpi-card mini">
                        <span>Net Sales</span>
                        <strong id="detailSales">0</strong>
                    </div>
                    <div class="kpi-card mini">
                        <span>Store Margin</span>
                        <strong id="detailMargin">0</strong>
                    </div>
                     <div class="kpi-card mini">
                        <span>Store Contribution</span>
                        <strong id="detailContribution">0</strong>
                    </div>
                </div>
                <div class="table-wrapper mt-4" style="max-height: 400px; overflow-y: auto;">
                    <table class="analysis-table detail-table">
                        <thead>
                            <tr>
                                <th>Kalem</th>
                                <th class="text-right">P-A</th>
                                <th class="text-right">P-B</th>
                                <th class="text-right">Fark</th>
                                <th class="text-right">Fark %</th>
                            </tr>
                        </thead>
                        <tbody id="storeDetailBody">
                            <!-- Detail rows -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.openStoreDetail = function (storeFullName) {
    const periodA = document.getElementById('periodASelect').value;
    const periodB = document.getElementById('periodBSelect').value;
    const type = document.querySelector('.type-btn.active').dataset.type;

    const dataA = ALL_DATA[type][periodA] || [];
    const dataB = ALL_DATA[type][periodB] || [];

    const rowA = dataA.find(r => r['EPM Store Name'] === storeFullName);
    const rowB = dataB.find(r => r['EPM Store Name'] === storeFullName);

    // Set Title
    const parts = storeFullName.split('-');
    const displayName = parts.length > 2 ? parts.slice(2).join('-').trim() : storeFullName;
    document.getElementById('storeDetailTitle').textContent = displayName;

    // Headers
    document.getElementById('detailHeaderA').textContent = `P${periodA}`;
    document.getElementById('detailHeaderB').textContent = `P${periodB}`;

    // Metrics List - Comprehensive
    const metrics = [
        'Actual Net Sales', 'Actual COGS', 'Actual Royalty', 'Actual Store Margin',
        'Cost of Sales (Others)', 'Operating Margin', 'Staff Cost', 'Controllables',
        'Rent', 'Depreciation', 'Store Contribution', 'Cash +/- Stores'
    ];

    const tbody = document.getElementById('storeDetailBody');
    tbody.innerHTML = '';

    let salesVal = 0;

    metrics.forEach(metric => {
        const colKey = getColumnKey(metric);
        const valA = rowA ? parseMoney(rowA[colKey]) : 0;
        const valB = rowB ? parseMoney(rowB[colKey]) : 0;
        const { diff, percent } = calculateDiff(valA, valB);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${metric}</td>
            <td class="text-right">${formatMoney(valA)}</td>
            <td class="text-right">${formatMoney(valB)}</td>
            <td class="text-right ${diff >= 0 ? 'value-pos' : 'value-neg'}">${formatMoney(diff)}</td>
            <td class="text-right ${percent >= 0 ? 'value-pos' : 'value-neg'}">${formatPercent(percent)}</td>
        `;
        tbody.appendChild(tr);

        // Update mini KPIs
        if (metric === 'Actual Net Sales') {
            document.getElementById('detailSales').textContent = formatMoney(valA);
            salesVal = valA;
        }
        if (metric === 'Actual Store Margin') {
            // Calculate Margin % if possible
            const marginP = salesVal ? (valA / salesVal) * 100 : 0;
            document.getElementById('detailMargin').innerHTML = `${formatMoney(valA)} <small class="text-muted">(${marginP.toFixed(1)}%)</small>`;
        }
        if (metric === 'Store Contribution') {
            document.getElementById('detailContribution').textContent = formatMoney(valA);
        }
    });

    // Show Modal
    const modal = document.getElementById('storeDetailModal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
};

window.closeStoreDetailModal = function () {
    const modal = document.getElementById('storeDetailModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.classList.add('hidden'), 300); // Wait for transition
    }
};

// Close on overlay click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('storeDetailModal');
    if (modal && e.target === modal) {
        closeStoreDetailModal();
    }
});
