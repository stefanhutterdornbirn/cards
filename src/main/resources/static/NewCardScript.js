import { clearContentScreen } from './js/common.js';

const NEW_CARD_PAGE = "NEW_CARD_PAGE";

document.addEventListener('DOMContentLoaded', function () {
    const newcardsLink = document.getElementById('newcardsLink');
    const newcardsContent = document.getElementById('newcardContent');

    newcardsLink.addEventListener('click', function (e) {
        e.preventDefault();
        createMemoryCards();
    });
});

// Funktion zum Erstellen einer neuen Lernkarte
function createMemoryCards() {
    const newcardsContent = document.getElementById('newcardContent');
    clearContentScreen(NEW_CARD_PAGE);

    // Überschrift
    const heading = document.createElement('h2');
    heading.textContent = 'Neue Lernkarte erstellen';
    newcardsContent.appendChild(heading);

    // Einzelne Karte - direkt im Content-Bereich ohne cards-container
    const memoryCard = document.createElement('div');
    memoryCard.className = 'memory-card';
    // Breiteres Layout für die Erstellungskarte
    memoryCard.style.maxWidth = '800px';
    memoryCard.style.margin = '0 auto'; // Zentrieren
    memoryCard.style.width = '100%';
    
    // Header-Bereich mit Topic-Auswahl
    const headerSection = document.createElement('div');
    headerSection.className = 'card-header';
    
    const topicLabel = document.createElement('label');
    topicLabel.textContent = 'Thema:';
    topicLabel.className = 'card-topic';
    topicLabel.setAttribute('for', 'topicSelect');
    
    const topicSelect = document.createElement('select');
    topicSelect.id = 'topicSelect';
    topicSelect.className = 'topic-filter';
    topicSelect.style.marginLeft = '10px';
    topicSelect.style.width = '70%';
    
    headerSection.appendChild(topicLabel);
    headerSection.appendChild(topicSelect);
    memoryCard.appendChild(headerSection);
    
    // Frage-Bereich
    const questionSection = document.createElement('div');
    questionSection.className = 'card-question';
    
    const questionLabel = document.createElement('label');
    questionLabel.textContent = 'Frage:';
    questionLabel.setAttribute('for', 'questionInput');
    questionLabel.style.display = 'block';
    questionLabel.style.marginBottom = '5px';
    
    const questionInput = document.createElement('textarea');
    questionInput.id = 'questionInput';
    questionInput.className = 'form-control';
    questionInput.rows = 3;
    questionInput.placeholder = 'Geben Sie hier Ihre Frage ein...';
    questionInput.style.width = '100%';
    questionInput.style.padding = '8px';
    questionInput.style.borderRadius = '5px';
    questionInput.style.border = '1px solid #ddd';
    
    questionSection.appendChild(questionLabel);
    questionSection.appendChild(questionInput);
    
    // Bild-Auswahl
    const imageSection = document.createElement('div');
    imageSection.className = 'card-image';
    imageSection.style.marginTop = '15px';
    
    const imageLabel = document.createElement('label');
    imageLabel.textContent = 'Bild auswählen:';
    imageLabel.setAttribute('for', 'imageSelect');
    imageLabel.style.display = 'block';
    imageLabel.style.marginBottom = '5px';
    
    const imageSelect = document.createElement('select');
    imageSelect.id = 'imageSelect';
    imageSelect.className = 'topic-filter';
    imageSelect.style.width = '100%';
    
    // Vorschaubild-Container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'image-preview-container';
    previewContainer.style.marginTop = '10px';
    previewContainer.style.textAlign = 'center';
    
    imageSection.appendChild(imageLabel);
    imageSection.appendChild(imageSelect);
    imageSection.appendChild(previewContainer);
    
    questionSection.appendChild(imageSection);
    memoryCard.appendChild(questionSection);
    
    // Antworten-Bereich
    const answersSection = document.createElement('div');
    answersSection.className = 'card-answers';
    
    const answersLabel = document.createElement('h3');
    answersLabel.textContent = 'Antworten';
    answersLabel.style.marginBottom = '10px';
    answersLabel.style.marginTop = '20px';
    answersSection.appendChild(answersLabel);

    // Container für die einzelnen Antworten
    const answersListContainer = document.createElement('div');
    answersListContainer.id = 'answersListContainer';
    answersListContainer.style.display = 'flex';
    answersListContainer.style.flexDirection = 'column';
    answersListContainer.style.gap = '10px';
    answersSection.appendChild(answersListContainer);
    
    memoryCard.appendChild(answersSection);
    
    // Button-Container am Ende der Karte
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'space-between';
    
    // Button zum Hinzufügen neuer Antworten
    const addAnswerButton = document.createElement('button');
    addAnswerButton.className = 'add-answer-button';
    addAnswerButton.innerHTML = '<span class="material-icons">add</span> Neue Antwort';
    addAnswerButton.style.backgroundColor = '#2196F3';
    addAnswerButton.style.color = 'white';
    addAnswerButton.style.border = 'none';
    addAnswerButton.style.borderRadius = '4px';
    addAnswerButton.style.padding = '8px 16px';
    addAnswerButton.style.cursor = 'pointer';
    addAnswerButton.style.display = 'flex';
    addAnswerButton.style.alignItems = 'center';
    addAnswerButton.style.gap = '5px';
    addAnswerButton.onclick = addNewAnswer;
    
    // Speichern-Button
    const saveButton = document.createElement('button');
    saveButton.className = 'save-card-button';
    saveButton.innerHTML = '<span class="material-icons">save</span> Speichern';
    saveButton.style.backgroundColor = '#4CAF50';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '4px';
    saveButton.style.padding = '8px 16px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.display = 'flex';
    saveButton.style.alignItems = 'center';
    saveButton.style.gap = '5px';
    saveButton.onclick = saveMemoryCard;
    
    buttonContainer.appendChild(addAnswerButton);
    buttonContainer.appendChild(saveButton);
    memoryCard.appendChild(buttonContainer);
    
    // Karte direkt zum Content hinzufügen, ohne cards-container
    newcardsContent.appendChild(memoryCard);
    
    // Daten laden
    loadTopics();
    loadImages();
    
    // Initial zwei leere Antwortfelder hinzufügen
    addNewAnswer();
    addNewAnswer();
}

