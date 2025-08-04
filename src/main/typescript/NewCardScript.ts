import {clearContentScreen} from './common.js';
import { i18n } from './i18n/TranslationService.js';


const NEW_CARDL_PAGE: string = "NEW_CARD_PAGE";

// Counter for unique IDs
let answerIdCounter = 0;

// Interfaces for data structures
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

interface MemoryCard {
    id: number;
    topic: Topic;
    question: Question;
    answers: Answer[];
}

interface LearningCard {
    id?: number;
    title: string;
    question: string;
    answer: string;
    category?: string;
    difficulty?: number; // Optional, defaults to 1
    imageId?: number;    // Optional image ID
    createdBy?: number;  // Set by backend
    groupId?: number;    // Set by backend
}

interface Frage {
    frage: string
}

interface Antwort {
    antwort: string
}



document.addEventListener('DOMContentLoaded', () => {
    const newcardsLink = document.getElementById('newcardsLink') as HTMLElement;
    const newcardsContent = document.getElementById('newcardContent') as HTMLElement;

    newcardsLink.addEventListener('click', (e: Event) => {
        e.preventDefault();
        createMemoryCards();
    });
});

// Function to create a new learning card
function createMemoryCards(): void {
    const newcardsContent = document.getElementById('newcardContent') as HTMLElement;
    clearContentScreen(NEW_CARDL_PAGE);

    // Header
    const heading = document.createElement('h2');
    heading.textContent = i18n.t('cards.createNewCard');
    newcardsContent.appendChild(heading);

    // Einzelne Karte
    const memoryCard = document.createElement('div');
    memoryCard.className = 'memory-card';
    memoryCard.style.maxWidth = '1200px';
    memoryCard.style.margin = '0 auto';
    memoryCard.style.width = '100%';
    memoryCard.style.padding = '20px';
    memoryCard.style.border = '1px solid #ddd';
    memoryCard.style.borderRadius = '8px';

    // Header section with topic selection
    const headerSection = document.createElement('div');
    headerSection.className = 'card-header';

    const topicLabel = document.createElement('label');
    topicLabel.textContent = i18n.t('cards.topic') + ':';
    topicLabel.className = 'card-topic';
    topicLabel.setAttribute('for', 'topicSelect');

    const topicSelect = document.createElement('select');
    topicSelect.id = 'topicSelect';
    topicSelect.className = 'topic-filter';
    topicSelect.style.marginLeft = '10px';
    topicSelect.style.width = '70%';

    headerSection.appendChild(topicLabel);
    headerSection.appendChild(topicSelect);

    // Add difficulty selection
    const difficultyLabel = document.createElement('label');
    difficultyLabel.textContent = i18n.t('cards.difficulty') + ':';
    difficultyLabel.className = 'card-difficulty';
    difficultyLabel.setAttribute('for', 'difficultySelect');
    difficultyLabel.style.marginLeft = '20px';

    const difficultySelect = document.createElement('select');
    difficultySelect.id = 'difficultySelect';
    difficultySelect.className = 'difficulty-filter';
    difficultySelect.style.marginLeft = '10px';
    difficultySelect.style.width = 'auto';

    // Add difficulty options
    for (let i = 1; i <= 5; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.textContent = `${i} ${'★'.repeat(i)}${'☆'.repeat(5-i)}`;
        if (i === 1) option.selected = true; // Default to 1
        difficultySelect.appendChild(option);
    }

    headerSection.appendChild(difficultyLabel);
    headerSection.appendChild(difficultySelect);
    memoryCard.appendChild(headerSection);

    // Title section
    const titleSection = document.createElement('div');
    titleSection.className = 'card-title';
    titleSection.style.marginTop = '15px';

    const titleLabel = document.createElement('label');
    titleLabel.textContent = i18n.t('cards.cardTitle') + ':';
    titleLabel.setAttribute('for', 'titleInput');
    titleLabel.style.display = 'block';
    titleLabel.style.marginBottom = '5px';

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'titleInput';
    titleInput.className = 'form-control';
    titleInput.placeholder = i18n.t('cards.titlePlaceholder');
    titleInput.style.width = '100%';
    titleInput.style.padding = '8px';
    titleInput.style.borderRadius = '5px';
    titleInput.style.border = '1px solid #ddd';

    titleSection.appendChild(titleLabel);
    titleSection.appendChild(titleInput);
    memoryCard.appendChild(titleSection);

    // Question section
    const questionSection = document.createElement('div');
    questionSection.className = 'card-question';

    const questionLabel = document.createElement('label');
    questionLabel.textContent = i18n.t('cards.question') + ':';
    questionLabel.setAttribute('for', 'questionInput');
    questionLabel.style.display = 'block';
    questionLabel.style.marginBottom = '5px';

    const questionInput = document.createElement('textarea');
    questionInput.id = 'questionInput';
    questionInput.className = 'form-control';
    questionInput.rows = 3;
    questionInput.placeholder = i18n.t('cards.questionPlaceholder');
    questionInput.style.width = '100%';
    questionInput.style.padding = '8px';
    questionInput.style.borderRadius = '5px';
    questionInput.style.border = '1px solid #ddd';

    questionSection.appendChild(questionLabel);
    questionSection.appendChild(questionInput);

    // Image selection
    const imageSection = document.createElement('div');
    imageSection.className = 'card-image';
    imageSection.style.marginTop = '15px';

    const imageLabel = document.createElement('label');
    imageLabel.textContent = i18n.t('cards.imageSelect') + ':';
    imageLabel.setAttribute('for', 'imageSelect');
    imageLabel.style.display = 'block';
    imageLabel.style.marginBottom = '5px';

    const imageSelect = document.createElement('select');
    imageSelect.id = 'imageSelect';
    imageSelect.className = 'topic-filter';
    imageSelect.style.width = '100%';

    const previewContainer = document.createElement('div');
    previewContainer.className = 'image-preview-container';
    previewContainer.style.marginTop = '10px';
    previewContainer.style.textAlign = 'center';

    imageSection.appendChild(imageLabel);
    imageSection.appendChild(imageSelect);
    imageSection.appendChild(previewContainer);

    questionSection.appendChild(imageSection);
    memoryCard.appendChild(questionSection);

    // Answers section
    const answersSection = document.createElement('div');
    answersSection.className = 'card-answers';

    const answersLabel = document.createElement('h3');
    answersLabel.textContent = i18n.t('cards.answers');
    answersLabel.style.marginBottom = '10px';
    answersLabel.style.marginTop = '20px';
    answersSection.appendChild(answersLabel);

    const answersListContainer = document.createElement('div');
    answersListContainer.id = 'answersListContainer';
    answersListContainer.style.display = 'flex';
    answersListContainer.style.flexDirection = 'column';
    answersListContainer.style.gap = '10px';
    answersSection.appendChild(answersListContainer);

    memoryCard.appendChild(answersSection);

    // Button-Container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'space-between';

    const addAnswerButton = document.createElement('button');
    addAnswerButton.className = 'add-answer-button';
    addAnswerButton.innerHTML = '<span class="material-icons">add</span> ' + i18n.t('cards.newAnswer');
    addAnswerButton.style.backgroundColor = '#2196F3';
    addAnswerButton.style.color = 'white';
    addAnswerButton.style.border = 'none';
    addAnswerButton.style.borderRadius = '4px';
    addAnswerButton.style.padding = '8px 16px';
    addAnswerButton.style.cursor = 'pointer';
    addAnswerButton.style.display = 'flex';
    addAnswerButton.style.alignItems = 'center';
    addAnswerButton.style.gap = '5px';
    
    // Fix icon color
    const addIcon = addAnswerButton.querySelector('.material-icons') as HTMLElement;
    if (addIcon) {
        addIcon.style.color = 'white';
    }
    addAnswerButton.onclick = () => addNewAnswer("");

    const askAIButton = document.createElement('button');
    askAIButton.className = 'add-answer-button';
    askAIButton.innerHTML = '<span class="material-icons">add</span> ' + i18n.t('cards.askAI');
    askAIButton.style.backgroundColor = '#2196F3';
    askAIButton.style.color = 'white';
    askAIButton.style.border = 'none';
    askAIButton.style.borderRadius = '4px';
    askAIButton.style.padding = '8px 16px';
    askAIButton.style.cursor = 'pointer';
    askAIButton.style.display = 'flex';
    askAIButton.style.alignItems = 'center';
    askAIButton.style.gap = '5px';
    
    // Fix icon color
    const askIcon = askAIButton.querySelector('.material-icons') as HTMLElement;
    if (askIcon) {
        askIcon.style.color = 'white';
    }
    askAIButton.onclick = addNewAIAnswer;

    const saveButton = document.createElement('button');
    saveButton.className = 'save-card-button';
    saveButton.innerHTML = '<span class="material-icons">save</span> ' + i18n.t('cards.save');
    saveButton.style.backgroundColor = '#4CAF50';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '4px';
    saveButton.style.padding = '8px 16px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.display = 'flex';
    saveButton.style.alignItems = 'center';
    saveButton.style.gap = '5px';
    
    // Fix icon color
    const saveIcon = saveButton.querySelector('.material-icons') as HTMLElement;
    if (saveIcon) {
        saveIcon.style.color = 'white';
    }
    saveButton.onclick = saveMemoryCard;

    buttonContainer.appendChild(addAnswerButton);
    buttonContainer.appendChild(askAIButton);
    buttonContainer.appendChild(saveButton);
    memoryCard.appendChild(buttonContainer);

    newcardsContent.appendChild(memoryCard);

    loadTopics();
    loadImages();

    addNewAnswer("");
    addNewAnswer("");
}

