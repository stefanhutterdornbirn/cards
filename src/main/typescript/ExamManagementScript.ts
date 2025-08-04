import { clearContentScreen } from './common.js';
import { i18n } from './i18n/TranslationService.js';

const EXAM_MANAGEMENT_PAGE: string = "EXAM_MANAGEMENT_PAGE";

interface Exam {
    id?: number;
    name: string;
    durationInSeconds: number;
    createdBy?: number;
    groupId?: number;
    createdAt?: string;
    updatedAt?: string;
    cardCount?: number; // Number of cards in this exam
}

interface LearningCard {
    id?: number;
    title: string;
    question: string;
    answer: string;
    category?: string;
    difficulty?: number;
    imageId?: number;
    createdBy?: number;
    groupId?: number;
    createdAt?: string;
    updatedAt?: string;
}

let answerIdCounter = 0;

// Helper function to format dates
function formatDate(dateString?: string): string {
    if (!dateString || dateString.trim() === '') {
        return i18n.t('common.unknown');
    }
    
    try {
        // Handle ZonedDateTime format from Kotlin backend
        // Example: "2025-07-17T13:40:19.171971600+02:00[Europe/Vienna]"
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
        
        // Create date object
        const date = new Date(cleanDateString);
        
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date string after cleaning:', cleanDateString, 'original:', dateString);
            return i18n.t('common.unknown');
        }
        
        // Format as DD.MM.YYYY (German format)
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.warn('Error formatting date:', dateString, error);
        return i18n.t('common.unknown');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const examManagementLink = document.getElementById('examManagementLink');
    
    examManagementLink?.addEventListener('click', function (e) {
        e.preventDefault();
        loadExamManagement();
    });
});

function loadExamManagement(): void {
    clearContentScreen(EXAM_MANAGEMENT_PAGE);
    const examManagementContent = document.getElementById('examManagementContent');
    if (!examManagementContent) return;

    examManagementContent.innerHTML = `
        <div class="exam-management-container">
            <div class="exam-header">
                <h2>📝 ${i18n.t('exams.title')}</h2>
                <button class="new-exam-btn" id="newExamBtn">
                    <span class="material-icons" style="color: white;">add</span>
                    ${i18n.t('exams.newExam')}
                </button>
            </div>
            <div class="exam-list" id="examList">
                <div class="loading">${i18n.t('exams.loading')}</div>
            </div>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .exam-management-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .exam-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #dee2e6;
        }
        
        .exam-header h2 {
            margin: 0;
            color: #212529;
        }
        
        .new-exam-btn {
            background-color: #28a745;
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
        
        .new-exam-btn:hover {
            background-color: #218838;
        }
        
        .exam-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: box-shadow 0.2s;
        }
        
        .exam-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .exam-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .exam-title {
            font-size: 18px;
            font-weight: 600;
            color: #212529;
            margin: 0;
        }
        
        .exam-duration {
            color: #6c757d;
            font-size: 14px;
        }
        
        .exam-card-count {
            color: #495057;
            font-size: 14px;
            font-weight: 500;
            margin-top: 5px;
        }
        
        .exam-actions {
            display: flex;
            gap: 10px;
        }
        
        .exam-btn {
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
        
        .exam-btn.edit {
            background-color: #007bff;
            color: white;
        }
        
        .exam-btn.edit:hover {
            background-color: #0056b3;
        }
        
        .exam-btn.delete {
            background-color: #dc3545;
            color: white;
        }
        
        .exam-btn.delete:hover {
            background-color: #c82333;
        }
        
        .exam-btn.manage-cards {
            background-color: #17a2b8;
            color: white;
        }
        
        .exam-btn.manage-cards:hover {
            background-color: #138496;
        }
        
        .exam-info {
            display: flex;
            gap: 20px;
            color: #495057;
            font-size: 14px;
        }
        
        .exam-form {
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
        
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .duration-inputs {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .duration-inputs input {
            width: 80px;
            text-align: center;
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
    `;
    document.head.appendChild(style);

    const newExamBtn = document.getElementById('newExamBtn');
    newExamBtn?.addEventListener('click', showNewExamForm);

    loadExams();
}

function loadExams(): void {
    const authToken = localStorage.getItem('authToken');
    const examList = document.getElementById('examList');
    
    if (!examList) return;

    fetch('/exams', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(i18n.t('exams.loadError'));
        }
        return response.json();
    })
    .then((exams: Exam[]) => {
        // Load card counts for each exam
        loadExamsWithCardCounts(exams);
    })
    .catch(error => {
        console.error('Error loading exams:', error);
        examList.innerHTML = `<div class="error">${i18n.t('exams.loadError')}</div>`;
    });
}

