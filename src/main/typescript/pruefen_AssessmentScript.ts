import { clearContentScreen } from './common.js';
import { i18n } from './i18n/TranslationService.js';

const ASSESSMENT_PAGE: string = "ASSESSMENT_PAGE";

interface Assessment {
    id?: number;
    name: string;
    examId: number;
    startTime: string; // ISO DateTime string
    endTime: string; // ISO DateTime string
    createdBy?: number;
    groupId?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface Exam {
    id?: number;
    name: string;
    durationInSeconds: number;
    cardCount?: number;
}

interface User {
    id?: number;
    username: string;
    email?: string;
}

// Helper function to format date for datetime-local input
function formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Helper function to convert datetime-local input to ISO string without timezone conversion
function formatDateTimeForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Helper function to format dates
function formatDateTime(dateString?: string): string {
    if (!dateString || dateString.trim() === '') {
        return i18n.t('test.unknown');
    }
    
    try {
        // Handle ZonedDateTime format from Kotlin backend
        let cleanDateString = dateString;
        
        // Remove the timezone identifier in brackets [Europe/Vienna]
        if (cleanDateString.includes('[')) {
            cleanDateString = cleanDateString.substring(0, cleanDateString.indexOf('['));
        }
        
        // Remove excessive nanosecond precision (keep only 3 digits for milliseconds)
        if (cleanDateString.includes('.')) {
            const parts = cleanDateString.split('.');
            if (parts.length === 2) {
                const beforeDot = parts[0];
                const afterDot = parts[1];
                
                // Extract timezone offset (e.g., "+02:00")
                const timezoneMatch = afterDot.match(/([+-]\d{2}:\d{2})$/);
                const timezone = timezoneMatch ? timezoneMatch[1] : '';
                
                // Keep only first 3 digits of fractional seconds
                const fractionalSeconds = afterDot.replace(/[+-]\d{2}:\d{2}$/, '').substring(0, 3);
                
                cleanDateString = beforeDot + '.' + fractionalSeconds + timezone;
            }
        }
        
        const date = new Date(cleanDateString);
        
        if (isNaN(date.getTime())) {
            console.warn('Invalid date string after cleaning:', cleanDateString, 'original:', dateString);
            return i18n.t('test.unknown');
        }
        
        // Format as DD.MM.YYYY HH:MM (German format)
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }) + ' ' + date.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.warn('Error formatting date:', dateString, error);
        return i18n.t('test.unknown');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const pruefenCardsLink = document.getElementById('pruefenCardsLink');
    
    pruefenCardsLink?.addEventListener('click', function (e) {
        e.preventDefault();
        loadAssessmentManagement();
    });
});

