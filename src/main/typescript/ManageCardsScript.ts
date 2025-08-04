import { clearContentScreen } from './common.js';
import { i18n } from './i18n/TranslationService.js';

const MANAGE_CARDL_PAGE: string = "MANAGE_CARD_PAGE";

interface Topic {
    id: number;
    name: string;
}

interface Image {
    id: number;
    name: string;
    extension?: string;
    location?: string;
}

interface Question {
    id: number;
    text: string;
    image: Image;
}

interface Answer {
    id: number;
    text: string;
    isCorrect: boolean;
}

interface CardAnswer {
    text: string;
    isCorrect: boolean;
}

interface LearningCard {
    id?: number;
    title: string;
    question: string;
    answer: string; // JSON string containing CardAnswer[]
    category?: string;
    difficulty?: number;
    imageId?: number;
    createdBy?: number;
    groupId?: number;
    createdAt?: string;
    updatedAt?: string;
}

document.addEventListener('DOMContentLoaded', function () {
    const manageCardsLink = document.getElementById('manageCardsLink');
    const cardsContent = document.getElementById('cardsContent');

    manageCardsLink?.addEventListener('click', function (e) {
        e.preventDefault();
        loadMemoryCards();
    });
});

function loadMemoryCards(): void {
    const authToken = localStorage.getItem('authToken');

    fetch('/learning-cards', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error(i18n.t('forms.networkError'));
            return response.json();
        })
        .then((cards: LearningCard[]) => {
            displayLearningCards(cards);
        })
        .catch(error => {
            console.error(i18n.t('cards.loadError') + ':', error);
            const cardsContent = document.getElementById('cardsContent');
            if (cardsContent) {
                cardsContent.innerHTML = `<p class="error">${i18n.t('cards.errorLoadingCards')}</p>`;
            }
        });
}

function formatAnswersForDisplay(answerText: string): string {
    try {
        // Try to parse as JSON first (new format)
        const answers: CardAnswer[] = JSON.parse(answerText);
        return answers.map(answer => 
            answer.isCorrect ? `✓ ${answer.text}` : `• ${answer.text}`
        ).join(' | ');
    } catch (e) {
        // Fallback to old newline-separated format
        const lines = answerText.split('\n').filter(line => line.trim());
        
        return lines.map(line => {
            // Remove number prefix and clean up
            const cleanLine = line.replace(/^\d+\.\s*/, '');
            
            // Check if it's marked as correct
            const isCorrect = cleanLine.includes('(✓)');
            
            // Remove the correct marker
            const text = cleanLine.replace(/\s*\(✓\)\s*$/, '').trim();
            
            // Return formatted text with correct indicator
            return isCorrect ? `✓ ${text}` : `• ${text}`;
        }).join(' | ');
    }
}

function displayLearningCards(cards: LearningCard[]): void {
    clearContentScreen(MANAGE_CARDL_PAGE);
    const cardsContent = document.getElementById('cardsContent');
    if (!cardsContent) return;

    const heading = document.createElement('h2');
    heading.textContent = i18n.t('cards.management');
    cardsContent.appendChild(heading);

    const table = document.createElement('table');
    table.className = 'cards-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    table.style.backgroundColor = 'white';
    table.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            <th style="padding: 12px; text-align: left; border-right: 1px solid #dee2e6; width: 60px;">ID</th>
            <th style="padding: 12px; text-align: left; border-right: 1px solid #dee2e6; width: 180px;">${i18n.t('cards.cardTitle')}</th>
            <th style="padding: 12px; text-align: left; border-right: 1px solid #dee2e6; width: 250px;">${i18n.t('cards.question')}</th>
            <th style="padding: 12px; text-align: left; border-right: 1px solid #dee2e6; width: 250px;">${i18n.t('cards.answers')}</th>
            <th style="padding: 12px; text-align: left; border-right: 1px solid #dee2e6; width: 120px;">${i18n.t('cards.areas')}</th>
            <th style="padding: 12px; text-align: left; border-right: 1px solid #dee2e6; width: 100px;">${i18n.t('cards.difficulty')}</th>
            <th style="padding: 12px; text-align: left; width: 180px;">${i18n.t('cards.actions')}</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    cards.forEach(card => {
        tbody.appendChild(createCardRow(card));
    });

    table.appendChild(tbody);
    cardsContent.appendChild(table);
}