function loadTopics(): void {
    const topicSelect = document.getElementById('topicSelect') as HTMLSelectElement;
    const authToken = localStorage.getItem('authToken');

    fetch('/learning-topics', {
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
        .then((topics: Topic[]) => {
            const sortedTopics = topics.sort((a, b) => a.id - b.id);

            topicSelect.innerHTML = '';

            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = i18n.t('cards.selectTopic');
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            topicSelect.appendChild(placeholderOption);

            sortedTopics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic.id.toString();
                option.textContent = topic.name;
                topicSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error(i18n.t('topics.loadError') + ':', error);
            alert(i18n.t('topics.loadError'));
        });
}

function loadImages(): void {
    const imageSelect = document.getElementById('imageSelect') as HTMLSelectElement;
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
            const sortedImages = images.sort((a, b) => a.id - b.id);

            imageSelect.innerHTML = '';

            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = i18n.t('cards.selectImage');
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            imageSelect.appendChild(placeholderOption);

            sortedImages.forEach(image => {
                const option = document.createElement('option');
                option.value = image.id.toString();
                option.textContent = image.name;
                option.dataset.location = image.location;
                imageSelect.appendChild(option);
            });

            imageSelect.addEventListener('change', updateImagePreview);
        })
        .catch(error => {
            console.error(i18n.t('images.loadError') + ':', error);
            alert(i18n.t('images.loadError'));
        });
}

