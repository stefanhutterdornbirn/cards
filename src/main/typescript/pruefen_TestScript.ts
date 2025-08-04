import { clearContentScreen } from './common.js';
import { i18n } from './i18n/TranslationService.js';

const TEST_PAGE: string = "TEST_PAGE";

interface UserAssessment {
    id: number;
    name: string;
    examId: number;
    examName: string;
    startTime: string;
    endTime: string;
    status: string; // assigned, started, completed, cancelled, paused
    duration: number; // in seconds
    cardCount: number;
    actualStartTime?: string; // When the user actually started the assessment
    timeSpentSeconds?: number; // Total time spent on assessment so far
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

// Helper function to check if assessment is currently active
function isAssessmentActive(assessment: UserAssessment): boolean {
    const now = new Date();
    const startDate = new Date(assessment.startTime);
    const endDate = new Date(assessment.endTime);
    
    return now >= startDate && now <= endDate;
}

// Helper function to get assessment status display
function getAssessmentStatusDisplay(assessment: UserAssessment): { text: string, className: string, icon: string } {
    const isActive = isAssessmentActive(assessment);
    const now = new Date();
    const startDate = new Date(assessment.startTime);
    const endDate = new Date(assessment.endTime);
    
    if (assessment.status === 'completed') {
        return { text: i18n.t('test.completed'), className: 'status-completed', icon: '✅' };
    } else if (assessment.status === 'started') {
        if (isActive) {
            return { text: i18n.t('test.inProgress'), className: 'status-active', icon: '⏳' };
        } else {
            return { text: i18n.t('test.expired'), className: 'status-expired', icon: '⏰' };
        }
    } else if (assessment.status === 'cancelled') {
        return { text: i18n.t('test.cancelled'), className: 'status-cancelled', icon: '❌' };
    } else if (assessment.status === 'paused') {
        return { text: i18n.t('test.paused'), className: 'status-paused', icon: '⏸️' };
    } else if (now < startDate) {
        return { text: i18n.t('test.scheduled'), className: 'status-scheduled', icon: '📅' };
    } else if (isActive) {
        return { text: i18n.t('test.available'), className: 'status-available', icon: '🎯' };
    } else {
        return { text: i18n.t('test.expired'), className: 'status-expired', icon: '⏰' };
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const testCardsLink = document.getElementById('testCardsLink');
    
    testCardsLink?.addEventListener('click', function (e) {
        e.preventDefault();
        loadTestTaking();
    });
});

function loadTestTaking(): void {
    clearContentScreen(TEST_PAGE);
    const content = document.getElementById('content');
    if (!content) return;

    // Find or create test content div
    let testContent = document.getElementById('testContent');
    if (!testContent) {
        testContent = document.createElement('div');
        testContent.id = 'testContent';
        content.appendChild(testContent);
    }

    testContent.innerHTML = `
        <div class="test-container">
            <div class="test-header">
                <h2>📝 ${i18n.t('test.takeExams')}</h2>
                <div class="test-stats" id="testStats">
                    <span class="stat-item">
                        <span class="stat-icon">📊</span>
                        <span class="stat-text">${i18n.t('test.yourAvailableExams')}</span>
                    </span>
                </div>
            </div>
            <div class="test-list" id="testList">
                <div class="loading">${i18n.t('test.loadingAvailableExams')}</div>
            </div>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .test-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #dee2e6;
        }
        
        .test-header h2 {
            margin: 0;
            color: #212529;
        }
        
        .test-stats {
            display: flex;
            gap: 20px;
        }
        
        .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #6c757d;
            font-size: 14px;
        }
        
        .stat-icon {
            font-size: 16px;
        }
        
        .test-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: box-shadow 0.2s, border-color 0.2s;
        }
        
        .test-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .test-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .test-title {
            font-size: 18px;
            font-weight: 600;
            color: #212529;
            margin: 0 0 5px 0;
        }
        
        .test-exam {
            color: #6c757d;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .test-timeframe {
            color: #495057;
            font-size: 14px;
            font-weight: 500;
        }
        
        .test-status {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status-available {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-active {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .status-completed {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .status-expired {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status-scheduled {
            background-color: #e2e3e5;
            color: #41464b;
            border: 1px solid #d6d8db;
        }
        
        .status-cancelled {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status-paused {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .test-info {
            display: flex;
            gap: 20px;
            color: #495057;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .test-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .test-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background-color 0.2s;
            font-weight: 500;
        }
        
        .test-btn.start {
            background-color: #28a745;
            color: white;
        }
        
        .test-btn.start:hover {
            background-color: #218838;
        }
        
        .test-btn.continue {
            background-color: #ffc107;
            color: #212529;
        }
        
        .test-btn.continue:hover {
            background-color: #e0a800;
        }
        
        .test-btn.view {
            background-color: #17a2b8;
            color: white;
        }
        
        .test-btn.view:hover {
            background-color: #138496;
        }
        
        .test-btn:disabled {
            background-color: #6c757d;
            color: white;
            cursor: not-allowed;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
        
        .no-tests {
            text-align: center;
            padding: 40px;
            color: #6c757d;
        }
        
        .no-tests .icon {
            font-size: 48px;
            margin-bottom: 15px;
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);

    loadAndDisplayUserAssessments();
}

function loadUserAssessments(): Promise<UserAssessment[]> {
    const authToken = localStorage.getItem('authToken');

    return fetch('/assessments/available', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load available assessments');
        }
        return response.json();
    })
    .then((assessments: UserAssessment[]) => {
        return assessments;
    });
}

function loadAndDisplayUserAssessments(): void {
    const testList = document.getElementById('testList');
    if (!testList) return;

    loadUserAssessments()
    .then((assessments: UserAssessment[]) => {
        displayUserAssessments(assessments);
        updateTestStats(assessments);
    })
    .catch(error => {
        console.error('Error loading assessments:', error);
        testList.innerHTML = `<div class="error">${i18n.t('test.errorLoadingExams')}</div>`;
    });
}

function displayUserAssessments(assessments: UserAssessment[]): void {
    const testList = document.getElementById('testList');
    if (!testList) return;

    if (assessments.length === 0) {
        testList.innerHTML = `
            <div class="no-tests">
                <div class="icon">📝</div>
                <h3>${i18n.t('test.noExamsAvailable')}</h3>
                <p>${i18n.t('test.noExamsAvailableText')}</p>
                <p>${i18n.t('test.contactInstructorForInfo')}</p>
            </div>
        `;
        return;
    }

    testList.innerHTML = '';
    assessments.forEach(assessment => {
        const testCard = createTestCard(assessment);
        testList.appendChild(testCard);
    });
}

function createTestCard(assessment: UserAssessment): HTMLElement {
    const card = document.createElement('div');
    card.className = 'test-card';
    card.dataset.assessmentId = assessment.id.toString();

    const startDate = formatDateTime(assessment.startTime);
    const endDate = formatDateTime(assessment.endTime);
    const status = getAssessmentStatusDisplay(assessment);
    const isActive = isAssessmentActive(assessment);
    const canStart = isActive && (assessment.status === 'assigned' || assessment.status === 'started');
    const canResume = isActive && (assessment.status === 'started' || assessment.status === 'paused');
    const isCompleted = assessment.status === 'completed';

    // Format duration
    const hours = Math.floor(assessment.duration / 3600);
    const minutes = Math.floor((assessment.duration % 3600) / 60);
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    card.innerHTML = `
        <div class="test-card-header">
            <div>
                <h3 class="test-title">${assessment.name}</h3>
                <div class="test-exam">📋 ${assessment.examName}</div>
                <div class="test-timeframe">⏰ ${startDate} - ${endDate}</div>
            </div>
            <div class="test-status ${status.className}">
                <span>${status.icon}</span>
                <span>${status.text}</span>
            </div>
        </div>
        <div class="test-info">
            <span>📊 ${assessment.cardCount} ${i18n.t('test.questions')}</span>
            <span>⏱️ ${durationText}</span>
            <span>🆔 ${i18n.t('test.assessment')} ${assessment.id}</span>
        </div>
        <div class="test-actions">
            ${canStart && assessment.status === 'assigned' ? 
                `<button class="test-btn start" onclick="startAssessment(${assessment.id})">
                    <span class="material-icons" style="font-size: 16px;">play_arrow</span>
                    ${i18n.t('test.startExam')}
                </button>` : ''
            }
            ${canResume && assessment.status === 'started' ? 
                `<button class="test-btn continue" onclick="continueAssessment(${assessment.id})">
                    <span class="material-icons" style="font-size: 16px;">play_arrow</span>
                    ${i18n.t('test.continue')}
                </button>` : ''
            }
            ${canResume && assessment.status === 'paused' ? 
                `<button class="test-btn continue" onclick="continueAssessment(${assessment.id})">
                    <span class="material-icons" style="font-size: 16px;">play_arrow</span>
                    ${i18n.t('test.continue')}
                </button>` : ''
            }
            ${isCompleted ? 
                `<button class="test-btn view" onclick="viewAssessmentResults(${assessment.id})">
                    <span class="material-icons" style="font-size: 16px;">visibility</span>
                    ${i18n.t('test.showResult')}
                </button>` : ''
            }
        </div>
    `;

    return card;
}

function updateTestStats(assessments: UserAssessment[]): void {
    const testStats = document.getElementById('testStats');
    if (!testStats) return;

    const availableCount = assessments.filter(a => isAssessmentActive(a) && a.status === 'assigned').length;
    const activeCount = assessments.filter(a => a.status === 'started').length;
    const completedCount = assessments.filter(a => a.status === 'completed').length;

    let statsHtml = `
        <span class="stat-item">
            <span class="stat-icon">📊</span>
            <span class="stat-text">${i18n.t('test.total')}: ${assessments.length}</span>
        </span>
    `;

    if (availableCount > 0) {
        statsHtml += `
            <span class="stat-item">
                <span class="stat-icon">🎯</span>
                <span class="stat-text">${i18n.t('test.statAvailable')}: ${availableCount}</span>
            </span>
        `;
    }

    if (activeCount > 0) {
        statsHtml += `
            <span class="stat-item">
                <span class="stat-icon">⏳</span>
                <span class="stat-text">${i18n.t('test.statInProgress')}: ${activeCount}</span>
            </span>
        `;
    }

    if (completedCount > 0) {
        statsHtml += `
            <span class="stat-item">
                <span class="stat-icon">✅</span>
                <span class="stat-text">${i18n.t('test.statCompleted')}: ${completedCount}</span>
            </span>
        `;
    }

    testStats.innerHTML = statsHtml;
}

// Helper function to parse answers from JSON or legacy format
function parseAnswersFromString(answerString: string): string[] {
    try {
        // Try to parse as JSON first (new format)
        const cardAnswers: CardAnswer[] = JSON.parse(answerString);
        return cardAnswers.map((answer, index) => 
            `${index + 1}. ${answer.text} ${answer.isCorrect ? '(✓)' : ''}`
        );
    } catch (e) {
        // Fallback to old newline-separated format
        return answerString.split('\n').map(a => a.trim()).filter(a => a.length > 0);
    }
}

interface CardAnswer {
    text: string;
    isCorrect: boolean;
}

interface AssessmentQuestion {
    id: number;
    question: string;
    answer: string; // JSON string containing CardAnswer[]
    category: string;
    difficulty: number;
    title: string;
}

interface AssessmentResult {
    id: number;
    assessmentId: number;
    userId: number;
    startedAt: string;
    completedAt: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    scorePercentage: number;
    timeSpentSeconds: number;
}

let currentAssessment: UserAssessment | null = null;
let assessmentQuestions: AssessmentQuestion[] = [];
let userAnswers: Map<number, string[]> = new Map();
let answerStates: Map<string, string> = new Map(); // Map of "questionId-answerText" to "unknown/no/yes"
let assessmentTimer: number | null = null;
let timeRemainingSeconds: number = 0;
let assessmentStartTime: Date | null = null;

// Global functions for event handlers
(window as any).startAssessment = function(assessmentId: number): void {
    if (!confirm(i18n.t('test.confirmStartExam'))) {
        return;
    }
    
    startAssessmentProcess(assessmentId);
};

(window as any).continueAssessment = function(assessmentId: number): void {
    if (!confirm(i18n.t('test.confirmContinueExam'))) {
        return;
    }
    
    continueAssessmentProcess(assessmentId);
};

(window as any).viewAssessmentResults = function(assessmentId: number): void {
    loadAssessmentResultsAndShow(assessmentId);
};

function loadAssessmentResultsAndShow(assessmentId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    fetch(`/assessments/${assessmentId}/result`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load assessment results');
        }
        return response.json();
    })
    .then((result: AssessmentResult) => {
        showAssessmentResults(result);
    })
    .catch(error => {
        console.error('Error loading assessment results:', error);
        alert(i18n.t('test.errorLoadingResults'));
    });
}

function continueAssessmentProcess(assessmentId: number): void {
    // For continuing an assessment, we don't need to call the start endpoint again
    // We just load the questions and show the overlay
    loadAssessmentQuestions(assessmentId);
}

function startAssessmentProcess(assessmentId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    // Start the assessment on the backend
    fetch(`/assessments/${assessmentId}/start`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to start assessment');
        }
        return response.json();
    })
    .then(() => {
        // Load questions and show assessment overlay
        loadAssessmentQuestions(assessmentId);
    })
    .catch(error => {
        console.error('Error starting assessment:', error);
        alert(i18n.t('test.errorStartingExam'));
    });
}

function loadAssessmentQuestions(assessmentId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    Promise.all([
        // Load questions
        fetch(`/assessments/${assessmentId}/questions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        }).then(response => response.json()),
        // Get assessment details from the current list
        Promise.resolve(null) // We'll find it in the current list
    ])
    .then(([questions, _]) => {
        assessmentQuestions = questions;
        
        // Find current assessment details
        const testCards = document.querySelectorAll('.test-card');
        testCards.forEach(card => {
            const htmlCard = card as HTMLElement;
            if (htmlCard.dataset.assessmentId === assessmentId.toString()) {
                // Extract assessment info (we could also make another API call)
                const titleElement = card.querySelector('.test-title');
                const timeElement = card.querySelector('.test-timeframe');
                if (titleElement && timeElement) {
                    // For now, we'll get the assessment duration from our available assessments
                    // This is a simplified approach - in production you might want to fetch full details
                    loadUserAssessments().then((assessments: UserAssessment[]) => {
                        const assessment = assessments.find((a: UserAssessment) => a.id === assessmentId);
                        if (assessment) {
                            currentAssessment = assessment;
                            showAssessmentOverlay();
                        }
                    });
                }
            }
        });
    })
    .catch(error => {
        console.error('Error loading questions:', error);
        alert(i18n.t('test.errorLoadingQuestions'));
    });
}

