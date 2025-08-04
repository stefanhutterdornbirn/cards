import { clearContentScreen } from './common.js';
import { i18n } from './i18n/TranslationService.js';

const TOPIC_PAGE: string = "TOPIC_PAGE";

interface Topic {
    id: number;
    name: string;
}

document.addEventListener('DOMContentLoaded', function () {
    // Authentication is now handled by Authentication.ts

    const topicLink = document.getElementById('topicLink');
    const topicContent = document.getElementById('topicContent');

    topicLink?.addEventListener('click', function (e) {
        e.preventDefault();

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
            .then((data: Topic[]) => {
                // Display data in content area
                displayTopics(data);
            })
            .catch(error => {
                console.error(i18n.t('topics.loadError') + ':', error);
                if (topicContent) {
                    topicContent.innerHTML = `<p class="error">${i18n.t('topics.loadError')}.</p>`;
                }
            });
    });

    function displayTopics(topics: Topic[]): void {
        const sortedTopics = topics.sort((a, b) => a.id - b.id);
        const topicContent = document.getElementById('topicContent');
        if (!topicContent) return;
        
        clearContentScreen(TOPIC_PAGE);

        // Container for modern view
        const container = document.createElement('div');
        container.className = 'topics-container';

        // Header
        const header = document.createElement('div');
        header.className = 'topics-header';
        header.textContent = i18n.t('topics.management');
        container.appendChild(header);

        // Statistiken
        const stats = document.createElement('div');
        stats.className = 'topic-stats';
        
        const totalTopics = sortedTopics.length;

        stats.innerHTML = `
            <div class="topic-stat">
                <div class="topic-stat-number">${totalTopics}</div>
                <div class="topic-stat-label">${i18n.t('topics.totalTopics')}</div>
            </div>
        `;
        container.appendChild(stats);

        // Neues Topic Button
        const newTopicButton = document.createElement('button');
        newTopicButton.textContent = i18n.t('topics.addTopic');
        newTopicButton.className = 'btn-new-topic';
        newTopicButton.addEventListener('click', function(e) {
            e.preventDefault();
            showTopicCreateForm();
        });
        container.appendChild(newTopicButton);

        // Grid for topics
        const grid = document.createElement('div');
        grid.className = 'topics-grid';
        
        sortedTopics.forEach(topic => {
            grid.appendChild(createTopicCard(topic));
        });

        container.appendChild(grid);
        topicContent.appendChild(container);
    }

    function createTopicCard(topic: Topic): HTMLElement {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.dataset.topicId = topic.id.toString();

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
        editBtn.innerHTML = '<span class="material-icons">edit</span>' + i18n.t('topics.edit');
        editBtn.addEventListener('click', () => {
            showTopicEditForm(topic);
        });
        actions.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete-topic';
        deleteBtn.innerHTML = '<span class="material-icons">delete</span>' + i18n.t('topics.delete');
        deleteBtn.addEventListener('click', () => {
            handleDeleteTopic(topic.id);
        });
        actions.appendChild(deleteBtn);

        card.appendChild(actions);

        return card;
    }

    function showTopicCreateForm(): void {
        const topicContent = document.getElementById('topicContent');
        if (!topicContent) return;
        
        // Check if form already exists
        const existingForm = topicContent.querySelector('.topic-create-form');
        if (existingForm) {
            existingForm.remove();
        }
        
        // Create form element
        const createForm = document.createElement('div');
        createForm.className = 'topic-create-form';
        
        createForm.innerHTML = `
            <h3 class="topic-create-title">${i18n.t('topics.createTopic')}</h3>
            <div class="topic-create-content">
                <div class="form-group">
                    <label for="topicName">${i18n.t('topics.name')}:</label>
                    <input type="text" id="topicName" placeholder="${i18n.t('topics.placeholderName')}" class="form-input">
                </div>
                <div class="form-actions">
                    <button class="btn-success" id="saveTopicBtn">${i18n.t('topics.create')}</button>
                    <button class="btn-danger" id="cancelTopicBtn">${i18n.t('topics.cancel')}</button>
                </div>
            </div>
        `;
        
        topicContent.insertBefore(createForm, topicContent.firstChild);
        
        // Event-Listener
        const saveBtn = createForm.querySelector('#saveTopicBtn') as HTMLButtonElement;
        const cancelBtn = createForm.querySelector('#cancelTopicBtn') as HTMLButtonElement;
        const nameInput = createForm.querySelector('#topicName') as HTMLInputElement;
        
        saveBtn?.addEventListener('click', () => {
            const name = nameInput?.value.trim();
            
            if (!name) {
                alert(i18n.t('forms.pleaseEnterName'));
                return;
            }
            
            saveTopicToDatabase(name, createForm);
        });
        
        cancelBtn?.addEventListener('click', () => {
            createForm.remove();
        });
        
        // Focus on input
        nameInput?.focus();
    }

    function showTopicEditForm(topic: Topic): void {
        const topicContent = document.getElementById('topicContent');
        if (!topicContent) return;
        
        // Check if form already exists
        const existingForm = topicContent.querySelector('.topic-edit-form');
        if (existingForm) {
            existingForm.remove();
        }
        
        // Create edit form element
        const editForm = document.createElement('div');
        editForm.className = 'topic-edit-form';
        
        editForm.innerHTML = `
            <h3 class="topic-edit-title">${i18n.t('topics.editTopic')}</h3>
            <div class="topic-edit-content">
                <div class="form-group">
                    <label for="editTopicName">${i18n.t('topics.name')}:</label>
                    <input type="text" id="editTopicName" value="${topic.name}" class="form-input">
                </div>
                <div class="form-actions">
                    <button class="btn-success" id="updateTopicBtn">${i18n.t('topics.save')}</button>
                    <button class="btn-danger" id="cancelEditTopicBtn">${i18n.t('topics.cancel')}</button>
                </div>
            </div>
        `;
        
        topicContent.insertBefore(editForm, topicContent.firstChild);
        
        // Event-Listener
        const updateBtn = editForm.querySelector('#updateTopicBtn') as HTMLButtonElement;
        const cancelBtn = editForm.querySelector('#cancelEditTopicBtn') as HTMLButtonElement;
        const nameInput = editForm.querySelector('#editTopicName') as HTMLInputElement;
        
        updateBtn?.addEventListener('click', () => {
            const name = nameInput?.value.trim();
            
            if (!name) {
                alert(i18n.t('forms.pleaseEnterName'));
                return;
            }
            
            updateTopicInDatabase(topic.id, name, editForm);
        });
        
        cancelBtn?.addEventListener('click', () => {
            editForm.remove();
        });
        
        // Focus on input
        nameInput?.focus();
        nameInput?.select();
    }

    function saveTopicToDatabase(name: string, formElement: HTMLElement): void {
        const authToken = localStorage.getItem('authToken');
        
        fetch('/learning-topics', {
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
                throw new Error(i18n.t('topics.createError'));
            }
            return response.json();
        })
        .then(topicData => {
            console.log(i18n.t('topics.topicCreated') + ':', topicData);
            formElement.remove();
            loadTopics();
        })
        .catch(error => {
            console.error(i18n.t('topics.createError') + ':', error);
            alert(i18n.t('topics.createError') + ': ' + error.message);
        });
    }

    function updateTopicInDatabase(id: number, name: string, formElement: HTMLElement): void {
        const authToken = localStorage.getItem('authToken');
        
        fetch(`/learning-topics/${id}`, {
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
                throw new Error(i18n.t('topics.saveError'));
            }
            return response.json();
        })
        .then(topicData => {
            console.log(i18n.t('topics.topicUpdated') + ':', topicData);
            formElement.remove();
            loadTopics();
        })
        .catch(error => {
            console.error(i18n.t('topics.saveError') + ':', error);
            alert(i18n.t('topics.saveError') + ': ' + error.message);
        });
    }

    function handleDeleteTopic(topicId: number): void {
        if (confirm(i18n.t('topics.confirmDelete'))) {
            const authToken = localStorage.getItem('authToken');
            
            fetch(`/learning-topics/${topicId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(i18n.t('forms.deleteError'));
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
                console.error(i18n.t('topics.deleteError') + ':', error);
                alert(i18n.t('topics.deleteError'));
            });
        }
    }

    function loadTopics(): void {
        fetch('/learning-topics', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
            .then(response => {
                if (!response.ok) throw new Error(i18n.t('forms.networkError'));
                return response.json();
            })
            .then((topics: Topic[]) => {
                displayTopics(topics);
            })
            .catch(error => {
                console.error(i18n.t('topics.loadError') + ':', error);
                alert(i18n.t('topics.loadError'));
            });
    }

    // Event listener for topic link
    document.addEventListener('DOMContentLoaded', function () {
        const topicLink = document.getElementById('topicLink');
        topicLink?.addEventListener('click', function (e) {
            e.preventDefault();
            loadTopics();
        });
    });
});