function createCardRow(card: LearningCard): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.dataset.cardId = card.id?.toString() || '0';
    tr.style.borderBottom = '1px solid #dee2e6';
    tr.style.transition = 'background-color 0.2s';
    
    // Add hover effect
    tr.addEventListener('mouseenter', () => {
        tr.style.backgroundColor = '#f8f9fa';
    });
    tr.addEventListener('mouseleave', () => {
        tr.style.backgroundColor = 'white';
    });
    
    const difficultyStars = '★'.repeat(card.difficulty || 1) + '☆'.repeat(5 - (card.difficulty || 1));
    
    // Truncate long text for better display
    const truncatedQuestion = card.question.length > 80 ? card.question.substring(0, 80) + '...' : card.question;
    const truncatedTitle = card.title.length > 40 ? card.title.substring(0, 40) + '...' : card.title;
    
    // Format answers for display
    const formattedAnswers = formatAnswersForDisplay(card.answer);
    const truncatedAnswers = formattedAnswers.length > 80 ? formattedAnswers.substring(0, 80) + '...' : formattedAnswers;
    
    tr.innerHTML = `
        <td style="padding: 12px; border-right: 1px solid #dee2e6; font-weight: bold; color: #495057;">${card.id}</td>
        <td style="padding: 12px; border-right: 1px solid #dee2e6;" class="card-title" title="${card.title}">${truncatedTitle}</td>
        <td style="padding: 12px; border-right: 1px solid #dee2e6; word-wrap: break-word;" class="card-question" title="${card.question}">${truncatedQuestion}</td>
        <td style="padding: 12px; border-right: 1px solid #dee2e6; word-wrap: break-word; font-size: 12px; color: #495057;" class="card-answers" title="${formattedAnswers}">${truncatedAnswers}</td>
        <td style="padding: 12px; border-right: 1px solid #dee2e6; color: #6c757d;">${card.category || i18n.t('cards.unknown')}</td>
        <td style="padding: 12px; border-right: 1px solid #dee2e6; color: #ff6b35; font-weight: bold;">${difficultyStars}</td>
        <td style="padding: 12px;" class="action-buttons">
            <button class="edit-button" style="
                background-color: #007bff;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 5px;
                font-size: 12px;
            ">${i18n.t('cards.edit')}</button>
            <button class="delete-button" style="
                background-color: #dc3545;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            ">${i18n.t('cards.delete')}</button>
        </td>
    `;

    // Add button hover effects
    const editButton = tr.querySelector('.edit-button') as HTMLButtonElement;
    const deleteButton = tr.querySelector('.delete-button') as HTMLButtonElement;
    
    editButton.addEventListener('mouseenter', () => {
        editButton.style.backgroundColor = '#0056b3';
    });
    editButton.addEventListener('mouseleave', () => {
        editButton.style.backgroundColor = '#007bff';
    });
    
    deleteButton.addEventListener('mouseenter', () => {
        deleteButton.style.backgroundColor = '#c82333';
    });
    deleteButton.addEventListener('mouseleave', () => {
        deleteButton.style.backgroundColor = '#dc3545';
    });

    editButton.addEventListener('click', () => showEditForm(card, tr));
    deleteButton.addEventListener('click', () => deleteCard(card.id!, tr));

    return tr;
}