function showAssessmentOverlay(): void {
    if (!currentAssessment || assessmentQuestions.length === 0) return;
    
    // Calculate time remaining based on assessment status
    const now = new Date();
    const endTime = new Date(currentAssessment.endTime);
    const assessmentDurationMs = currentAssessment.duration * 1000;
    const timeUntilEnd = endTime.getTime() - now.getTime();
    
    if ((currentAssessment.status === 'started' || currentAssessment.status === 'paused') && currentAssessment.actualStartTime) {
        // Assessment was already started or paused - calculate remaining time
        try {
            const alreadySpentSeconds = currentAssessment.timeSpentSeconds || 0;
            
            if (currentAssessment.status === 'paused') {
                // For paused assessments, use the stored time spent
                const remainingFromDuration = Math.max(0, (assessmentDurationMs / 1000) - alreadySpentSeconds);
                const remainingFromEndTime = Math.max(0, timeUntilEnd / 1000);
                timeRemainingSeconds = Math.min(remainingFromDuration, remainingFromEndTime);
                
                console.log(`DEBUG: Resuming paused assessment. Already spent: ${alreadySpentSeconds}s, Remaining: ${Math.round(timeRemainingSeconds)}s`);
            } else {
                // For started assessments, calculate current session time and add to already spent
                const actualStartTime = new Date(currentAssessment.actualStartTime);
                if (!isNaN(actualStartTime.getTime())) {
                    const currentSessionMs = now.getTime() - actualStartTime.getTime();
                    const currentSessionSeconds = currentSessionMs / 1000;
                    const totalElapsedSeconds = alreadySpentSeconds + currentSessionSeconds;
                    
                    const remainingFromDuration = Math.max(0, (assessmentDurationMs / 1000) - totalElapsedSeconds);
                    const remainingFromEndTime = Math.max(0, timeUntilEnd / 1000);
                    timeRemainingSeconds = Math.min(remainingFromDuration, remainingFromEndTime);
                    
                    console.log(`DEBUG: Continuing started assessment. Already spent: ${alreadySpentSeconds}s, Current session: ${Math.round(currentSessionSeconds)}s, Total: ${Math.round(totalElapsedSeconds)}s, Remaining: ${Math.round(timeRemainingSeconds)}s`);
                } else {
                    // Fallback to stored time only
                    const remainingFromDuration = Math.max(0, (assessmentDurationMs / 1000) - alreadySpentSeconds);
                    const remainingFromEndTime = Math.max(0, timeUntilEnd / 1000);
                    timeRemainingSeconds = Math.min(remainingFromDuration, remainingFromEndTime);
                    console.log(`DEBUG: Invalid actualStartTime, using stored time: ${alreadySpentSeconds}s`);
                }
            }
        } catch (error) {
            console.log(`DEBUG: Error calculating time, using new assessment logic:`, error);
            timeRemainingSeconds = Math.min(assessmentDurationMs / 1000, timeUntilEnd / 1000);
        }
    } else {
        // New assessment - use full duration or time until end, whichever is shorter
        timeRemainingSeconds = Math.min(assessmentDurationMs / 1000, timeUntilEnd / 1000);
        console.log(`DEBUG: Starting new assessment. Duration: ${Math.round(timeRemainingSeconds)}s`);
    }
    
    // Ensure timeRemainingSeconds is a valid number
    if (isNaN(timeRemainingSeconds) || timeRemainingSeconds < 0) {
        timeRemainingSeconds = Math.min(assessmentDurationMs / 1000, timeUntilEnd / 1000);
        console.log(`DEBUG: Fixed invalid timeRemainingSeconds to: ${Math.round(timeRemainingSeconds)}s`);
    }
    
    // Set the start time for this session (not the original assessment start)
    assessmentStartTime = new Date();
    
    // Initialize user answers - all questions start as "unknown"
    userAnswers = new Map();
    assessmentQuestions.forEach(question => {
        userAnswers.set(question.id, ['unknown']);
    });
    
    const overlayHtml = `
        <div class="assessment-overlay" id="assessmentOverlay">
            <div class="assessment-container">
                <div class="assessment-header">
                    <div class="assessment-info">
                        <h2>📝 ${currentAssessment.name}</h2>
                        <p>${i18n.t('test.exam')}: ${currentAssessment.examName} | ${assessmentQuestions.length} ${i18n.t('test.questions')}</p>
                    </div>
                    <div class="assessment-timer">
                        <div class="timer-display" id="timerDisplay">
                            <span class="timer-icon">⏰</span>
                            <span class="timer-text" id="timerText">${formatTime(timeRemainingSeconds)}</span>
                        </div>
                        <button class="pause-btn" id="pauseAssessmentBtn">
                            <span class="material-icons">pause</span>
                            ${i18n.t('test.pauseExam')}
                        </button>
                        <button class="submit-btn" id="submitAssessmentBtn">
                            <span class="material-icons">send</span>
                            ${i18n.t('test.submitExam')}
                        </button>
                    </div>
                </div>
                <div class="questions-container" id="questionsContainer">
                    ${renderQuestions()}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', overlayHtml);
    addAssessmentOverlayStyles();
    
    // Start timer
    startAssessmentTimer();
    
    // Add event listeners
    document.getElementById('submitAssessmentBtn')?.addEventListener('click', submitAssessment);
    document.getElementById('pauseAssessmentBtn')?.addEventListener('click', pauseAssessment);
    
    // Add answer toggle listeners
    document.querySelectorAll('.answer-toggle-btn').forEach(button => {
        button.addEventListener('click', toggleAnswer);
    });
    
    // Initialize submit button state
    updateSubmitButtonState();
}

function getDifficultyText(difficulty: number): string {
    switch (difficulty) {
        case 1: return i18n.t('test.veryEasy');
        case 2: return i18n.t('test.easy');
        case 3: return i18n.t('test.medium');
        case 4: return i18n.t('test.hard');
        case 5: return i18n.t('test.veryHard');
        default: return i18n.t('test.unknown');
    }
}

function getDifficultyClass(difficulty: number): string {
    switch (difficulty) {
        case 1:
        case 2: return 'difficulty-easy';
        case 3: return 'difficulty-medium';
        case 4:
        case 5: return 'difficulty-hard';
        default: return 'difficulty-medium';
    }
}

function renderQuestions(): string {
    return assessmentQuestions.map((question, index) => {
        // Parse answers from JSON or fallback to newline format
        const answers = parseAnswersFromString(question.answer);
        
        // Convert difficulty number to string
        const difficultyText = getDifficultyText(question.difficulty);
        const difficultyClass = getDifficultyClass(question.difficulty);
        
        return `
            <div class="question-card" data-question-id="${question.id}">
                <div class="question-header">
                    <span class="question-number">${i18n.t('test.question')} ${index + 1}</span>
                    <span class="question-category">${question.category || i18n.t('test.general')}</span>
                    <span class="question-difficulty ${difficultyClass}">${difficultyText}</span>
                </div>
                <div class="question-title">${question.title || i18n.t('test.question')}</div>
                <div class="question-text">${question.question}</div>
                <div class="answers-container">
                    <div class="answers-instruction">${i18n.t('test.rateYourKnowledge')}</div>
                    ${answers.map(answer => {
                        // Remove checkmarks from display text
                        const cleanAnswer = answer.replace('(✓)', '').replace('✓', '').trim();
                        const answerKey = `${question.id}-${cleanAnswer}`;
                        return `
                        <div class="answer-item">
                            <span class="answer-text">${cleanAnswer.replace(/\n/g, '<br>')}</span>
                            <button class="answer-toggle-btn" data-question-id="${question.id}" data-answer="${cleanAnswer}" data-state="unknown">
                                ❓
                            </button>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function toggleAnswer(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const questionId = parseInt(target.dataset.questionId || '0');
    const answer = target.dataset.answer || '';
    const currentState = target.dataset.state || 'unknown';
    
    // Cycle through states: unknown -> no -> yes -> unknown
    let nextState: string;
    let nextIcon: string;
    
    switch (currentState) {
        case 'unknown':
            nextState = 'no';
            nextIcon = '❌';
            break;
        case 'no':
            nextState = 'yes';
            nextIcon = '✅';
            break;
        case 'yes':
        default:
            nextState = 'unknown';
            nextIcon = '❓';
            break;
    }
    
    // Update button state and icon
    target.dataset.state = nextState;
    target.textContent = nextIcon;
    
    // Store the answer state
    const answerKey = `${questionId}-${answer}`;
    answerStates.set(answerKey, nextState);
    
    // Update submit button state
    updateSubmitButtonState();
}

function updateSubmitButtonState(): void {
    const submitBtn = document.getElementById('submitAssessmentBtn') as HTMLButtonElement;
    if (!submitBtn) return;
    
    // Check if all questions have at least one answer that is not "unknown"
    const allAnswered = assessmentQuestions.every(question => {
        // Get all answers for this question
        const answers = parseAnswersFromString(question.answer);
        
        // Check if at least one answer is not "unknown"
        return answers.some(answer => {
            const cleanAnswer = answer.replace('(✓)', '').replace('✓', '').trim();
            const answerKey = `${question.id}-${cleanAnswer}`;
            const state = answerStates.get(answerKey);
            return state && state !== 'unknown';
        });
    });
    
    if (allAnswered) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.title = i18n.t('test.submitExam');
    } else {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        const unansweredCount = assessmentQuestions.filter(q => {
            const answers = parseAnswersFromString(q.answer);
            return !answers.some(answer => {
                const cleanAnswer = answer.replace('(✓)', '').replace('✓', '').trim();
                const answerKey = `${q.id}-${cleanAnswer}`;
                const state = answerStates.get(answerKey);
                return state && state !== 'unknown';
            });
        }).length;
        submitBtn.title = `${i18n.t('test.still')} ${unansweredCount} ${i18n.t('test.questionsToAnswer')}`;
    }
}

function startAssessmentTimer(): void {
    assessmentTimer = window.setInterval(() => {
        timeRemainingSeconds--;
        
        const timerText = document.getElementById('timerText');
        if (timerText) {
            timerText.textContent = formatTime(timeRemainingSeconds);
            
            // Change color when time is running low
            const timerDisplay = document.getElementById('timerDisplay');
            if (timerDisplay) {
                if (timeRemainingSeconds <= 300) { // 5 minutes
                    timerDisplay.classList.add('time-critical');
                } else if (timeRemainingSeconds <= 600) { // 10 minutes
                    timerDisplay.classList.add('time-warning');
                }
            }
        }
        
        if (timeRemainingSeconds <= 0) {
            // Time's up - auto submit
            alert(i18n.t('test.timeExpired'));
            submitAssessment();
        }
    }, 1000);
}

function formatTime(seconds: number): string {
    // Ensure seconds is a valid number
    if (isNaN(seconds) || seconds < 0) {
        seconds = 0;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

function pauseAssessment(): void {
    if (!currentAssessment || !confirm(i18n.t('test.confirmPauseExam'))) {
        return;
    }
    
    // Calculate only the current session time (not total time)
    const now = new Date();
    let currentSessionSeconds = 0;
    
    if (assessmentStartTime) {
        currentSessionSeconds = Math.floor((now.getTime() - assessmentStartTime.getTime()) / 1000);
    }
    
    console.log(`DEBUG: Pausing assessment. Current session time: ${currentSessionSeconds}s`);
    
    // Stop timer
    if (assessmentTimer) {
        clearInterval(assessmentTimer);
        assessmentTimer = null;
    }
    
    // Send pause request to backend
    const authToken = localStorage.getItem('authToken');
    
    fetch(`/assessments/${currentAssessment.id}/pause`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ timeSpentSeconds: currentSessionSeconds })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to pause assessment');
        }
        return response.json();
    })
    .then(() => {
        // Close assessment overlay
        const overlay = document.getElementById('assessmentOverlay');
        overlay?.remove();
        
        // Refresh the test list to show updated status
        loadAndDisplayUserAssessments();
        
        alert(i18n.t('test.examPaused'));
    })
    .catch(error => {
        console.error('Error pausing assessment:', error);
        // Still close overlay even if backend call fails
        const overlay = document.getElementById('assessmentOverlay');
        overlay?.remove();
        
        alert(i18n.t('test.errorPausingExam'));
        loadAndDisplayUserAssessments();
    });
}

function submitAssessment(): void {
    if (!currentAssessment || !confirm(i18n.t('test.confirmSubmitExam'))) {
        return;
    }
    
    // Stop timer
    if (assessmentTimer) {
        clearInterval(assessmentTimer);
        assessmentTimer = null;
    }
    
    // Prepare answers for submission based on answer states
    const answersForSubmission: { [key: string]: string[] } = {};
    assessmentQuestions.forEach(question => {
        const allAnswers = parseAnswersFromString(question.answer);
        const submittedAnswers: string[] = [];
        
        allAnswers.forEach(answer => {
            const cleanAnswer = answer.replace('(✓)', '').replace('✓', '').trim();
            const answerKey = `${question.id}-${cleanAnswer}`;
            const state = answerStates.get(answerKey);
            
            if (state === 'yes') {
                // User thinks they know this answer - include it in submission
                submittedAnswers.push(cleanAnswer);
            }
            // If state is 'no' or 'unknown', don't include the answer
        });
        
        answersForSubmission[question.id.toString()] = submittedAnswers;
    });
    
    const authToken = localStorage.getItem('authToken');
    
    fetch(`/assessments/${currentAssessment.id}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(answersForSubmission)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to submit assessment');
        }
        return response.json();
    })
    .then((result: AssessmentResult) => {
        // Close assessment overlay
        const overlay = document.getElementById('assessmentOverlay');
        overlay?.remove();
        
        // Show results
        showAssessmentResults(result);
        
        // Refresh the test list
        loadAndDisplayUserAssessments();
    })
    .catch(error => {
        console.error('Error submitting assessment:', error);
        alert(i18n.t('test.errorSubmittingExam'));
    });
}