function updateImagePreview(): void {
    const imageSelect = document.getElementById('imageSelect') as HTMLSelectElement;
    const previewContainer = document.querySelector('.image-preview-container') as HTMLElement;

    previewContainer.innerHTML = '';

    if (imageSelect.value) {
        const selectedOption = imageSelect.options[imageSelect.selectedIndex];
        const imageLocation = selectedOption.dataset.location;

        if (imageLocation) {
            const imagePreview = document.createElement('img');
            imagePreview.src = `/thumbnails/${imageLocation}`;
            imagePreview.alt = i18n.t('cards.imagePreview');
            imagePreview.className = 'question-image';
            imagePreview.style.maxWidth = '300px';
            imagePreview.style.maxHeight = '300px';
            imagePreview.style.marginTop = '10px';

            previewContainer.appendChild(imagePreview);
        }
    }
}

function addNewAIAnswer(): void {
    const questionInput = document.getElementById('questionInput') as HTMLTextAreaElement;
    let frage: string = questionInput.value.trim();

    // Get the AI button to show loading state
    const askAIButton = document.querySelector('.add-answer-button:nth-child(2)') as HTMLButtonElement;
    
    // Store original button content
    const originalButtonContent = askAIButton.innerHTML;
    
    // Show loading state
    askAIButton.innerHTML = '<span class="material-icons spinning" style="color: white;">hourglass_top</span> ' + i18n.t('cards.loading');
    askAIButton.disabled = true;
    askAIButton.style.cursor = 'not-allowed';
    askAIButton.style.opacity = '0.7';

    const authToken = localStorage.getItem('authToken');
    const frage1: Frage = {
        frage: frage
    }

    fetch('/ask', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(frage1)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(i18n.t('forms.requestError') + ': ' + (errorData.message || i18n.t('forms.unknownError')));
                });
            }
            return response.json();
        })
        .then((antwort: Antwort) => {
            addNewAnswer(antwort.antwort);
        })
        .catch(error => {
            alert("Please try again later.");
        })
        .finally(() => {
            // Restore original button state
            askAIButton.innerHTML = originalButtonContent;
            askAIButton.disabled = false;
            askAIButton.style.cursor = 'pointer';
            askAIButton.style.opacity = '1';
        });
}