function showEditForm(card: LearningCard, row: HTMLTableRowElement): void {
    const editForm = document.createElement('tr');
    editForm.className = 'edit-form-row edit-form';
    editForm.innerHTML = `
        <td colspan="7">
            <div class="learning-card" style="max-width: 800px; margin: 0 auto; width: 100%;">
                <div class="card-header">
                    <label class="card-topic" for="topicSelect">${i18n.t('cards.areas')}:</label>
                    <select id="topicSelect" class="topic-filter topic-select" style="margin-left: 10px; width: 70%;">
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <label>ID:</label>
                    <span class="card-id">${card.id}</span>
                </div>
                
                <div class="form-group">
                    <label for="titleInput" style="display: block; margin-bottom: 5px;">${i18n.t('cards.cardTitle')}:</label>
                    <input type="text" id="titleInput" class="title-input form-control" 
                        style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd;"
                        value="${card.title}">
                </div>
                
                <div class="form-group">
                    <label for="questionInput" style="display: block; margin-bottom: 5px;">${i18n.t('cards.question')}:</label>
                    <textarea id="questionInput" class="question-input form-control" rows="3" 
                        style="width: 100%; padding: 8px; border-radius: 5px; border: 1px solid #ddd;"
                    >${card.question}</textarea>
                </div>
                
                <div class="card-answers">
                    <h3 style="margin-bottom: 10px; margin-top: 20px;">${i18n.t('cards.answers')}</h3>
                    <div class="answers-list" style="display: flex; flex-direction: column; gap: 10px;">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="difficultySelect" style="display: block; margin-bottom: 5px;">${i18n.t('cards.difficulty')}:</label>
                    <select id="difficultySelect" class="difficulty-select" style="width: 200px;">
                        <option value="1" ${card.difficulty === 1 ? 'selected' : ''}>1 ★☆☆☆☆</option>
                        <option value="2" ${card.difficulty === 2 ? 'selected' : ''}>2 ★★☆☆☆</option>
                        <option value="3" ${card.difficulty === 3 ? 'selected' : ''}>3 ★★★☆☆</option>
                        <option value="4" ${card.difficulty === 4 ? 'selected' : ''}>4 ★★★★☆</option>
                        <option value="5" ${card.difficulty === 5 ? 'selected' : ''}>5 ★★★★★</option>
                    </select>
                </div>
                
                <div class="card-image" style="margin-top: 15px;">
                    <label for="imageSelect" style="display: block; margin-bottom: 5px;">${i18n.t('cards.imageSelect')}:</label>
                    <select id="imageSelect" class="topic-filter image-select" style="width: 100%;">
                    </select>
                    <div class="image-preview-container image-preview" style="margin-top: 10px; text-align: center;">
                    </div>
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: space-between;">
                    <button type="button" class="add-answer-btn" style="
                        background-color: #2196F3;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 8px 16px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    "><span class="material-icons" style="color: white;">add</span> ${i18n.t('cards.newAnswer')}</button>
                    
                    <div class="button-group" style="display: flex; gap: 10px;">
                        <button type="button" class="save-btn" style="
                            background-color: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            padding: 8px 16px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        "><span class="material-icons" style="color: white;">save</span> ${i18n.t('cards.save')}</button>
                        
                        <button type="button" class="cancel-btn" style="
                            background-color: #f44336;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            padding: 8px 16px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        "><span class="material-icons" style="color: white;">close</span> ${i18n.t('cards.cancel')}</button>
                    </div>
                </div>
            </div>
        </td>
    `;

    // Load topics and images
    loadTopicsForEdit(editForm.querySelector('.topic-select') as HTMLSelectElement, card.category || '');
    loadImagesForEdit(editForm.querySelector('.image-select') as HTMLSelectElement, card.imageId || 0);

    // Parse existing answers from the card.answer field
    const answersContainer = editForm.querySelector('.answers-list') as HTMLElement;
    const existingAnswers = parseAnswersFromText(card.answer);
    
    // Add existing answers to the form
    existingAnswers.forEach(answer => addAnswerToForm(answersContainer, answer));
    
    // If no answers exist, add two empty ones
    if (existingAnswers.length === 0) {
        addAnswerToForm(answersContainer, { id: 0, text: '', isCorrect: false });
        addAnswerToForm(answersContainer, { id: 0, text: '', isCorrect: false });
    }

    // Event handlers for buttons
    editForm.querySelector('.add-answer-btn')?.addEventListener('click', () => {
        addAnswerToForm(answersContainer, { id: 0, text: '', isCorrect: false });
    });
    
    editForm.querySelector('.save-btn')?.addEventListener('click', () => saveEditedCard(card.id!, editForm, row));
    editForm.querySelector('.cancel-btn')?.addEventListener('click', () => {
        row.style.display = '';
        editForm.remove();
    });

    // Event listener for image preview
    const imageSelect = editForm.querySelector('.image-select');
    if (imageSelect) {
        setTimeout(() => {
            imageSelect.addEventListener('change', () => {
                const currentForm = document.querySelector('.edit-form');
                if (currentForm) {
                    const select = currentForm.querySelector('.image-select') as HTMLSelectElement;
                    const container = currentForm.querySelector('.image-preview') as HTMLElement;
                    
                    if (select && container) {
                        container.innerHTML = '';
                        
                        if (select.value) {
                            const selectedOption = select.options[select.selectedIndex];
                            const imageLocation = selectedOption.dataset.location;
                            if (imageLocation) {
                                const imagePreview = document.createElement('img');
                                imagePreview.src = `/thumbnails/${imageLocation}`;
                                imagePreview.alt = i18n.t('cards.imagePreviewAlt');
                                imagePreview.className = 'question-image';
                                imagePreview.style.maxWidth = '300px';
                                imagePreview.style.maxHeight = '300px';
                                imagePreview.style.marginTop = '10px';
                                
                                container.appendChild(imagePreview);
                            }
                        }
                    }
                }
            });
            
            // Initial preview
            imageSelect.dispatchEvent(new Event('change'));
        }, 0);
    }

    row.style.display = 'none';
    row.parentNode?.insertBefore(editForm, row.nextSibling);
}