function loadAssessmentManagement(): void {
    clearContentScreen(ASSESSMENT_PAGE);
    const content = document.getElementById('content');
    if (!content) return;

    // Find or create assessment content div
    let assessmentContent = document.getElementById('assessmentContent');
    if (!assessmentContent) {
        assessmentContent = document.createElement('div');
        assessmentContent.id = 'assessmentContent';
        content.appendChild(assessmentContent);
    }

    assessmentContent.innerHTML = `
        <div class="assessment-container">
            <div class="assessment-header">
                <h2>🎯 ${i18n.t('test.conductExams')}</h2>
                <button class="new-assessment-btn" id="newAssessmentBtn">
                    <span class="material-icons" style="color: white;">add</span>
                    ${i18n.t('test.newAssessment')}
                </button>
            </div>
            <div class="assessment-list" id="assessmentList">
                <div class="loading">${i18n.t('test.loadingAssessments')}</div>
            </div>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .assessment-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .assessment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #dee2e6;
        }
        
        .assessment-header h2 {
            margin: 0;
            color: #212529;
        }
        
        .new-assessment-btn {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        
        .new-assessment-btn:hover {
            background-color: #0056b3;
        }
        
        .assessment-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: box-shadow 0.2s;
        }
        
        .assessment-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .assessment-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .assessment-title {
            font-size: 18px;
            font-weight: 600;
            color: #212529;
            margin: 0;
        }
        
        .assessment-exam {
            color: #6c757d;
            font-size: 14px;
            margin-top: 5px;
        }
        
        .assessment-timeframe {
            color: #495057;
            font-size: 14px;
            font-weight: 500;
            margin-top: 5px;
        }
        
        .assessment-actions {
            display: flex;
            gap: 10px;
        }
        
        .assessment-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: background-color 0.2s;
        }
        
        .assessment-btn.manage-users {
            background-color: #17a2b8;
            color: white;
        }
        
        .assessment-btn.manage-users:hover {
            background-color: #138496;
        }
        
        .assessment-btn.edit {
            background-color: #28a745;
            color: white;
        }
        
        .assessment-btn.edit:hover {
            background-color: #218838;
        }
        
        .assessment-btn.delete {
            background-color: #dc3545;
            color: white;
        }
        
        .assessment-btn.delete:hover {
            background-color: #c82333;
        }
        
        .assessment-info {
            display: flex;
            gap: 20px;
            color: #495057;
            font-size: 14px;
        }
        
        .assessment-form {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #212529;
        }
        
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .datetime-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: end;
            margin-top: 25px;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
        
        .no-assessments {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
    `;
    document.head.appendChild(style);

    const newAssessmentBtn = document.getElementById('newAssessmentBtn');
    newAssessmentBtn?.addEventListener('click', showNewAssessmentForm);

    loadAssessments();
}

function loadAssessments(): void {
    const authToken = localStorage.getItem('authToken');
    const assessmentList = document.getElementById('assessmentList');
    
    if (!assessmentList) return;

    fetch('/assessments', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load assessments');
        }
        return response.json();
    })
    .then((assessments: Assessment[]) => {
        displayAssessments(assessments);
    })
    .catch(error => {
        console.error('Error loading assessments:', error);
        assessmentList.innerHTML = `<div class="error">${i18n.t('test.errorLoadingAssessments')}</div>`;
    });
}

function displayAssessments(assessments: Assessment[]): void {
    const assessmentList = document.getElementById('assessmentList');
    if (!assessmentList) return;

    if (assessments.length === 0) {
        assessmentList.innerHTML = `
            <div class="no-assessments">
                <p>${i18n.t('test.noAssessmentsCreated')}</p>
                <p>${i18n.t('test.clickNewAssessment')}</p>
            </div>
        `;
        return;
    }

    assessmentList.innerHTML = '';
    assessments.forEach(assessment => {
        const assessmentCard = createAssessmentCard(assessment);
        assessmentList.appendChild(assessmentCard);
    });
}

function createAssessmentCard(assessment: Assessment): HTMLElement {
    const card = document.createElement('div');
    card.className = 'assessment-card';
    card.dataset.assessmentId = assessment.id?.toString();

    const startDate = formatDateTime(assessment.startTime);
    const endDate = formatDateTime(assessment.endTime);

    card.innerHTML = `
        <div class="assessment-card-header">
            <div>
                <h3 class="assessment-title">${assessment.name}</h3>
                <div class="assessment-exam">📋 ${i18n.t('test.examId')}: ${assessment.examId}</div>
                <div class="assessment-timeframe">⏰ ${startDate} - ${endDate}</div>
            </div>
            <div class="assessment-actions">
                <button class="assessment-btn manage-users" onclick="manageAssessmentUsers(${assessment.id})">
                    <span class="material-icons" style="color: white; font-size: 14px;">people</span>
                    ${i18n.t('test.manageUsers')}
                </button>
                <button class="assessment-btn edit" onclick="editAssessment(${assessment.id})">
                    <span class="material-icons" style="color: white; font-size: 14px;">edit</span>
                    ${i18n.t('test.edit')}
                </button>
                <button class="assessment-btn delete" onclick="deleteAssessment(${assessment.id})">
                    <span class="material-icons" style="color: white; font-size: 14px;">delete</span>
                    ${i18n.t('test.delete')}
                </button>
            </div>
        </div>
        <div class="assessment-info">
            <span>ID: ${assessment.id}</span>
            <span>${i18n.t('test.created')}: ${formatDateTime(assessment.createdAt)}</span>
        </div>
    `;

    return card;
}

