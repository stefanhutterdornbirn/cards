// Migration Management JavaScript

let currentTab = 'verification';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    showTab('verification');
});

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activate corresponding tab button
    const tabButtons2 = document.querySelectorAll('.tab-btn');
    tabButtons2.forEach(btn => {
        if (btn.textContent.toLowerCase().includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    currentTab = tabName;
}

// Loading overlay functions
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

// API call wrapper with error handling
async function apiCall(url, options = {}) {
    try {
        showLoading();
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Verification functions
async function runVerification(includeDetails = false) {
    const resultsContainer = document.getElementById('verification-results');
    
    try {
        const result = await apiCall(`/api/migration/verify?details=${includeDetails}`);
        
        const html = `
            <div class="summary-container">
                <h3>📊 Verification Summary</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-value">${result.summary.totalFilesInDb}</div>
                        <div class="stat-label">Total Files in DB</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value text-success">${result.summary.filesVerifiedInS3}</div>
                        <div class="stat-label">Verified in S3</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value text-danger">${result.summary.filesMissingInS3}</div>
                        <div class="stat-label">Missing in S3</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value text-warning">${result.summary.filesOnlyInS3}</div>
                        <div class="stat-label">Orphaned in S3</div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <span class="badge ${result.summary.verificationSuccess ? 'badge-success' : 'badge-danger'}">
                        ${result.summary.verificationSuccess ? '✅ Migration Complete' : '❌ Issues Found'}
                    </span>
                </div>
            </div>
            
            <div style="padding: 20px;">
                <h4>📋 Detailed Results</h4>
                
                <div style="margin-bottom: 20px;">
                    <h5>🖼️ Image Files</h5>
                    <p>Total: ${result.details.imageFiles.totalInDb}, Verified: ${result.details.imageFiles.verifiedInS3}, Missing: ${result.details.imageFiles.missingInS3.length}</p>
                    ${result.details.imageFiles.missingInS3.length > 0 && includeDetails ? 
                        `<div class="file-list">
                            ${result.details.imageFiles.missingInS3.map(file => 
                                `<div class="file-item"><span class="file-path">${file}</span></div>`
                            ).join('')}
                        </div>` : ''}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h5>📄 DMS Files</h5>
                    <p>Total: ${result.details.dmsFiles.totalInDb}, Verified: ${result.details.dmsFiles.verifiedInS3}, Missing: ${result.details.dmsFiles.missingInS3.length}</p>
                    ${result.details.dmsFiles.missingInS3.length > 0 && includeDetails ?
                        `<div class="file-list">
                            ${result.details.dmsFiles.missingInS3.map(file => 
                                `<div class="file-item"><span class="file-hash">${file}</span></div>`
                            ).join('')}
                        </div>` : ''}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h5>💾 CAS Files</h5>
                    <p>Total: ${result.details.casFiles.totalInDb}, Verified: ${result.details.casFiles.verifiedInS3}, Missing: ${result.details.casFiles.missingInS3.length}</p>
                    ${result.details.casFiles.missingInS3.length > 0 && includeDetails ?
                        `<div class="file-list">
                            ${result.details.casFiles.missingInS3.map(file => 
                                `<div class="file-item"><span class="file-path">${file}</span></div>`
                            ).join('')}
                        </div>` : ''}
                </div>
                
                ${result.errors.length > 0 ? `
                    <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin-top: 20px;">
                        <h5 style="color: #721c24;">⚠️ Errors</h5>
                        <ul>
                            ${result.errors.map(error => `<li style="color: #721c24;">${error}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        resultsContainer.innerHTML = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px;">
                <h5 style="color: #721c24;">❌ Verification Failed</h5>
                <p style="color: #721c24;">${error.message}</p>
            </div>
        `;
    }
}

async function getMissingFiles() {
    const resultsContainer = document.getElementById('missing-files-results');
    
    try {
        const result = await apiCall('/api/migration/missing-files');
        
        if (result.missingFiles.length === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #28a745;">No Missing Files Found</h3>
                    <p>All files referenced in the database are available in storage.</p>
                </div>
            `;
            return;
        }
        
        const html = `
            <div style="margin-bottom: 20px;">
                <h4>❌ Missing Files (${result.missingFiles.length})</h4>
                <p>The following files are referenced in the database but missing from storage:</p>
            </div>
            
            <div class="file-list">
                ${result.missingFiles.map(file => `
                    <div class="file-item">
                        <div>
                            <span class="file-path">${file.identifier}</span>
                            <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
                                Type: ${file.type} | Source: ${file.source}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        resultsContainer.innerHTML = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px;">
                <h5 style="color: #721c24;">❌ Error Loading Missing Files</h5>
                <p style="color: #721c24;">${error.message}</p>
            </div>
        `;
    }
}

// File relationships functions
async function getFileRelationships() {
    const resultsContainer = document.getElementById('relationships-results');
    const summaryContainer = document.getElementById('relationships-summary');
    const filter = document.getElementById('relationship-filter').value;
    const limit = parseInt(document.getElementById('relationship-limit').value) || 100;
    
    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            onlyOrphaned: (filter === 'orphaned').toString(),
            onlyUsed: (filter === 'used').toString()
        });
        
        const result = await apiCall(`/api/migration/file-relationships?${params}`);
        
        // Update summary
        summaryContainer.innerHTML = `
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-value">${result.summary.totalFiles}</div>
                    <div class="stat-label">Total Files</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value text-success">${result.summary.usedFiles}</div>
                    <div class="stat-label">Used Files</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value text-danger">${result.summary.orphanedFiles}</div>
                    <div class="stat-label">Orphaned Files</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${result.summary.totalReferences}</div>
                    <div class="stat-label">Total References</div>
                </div>
            </div>
        `;
        
        if (result.relationships.length === 0) {
            resultsContainer.innerHTML = `
                <div class="placeholder">No file relationships found with the current filter settings.</div>
            `;
            return;
        }
        
        // Render relationships
        const html = result.relationships.map(rel => `
            <div class="relationship-item ${rel.isOrphaned ? 'orphaned-file' : 'used-file'}">
                <div class="relationship-header" onclick="toggleRelationship('${rel.hash}')">
                    <div>
                        <div class="file-path">${rel.filePath}</div>
                        <div style="margin-top: 5px;">
                            <span class="file-hash">${rel.hash}</span>
                            <span class="file-size">${formatBytes(rel.sizeBytes)}</span>
                            <span class="badge ${rel.isOrphaned ? 'badge-danger' : 'badge-success'}">
                                ${rel.isOrphaned ? 'Orphaned' : 'Used'}
                            </span>
                            ${rel.fileType !== 'unknown' ? `<span class="badge badge-info">${rel.fileType}</span>` : ''}
                        </div>
                    </div>
                    <div>
                        <span style="font-size: 12px; color: #6c757d;">
                            ${rel.usedBy.length} references
                        </span>
                        <span style="margin-left: 10px;">▼</span>
                    </div>
                </div>
                <div class="relationship-content" id="rel-${rel.hash}">
                    ${rel.usedBy.length > 0 ? `
                        <h6>📝 Database References:</h6>
                        <div class="relationship-refs">
                            ${rel.usedBy.map(ref => `
                                <div class="relationship-ref">
                                    <strong>${ref.table}.${ref.field}</strong> (ID: ${ref.recordId})
                                    ${ref.recordTitle ? `<br><em>${ref.recordTitle}</em>` : ''}
                                    ${Object.keys(ref.additionalInfo).length > 0 ? `
                                        <div style="font-size: 11px; color: #666; margin-top: 3px;">
                                            ${Object.entries(ref.additionalInfo).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p><em>No database references found</em></p>'}
                    
                    ${rel.derivedFiles && rel.derivedFiles.length > 0 ? `
                        <h6 style="margin-top: 15px;">🔗 Derived Files:</h6>
                        <div class="file-list">
                            ${rel.derivedFiles.map(derived => `
                                <div class="file-item">
                                    <span class="file-path">${derived.filePath}</span>
                                    <div class="file-meta">
                                        <span class="badge badge-info">${derived.type}</span>
                                        <span class="file-size">${formatBytes(derived.sizeBytes)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${rel.isOriginalOf ? `
                        <div style="margin-top: 15px; padding: 10px; background: #e7f3ff; border-radius: 4px;">
                            <strong>🔗 This is a derived file of:</strong> 
                            <span class="file-hash">${rel.isOriginalOf}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        resultsContainer.innerHTML = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px;">
                <h5 style="color: #721c24;">❌ Error Loading File Relationships</h5>
                <p style="color: #721c24;">${error.message}</p>
            </div>
        `;
    }
}

function toggleRelationship(hash) {
    const content = document.getElementById('rel-' + hash);
    if (content) {
        content.classList.toggle('expanded');
    }
}

// Cleanup functions
async function getOrphanedFiles() {
    const resultsContainer = document.getElementById('orphaned-files-results');
    
    try {
        const result = await apiCall('/api/migration/orphaned-files?limit=100');
        
        if (result.orphanedFiles.length === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #28a745;">No Orphaned Files Found</h3>
                    <p>All files in storage are properly referenced in the database.</p>
                </div>
            `;
            return;
        }
        
        const totalSize = result.orphanedFiles.reduce((sum, file) => sum + file.sizeBytes, 0);
        
        const html = `
            <div style="margin-bottom: 20px;">
                <h4>🗑️ Orphaned Files Preview (${result.orphanedFiles.length} of ${result.totalShown})</h4>
                <p>Total space that could be freed: <strong>${formatBytes(totalSize)}</strong></p>
            </div>
            
            <div class="file-list">
                ${result.orphanedFiles.map(file => `
                    <div class="file-item">
                        <div>
                            <span class="file-path">${file.filePath}</span>
                            <div style="margin-top: 5px;">
                                <span class="file-hash">${file.hash}</span>
                            </div>
                        </div>
                        <span class="file-size">${formatBytes(file.sizeBytes)}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        resultsContainer.innerHTML = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px;">
                <h5 style="color: #721c24;">❌ Error Loading Orphaned Files</h5>
                <p style="color: #721c24;">${error.message}</p>
            </div>
        `;
    }
}

async function runCleanup(dryRun = true, showConfirmation = false) {
    const resultsContainer = document.getElementById('cleanup-results');
    const includeDetails = document.getElementById('include-details').checked;
    
    if (!dryRun && !showConfirmation) {
        showConfirmationModal();
        return;
    }
    
    try {
        const params = new URLSearchParams({
            dryRun: dryRun.toString(),
            details: includeDetails.toString(),
            confirm: (!dryRun).toString()
        });
        
        const result = await apiCall(`/api/migration/cleanup?${params}`, {
            method: 'POST'
        });
        
        const html = `
            <div class="summary-container">
                <h3>${dryRun ? '🔍 Cleanup Preview' : '🗑️ Cleanup Results'}</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <div class="stat-value">${result.summary.totalOrphanedFiles}</div>
                        <div class="stat-label">Orphaned Files Found</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value text-${dryRun ? 'warning' : 'success'}">${result.summary.filesDeleted}</div>
                        <div class="stat-label">${dryRun ? 'Would Delete' : 'Files Deleted'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value text-danger">${result.summary.filesFailedToDelete}</div>
                        <div class="stat-label">Failed Deletions</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${formatBytes(result.summary.spaceFreedBytes)}</div>
                        <div class="stat-label">${dryRun ? 'Would Free' : 'Space Freed'}</div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <span class="badge ${result.status === 'success' ? 'badge-success' : result.status === 'partial' ? 'badge-warning' : 'badge-danger'}">
                        ${result.status === 'success' ? '✅ Success' : result.status === 'partial' ? '⚠️ Partial Success' : '❌ Error'}
                    </span>
                    ${result.summary.dryRun ? '<span class="badge badge-info">DRY RUN</span>' : ''}
                </div>
            </div>
            
            ${result.deletedFiles && result.deletedFiles.length > 0 ? `
                <div style="padding: 20px;">
                    <h4>${dryRun ? '📋 Files That Would Be Deleted' : '✅ Deleted Files'}</h4>
                    <div class="file-list">
                        ${result.deletedFiles.map(file => `
                            <div class="file-item">
                                <span class="file-path">${file}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${result.failedDeletions && result.failedDeletions.length > 0 ? `
                <div style="padding: 20px;">
                    <h4>❌ Failed Deletions</h4>
                    <div class="file-list">
                        ${result.failedDeletions.map(failure => `
                            <div class="file-item">
                                <div>
                                    <span class="file-path">${failure.filePath}</span>
                                    <div style="color: #dc3545; font-size: 12px; margin-top: 5px;">${failure.error}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${result.errors && result.errors.length > 0 ? `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 20px;">
                    <h5 style="color: #721c24;">⚠️ Errors</h5>
                    <ul>
                        ${result.errors.map(error => `<li style="color: #721c24;">${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        resultsContainer.innerHTML = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px;">
                <h5 style="color: #721c24;">❌ Cleanup Failed</h5>
                <p style="color: #721c24;">${error.message}</p>
            </div>
        `;
    }
}

function confirmCleanup() {
    showConfirmationModal();
}

function showConfirmationModal() {
    document.getElementById('confirmation-modal').style.display = 'flex';
}

function closeConfirmationModal() {
    document.getElementById('confirmation-modal').style.display = 'none';
}

function executeCleanup() {
    closeConfirmationModal();
    runCleanup(false, true);
}

// Storage browser functions
async function browseStorage() {
    const resultsContainer = document.getElementById('storage-results');
    const prefix = document.getElementById('storage-prefix').value;
    const limit = parseInt(document.getElementById('storage-limit').value) || 500;
    const includeSize = document.getElementById('include-size').checked;
    
    try {
        const params = new URLSearchParams({
            prefix: prefix,
            limit: limit.toString(),
            includeSize: includeSize.toString()
        });
        
        const result = await apiCall(`/api/migration/storage-files?${params}`);
        
        if (result.files.length === 0) {
            resultsContainer.innerHTML = `
                <div class="placeholder">No files found with the specified prefix.</div>
            `;
            return;
        }
        
        const totalSize = includeSize ? result.files.reduce((sum, file) => sum + (file.size || 0), 0) : 0;
        
        const html = `
            <div style="margin-bottom: 20px;">
                <h4>💾 Storage Files (${result.shown} of ${result.totalFiles})</h4>
                ${prefix ? `<p>Prefix filter: <code>${prefix}</code></p>` : ''}
                ${includeSize ? `<p>Total size: <strong>${formatBytes(totalSize)}</strong></p>` : ''}
            </div>
            
            <div class="file-list">
                ${result.files.map(file => `
                    <div class="file-item">
                        <span class="file-path">${file.path}</span>
                        ${includeSize && file.size !== undefined ? `
                            <span class="file-size">${formatBytes(file.size)}</span>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            
            ${result.shown < result.totalFiles ? `
                <div style="text-align: center; padding: 15px; color: #6c757d;">
                    Showing ${result.shown} of ${result.totalFiles} files. Increase limit to see more.
                </div>
            ` : ''}
        `;
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        resultsContainer.innerHTML = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px;">
                <h5 style="color: #721c24;">❌ Error Browsing Storage</h5>
                <p style="color: #721c24;">${error.message}</p>
            </div>
        `;
    }
}

// Utility functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modal
    if (e.key === 'Escape') {
        closeConfirmationModal();
    }
    
    // Tab switching with Ctrl + number
    if (e.ctrlKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                showTab('verification');
                break;
            case '2':
                e.preventDefault();
                showTab('relationships');
                break;
            case '3':
                e.preventDefault();
                showTab('cleanup');
                break;
            case '4':
                e.preventDefault();
                showTab('storage');
                break;
        }
    }
});

// Auto-refresh functionality (optional)
function startAutoRefresh(intervalMs = 30000) {
    setInterval(() => {
        if (currentTab === 'verification') {
            // Auto-refresh verification if results are shown
            const resultsContainer = document.getElementById('verification-results');
            if (resultsContainer.children.length > 0 && !resultsContainer.querySelector('.placeholder')) {
                runVerification(false);
            }
        }
    }, intervalMs);
}

// Initialize auto-refresh (disabled by default)
// startAutoRefresh();