function loadTopicsForEdit(select: HTMLSelectElement, selectedCategory: string): void {
    const authToken = localStorage.getItem('authToken');
    
    fetch('/learning-topics', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => response.json())
        .then((topics: Topic[]) => {
            topics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic.name;
                option.textContent = topic.name;
                option.selected = topic.name === selectedCategory;
                select.appendChild(option);
            });
        });
}

function parseAnswersFromText(answerText: string): Answer[] {
    try {
        // Try to parse as JSON first (new format)
        const cardAnswers: CardAnswer[] = JSON.parse(answerText);
        return cardAnswers.map((answer, index) => ({
            id: index + 1,
            text: answer.text,
            isCorrect: answer.isCorrect
        }));
    } catch (e) {
        // Fallback to old newline-separated format
        const answers: Answer[] = [];
        const lines = answerText.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
            // Remove number prefix (e.g., "1. ")
            const cleanLine = line.replace(/^\d+\.\s*/, '');
            
            // Check if it's marked as correct (contains ✓)
            const isCorrect = cleanLine.includes('(✓)');
            
            // Remove the correct marker
            const text = cleanLine.replace(/\s*\(✓\)\s*$/, '').trim();
            
            if (text) {
                answers.push({
                    id: index + 1,
                    text: text,
                    isCorrect: isCorrect
                });
            }
        });
        
        return answers;
    }
}

let answerIdCounter = 0;