function loadExamsWithCardCounts(exams: Exam[]): void {
    const authToken = localStorage.getItem('authToken');
    
    // Create promises to load card counts for each exam
    const cardCountPromises = exams.map(exam => 
        fetch(`/exams/${exam.id}/cards`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                // If we can't load card count, just set it to 0
                return [];
            }
            return response.json();
        })
        .then((cards: LearningCard[]) => {
            exam.cardCount = cards.length;
            return exam;
        })
        .catch(error => {
            console.warn('Error loading card count for exam', exam.id, error);
            exam.cardCount = 0;
            return exam;
        })
    );

    // Wait for all card counts to load, then display exams
    Promise.all(cardCountPromises)
        .then(examsWithCounts => {
            displayExams(examsWithCounts);
        })
        .catch(error => {
            console.error('Error loading exam card counts:', error);
            // Fallback: display exams without card counts
            displayExams(exams);
        });
}

function displayExams(exams: Exam[]): void {
    const examList = document.getElementById('examList');
    if (!examList) return;

    if (exams.length === 0) {
        examList.innerHTML = `
            <div class="no-exams">
                <p>${i18n.t('exams.noExams')}</p>
                <p>${i18n.t('exams.createFirstExam')}</p>
            </div>
        `;
        return;
    }

    examList.innerHTML = '';
    exams.forEach(exam => {
        const examCard = createExamCard(exam);
        examList.appendChild(examCard);
    });
}

function createExamCard(exam: Exam): HTMLElement {
    const card = document.createElement('div');
    card.className = 'exam-card';
    card.dataset.examId = exam.id?.toString();

    const minutes = Math.floor(exam.durationInSeconds / 60);
    const seconds = exam.durationInSeconds % 60;
    const durationText = `${minutes}:${seconds.toString().padStart(2, '0')} Min`;

    card.innerHTML = `
        <div class="exam-card-header">
            <div>
                <h3 class="exam-title">${exam.name}</h3>
                <div class="exam-duration">${i18n.t('exams.duration')}: ${durationText}</div>
                <div class="exam-card-count">📋 ${exam.cardCount || 0} ${i18n.t('exams.questions')}</div>
            </div>
            <div class="exam-actions">
                <button class="exam-btn manage-cards" onclick="manageExamCards(${exam.id})">
                    <span class="material-icons" style="color: white; font-size: 14px;">view_list</span>
                    ${i18n.t('exams.cards')}
                </button>
                <button class="exam-btn edit" onclick="editExam(${exam.id})">
                    <span class="material-icons" style="color: white; font-size: 14px;">edit</span>
                    ${i18n.t('common.edit')}
                </button>
                <button class="exam-btn delete" onclick="deleteExam(${exam.id})">
                    <span class="material-icons" style="color: white; font-size: 14px;">delete</span>
                    ${i18n.t('common.delete')}
                </button>
            </div>
        </div>
        <div class="exam-info">
            <span>ID: ${exam.id}</span>
            <span>${i18n.t('common.created')}: ${formatDate(exam.createdAt)}</span>
        </div>
    `;

    return card;
}

function showNewExamForm(): void {
    const examList = document.getElementById('examList');
    if (!examList) return;

    const formHtml = `
        <div class="exam-form" id="examForm">
            <h3>📝 ${i18n.t('exams.createNew')}</h3>
            <div class="form-group">
                <label for="examName">${i18n.t('exams.examName')}:</label>
                <input type="text" id="examName" placeholder="${i18n.t('exams.namePlaceholder')}" required>
            </div>
            <div class="form-group">
                <label>${i18n.t('exams.examDuration')}:</label>
                <div class="duration-inputs">
                    <input type="number" id="durationMinutes" min="0" max="999" value="60" required>
                    <span>${i18n.t('common.minutes')}</span>
                    <input type="number" id="durationSeconds" min="0" max="59" value="0" required>
                    <span>${i18n.t('common.seconds')}</span>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="exam-btn" style="background-color: #6c757d; color: white;" onclick="cancelExamForm()">
                    <span class="material-icons" style="color: white; font-size: 14px;">close</span>
                    ${i18n.t('common.cancel')}
                </button>
                <button type="button" class="exam-btn" style="background-color: #28a745; color: white;" onclick="saveExam()">
                    <span class="material-icons" style="color: white; font-size: 14px;">save</span>
                    ${i18n.t('common.save')}
                </button>
            </div>
        </div>
    `;

    examList.insertAdjacentHTML('afterbegin', formHtml);
    document.getElementById('examName')?.focus();
}