function addNewAnswer(init: string): void {
    const answersListContainer = document.getElementById('answersListContainer') as HTMLElement;

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
    answerInput.value = init;
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

    const correctLabel = document.createElement('label');
    correctLabel.textContent = i18n.t('cards.correct');
    correctLabel.setAttribute('for', correctCheckbox.id);
    correctLabel.style.fontSize = '14px';

    correctContainer.appendChild(correctCheckbox);
    correctContainer.appendChild(correctLabel);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-answer-button';
    deleteButton.innerHTML = '<span class="material-icons">delete</span>';
    deleteButton.style.backgroundColor = 'transparent';
    deleteButton.style.border = 'none';
    deleteButton.style.color = '#f44336';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.minWidth = '24px';
    
    // Fix icon color
    const deleteIcon = deleteButton.querySelector('.material-icons') as HTMLElement;
    if (deleteIcon) {
        deleteIcon.style.color = '#f44336';
    }
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

    answersListContainer.appendChild(answerDiv);
}

function saveMemoryCard(): void {
    const topicSelect = document.getElementById('topicSelect') as HTMLSelectElement;
    const titleInput = document.getElementById('titleInput') as HTMLInputElement;
    const questionInput = document.getElementById('questionInput') as HTMLTextAreaElement;
    const imageSelect = document.getElementById('imageSelect') as HTMLSelectElement;
    const difficultySelect = document.getElementById('difficultySelect') as HTMLSelectElement;
    const answerItems = document.querySelectorAll('.card-answer');
    const authToken = localStorage.getItem('authToken');

    if (!topicSelect.value) {
        alert(i18n.t('topics.pleaseSelectTopic'));
        return;
    }

    if (!titleInput.value.trim()) {
        alert(i18n.t('forms.pleaseEnterTitle'));
        return;
    }

    if (!questionInput.value.trim()) {
        alert(i18n.t('cards.pleaseEnterQuestion'));
        return;
    }

    //if (!imageSelect.value) {
    //    alert(i18n.t('cards.pleaseSelectImage'));
    //    return;
    //}

    if (answerItems.length < 2) {
        alert(i18n.t('cards.minTwoAnswers'));
        return;
    }

    const answers: Answer[] = [];
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

    if (answers.length < 2) {
        alert(i18n.t('cards.minTwoAnswers'));
        return;
    }

    if (!hasCorrectAnswer) {
        alert(i18n.t('cards.oneCorrectAnswerRequired'));
        return;
    }

    // Convert answers to JSON format
    const cardAnswers: CardAnswer[] = answers.map(answer => ({
        text: answer.text,
        isCorrect: answer.isCorrect
    }));

    const learningCard: LearningCard = {
        title: titleInput.value.trim(),
        question: questionInput.value.trim(),
        answer: JSON.stringify(cardAnswers),
        category: topicSelect.options[topicSelect.selectedIndex].textContent || undefined,
        difficulty: parseInt(difficultySelect.value) || 1,
        imageId: imageSelect.value && imageSelect.value !== '0' ? parseInt(imageSelect.value) : undefined
    };

    fetch('/learning-cards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(learningCard)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(i18n.t('cards.saveError') + ': ' + (errorData.message || i18n.t('forms.unknownError')));
                });
            }
            return response.json();
        })
        .then(() => {
            alert(i18n.t('cards.cardSavedSuccessfully'));

            topicSelect.selectedIndex = 0;
            titleInput.value = '';
            questionInput.value = '';
            imageSelect.selectedIndex = 0;
            difficultySelect.selectedIndex = 0;

            const previewContainer = document.querySelector('.image-preview-container') as HTMLElement;
            previewContainer.innerHTML = '';

            const answersListContainer = document.getElementById('answersListContainer') as HTMLElement;
            answersListContainer.innerHTML = '';

            addNewAnswer("");
            addNewAnswer("");
        })
        .catch(error => {
            console.error(i18n.t('cards.saveError') + ':', error);
            alert(error.message);
        });
}