function addAnswerToForm(container: HTMLElement, answer: Answer): void {
    const answerDiv = document.createElement('div');
    answerDiv.className = 'card-answer';
    answerDiv.style.marginBottom = '15px';
    answerDiv.style.border = '1px solid #ddd';
    answerDiv.style.borderRadius = '8px';
    answerDiv.style.padding = '15px';

    const answerContent = document.createElement('div');
    answerContent.className = 'answer-content';
    answerContent.style.display = 'flex';
    answerContent.style.alignItems = 'flex-start';
    answerContent.style.width = '100%';
    answerContent.style.gap = '10px';
    answerContent.style.minHeight = '80px';

    const answerInput = document.createElement('textarea');
    answerInput.value = answer.text;
    answerInput.className = 'answer-input answer-text';
    answerInput.placeholder = i18n.t('cards.answerPlaceholder');
    answerInput.style.flex = '1';
    answerInput.style.border = '1px solid #ccc';
    answerInput.style.padding = '12px';
    answerInput.style.backgroundColor = '#fff';
    answerInput.style.resize = 'vertical';
    answerInput.style.minHeight = '80px';
    answerInput.style.fontSize = '14px';
    answerInput.style.borderRadius = '4px';
    answerInput.style.overflowY = 'hidden';
    
    // Auto-resize textarea as content grows
    answerInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
        
        // Update answer-content height to match textarea
        answerContent.style.height = 'auto';
        answerContent.style.minHeight = this.scrollHeight + 'px';
        
        // Update card-answer (answerDiv) height to match content
        answerDiv.style.height = 'auto';
        answerDiv.style.minHeight = this.scrollHeight + 'px';
    });

    const correctContainer = document.createElement('div');
    correctContainer.style.display = 'flex';
    correctContainer.style.alignItems = 'center';
    correctContainer.style.gap = '5px';
    correctContainer.style.marginRight = '15px';

    const correctCheckbox = document.createElement('input');
    correctCheckbox.type = 'checkbox';
    correctCheckbox.className = 'correct-checkbox';
    correctCheckbox.id = `correct-${++answerIdCounter}`;
    correctCheckbox.checked = answer.isCorrect;

    const correctLabel = document.createElement('label');
    correctLabel.textContent = i18n.t('cards.correct');
    correctLabel.setAttribute('for', correctCheckbox.id);
    correctLabel.style.fontSize = '14px';

    correctContainer.appendChild(correctCheckbox);
    correctContainer.appendChild(correctLabel);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-answer-button';
    deleteButton.innerHTML = '<span class="material-icons" style="color: #f44336;">delete</span>';
    deleteButton.style.backgroundColor = 'transparent';
    deleteButton.style.border = 'none';
    deleteButton.style.color = '#f44336';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.minWidth = '24px';
    deleteButton.onclick = function () {
        if (document.querySelectorAll('.card-answer').length > 2) {
            answerDiv.remove();
        } else {
            alert(i18n.t('cards.minTwoAnswersRequired'));
        }
    };

    answerContent.appendChild(answerInput);
    answerContent.appendChild(correctContainer);
    answerContent.appendChild(deleteButton);
    answerDiv.appendChild(answerContent);

    container.appendChild(answerDiv);
}

function loadImagesForEdit(imageSelect: HTMLSelectElement, selectedImageId: number) {
    console.log('Loading images for edit form, selected image ID:', selectedImageId);
    
    const authToken = localStorage.getItem('authToken');
    
    fetch('/images', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(i18n.t('forms.networkError'));
        }
        return response.json();
    })
    .then((images: Image[]) => {
        // Sort images by ID
        const sortedImages = images.sort((a, b) => a.id - b.id);
        
        // Clear existing options
        imageSelect.innerHTML = '';
        
        // Add placeholder
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = i18n.t('cards.selectImage');
        placeholderOption.disabled = true;
        imageSelect.appendChild(placeholderOption);
        
        // Add images as options
        sortedImages.forEach(image => {
            const option = document.createElement('option');
            option.value = image.id.toString();
            option.textContent = image.name;
            // Store location in dataset
            if (image.location) {
                option.dataset.location = image.location;
            }
            if (image.id === selectedImageId) {
                option.selected = true;
            }
            imageSelect.appendChild(option);
        });

        // Trigger initial preview
        imageSelect.dispatchEvent(new Event('change'));
    })
    .catch(error => {
        console.error(i18n.t('images.loadError') + ':', error);
        alert(i18n.t('images.loadError'));
    });
}