function showNewAssessmentForm(): void {
    const assessmentList = document.getElementById('assessmentList');
    if (!assessmentList) return;

    // Load available exams first
    loadAvailableExams().then(exams => {
        const examOptions = exams.map(exam => 
            `<option value="${exam.id}">${exam.name} (${exam.cardCount || 0} ${i18n.t('test.questions')})</option>`
        ).join('');

        const now = new Date();
        const defaultStart = new Date(now.getTime()); // current time
        const defaultEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now

        const formHtml = `
            <div class="assessment-form" id="assessmentForm">
                <h3>🎯 ${i18n.t('test.createNewAssessment')}</h3>
                <div class="form-group">
                    <label for="assessmentName">${i18n.t('test.assessmentName')}:</label>
                    <input type="text" id="assessmentName" placeholder="${i18n.t('test.assessmentNamePlaceholder')}" required>
                </div>
                <div class="form-group">
                    <label for="examSelect">${i18n.t('test.selectExam')}:</label>
                    <select id="examSelect" required>
                        <option value="">${i18n.t('test.pleaseSelectExam')}</option>
                        ${examOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>${i18n.t('test.timeframe')}:</label>
                    <div class="datetime-inputs">
                        <div>
                            <label for="startDateTime">${i18n.t('test.from')}:</label>
                            <input type="datetime-local" id="startDateTime" 
                                value="${formatDateTimeLocal(defaultStart)}" required>
                        </div>
                        <div>
                            <label for="endDateTime">${i18n.t('test.to')}:</label>
                            <input type="datetime-local" id="endDateTime" 
                                value="${formatDateTimeLocal(defaultEnd)}" required>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="assessment-btn" style="background-color: #6c757d; color: white;" onclick="cancelAssessmentForm()">
                        <span class="material-icons" style="color: white; font-size: 14px;">close</span>
                        ${i18n.t('test.cancel')}
                    </button>
                    <button type="button" class="assessment-btn" style="background-color: #007bff; color: white;" onclick="saveAssessment()">
                        <span class="material-icons" style="color: white; font-size: 14px;">save</span>
                        ${i18n.t('test.save')}
                    </button>
                </div>
            </div>
        `;

        assessmentList.insertAdjacentHTML('afterbegin', formHtml);
        document.getElementById('assessmentName')?.focus();
    }).catch(error => {
        console.error('Error loading exams:', error);
        alert(i18n.t('test.errorLoadingAvailableExams'));
    });
}

function loadAvailableExams(): Promise<Exam[]> {
    const authToken = localStorage.getItem('authToken');
    
    return fetch('/exams', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load exams');
        }
        return response.json();
    });
}

// Global functions for event handlers
(window as any).editAssessment = function(assessmentId: number): void {
    showEditAssessmentForm(assessmentId);
};

