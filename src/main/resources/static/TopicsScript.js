import { clearContentScreen } from './js/common.js';


const TOPIC_PAGE = "TOPIC_PAGE";

document.addEventListener('DOMContentLoaded', function () {
    // Authentication is now handled by Authentication.ts

    const topicLink = document.getElementById('topicLink');
    const topicContent = document.getElementById('topicContent');


    topicLink.addEventListener('click', function (e) {
        e.preventDefault();

        const authToken = localStorage.getItem('authToken');

        fetch('/topics', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // Falls Token-Authentifizierung benötigt wird
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Netzwerkantwort war nicht ok');
                }
                return response.json();
            })
            .then(data => {
                // Daten im Content-Bereich anzeigen
                displayTopics(data);
            })
            .catch(error => {
                console.error('Fehler beim Abrufen der Topics:', error);
                topicContent.innerHTML = '<p class="error">Fehler beim Laden der Topics. Bitte versuchen Sie es später erneut.</p>';
            });
    });

    function displayTopics(topics) {
        const sortedTopics = topics.sort((a, b) => a.id - b.id);
        const topicContent = document.getElementById('topicContent');
        clearContentScreen(TOPIC_PAGE);

        // Container für die moderne Ansicht
        const container = document.createElement('div');
        container.className = 'topics-container';

        // Header
        const header = document.createElement('div');
        header.className = 'topics-header';
        header.textContent = 'Lerngebiete-Verwaltung';
        container.appendChild(header);

        // Statistiken
        const stats = document.createElement('div');
        stats.className = 'topic-stats';
        
        const totalTopics = sortedTopics.length;

        stats.innerHTML = `
            <div class="topic-stat">
                <div class="topic-stat-number">${totalTopics}</div>
                <div class="topic-stat-label">Lerngebiete gesamt</div>
            </div>
        `;
        container.appendChild(stats);

        // Neues Topic Button
        const newTopicButton = document.createElement('button');
        newTopicButton.textContent = 'Neues Lerngebiet hinzufügen';
        newTopicButton.className = 'btn-new-topic';
        newTopicButton.addEventListener('click', function(e) {
            e.preventDefault();
            showTopicCreateForm();
        });
        container.appendChild(newTopicButton);

        // Grid für Topics
        const grid = document.createElement('div');
        grid.className = 'topics-grid';
        
        sortedTopics.forEach(topic => {
            grid.appendChild(createTopicCard(topic));
        });

        container.appendChild(grid);
        topicContent.appendChild(container);
    }

    function createTopicCard(topic) {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.dataset.topicId = topic.id;

        // Header mit Titel und ID
        const header = document.createElement('div');
        header.className = 'topic-card-header';
        header.innerHTML = `
            <h3 class="topic-card-title">${topic.name}</h3>
            <span class="topic-card-id">ID: ${topic.id}</span>
        `;
        card.appendChild(header);

        // Aktionen
        const actions = document.createElement('div');
        actions.className = 'topic-card-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.innerHTML = '<span class="material-icons">edit</span>Bearbeiten';
        editBtn.addEventListener('click', () => {
            showTopicEditForm(topic);
        });
        actions.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete-topic';
        deleteBtn.innerHTML = '<span class="material-icons">delete</span>Löschen';
        deleteBtn.addEventListener('click', () => {
            handleDeleteTopic(topic.id);
        });
        actions.appendChild(deleteBtn);

        card.appendChild(actions);

        return card;
    }

    function showTopicCreateForm() {
        const topicContent = document.getElementById('topicContent');
        
        // Prüfen ob bereits eine Form existiert
        const existingForm = topicContent.querySelector('.topic-create-form');
        if (existingForm) {
            existingForm.remove();
        }
        
        // Create-Form erstellen
        const createForm = document.createElement('div');
        createForm.className = 'topic-create-form';
        
        createForm.innerHTML = `
            <h3 class="topic-create-title">Neues Lerngebiet erstellen</h3>
            <div class="topic-create-content">
                <div class="form-group">
                    <label for="topicName">Name:</label>
                    <input type="text" id="topicName" placeholder="Name des Lerngebiets" class="form-input">
                </div>
                <div class="form-actions">
                    <button class="btn-success" id="saveTopicBtn">Erstellen</button>
                    <button class="btn-danger" id="cancelTopicBtn">Abbrechen</button>
                </div>
            </div>
        `;
        
        topicContent.insertBefore(createForm, topicContent.firstChild);
        
        // Event-Listener
        const saveBtn = createForm.querySelector('#saveTopicBtn');
        const cancelBtn = createForm.querySelector('#cancelTopicBtn');
        const nameInput = createForm.querySelector('#topicName');
        
        saveBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            
            if (!name) {
                alert('Bitte geben Sie einen Namen ein');
                return;
            }
            
            saveTopicToDatabase(name, createForm);
        });
        
        cancelBtn.addEventListener('click', () => {
            createForm.remove();
        });
        
        // Focus auf Input
        nameInput.focus();
    }

    function showTopicEditForm(topic) {
        const topicContent = document.getElementById('topicContent');
        
        // Prüfen ob bereits eine Form existiert
        const existingForm = topicContent.querySelector('.topic-edit-form');
        if (existingForm) {
            existingForm.remove();
        }
        
        // Edit-Form erstellen
        const editForm = document.createElement('div');
        editForm.className = 'topic-edit-form';
        
        editForm.innerHTML = `
            <h3 class="topic-edit-title">Lerngebiet bearbeiten</h3>
            <div class="topic-edit-content">
                <div class="form-group">
                    <label for="editTopicName">Name:</label>
                    <input type="text" id="editTopicName" value="${topic.name}" class="form-input">
                </div>
                <div class="form-actions">
                    <button class="btn-success" id="updateTopicBtn">Speichern</button>
                    <button class="btn-danger" id="cancelEditTopicBtn">Abbrechen</button>
                </div>
            </div>
        `;
        
        topicContent.insertBefore(editForm, topicContent.firstChild);
        
        // Event-Listener
        const updateBtn = editForm.querySelector('#updateTopicBtn');
        const cancelBtn = editForm.querySelector('#cancelEditTopicBtn');
        const nameInput = editForm.querySelector('#editTopicName');
        
        updateBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            
            if (!name) {
                alert('Bitte geben Sie einen Namen ein');
                return;
            }
            
            updateTopicInDatabase(topic.id, name, editForm);
        });
        
        cancelBtn.addEventListener('click', () => {
            editForm.remove();
        });
        
        // Focus auf Input
        nameInput.focus();
        nameInput.select();
    }

    function saveTopicToDatabase(name, formElement) {
        const authToken = localStorage.getItem('authToken');
        
        fetch('/topics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name: name
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Fehler beim Erstellen des Lerngebiets');
            }
            return response.json();
        })
        .then(topicData => {
            console.log('Lerngebiet erfolgreich erstellt:', topicData);
            formElement.remove();
            loadTopics();
        })
        .catch(error => {
            console.error('Fehler beim Erstellen:', error);
            alert('Fehler beim Erstellen des Lerngebiets: ' + error.message);
        });
    }

    function updateTopicInDatabase(id, name, formElement) {
        const authToken = localStorage.getItem('authToken');
        
        fetch(`/topics/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                id: id,
                name: name
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Fehler beim Speichern des Lerngebiets');
            }
            return response.json();
        })
        .then(topicData => {
            console.log('Lerngebiet erfolgreich aktualisiert:', topicData);
            formElement.remove();
            loadTopics();
        })
        .catch(error => {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern des Lerngebiets: ' + error.message);
        });
    }

    function handleDeleteTopic(topicId) {
        if (confirm('Möchten Sie dieses Lerngebiet wirklich löschen?')) {
            const authToken = localStorage.getItem('authToken');
            
            fetch(`/topics/${topicId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Fehler beim Löschen');
                }
                return response.json();
            })
            .then(data => {
                // Topic aus der Ansicht entfernen
                const topicCard = document.querySelector(`[data-topic-id="${topicId}"]`);
                if (topicCard) {
                    topicCard.remove();
                }
                
                // Statistiken aktualisieren
                loadTopics();
            })
            .catch(error => {
                console.error('Fehler beim Löschen:', error);
                alert('Fehler beim Löschen des Lerngebiets');
            });
        }
    }


// Event Listener für den Topic-Link
    document.addEventListener('DOMContentLoaded', function () {
        document.getElementById('topicLink').addEventListener('click', function (e) {
            e.preventDefault();
            loadTopics();
        });
    });

    function loadTopics() {
        fetch('/topics', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Netzwerkantwort war nicht ok');
                return response.json();
            })
            .then(topics => {
                displayTopics(topics);
            })
            .catch(error => {
                console.error('Fehler beim Laden der Topics:', error);
                alert('Fehler beim Laden der Topics');
            });
    }


});