// Funktion zum Laden der Themen
function loadTopics() {
    const topicSelect = document.getElementById('topicSelect');
    const authToken = localStorage.getItem('authToken');
    
    fetch('/topics', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }
        return response.json();
    })
    .then(topics => {
        // Sortiere die Themen nach ID
        const sortedTopics = topics.sort((a, b) => a.id - b.id);
        
        // Lösche vorhandene Optionen
        topicSelect.innerHTML = '';
        
        // Füge Platzhalter hinzu
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = '-- Bitte Thema auswählen --';
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        topicSelect.appendChild(placeholderOption);
        
        // Füge Themen als Optionen hinzu
        sortedTopics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic.id;
            option.textContent = topic.name;
            topicSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Fehler beim Laden der Themen:', error);
        alert('Fehler beim Laden der Themen. Bitte versuchen Sie es später erneut.');
    });
}

// Funktion zum Laden der Bilder
function loadImages() {
    const imageSelect = document.getElementById('imageSelect');
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
            throw new Error('Netzwerkantwort war nicht ok');
        }
        return response.json();
    })
    .then(images => {
        // Sortiere die Bilder nach ID
        const sortedImages = images.sort((a, b) => a.id - b.id);
        
        // Lösche vorhandene Optionen
        imageSelect.innerHTML = '';
        
        // Füge Platzhalter hinzu
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = '-- Bitte Bild auswählen --';
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        imageSelect.appendChild(placeholderOption);
        
        // Füge Bilder als Optionen hinzu
        sortedImages.forEach(image => {
            const option = document.createElement('option');
            option.value = image.id;
            option.textContent = image.name;
            option.dataset.location = image.location;
            imageSelect.appendChild(option);
        });
        
        // Event-Listener für die Bildvorschau
        imageSelect.addEventListener('change', updateImagePreview);
    })
    .catch(error => {
        console.error('Fehler beim Laden der Bilder:', error);
        alert('Fehler beim Laden der Bilder. Bitte versuchen Sie es später erneut.');
    });
}

// Funktion zum Aktualisieren der Bildvorschau
function updateImagePreview() {
    const imageSelect = document.getElementById('imageSelect');
    const previewContainer = document.querySelector('.image-preview-container');
    
    // Lösche vorhandene Vorschau
    previewContainer.innerHTML = '';
    
    // Wenn ein Bild ausgewählt ist
    if (imageSelect.value) {
        const selectedOption = imageSelect.options[imageSelect.selectedIndex];
        const imageLocation = selectedOption.dataset.location;
        
        if (imageLocation) {
            const imagePreview = document.createElement('img');
            imagePreview.src = `/thumbnails/${imageLocation}`;
            imagePreview.alt = 'Bildvorschau';
            imagePreview.className = 'question-image';
            imagePreview.style.maxWidth = '300px'; // Größeres Bild
            imagePreview.style.maxHeight = '300px'; // Größeres Bild
            imagePreview.style.marginTop = '10px';
            
            previewContainer.appendChild(imagePreview);
        }
    }
}