function showEditAssessmentForm(assessmentId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    // Load assessment data and available exams in parallel
    Promise.all([
        loadAssessmentById(assessmentId),
        loadAvailableExams()
    ]).then(([assessment, exams]) => {
        const assessmentList = document.getElementById('assessmentList');
        if (!assessmentList) return;

        const examOptions = exams.map(exam => 
            `<option value="${exam.id}" ${exam.id === assessment.examId ? 'selected' : ''}>
                ${exam.name} (${exam.cardCount || 0} ${i18n.t('test.questions')})
            </option>`
        ).join('');

        // Convert assessment times back to datetime-local format
        const startDate = new Date(assessment.startTime);
        const endDate = new Date(assessment.endTime);

        const formHtml = `
            <div class="assessment-form" id="editAssessmentForm">
                <h3>✏️ ${i18n.t('test.editAssessment')}</h3>
                <div class="form-group">
                    <label for="editAssessmentName">${i18n.t('test.assessmentName')}:</label>
                    <input type="text" id="editAssessmentName" value="${assessment.name}" placeholder="${i18n.t('test.assessmentNamePlaceholder')}" required>
                </div>
                <div class="form-group">
                    <label for="editExamSelect">${i18n.t('test.selectExam')}:</label>
                    <select id="editExamSelect" required>
                        <option value="">${i18n.t('test.pleaseSelectExam')}</option>
                        ${examOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>${i18n.t('test.timeframe')}:</label>
                    <div class="datetime-inputs">
                        <div>
                            <label for="editStartDateTime">${i18n.t('test.from')}:</label>
                            <input type="datetime-local" id="editStartDateTime" 
                                value="${formatDateTimeLocal(startDate)}" required>
                        </div>
                        <div>
                            <label for="editEndDateTime">${i18n.t('test.to')}:</label>
                            <input type="datetime-local" id="editEndDateTime" 
                                value="${formatDateTimeLocal(endDate)}" required>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="assessment-btn" style="background-color: #6c757d; color: white;" onclick="cancelEditAssessmentForm()">
                        <span class="material-icons" style="color: white; font-size: 14px;">close</span>
                        ${i18n.t('test.cancel')}
                    </button>
                    <button type="button" class="assessment-btn" style="background-color: #28a745; color: white;" onclick="updateAssessment(${assessmentId})">
                        <span class="material-icons" style="color: white; font-size: 14px;">save</span>
                        ${i18n.t('test.update')}
                    </button>
                </div>
            </div>
        `;

        assessmentList.insertAdjacentHTML('afterbegin', formHtml);
        document.getElementById('editAssessmentName')?.focus();
    }).catch(error => {
        console.error('Error loading assessment for edit:', error);
        alert(i18n.t('test.errorLoadingAssessment'));
    });
}

function loadAssessmentById(assessmentId: number): Promise<Assessment> {
    const authToken = localStorage.getItem('authToken');
    
    return fetch(`/assessments/${assessmentId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load assessment');
        }
        return response.json();
    });
}

(window as any).cancelEditAssessmentForm = function(): void {
    const editForm = document.getElementById('editAssessmentForm');
    editForm?.remove();
};

(window as any).updateAssessment = function(assessmentId: number): void {
    const nameInput = document.getElementById('editAssessmentName') as HTMLInputElement;
    const examSelect = document.getElementById('editExamSelect') as HTMLSelectElement;
    const startInput = document.getElementById('editStartDateTime') as HTMLInputElement;
    const endInput = document.getElementById('editEndDateTime') as HTMLInputElement;

    if (!nameInput.value.trim()) {
        alert(i18n.t('test.pleaseEnterAssessmentName'));
        return;
    }

    if (!examSelect.value) {
        alert(i18n.t('test.pleaseSelectExamFirst'));
        return;
    }

    if (!startInput.value || !endInput.value) {
        alert(i18n.t('test.pleaseEnterValidTimeframe'));
        return;
    }

    const startDate = new Date(startInput.value);
    const endDate = new Date(endInput.value);

    if (endDate <= startDate) {
        alert(i18n.t('test.endDateMustBeAfterStart'));
        return;
    }

    const assessmentUpdate: Assessment = {
        id: assessmentId,
        name: nameInput.value.trim(),
        examId: parseInt(examSelect.value),
        startTime: formatDateTimeForBackend(startDate),
        endTime: formatDateTimeForBackend(endDate)
    };

    const authToken = localStorage.getItem('authToken');

    fetch(`/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(assessmentUpdate)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update assessment');
        }
        return response.json();
    })
    .then(() => {
        const editForm = document.getElementById('editAssessmentForm');
        editForm?.remove();
        loadAssessments(); // Refresh the list
    })
    .catch(error => {
        console.error('Error updating assessment:', error);
        alert(i18n.t('test.errorUpdatingAssessment'));
    });
};