function showAssessmentResults(result: AssessmentResult): void {
    const resultsHtml = `
        <div class="results-overlay" id="resultsOverlay">
            <div class="results-container">
                <div class="results-header">
                    <h2>🎯 ${i18n.t('test.examResult')}</h2>
                    <button class="close-results-btn" id="closeResultsBtn">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="results-content">
                    <div class="score-summary">
                        <div class="score-circle">
                            <div class="score-percentage">${Math.round(result.scorePercentage)}%</div>
                            <div class="score-label">${i18n.t('test.achieved')}</div>
                        </div>
                    </div>
                    <div class="results-details">
                        <div class="result-item">
                            <span class="result-icon">📊</span>
                            <span class="result-label">${i18n.t('test.totalQuestions')}:</span>
                            <span class="result-value">${result.totalQuestions}</span>
                        </div>
                        <div class="result-item correct">
                            <span class="result-icon">✅</span>
                            <span class="result-label">${i18n.t('test.correctAnswers')}:</span>
                            <span class="result-value">${result.correctAnswers}</span>
                        </div>
                        <div class="result-item incorrect">
                            <span class="result-icon">❌</span>
                            <span class="result-label">${i18n.t('test.incorrectAnswers')}:</span>
                            <span class="result-value">${result.incorrectAnswers}</span>
                        </div>
                        <div class="result-item">
                            <span class="result-icon">⏱️</span>
                            <span class="result-label">${i18n.t('test.timeRequired')}:</span>
                            <span class="result-value">${formatTime(result.timeSpentSeconds)}</span>
                        </div>
                    </div>
                    <div class="results-actions">
                        <button class="close-btn" onclick="closeResults()">
                            <span class="material-icons">check</span>
                            ${i18n.t('test.understood')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', resultsHtml);
    addResultsOverlayStyles();
    
    // Add close event listener
    document.getElementById('closeResultsBtn')?.addEventListener('click', closeResults);
}

(window as any).closeResults = function(): void {
    closeResults();
};

function closeResults(): void {
    const overlay = document.getElementById('resultsOverlay');
    overlay?.remove();
}

function addAssessmentOverlayStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
        .assessment-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }
        
        .assessment-container {
            background: white;
            width: 95%;
            max-width: 1200px;
            height: 95vh;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .assessment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 2px solid #dee2e6;
            background: #f8f9fa;
        }
        
        .assessment-info h2 {
            margin: 0 0 5px 0;
            color: #212529;
        }
        
        .assessment-info p {
            margin: 0;
            color: #6c757d;
            font-size: 14px;
        }
        
        .assessment-timer {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .timer-display {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            background: #e9ecef;
            border-radius: 6px;
            font-weight: bold;
            font-size: 18px;
        }
        
        .timer-display.time-warning {
            background: #fff3cd;
            color: #856404;
        }
        
        .timer-display.time-critical {
            background: #f8d7da;
            color: #721c24;
        }
        
        .pause-btn {
            background-color: #ffc107;
            color: #212529;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            margin-right: 10px;
        }
        
        .pause-btn:hover {
            background-color: #e0a800;
        }
        
        .submit-btn {
            background-color: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }
        
        .submit-btn:hover {
            background-color: #c82333;
        }
        
        .questions-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }
        
        .question-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .question-header {
            display: flex;
            gap: 15px;
            margin-bottom: 10px;
            align-items: center;
        }
        
        .question-number {
            background: #007bff;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .question-category {
            background: #6c757d;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
        }
        
        .question-difficulty {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
        }
        
        .difficulty-easy { background: #d4edda; color: #155724; }
        .difficulty-medium { background: #fff3cd; color: #856404; }
        .difficulty-hard { background: #f8d7da; color: #721c24; }
        
        .question-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
            color: #212529;
        }
        
        .question-text {
            font-size: 15px;
            margin-bottom: 15px;
            color: #495057;
            line-height: 1.5;
        }
        
        .answers-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .answer-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            margin-bottom: 8px;
        }
        
        .answers-instruction {
            font-size: 14px;
            color: #495057;
            font-weight: 500;
            margin-bottom: 10px;
            padding: 8px 12px;
            background: #e9ecef;
            border-radius: 4px;
            border-left: 3px solid #007bff;
        }
        
        .answer-toggle-btn {
            width: 50px;
            height: 50px;
            border: 2px solid #dee2e6;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .answer-toggle-btn:hover {
            border-color: #007bff;
            background: #f0f8ff;
            transform: scale(1.05);
        }
        
        .answer-toggle-btn[data-state="unknown"] {
            border-color: #ffc107;
            background: #fff3cd;
        }
        
        .answer-toggle-btn[data-state="no"] {
            border-color: #dc3545;
            background: #f8d7da;
        }
        
        .answer-toggle-btn[data-state="yes"] {
            border-color: #28a745;
            background: #d4edda;
        }
        
        .answer-text {
            font-size: 14px;
            font-weight: 500;
            flex: 1;
            margin-right: 15px;
        }
    `;
    document.head.appendChild(style);
}

function addResultsOverlayStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
        .results-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2100;
        }
        
        .results-container {
            background: white;
            width: 90%;
            max-width: 600px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 2px solid #dee2e6;
            background: #f8f9fa;
        }
        
        .results-header h2 {
            margin: 0;
            color: #212529;
        }
        
        .close-results-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
            color: #6c757d;
        }
        
        .results-content {
            padding: 30px;
        }
        
        .score-summary {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .score-circle {
            display: inline-block;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: linear-gradient(135deg, #28a745, #20c997);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            margin: 0 auto;
        }
        
        .score-percentage {
            font-size: 36px;
            font-weight: bold;
            line-height: 1;
        }
        
        .score-label {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .results-details {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .result-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .result-item.correct {
            background: #d4edda;
        }
        
        .result-item.incorrect {
            background: #f8d7da;
        }
        
        .result-icon {
            font-size: 16px;
        }
        
        .result-label {
            flex: 1;
            font-weight: 500;
        }
        
        .result-value {
            font-weight: bold;
        }
        
        .results-actions {
            text-align: center;
        }
        
        .close-btn {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            font-size: 16px;
        }
        
        .close-btn:hover {
            background-color: #0056b3;
        }
    `;
    document.head.appendChild(style);
}

// Export to make this file a module
export {};