// Funktion zum Hinzufügen einer neuen Antwort
function addNewAnswer() {
    const answersListContainer = document.getElementById('answersListContainer');
    
    // Erstelle Container für eine Antwort im Stil der Card-Answers
    const answerDiv = document.createElement('div');
    answerDiv.className = 'card-answer';
    
    const answerContent = document.createElement('div');
    answerContent.className = 'answer-content';
    answerContent.style.display = 'flex';
    answerContent.style.alignItems = 'center';
    answerContent.style.width = '100%';
    
    // Erstelle Eingabefeld für Antworttext
    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.className = 'answer-input answer-text';
    answerInput.placeholder = 'Antwort eingeben';
    answerInput.style.flex = '1';
    answerInput.style.border = 'none';
    answerInput.style.padding = '5px';
    answerInput.style.backgroundColor = 'transparent';
    
    // Container für die Checkbox und Label
    const correctContainer = document.createElement('div');
    correctContainer.style.display = 'flex';
    correctContainer.style.alignItems = 'center';
    correctContainer.style.gap = '5px';
    correctContainer.style.marginRight = '15px';
    
    // Erstelle Checkbox für korrekte Antwort
    const correctCheckbox = document.createElement('input');
    correctCheckbox.type = 'checkbox';
    correctCheckbox.className = 'correct-checkbox';
    correctCheckbox.id = `correct-${Date.now()}`; // Eindeutige ID
    
    const correctLabel = document.createElement('label');
    correctLabel.textContent = 'Korrekt';
    correctLabel.setAttribute('for', correctCheckbox.id);
    correctLabel.style.fontSize = '14px';
    
    correctContainer.appendChild(correctCheckbox);
    correctContainer.appendChild(correctLabel);
    
    // Erstelle Löschen-Button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-answer-button';
    deleteButton.innerHTML = '<span class="material-icons">delete</span>';
    deleteButton.style.backgroundColor = 'transparent';
    deleteButton.style.border = 'none';
    deleteButton.style.color = '#f44336';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.minWidth = '24px'; // Feste Mindestbreite für den Button
    deleteButton.onclick = function() {
        // Entferne diese Antwort, wenn mindestens zwei Antworten vorhanden sind
        if (document.querySelectorAll('.card-answer').length > 2) {
            answerDiv.remove();
        } else {
            alert('Mindestens zwei Antworten sind erforderlich!');
        }
    };
    
    // Füge alles zum Antwort-Container hinzu
    answerContent.appendChild(answerInput);
    answerContent.appendChild(correctContainer);
    answerContent.appendChild(deleteButton);
    answerDiv.appendChild(answerContent);
    
    // Füge den Antwort-Container zum Antworten-Container hinzu
    answersListContainer.appendChild(answerDiv);
}

// Funktion zum Speichern der Lernkarte
function saveMemoryCard() {
    const topicSelect = document.getElementById('topicSelect');
    const questionInput = document.getElementById('questionInput');
    const imageSelect = document.getElementById('imageSelect');
    const answerItems = document.querySelectorAll('.card-answer');
    const authToken = localStorage.getItem('authToken');
    
    // Validierung
    if (!topicSelect.value) {
        alert('Bitte wählen Sie ein Thema aus.');
        return;
    }
    
    if (!questionInput.value.trim()) {
        alert('Bitte geben Sie eine Frage ein.');
        return;
    }
    
    if (!imageSelect.value) {
        alert('Bitte wählen Sie ein Bild aus.');
        return;
    }
    
    if (answerItems.length < 2) {
        alert('Mindestens zwei Antworten sind erforderlich.');
        return;
    }
    
    // Sammle Antworten
    const answers = [];
    let hasCorrectAnswer = false;
    
    answerItems.forEach(item => {
        const answerText = item.querySelector('.answer-input').value.trim();
        const isCorrect = item.querySelector('.correct-checkbox').checked;
        
        if (answerText) {
            answers.push({
                id: 0, // Wird vom Server gesetzt
                text: answerText,
                isCorrect: isCorrect
            });
            
            if (isCorrect) {
                hasCorrectAnswer = true;
            }
        }
    });
    
    if (answers.length < 2) {
        alert('Mindestens zwei Antworten mit Text sind erforderlich.');
        return;
    }
    
    if (!hasCorrectAnswer) {
        alert('Mindestens eine Antwort muss als korrekt markiert sein.');
        return;
    }
    
    // Erstelle Karten-Objekt
    const memoryCard = {
        id: 0, // Wird vom Server gesetzt
        topic: {
            id: parseInt(topicSelect.value),
            name: topicSelect.options[topicSelect.selectedIndex].textContent
        },
        question: {
            id: 0, // Wird vom Server gesetzt
            text: questionInput.value.trim(),
            image: {
                id: parseInt(imageSelect.value),
                name: imageSelect.options[imageSelect.selectedIndex].textContent,
                extension: "", // Wird ignoriert, da bereits in der Datenbank
                location: "" // Wird ignoriert, da bereits in der Datenbank
            }
        },
        answers: answers
    };
    
    // Sende Daten an den Server
    fetch('/memorycard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(memoryCard)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(`Fehler beim Speichern: ${errorData.message || 'Unbekannter Fehler'}`);
            });
        }
        return response.json();
    })
    .then(data => {
        alert('Lernkarte erfolgreich gespeichert!');
        
        // Formular zurücksetzen
        topicSelect.selectedIndex = 0;
        questionInput.value = '';
        imageSelect.selectedIndex = 0;
        document.querySelector('.image-preview-container').innerHTML = '';
        
        // Antworten zurücksetzen
        const answersListContainer = document.getElementById('answersListContainer');
        answersListContainer.innerHTML = '';
        
        // Neue leere Antwortfelder hinzufügen
        addNewAnswer();
        addNewAnswer();
    })
    .catch(error => {
        console.error('Fehler beim Speichern der Lernkarte:', error);
        alert(error.message);
    });
}