function saveEditedCard(cardId: number, editForm: HTMLTableRowElement, originalRow: HTMLTableRowElement): void {
    // Collect all data from form
    const title = (editForm.querySelector('.title-input') as HTMLInputElement).value;
    const question = (editForm.querySelector('.question-input') as HTMLTextAreaElement).value;
    const category = (editForm.querySelector('.topic-select') as HTMLSelectElement).value;
    const difficulty = parseInt((editForm.querySelector('.difficulty-select') as HTMLSelectElement).value);
    const imageId = parseInt((editForm.querySelector('.image-select') as HTMLSelectElement).value) || undefined;
    
    // Collect answers
    const answers: Answer[] = [];
    const answerItems = editForm.querySelectorAll('.card-answer');
    let hasCorrectAnswer = false;

    answerItems.forEach(item => {
        const answerInput = item.querySelector('.answer-input') as HTMLTextAreaElement;
        const correctCheckbox = item.querySelector('.correct-checkbox') as HTMLInputElement;
        const answerText = answerInput.value;
        const isCorrect = correctCheckbox.checked;

        if (answerText.trim()) {
            answers.push({
                id: 0,
                text: answerText,
                isCorrect: isCorrect
            });

            if (isCorrect) {
                hasCorrectAnswer = true;
            }
        }
    });

    // Validation
    if (!title.trim()) {
        alert(i18n.t('forms.pleaseEnterTitle'));
        return;
    }

    if (!question.trim()) {
        alert(i18n.t('cards.pleaseEnterQuestion'));
        return;
    }

    if (answers.length < 2) {
        alert(i18n.t('cards.minTwoAnswersRequiredText'));
        return;
    }

    if (!hasCorrectAnswer) {
        alert(i18n.t('cards.oneCorrectAnswerRequiredText'));
        return;
    }

    // Convert answers to a single answer string (combine correct answers)
    const allAnswersText = answers.map((answer, index) => 
        `${index + 1}. ${answer.text} ${answer.isCorrect ? '(✓)' : ''}`
    ).join('\n');

    // Send update to server
    const authToken = localStorage.getItem('authToken');

    const updatedCard: LearningCard = {
        id: cardId,
        title: title.trim(),
        question: question.trim(),
        answer: allAnswersText,
        category: category || undefined,
        difficulty: difficulty || 1,
        imageId: imageId && imageId > 0 ? imageId : undefined
    };

    fetch(`/learning-cards/${cardId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updatedCard)
    })
        .then(response => {
            if (!response.ok) throw new Error(i18n.t('cards.updateFailed'));
            return response.json();
        })
        .then((savedCard: LearningCard) => {
            // Update original row and show it again
            const newRow = createCardRow(savedCard);
            originalRow.parentNode?.replaceChild(newRow, originalRow);
            editForm.remove();
        })
        .catch(error => {
            console.error(i18n.t('cards.saveError') + ':', error);
            alert(i18n.t('cards.errorSaving'));
        });
}

function deleteCard(cardId: number, row: HTMLTableRowElement): void {
    if (!confirm(i18n.t('cards.confirmDelete'))) return;

    const authToken = localStorage.getItem('authToken');
    
    fetch(`/learning-cards/${cardId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            if (!response.ok) throw new Error(i18n.t('cards.deleteFailed'));
            row.remove();
            return response.json();
        })
        .then(data => {
            console.log(i18n.t('cards.deleteSuccessful'), data.message);
            alert(i18n.t('cards.cardDeletedSuccessfully') + ': ' + data.message);
        })
        .catch(error => {
            console.error(i18n.t('cards.deleteError') + ':', error);
            alert(i18n.t('cards.errorDeleting'));
        });
}