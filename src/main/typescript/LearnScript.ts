import {clearContentScreen, getCurrentPage} from './common.js';
import { i18n } from './i18n/TranslationService.js';


// --- Interface-Definitionen für die Datenstrukturen ---

interface Topic {
    id: number;
    name: string;
}

interface Image {
    id: number;
    location: string;
    // Füge hier weitere Eigenschaften hinzu, wenn bekannt (z.B. altText)
}

interface Question {
    text: string;
    image?: Image; // '?' macht 'image' optional
    // Füge hier weitere Eigenschaften hinzu, wenn bekannt
}

interface Answer {
    text: string;
    isCorrect: boolean;
    // Füge hier weitere Eigenschaften hinzu, wenn bekannt
}

interface CardAnswer {
    text: string;
    isCorrect: boolean;
}


interface AnswerElementData {
    icon: HTMLSpanElement;
    isCorrectAnswer: boolean;
    currentState: number; // 0: help_outline, 1: check_circle, 2: cancel
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

interface StrokeCountResponse {
    number: number;
}

interface StrokePostData {
    tstamp: string;
    comment: string;
    memorycard_id: number;
}

const LEARN_PAGE: string = "LEARN_PAGE";

document.addEventListener('DOMContentLoaded', function (): void {
    // Sicherstellen, dass die Elemente existieren, bevor wir sie verwenden
    const learnLink = document.getElementById('lernenCardsLink') as HTMLAnchorElement;
    const learnContent = document.getElementById('learnContent') as HTMLDivElement;

    // Optional: Überprüfen, ob Elemente gefunden wurden
    if (!learnLink || !learnContent) {
        console.error("Critical: 'cardsLink' or 'learnContent' not found in DOM.");
        return; // Skript beenden, wenn essentielle Elemente fehlen
    }

    learnLink.addEventListener('click', function (e: MouseEvent): void {
        e.preventDefault();
        loadMemoryCards();
    });

    function loadMemoryCards(): void {
        const authToken: string | null = localStorage.getItem('authToken');

        if (!authToken) {
            console.error(i18n.t('auth.authTokenNotFound'));
            learnContent.innerHTML = `<p class="error">${i18n.t('auth.pleaseSignIn')}</p>`;
            return;
        }

        fetch('/learning-cards', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then((response: Response) => {
                if (!response.ok) {
                    throw new Error(i18n.t('common.networkError'));
                }
                return response.json();
            })
            .then((cards: LearningCard[]) => { // Typisieren des 'cards'-Arrays
                displayLearningCards(cards);
            })
            .catch((error: Error) => {
                console.error(i18n.t('cards.loadError'), error);
                learnContent.innerHTML = `<p class="error">${i18n.t('cards.loadError')}. ${i18n.t('common.tryAgainLater')}</p>`;
            });
    }

    function displayLearningCards(cards: LearningCard[]): void {
        clearContentScreen(LEARN_PAGE);
        learnContent.innerHTML = `<h2>${i18n.t('learn.title')}</h2>`;

        // Topic-Filter hinzufügen
        const topics: string[] = [...new Set(cards.map(card => card.category || i18n.t('cards.unknown')).filter(Boolean))];
        const filterContainer: HTMLDivElement = document.createElement('div');
        filterContainer.className = 'filter-container';

        const topicSelect: HTMLSelectElement = document.createElement('select');
        topicSelect.id = 'topicFilter';
        topicSelect.className = 'topic-filter';

        // Option für "Alle Themen" hinzufügen
        const allOption: HTMLOptionElement = document.createElement('option');
        allOption.value = '';
        allOption.textContent = i18n.t('learn.allAreas');
        topicSelect.appendChild(allOption);

        // Optionen für jedes Thema hinzufügen
        topics.forEach((topic: string) => {
            const option: HTMLOptionElement = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            topicSelect.appendChild(option);
        });

        filterContainer.appendChild(topicSelect);
        learnContent.appendChild(filterContainer);


        const cardsContainer: HTMLDivElement = document.createElement('div');
        cardsContainer.className = 'cards-container';
        learnContent.appendChild(cardsContainer);

        // Event-Listener für Topic-Filter
        topicSelect.addEventListener('change', (): void => {
            const selectedTopic: string = topicSelect.value;
            const filteredCards: LearningCard[] = selectedTopic
                ? cards.filter((card: LearningCard) => card.category === selectedTopic)
                : cards;

            updateCardsDisplay(filteredCards, cardsContainer);
        });

        // Initial alle Karten anzeigen
        updateCardsDisplay(cards, cardsContainer);
    }

    function updateCardsDisplay(cards: LearningCard[], container: HTMLDivElement): void {
        container.innerHTML = '';
        cards.forEach((card: LearningCard) => {
            const cardElement: HTMLDivElement = createCardElement(card);
            container.appendChild(cardElement);
        });
    }

    function parseAnswersFromText(answerText: string): Answer[] {
        try {
            // Try to parse as JSON first (new format)
            const cardAnswers: CardAnswer[] = JSON.parse(answerText);
            return cardAnswers.map(answer => ({
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
                        text: text,
                        isCorrect: isCorrect
                    });
                }
            });
            
            return answers;
        }
    }


    function createCardElement(card: LearningCard): HTMLDivElement {
        if (!card.id) {
            console.error('Card has no ID');
            const errorDiv = document.createElement('div');
            errorDiv.textContent = i18n.t('learn.cardIdMissing');
            errorDiv.className = 'error';
            return errorDiv;
        }

        const url: string = `/stroke/anz/${card.id}`;
        const authToken: string | null = localStorage.getItem('authToken');

        // Fehlerbehandlung für fehlenden AuthToken
        if (!authToken) {
            console.error(i18n.t('auth.authTokenNotFound'));
            const errorDiv = document.createElement('div');
            errorDiv.textContent = i18n.t('auth.authenticationError');
            errorDiv.className = 'error';
            return errorDiv;
        }

        const cardDiv: HTMLDivElement = document.createElement('div');
        cardDiv.className = 'memory-card';
        cardDiv.dataset.cardId = card.id.toString();

        const headerSection: HTMLDivElement = document.createElement('div');
        headerSection.className = 'card-header';

        const topicSection: HTMLDivElement = document.createElement('div');
        topicSection.className = 'card-topic';
        topicSection.style.color = '#212529';
        topicSection.style.marginBottom = '8px';
        topicSection.style.fontWeight = '500';
        
        // Difficulty stars display
        const difficultyStars = '★'.repeat(card.difficulty || 1) + '☆'.repeat(5 - (card.difficulty || 1));
        
        topicSection.innerHTML = `<span class="card-id" style="color: #495057; font-weight: bold;">#${card.id}</span> - <span style="color: #212529;">${card.category || i18n.t('cards.unknown')}</span> - <span style="color: #ff6b35; font-weight: bold; margin-left: 10px;" title="${i18n.t('learn.difficultyTitle')}: ${card.difficulty || 1}/5">${difficultyStars}</span>`;

        headerSection.appendChild(topicSection);
        
        // Title section
        const titleSection: HTMLDivElement = document.createElement('div');
        titleSection.className = 'card-title';
        titleSection.style.color = '#212529';
        titleSection.style.marginBottom = '10px';
        titleSection.style.fontWeight = '600';
        titleSection.style.fontSize = '18px';
        titleSection.textContent = card.title;
        
        headerSection.appendChild(titleSection);
        cardDiv.appendChild(headerSection);

        const questionSection: HTMLDivElement = document.createElement('div');
        questionSection.className = 'card-question';
        questionSection.textContent = card.question;

        const strokesSpan: HTMLLabelElement = document.createElement('label');
        strokesSpan.className = 'stroke-question';
        strokesSpan.textContent = '';

        questionSection.appendChild(strokesSpan);

        // Load stroke count
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then((response: Response) => {
                if (!response.ok) {
                    throw new Error(i18n.t('common.networkError'));
                }
                return response.json();
            })
            .then((data: StrokeCountResponse) => {
                strokesSpan.textContent = `Rate: ${data.number}`;
            })
            .catch((error: Error) => {
                console.error(i18n.t('cards.strokeSaveError'), error);
                strokesSpan.textContent = 'Rate: N/A';
                strokesSpan.style.color = 'red';
            });

        // Bildbereich hinzufügen, wenn ein Bild vorhanden ist
        if (card.imageId && card.imageId > 0) {
            console.log('Füge Bild hinzu für ImageID:', card.imageId);

            const imageSection: HTMLDivElement = document.createElement('div');
            imageSection.className = 'card-image';
            imageSection.style.marginTop = '15px';
            imageSection.style.marginBottom = '15px';
            
            const img: HTMLImageElement = document.createElement('img');

            // Zuerst Image-Details abrufen, dann Bild laden
            fetch(`/images/${card.imageId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })
                .then((response: Response) => {
                    console.log('Image-Details Response Status:', response.status);

                    if (!response.ok) {
                        throw new Error(i18n.t('images.loadError'));
                    }
                    return response.json();
                })
                .then((imageData: any) => {
                    console.log('Image-Details erhalten:', imageData);
                    
                    // Jetzt das eigentliche Bild über das location-Feld laden (resize für bessere Performance)
                    return fetch(`/resize/${imageData.location}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                })
                .then((response: Response) => {
                    console.log('Bild-Content Response Status:', response.status);

                    if (!response.ok) {
                        throw new Error(i18n.t('learn.imageLoadFailed'));
                    }
                    return response.blob();
                })
                .then((blob: Blob) => {
                    const imageUrl: string = URL.createObjectURL(blob);

                    img.src = imageUrl;
                    img.alt = i18n.t('learn.questionImage');
                    img.className = 'question-image';
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    img.style.borderRadius = '8px';
                    img.style.border = '1px solid #ddd';

                    // Freigeben der Blob-URL, wenn das Bild geladen wurde
                    img.onload = () => {
                        URL.revokeObjectURL(imageUrl);
                    };
                })
                .catch((error: Error) => {
                    console.error(i18n.t('images.loadError'), error);
                    imageSection.innerHTML = `<p class="error">${i18n.t('learn.imageError')}</p>`;
                });

            imageSection.appendChild(img);
            cardDiv.appendChild(imageSection);
        }

        cardDiv.appendChild(questionSection);

        const answersSection: HTMLDivElement = document.createElement('div');
        answersSection.className = 'card-answers';

        const answerElements: AnswerElementData[] = [];

        // Parse answers from the card.answer field
        const answers = parseAnswersFromText(card.answer);
        
        answers.forEach((answer: Answer) => {
            const answerDiv: HTMLDivElement = document.createElement('div');
            answerDiv.className = 'card-answer';

            const answerContent: HTMLDivElement = document.createElement('div');
            answerContent.className = 'answer-content';

            const answerText: HTMLSpanElement = document.createElement('span');
            answerText.className = 'answer-text';
            answerText.innerHTML = answer.text.replace(/\n/g, '<br>');

            const answerIcon: HTMLSpanElement = document.createElement('span');
            answerIcon.className = `material-icons answer-icon`;
            answerIcon.textContent = 'help_outline'; // Initial state: question mark

            // Store the current state of the icon (0: ?, 1: check_circle, 2: cancel)
            let iconState: number = 0;

            answerIcon.addEventListener('click', () => {
                iconState = (iconState + 1) % 3; // Cycle through 0, 1, 2

                // Update icon based on state
                switch (iconState) {
                    case 0:
                        answerIcon.textContent = 'help_outline';
                        answerIcon.classList.remove('correct', 'incorrect');
                        break;
                    case 1:
                        answerIcon.textContent = 'check_circle';
                        answerIcon.classList.add('correct');
                        answerIcon.classList.remove('incorrect');
                        break;
                    case 2:
                        answerIcon.textContent = 'cancel';
                        answerIcon.classList.add('incorrect');
                        answerIcon.classList.remove('correct');
                        break;
                }

                const elementIndex = answerElements.findIndex(el => el.icon === answerIcon);
                if (elementIndex > -1) {
                    answerElements[elementIndex].currentState = iconState;
                }
            });
            answerContent.appendChild(answerText);
            answerContent.appendChild(answerIcon);
            answerDiv.appendChild(answerContent);
            answersSection.appendChild(answerDiv);
            answerElements.push({icon: answerIcon, isCorrectAnswer: answer.isCorrect, currentState: iconState});
        });


        const resultPopup = document.createElement('div');
        resultPopup.id = 'result-popup';
        resultPopup.className = 'popup-container';

        const popupContent = document.createElement('div');
        popupContent.className = 'popup-content';

        const popupIcon = document.createElement('span');
        popupIcon.id = 'popup-icon';
        popupIcon.className = 'material-icons popup-icon';

        const popupMessage = document.createElement('p');
        popupMessage.id = 'popup-message';
        popupMessage.className = 'popup-message';

        const popupCloseButton = document.createElement('button');
        popupCloseButton.id = 'popup-close-button';
        popupCloseButton.className = 'popup-close-button';
        popupCloseButton.textContent = i18n.t('common.ok');

        popupCloseButton.addEventListener('click', () => {
            resultPopup.classList.remove('show'); // 'show' Klasse entfernen, um Pop-up zu verstecken
        });

        resultPopup.addEventListener('click', (event: MouseEvent) => {
            if (event.target === resultPopup) {
                resultPopup.classList.remove('show');
            }
        });

        popupContent.appendChild(popupIcon);
        popupContent.appendChild(popupMessage);
        popupContent.appendChild(popupCloseButton);
        resultPopup.appendChild(popupContent);
        document.body.appendChild(resultPopup);

        const checkButton: HTMLButtonElement = document.createElement('button');
        checkButton.textContent = i18n.t('learn.checkButton');
        checkButton.className = 'check-answers-button'; // Add a class for styling

        checkButton.addEventListener('click', () => {
            let allCorrect: boolean = true;

            answerElements.forEach(item => {
                // Determine if the user's selected icon state matches the actual correctness of the answer
                const isUserChoiceCorrect: boolean =
                    (item.isCorrectAnswer && item.currentState === 1) || // Is truly correct AND user selected 'check_circle'
                    (!item.isCorrectAnswer && item.currentState === 2);  // Is truly incorrect AND user selected 'cancel'

                if (!isUserChoiceCorrect) {
                    allCorrect = false;
                }
            });
            let message: string;
            if (allCorrect) {
                message = i18n.t('learn.correctMessage');
                showPopup(true, message); // Pop-up für richtig
            } else {
                message = i18n.t('learn.incorrectMessage');
                showPopup(false, message); // Pop-up für falsch
            }
        });
        answersSection.appendChild(checkButton);
        cardDiv.appendChild(answersSection);
        return cardDiv;

        function showPopup(isCorrect: boolean, message: string): void {
            if (isCorrect) {
                popupIcon.textContent = 'thumb_up'; // Daumen hoch
                popupIcon.classList.remove('incorrect-icon');
                popupIcon.classList.add('correct-icon');
            } else {
                popupIcon.textContent = 'thumb_down'; // Daumen runter
                popupIcon.classList.remove('correct-icon');
                popupIcon.classList.add('incorrect-icon');
            }
            popupMessage.textContent = message;
            resultPopup.classList.add('show'); // 'show' Klasse für Sichtbarkeit
        }

    }