(window as any).deleteAssessment = function(assessmentId: number): void {
    if (!confirm(i18n.t('test.confirmDeleteAssessment'))) return;

    const authToken = localStorage.getItem('authToken');
    
    fetch(`/assessments/${assessmentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete assessment');
        }
        return response.json();
    })
    .then(() => {
        loadAssessments(); // Refresh the list
    })
    .catch(error => {
        console.error('Error deleting assessment:', error);
        alert(i18n.t('test.errorDeletingAssessment'));
    });
};

(window as any).manageAssessmentUsers = function(assessmentId: number): void {
    showUserManagementDialog(assessmentId);
};

function showUserManagementDialog(assessmentId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    // Load assessment users and available users in parallel
    Promise.all([
        loadAssessmentUsers(assessmentId),
        loadAvailableUsers()
    ]).then(([assessmentUsers, allUsers]) => {
        // Filter out users already in assessment
        const assignedUserIds = new Set(assessmentUsers.map(user => user.id));
        const availableUsers = allUsers.filter(user => !assignedUserIds.has(user.id));
        
        const dialogHtml = `
            <div class="user-management-overlay" id="userManagementOverlay">
                <div class="user-management-container">
                    <div class="exam-header">
                        <h2>👥 ${i18n.t('test.manageAssessmentUsers')}</h2>
                        <button class="new-exam-btn close-dialog-btn" onclick="closeUserManagementDialog()">
                            <span class="material-icons" style="color: white;">close</span>
                            ${i18n.t('test.close')}
                        </button>
                    </div>
                    <div class="user-management">
                        <div class="available-users">
                            <h3>${i18n.t('test.availableUsers')}</h3>
                            <div class="user-list" id="availableUsersList">
                                ${availableUsers.length === 0 ? `<div class="empty">${i18n.t('test.noAvailableUsers')}</div>` : 
                                availableUsers.map(user => `
                                    <div class="user-card">
                                        <div class="user-info">
                                            <div class="user-name">${user.username}</div>
                                            ${user.email ? `<div class="user-email">${user.email}</div>` : ''}
                                        </div>
                                        <button class="add-card-btn" onclick="addUserToAssessment(${assessmentId}, ${user.id})">
                                            <span class="material-icons">add</span>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="exam-users">
                            <h3>${i18n.t('test.usersInAssessment')}</h3>
                            <div class="user-list" id="examUsersList">
                                ${assessmentUsers.length === 0 ? `<div class="empty">${i18n.t('test.noUsersAssigned')}</div>` : 
                                assessmentUsers.map(user => `
                                    <div class="user-card">
                                        <div class="user-info">
                                            <div class="user-name">${user.username}</div>
                                            ${user.email ? `<div class="user-email">${user.email}</div>` : ''}
                                        </div>
                                        <button class="remove-card-btn" onclick="removeUserFromAssessment(${assessmentId}, ${user.id})">
                                            <span class="material-icons">remove</span>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
        addUserManagementStyles();
    }).catch(error => {
        console.error('Error loading users:', error);
        alert(i18n.t('test.errorLoadingUsers'));
    });
}

function loadAssessmentUsers(assessmentId: number): Promise<User[]> {
    const authToken = localStorage.getItem('authToken');
    
    return fetch(`/assessments/${assessmentId}/users`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load assessment users');
        }
        return response.json();
    });
}

function loadAvailableUsers(): Promise<User[]> {
    const authToken = localStorage.getItem('authToken');
    
    return fetch('/users', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        return response.json();
    });
}