function showEditExamForm(examId: number): void {
    const examList = document.getElementById('examList');
    if (!examList) return;

    // First, get the exam data
    const authToken = localStorage.getItem('authToken');
    
    // Find the exam in the current list to get its data
    const examCard = document.querySelector(`[data-exam-id="${examId}"]`) as HTMLElement;
    if (!examCard) return;
    
    // Extract current exam data from the card
    const examTitle = examCard.querySelector('.exam-title')?.textContent || '';
    const durationText = examCard.querySelector('.exam-duration')?.textContent || '';
    
    // Parse duration from "Dauer: 60:30 Min" format
    const durationMatch = durationText.match(/(\d+):(\d+)/);
    const currentMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
    const currentSeconds = durationMatch ? parseInt(durationMatch[2]) : 0;

    const formHtml = `
        <div class="exam-form" id="editExamForm">
            <h3>✏️ ${i18n.t('exams.editExam')}</h3>
            <div class="form-group">
                <label for="editExamName">${i18n.t('exams.examName')}:</label>
                <input type="text" id="editExamName" value="${examTitle}" placeholder="${i18n.t('exams.namePlaceholder')}" required>
            </div>
            <div class="form-group">
                <label>${i18n.t('exams.examDuration')}:</label>
                <div class="duration-inputs">
                    <input type="number" id="editDurationMinutes" min="0" max="999" value="${currentMinutes}" required>
                    <span>${i18n.t('common.minutes')}</span>
                    <input type="number" id="editDurationSeconds" min="0" max="59" value="${currentSeconds}" required>
                    <span>${i18n.t('common.seconds')}</span>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="exam-btn" style="background-color: #6c757d; color: white;" onclick="cancelEditExamForm()">
                    <span class="material-icons" style="color: white; font-size: 14px;">close</span>
                    ${i18n.t('common.cancel')}
                </button>
                <button type="button" class="exam-btn" style="background-color: #28a745; color: white;" onclick="updateExam(${examId})">
                    <span class="material-icons" style="color: white; font-size: 14px;">save</span>
                    ${i18n.t('common.update')}
                </button>
            </div>
        </div>
    `;

    examList.insertAdjacentHTML('afterbegin', formHtml);
    document.getElementById('editExamName')?.focus();
}

// Global functions for event handlers
(window as any).editExam = function(examId: number): void {
    showEditExamForm(examId);
};

(window as any).deleteExam = function(examId: number): void {
    if (!confirm(i18n.t('common.confirmDelete'))) return;

    const authToken = localStorage.getItem('authToken');
    
    fetch(`/exams/${examId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(i18n.t('exams.deleteError'));
        }
        return response.json();
    })
    .then(() => {
        loadExams(); // Refresh the list
    })
    .catch(error => {
        console.error('Error deleting exam:', error);
        alert(i18n.t('exams.deleteError'));
    });
};

(window as any).manageExamCards = function(examId: number): void {
    showCardManagement(examId);
};

(window as any).cancelExamForm = function(): void {
    const examForm = document.getElementById('examForm');
    examForm?.remove();
};

(window as any).cancelEditExamForm = function(): void {
    const editExamForm = document.getElementById('editExamForm');
    editExamForm?.remove();
};

(window as any).updateExam = function(examId: number): void {
    const nameInput = document.getElementById('editExamName') as HTMLInputElement;
    const minutesInput = document.getElementById('editDurationMinutes') as HTMLInputElement;
    const secondsInput = document.getElementById('editDurationSeconds') as HTMLInputElement;

    if (!nameInput.value.trim()) {
        alert(i18n.t('exams.pleaseEnterName'));
        return;
    }

    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;

    if (minutes === 0 && seconds === 0) {
        alert(i18n.t('exams.pleaseEnterDuration'));
        return;
    }

    const totalSeconds = minutes * 60 + seconds;

    const exam: Exam = {
        id: examId,
        name: nameInput.value.trim(),
        durationInSeconds: totalSeconds
    };

    const authToken = localStorage.getItem('authToken');

    fetch(`/exams/${examId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(exam)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(i18n.t('exams.updateError'));
        }
        return response.json();
    })
    .then(() => {
        const editExamForm = document.getElementById('editExamForm');
        editExamForm?.remove();
        loadExams(); // Refresh the list
    })
    .catch(error => {
        console.error('Error updating exam:', error);
        alert(i18n.t('exams.updateError'));
    });
};