    // --- Funktion: showCommentPopup ---
    function showCommentPopup(cardId: number, authToken: string, strokesUrl: string, strokesSpanElement: HTMLLabelElement): void {
        const popupOverlay: HTMLDivElement = document.createElement('div');
        popupOverlay.className = 'popup-overlay';

        const popupContent: HTMLDivElement = document.createElement('div');
        popupContent.className = 'popup-content';

        const popupTitle: HTMLHeadingElement = document.createElement('h3');
        popupTitle.textContent = i18n.t('learn.enterComment');

        const commentInput: HTMLTextAreaElement = document.createElement('textarea');
        commentInput.className = 'comment-input';
        commentInput.placeholder = i18n.t('learn.commentPlaceholder');
        commentInput.rows = 4;

        const buttonContainer: HTMLDivElement = document.createElement('div');
        buttonContainer.className = 'popup-buttons';

        const saveButton: HTMLButtonElement = document.createElement('button');
        saveButton.textContent = i18n.t('common.save');
        saveButton.className = 'popup-button save';

        const cancelButton: HTMLButtonElement = document.createElement('button');
        cancelButton.textContent = i18n.t('common.cancel');
        cancelButton.className = 'popup-button cancel';

        popupContent.appendChild(popupTitle);
        popupContent.appendChild(commentInput);
        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(cancelButton);
        popupContent.appendChild(buttonContainer);
        popupOverlay.appendChild(popupContent);

        document.body.appendChild(popupOverlay);

        commentInput.focus();

        saveButton.addEventListener('click', function (): void {
            const commentText: string = commentInput.value;
            sendStrokePost(cardId, commentText, authToken, strokesUrl, strokesSpanElement);
            popupOverlay.remove();
        });

        cancelButton.addEventListener('click', function (): void {
            console.log(i18n.t('learn.strokeCancelled'));
            popupOverlay.remove();
        });

        popupOverlay.addEventListener('click', function (e: MouseEvent): void {
            if (e.target === popupOverlay) {
                const commentText: string = commentInput.value; // Optional: Kommentar trotzdem mitsenden, wenn außerhalb geklickt
                sendStrokePost(cardId, commentText, authToken, strokesUrl, strokesSpanElement);
                popupOverlay.remove();
            }
        });
    }