function addUserManagementStyles(): void {
    if (document.getElementById('userManagementStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'userManagementStyles';
    style.textContent = `
        .user-management-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .user-management-container {
            background: white;
            border-radius: 8px;
            width: 95%;
            max-width: 1200px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .user-management {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 20px;
        }
        
        .available-users, .exam-users {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .available-users h3, .exam-users h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #212529;
            border-bottom: 2px solid #f8f9fa;
            padding-bottom: 10px;
        }
        
        .user-list {
            min-height: 400px;
            max-height: 500px;
            overflow-y: auto;
        }
        
        .user-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background-color 0.2s;
            max-height: 80px;
        }
        
        .user-card:hover {
            background: #e9ecef;
        }
        
        .user-card:last-child {
            margin-bottom: 0;
        }
        
        .user-info {
            flex: 1;
        }
        
        .user-name {
            font-weight: 600;
            color: #212529;
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .user-email {
            color: #6c757d;
            font-size: 12px;
        }
        
        .add-card-btn, .remove-card-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: background-color 0.2s;
        }
        
        .add-card-btn {
            background-color: #28a745;
            color: white;
        }
        
        .add-card-btn:hover {
            background-color: #218838;
        }
        
        .remove-card-btn {
            background-color: #dc3545;
            color: white;
        }
        
        .remove-card-btn:hover {
            background-color: #c82333;
        }
        
        .add-card-btn .material-icons,
        .remove-card-btn .material-icons {
            font-size: 14px;
            color: white;
        }
        
        .empty {
            text-align: center;
            color: #6c757d;
            padding: 40px 20px;
            font-style: italic;
        }
        
        .close-dialog-btn {
            background-color: #dc3545 !important;
        }
        
        .close-dialog-btn:hover {
            background-color: #c82333 !important;
        }
    `;
    document.head.appendChild(style);
}

(window as any).closeUserManagementDialog = function(): void {
    const overlay = document.getElementById('userManagementOverlay');
    overlay?.remove();
};

(window as any).addUserToAssessment = function(assessmentId: number, userId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    fetch(`/assessments/${assessmentId}/users/${userId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add user to assessment');
        }
        return response.json();
    })
    .then(() => {
        // Refresh the dialog
        (window as any).closeUserManagementDialog();
        showUserManagementDialog(assessmentId);
    })
    .catch(error => {
        console.error('Error adding user to assessment:', error);
        alert(i18n.t('test.errorAddingUser'));
    });
};

(window as any).removeUserFromAssessment = function(assessmentId: number, userId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    fetch(`/assessments/${assessmentId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to remove user from assessment');
        }
        return response.json();
    })
    .then(() => {
        // Refresh the dialog
        (window as any).closeUserManagementDialog();
        showUserManagementDialog(assessmentId);
    })
    .catch(error => {
        console.error('Error removing user from assessment:', error);
        alert(i18n.t('test.errorRemovingUser'));
    });
};

(window as any).cancelAssessmentForm = function(): void {
    const assessmentForm = document.getElementById('assessmentForm');
    assessmentForm?.remove();
};

(window as any).saveAssessment = function(): void {
    const nameInput = document.getElementById('assessmentName') as HTMLInputElement;
    const examSelect = document.getElementById('examSelect') as HTMLSelectElement;
    const startInput = document.getElementById('startDateTime') as HTMLInputElement;
    const endInput = document.getElementById('endDateTime') as HTMLInputElement;

    if (!nameInput.value.trim()) {
        alert(i18n.t('test.pleaseEnterAssessmentName'));
        return;
    }

    if (!examSelect.value) {
        alert(i18n.t('test.pleaseSelectExamFirst'));
        return;
    }

    if (!startInput.value || !endInput.value) {
        alert(i18n.t('test.pleaseEnterValidTimeframe'));
        return;
    }

    const startDate = new Date(startInput.value);
    const endDate = new Date(endInput.value);

    if (endDate <= startDate) {
        alert(i18n.t('test.endDateMustBeAfterStart'));
        return;
    }

    const assessment: Assessment = {
        name: nameInput.value.trim(),
        examId: parseInt(examSelect.value),
        startTime: formatDateTimeForBackend(startDate),
        endTime: formatDateTimeForBackend(endDate)
    };

    const authToken = localStorage.getItem('authToken');

    fetch('/assessments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(assessment)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to create assessment');
        }
        return response.json();
    })
    .then(() => {
        const assessmentForm = document.getElementById('assessmentForm');
        assessmentForm?.remove();
        loadAssessments(); // Refresh the list
    })
    .catch(error => {
        console.error('Error creating assessment:', error);
        alert(i18n.t('test.errorCreatingAssessment'));
    });
};

// Export to make this file a module
export {};