(window as any).saveExam = function(): void {
    const nameInput = document.getElementById('examName') as HTMLInputElement;
    const minutesInput = document.getElementById('durationMinutes') as HTMLInputElement;
    const secondsInput = document.getElementById('durationSeconds') as HTMLInputElement;

    if (!nameInput.value.trim()) {
        alert(i18n.t('exams.pleaseEnterName'));
        return;
    }

    const minutes = parseInt(minutesInput.value) || 0;
    const seconds = parseInt(secondsInput.value) || 0;

    if (minutes === 0 && seconds === 0) {
        alert(i18n.t('exams.pleaseEnterDuration'));
        return;
    }

    const totalSeconds = minutes * 60 + seconds;

    const exam: Exam = {
        name: nameInput.value.trim(),
        durationInSeconds: totalSeconds
    };

    const authToken = localStorage.getItem('authToken');

    fetch('/exams', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(exam)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(i18n.t('exams.createError'));
        }
        return response.json();
    })
    .then(() => {
        const examForm = document.getElementById('examForm');
        examForm?.remove();
        loadExams(); // Refresh the list
    })
    .catch(error => {
        console.error('Error creating exam:', error);
        alert(i18n.t('exams.createError'));
    });
};

function showCardManagement(examId: number): void {
    const examManagementContent = document.getElementById('examManagementContent');
    if (!examManagementContent) return;

    examManagementContent.innerHTML = `
        <div class="exam-management-container">
            <div class="exam-header">
                <h2>🎯 Karten der Prüfung verwalten</h2>
                <button class="new-exam-btn" onclick="goBackToExamList()">
                    <span class="material-icons" style="color: white;">arrow_back</span>
                    Zurück zur Übersicht
                </button>
            </div>
            <div class="card-management">
                <div class="available-cards">
                    <h3>Verfügbare Lernkarten</h3>
                    <div class="card-list" id="availableCardsList">
                        <div class="loading">Karten werden geladen...</div>
                    </div>
                </div>
                <div class="exam-cards">
                    <h3>Karten in der Prüfung</h3>
                    <div class="card-list" id="examCardsList">
                        <div class="loading">Prüfungskarten werden geladen...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add card management styles
    const style = document.createElement('style');
    style.textContent = `
        .card-management {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 20px;
        }
        
        .available-cards, .exam-cards {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .available-cards h3, .exam-cards h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #212529;
            border-bottom: 2px solid #f8f9fa;
            padding-bottom: 10px;
        }
        
        .card-item {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background-color 0.2s;
        }
        
        .card-item:hover {
            background: #e9ecef;
        }
        
        .card-info {
            flex: 1;
        }
        
        .card-title {
            font-weight: 600;
            color: #212529;
            margin-bottom: 5px;
        }
        
        .card-details {
            font-size: 12px;
            color: #6c757d;
        }
        
        .card-action-btn {
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
        
        .card-action-btn.add {
            background-color: #28a745;
            color: white;
        }
        
        .card-action-btn.add:hover {
            background-color: #218838;
        }
        
        .card-action-btn.remove {
            background-color: #dc3545;
            color: white;
        }
        
        .card-action-btn.remove:hover {
            background-color: #c82333;
        }
    `;
    document.head.appendChild(style);

    loadAvailableCards(examId);
    loadExamCards(examId);
}

function loadAvailableCards(examId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    // Load all learning cards and exam cards in parallel
    Promise.all([
        fetch('/learning-cards', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        }),
        fetch(`/exams/${examId}/cards`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
    ])
    .then(([cardsResponse, examCardsResponse]) => {
        if (!cardsResponse.ok) {
            throw new Error('Failed to load cards');
        }
        if (!examCardsResponse.ok) {
            throw new Error('Failed to load exam cards');
        }
        return Promise.all([cardsResponse.json(), examCardsResponse.json()]);
    })
    .then(([allCards, examCards]: [LearningCard[], LearningCard[]]) => {
        // Filter out cards that are already in the exam
        const examCardIds = new Set(examCards.map(card => card.id));
        const availableCards = allCards.filter(card => !examCardIds.has(card.id));
        
        displayAvailableCards(availableCards, examId);
    })
    .catch(error => {
        console.error('Error loading available cards:', error);
        const list = document.getElementById('availableCardsList');
        if (list) {
            list.innerHTML = '<div class="error">Fehler beim Laden der Karten</div>';
        }
    });
}

function displayAvailableCards(cards: LearningCard[], examId: number): void {
    const list = document.getElementById('availableCardsList');
    if (!list) return;

    if (cards.length === 0) {
        list.innerHTML = '<div class="no-cards">Keine Lernkarten verfügbar</div>';
        return;
    }

    list.innerHTML = '';
    cards.forEach(card => {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        cardItem.innerHTML = `
            <div class="card-info">
                <div class="card-title">${card.title}</div>
                <div class="card-details">
                    ${card.category || 'Unbekannt'} • 
                    Schwierigkeit: ${'★'.repeat(card.difficulty || 1)}${'☆'.repeat(5 - (card.difficulty || 1))}
                </div>
            </div>
            <button class="card-action-btn add" onclick="addCardToExam(${examId}, ${card.id})">
                <span class="material-icons" style="color: white; font-size: 14px;">add</span>
                ${i18n.t('common.add')}
            </button>
        `;
        list.appendChild(cardItem);
    });
}

function loadExamCards(examId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    fetch(`/exams/${examId}/cards`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(i18n.t('exams.examCardsLoadError'));
        }
        return response.json();
    })
    .then((cards: LearningCard[]) => {
        displayExamCards(cards, examId);
    })
    .catch(error => {
        console.error('Error loading exam cards:', error);
        const list = document.getElementById('examCardsList');
        if (list) {
            list.innerHTML = `<div class="error">${i18n.t('exams.examCardsLoadError')}</div>`;
        }
    });
}

function displayExamCards(cards: LearningCard[], examId: number): void {
    const list = document.getElementById('examCardsList');
    if (!list) return;

    if (cards.length === 0) {
        list.innerHTML = `<div class="no-cards">${i18n.t('exams.noCardsInExam')}</div>`;
        return;
    }

    list.innerHTML = '';
    cards.forEach((card, index) => {
        const cardItem = document.createElement('div');
        cardItem.className = 'card-item';
        cardItem.innerHTML = `
            <div class="card-info">
                <div class="card-title">${index + 1}. ${card.title}</div>
                <div class="card-details">
                    ${card.category || 'Unbekannt'} • 
                    Schwierigkeit: ${'★'.repeat(card.difficulty || 1)}${'☆'.repeat(5 - (card.difficulty || 1))}
                </div>
            </div>
            <button class="card-action-btn remove" onclick="removeCardFromExam(${examId}, ${card.id})">
                <span class="material-icons" style="color: white; font-size: 14px;">remove</span>
                ${i18n.t('common.remove')}
            </button>
        `;
        list.appendChild(cardItem);
    });
}

// Helper function to refresh exam data after card changes
function refreshCurrentExamData(examId: number): void {
    // Check if we're currently in the card management view
    const examManagementContent = document.getElementById('examManagementContent');
    if (examManagementContent && examManagementContent.innerHTML.includes('Karten der Prüfung verwalten')) {
        // We're in card management view, refresh both lists
        loadAvailableCards(examId);
        loadExamCards(examId);
    } else {
        // We're in the main exam list view, refresh the exam list
        loadExams();
    }
}

// Global functions for card management
(window as any).goBackToExamList = function(): void {
    loadExamManagement();
};

(window as any).addCardToExam = function(examId: number, cardId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    fetch(`/exams/${examId}/cards/${cardId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(i18n.t('exams.addCardError'));
        }
        return response.json();
    })
    .then(() => {
        // Refresh exam data to update card counts and lists
        refreshCurrentExamData(examId);
    })
    .catch(error => {
        console.error('Error adding card to exam:', error);
        alert(i18n.t('exams.addCardError'));
    });
};

(window as any).removeCardFromExam = function(examId: number, cardId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    fetch(`/exams/${examId}/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(i18n.t('exams.removeCardError'));
        }
        return response.json();
    })
    .then(() => {
        // Refresh exam data to update card counts and lists
        refreshCurrentExamData(examId);
    })
    .catch(error => {
        console.error('Error removing card from exam:', error);
        alert(i18n.t('exams.removeCardError'));
    });
};