    // --- Funktion: sendStrokePost ---
    function sendStrokePost(cardId: number, comment: string, authToken: string, strokesUrl: string, strokesSpanElement: HTMLLabelElement): void {
        const jetzt: Date = new Date();
        const isoTimestampUTC: string = jetzt.toISOString();

        const postData: StrokePostData = {
            tstamp: isoTimestampUTC,
            comment: comment,
            memorycard_id: cardId
        };

        fetch('/stroke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(postData)
        })
            .then((response: Response) => {
                if (!response.ok) {
                    // Versuche, den Fehler als JSON zu parsen, sonst einen generischen Fehler werfen
                    return response.json().then((err: any) => {
                        throw new Error(err.message || `${i18n.t('common.networkResponseNotOk')}: ${response.status}`);
                    }).catch(() => {
                        // Falls response.json() fehlschlägt, wirf generischen Fehler
                        throw new Error(`${i18n.t('common.networkResponseNotOk')} (${i18n.t('common.status')}: ${response.status})`);
                    });
                }
                return response.json();
            })
            .then((data: any) => { // 'any' hier, da wir die genaue Struktur der POST-Antwort nicht kennen
                console.log(i18n.t('cards.strokeSaved'), data);
                // Erneuter GET-Call, um die aktualisierte Anzahl zu holen und anzuzeigen
                fetch(strokesUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    }
                })
                    .then((response: Response) => response.json())
                    .then((data: StrokeCountResponse) => {
                        strokesSpanElement.textContent = `Rate: ${data.number}`;
                    })
                    .catch((error: Error) => {
                        console.error(i18n.t('cards.strokeSaveError'), error);
                    });
            })
            .catch((error: Error) => {
                console.error(i18n.t('cards.strokeSaveError'), error);
                alert(`${i18n.t('cards.strokeSaveError')}. ${i18n.t('common.tryAgainLater')}`);
            });
    }

});