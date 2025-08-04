<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="/static/styles.css">
    <style>
        /* Inline CSS for migration management */
        .header {
            background: #f8f9fa;
            padding: 1rem 2rem;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .container { padding: 2rem; }
        .tab-container {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 2rem;
            border-bottom: 1px solid #dee2e6;
        }
        .tab-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            background: transparent;
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }
        .tab-btn.active {
            border-bottom-color: #007bff;
            background: #f8f9fa;
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .section {
            margin-bottom: 2rem;
            border: 1px solid #dee2e6;
            border-radius: 0.375rem;
        }
        .section-header {
            padding: 1rem;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .results-container {
            padding: 1rem;
            max-height: 400px;
            overflow-y: auto;
        }
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
            margin-right: 0.5rem;
        }
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1001;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .modal-content {
            background: white;
            padding: 0;
            border-radius: 0.375rem;
            max-width: 500px;
            width: 90%;
        }
        .modal-header, .modal-footer {
            padding: 1rem;
            border-bottom: 1px solid #dee2e6;
        }
        .modal-footer {
            border-bottom: none;
            border-top: 1px solid #dee2e6;
            text-align: right;
        }
        .modal-body { padding: 1rem; }
    </style>
</head>
<body>
    <div id="app">
        <div class="header">
            <h1>🔧 Storage Migration Management</h1>
            <div class="header-info">
                <span class="user-info">Logged in as User ID: ${userId}</span>
                <button class="btn btn-secondary" onclick="window.location.href='/'" type="button">Back to Main</button>
            </div>
        </div>

        <div class="container">
            <!-- Navigation Tabs -->
            <div class="tab-container">
                <button class="tab-btn active" onclick="showTab('verification')">📊 Verification</button>
                <button class="tab-btn" onclick="showTab('relationships')">🔗 File Relationships</button>
                <button class="tab-btn" onclick="showTab('cleanup')">🧹 Cleanup</button>
                <button class="tab-btn" onclick="showTab('storage')">💾 Storage Browser</button>
            </div>

            <!-- Verification Tab -->
            <div id="verification-tab" class="tab-content active">
                <div class="section">
                    <div class="section-header">
                        <h2>📋 Migration Verification</h2>
                        <div class="actions">
                            <button class="btn btn-primary" onclick="runVerification(false)">Quick Verify</button>
                            <button class="btn btn-secondary" onclick="runVerification(true)">Detailed Verify</button>
                        </div>
                    </div>
                    
                    <div id="verification-results" class="results-container">
                        <div class="placeholder">Click "Quick Verify" or "Detailed Verify" to start verification</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header">
                        <h2>❌ Missing Files</h2>
                        <div class="actions">
                            <button class="btn btn-secondary" onclick="getMissingFiles()">Get Missing Files</button>
                        </div>
                    </div>
                    
                    <div id="missing-files-results" class="results-container">
                        <div class="placeholder">Click "Get Missing Files" to see files referenced in DB but missing in storage</div>
                    </div>
                </div>
            </div>

            <!-- File Relationships Tab -->
            <div id="relationships-tab" class="tab-content">
                <div class="section">
                    <div class="section-header">
                        <h2>🔗 File-Database Relationships</h2>
                        <div class="controls">
                            <select id="relationship-filter" onchange="getFileRelationships()">
                                <option value="all">All Files</option>
                                <option value="used">Used Files Only</option>
                                <option value="orphaned">Orphaned Files Only</option>
                            </select>
                            <input type="number" id="relationship-limit" value="100" min="10" max="5000" 
                                   placeholder="Limit" onchange="getFileRelationships()">
                            <button class="btn btn-primary" onclick="getFileRelationships()">Load Relationships</button>
                        </div>
                    </div>
                    
                    <div id="relationships-summary" class="summary-container"></div>
                    <div id="relationships-results" class="results-container">
                        <div class="placeholder">Click "Load Relationships" to see file-database relationships</div>
                    </div>
                </div>
            </div>

            <!-- Cleanup Tab -->
            <div id="cleanup-tab" class="tab-content">
                <div class="section">
                    <div class="section-header">
                        <h2>🧹 Orphaned Files Cleanup</h2>
                        <div class="actions">
                            <button class="btn btn-secondary" onclick="getOrphanedFiles()">Preview Orphaned Files</button>
                        </div>
                    </div>
                    
                    <div id="orphaned-files-results" class="results-container">
                        <div class="placeholder">Click "Preview Orphaned Files" to see files that can be safely deleted</div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header">
                        <h2>⚠️ Cleanup Operations</h2>
                        <div class="cleanup-controls">
                            <label class="checkbox-container">
                                <input type="checkbox" id="include-details" checked>
                                <span class="checkmark"></span>
                                Include detailed file list
                            </label>
                        </div>
                    </div>
                    
                    <div class="cleanup-actions">
                        <button class="btn btn-secondary" onclick="runCleanup(true, false)">🔍 Dry Run (Preview)</button>
                        <button class="btn btn-danger" onclick="confirmCleanup()">🗑️ Delete Orphaned Files</button>
                    </div>
                    
                    <div id="cleanup-results" class="results-container">
                        <div class="placeholder">Use cleanup operations to manage orphaned files</div>
                    </div>
                </div>
            </div>

            <!-- Storage Browser Tab -->
            <div id="storage-tab" class="tab-content">
                <div class="section">
                    <div class="section-header">
                        <h2>💾 Storage File Browser</h2>
                        <div class="controls">
                            <input type="text" id="storage-prefix" placeholder="Prefix filter (e.g., ab/cd/)" 
                                   onchange="browseStorage()">
                            <input type="number" id="storage-limit" value="500" min="10" max="10000" 
                                   placeholder="Limit" onchange="browseStorage()">
                            <label class="checkbox-container">
                                <input type="checkbox" id="include-size" onchange="browseStorage()">
                                <span class="checkmark"></span>
                                Include file sizes
                            </label>
                            <button class="btn btn-primary" onclick="browseStorage()">Browse Storage</button>
                        </div>
                    </div>
                    
                    <div id="storage-results" class="results-container">
                        <div class="placeholder">Click "Browse Storage" to see files in CAS storage</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading overlay -->
        <div id="loading-overlay" class="loading-overlay" style="display: none;">
            <div class="loading-spinner"></div>
            <div class="loading-text">Processing...</div>
        </div>

        <!-- Confirmation modal -->
        <div id="confirmation-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⚠️ Confirm Deletion</h3>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete orphaned files?</p>
                    <p><strong>This action cannot be undone!</strong></p>
                    <p>Files will be permanently removed from storage.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeConfirmationModal()">Cancel</button>
                    <button class="btn btn-danger" onclick="executeCleanup()">Delete Files</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Migration Management JavaScript
        
        // Tab switching functionality
        function showTab(tabName) {
            // Hide all tabs
            const tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Remove active class from all buttons
            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(tabName + '-tab').classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
        }

        // Show/hide loading overlay
        function showLoading() {
            document.getElementById('loading-overlay').style.display = 'flex';
        }
        
        function hideLoading() {
            document.getElementById('loading-overlay').style.display = 'none';
        }

        // API call helper with authentication
        async function apiCall(endpoint, options = {}) {
            const token = localStorage.getItem('authToken');
            const defaultOptions = {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };
            
            try {
                const response = await fetch(endpoint, { ...options, ...defaultOptions });
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return await response.json();
            } catch (error) {
                console.error('API call failed:', error);
                throw error;
            }
        }

        // Verification functions
        async function runVerification(includeDetails) {
            showLoading();
            try {
                const result = await apiCall('/api/migration/verify?details=' + includeDetails);
                document.getElementById('verification-results').innerHTML = 
                    '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('verification-results').innerHTML = 
                    '<div class="error">Error: ' + error.message + '</div>';
            } finally {
                hideLoading();
            }
        }

        async function getMissingFiles() {
            showLoading();
            try {
                const result = await apiCall('/api/migration/missing-files');
                document.getElementById('missing-files-results').innerHTML = 
                    '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('missing-files-results').innerHTML = 
                    '<div class="error">Error: ' + error.message + '</div>';
            } finally {
                hideLoading();
            }
        }

        // Relationship functions
        async function getFileRelationships() {
            const filter = document.getElementById('relationship-filter').value;
            const limit = document.getElementById('relationship-limit').value;
            
            showLoading();
            try {
                let url = '/api/migration/file-relationships?limit=' + limit;
                if (filter === 'used') url += '&onlyUsed=true';
                if (filter === 'orphaned') url += '&onlyOrphaned=true';
                
                const result = await apiCall(url);
                
                // Show summary
                document.getElementById('relationships-summary').innerHTML = 
                    '<div class="summary">' +
                        '<strong>Summary:</strong> ' +
                        'Total: ' + result.summary.totalFiles + ', ' +
                        'Used: ' + result.summary.usedFiles + ', ' +
                        'Orphaned: ' + result.summary.orphanedFiles +
                    '</div>';
                
                document.getElementById('relationships-results').innerHTML = 
                    '<pre>' + JSON.stringify(result.relationships, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('relationships-results').innerHTML = 
                    '<div class="error">Error: ' + error.message + '</div>';
            } finally {
                hideLoading();
            }
        }

        // Cleanup functions
        async function getOrphanedFiles() {
            showLoading();
            try {
                const result = await apiCall('/api/migration/orphaned-files?limit=100');
                document.getElementById('orphaned-files-results').innerHTML = 
                    '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('orphaned-files-results').innerHTML = 
                    '<div class="error">Error: ' + error.message + '</div>';
            } finally {
                hideLoading();
            }
        }

        async function runCleanup(dryRun, confirm) {
            const includeDetails = document.getElementById('include-details').checked;
            showLoading();
            try {
                let url = '/api/migration/cleanup?dryRun=' + dryRun + '&details=' + includeDetails;
                if (!dryRun) url += '&confirm=true';
                
                const result = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await result.json();
                document.getElementById('cleanup-results').innerHTML = 
                    '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('cleanup-results').innerHTML = 
                    '<div class="error">Error: ' + error.message + '</div>';
            } finally {
                hideLoading();
            }
        }

        function confirmCleanup() {
            document.getElementById('confirmation-modal').style.display = 'flex';
        }

        function closeConfirmationModal() {
            document.getElementById('confirmation-modal').style.display = 'none';
        }

        function executeCleanup() {
            closeConfirmationModal();
            runCleanup(false, true);
        }

        // Storage browser
        async function browseStorage() {
            const prefix = document.getElementById('storage-prefix').value;
            const limit = document.getElementById('storage-limit').value;
            const includeSize = document.getElementById('include-size').checked;
            
            showLoading();
            try {
                const url = '/api/migration/storage-files?prefix=' + prefix + '&limit=' + limit + '&includeSize=' + includeSize;
                const result = await apiCall(url);
                document.getElementById('storage-results').innerHTML = 
                    '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('storage-results').innerHTML = 
                    '<div class="error">Error: ' + error.message + '</div>';
            } finally {
                hideLoading();
            }
        }
    </script>
</body>
</html>