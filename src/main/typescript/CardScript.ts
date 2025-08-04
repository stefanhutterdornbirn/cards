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

interface MemoryCard {
    id: number;
    question: Question;
    answers: Answer[];
    topic: Topic;
    // Füge hier weitere Eigenschaften hinzu, wenn bekannt
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

const CARD_PAGE: string = "CARD_PAGE";

document.addEventListener('DOMContentLoaded', function (): void {
    // Sicherstellen, dass die Elemente existieren, bevor wir sie verwenden
    const cardsLink = document.getElementById('cardsLink') as HTMLAnchorElement;
    const cardsContent = document.getElementById('cardsContent') as HTMLDivElement;

    // Optional: Überprüfen, ob Elemente gefunden wurden
    if (!cardsLink || !cardsContent) {
        console.error("Critical: 'cardsLink' or 'cardsContent' not found in DOM.");
        return; // Skript beenden, wenn essentielle Elemente fehlen
    }

    cardsLink.addEventListener('click', function (e: MouseEvent): void {
        e.preventDefault();
        loadMemoryCards();
    });

function loadMemoryCards(): void {
        const authToken: string | null = localStorage.getItem('authToken');

        if (!authToken) {
            console.error(i18n.t('auth.authTokenNotFound'));
            cardsContent.innerHTML = `<p class="error">${i18n.t('auth.pleaseSignIn')}</p>`;
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
                cardsContent.innerHTML = `<p class="error">${i18n.t('cards.loadError')}. ${i18n.t('common.tryAgainLater')}</p>`;
            });
    }

function displayLearningCards(cards: LearningCard[]): void {
        clearContentScreen(CARD_PAGE);
        cardsContent.innerHTML = `<h2>${i18n.t('cards.title')}</h2>`;

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
        allOption.textContent = i18n.t('cards.allTopics');
        topicSelect.appendChild(allOption);

        // Optionen für jedes Thema hinzufügen
        topics.forEach((topic: string) => {
            const option: HTMLOptionElement = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            topicSelect.appendChild(option);
        });

        filterContainer.appendChild(topicSelect);
        cardsContent.appendChild(filterContainer);


        const cardsContainer: HTMLDivElement = document.createElement('div');
        cardsContainer.className = 'cards-container';
        cardsContent.appendChild(cardsContainer);

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



    function createCardElement(card: LearningCard): HTMLDivElement {
        // Check if card has an ID
        if (!card.id) {
            console.error('Card has no ID');
            const errorDiv = document.createElement('div');
            errorDiv.textContent = i18n.t('learn.cardIdMissing');
            errorDiv.className = 'error';
            return errorDiv;
        }

        const url: string = `/stroke/anz/${card.id}`;
        const authToken: string | null = localStorage.getItem('authToken');

        // Fehlerbehandlung für fehlenden AuthToken auch hier, da fetch-Aufrufe erfolgen
        if (!authToken) {
            console.error(i18n.t('auth.authTokenNotFound'));
            // Kann hier ein leeres Div zurückgeben oder einen Fehler werfen, je nach gewünschtem Verhalten
            const errorDiv = document.createElement('div');
            errorDiv.textContent = i18n.t('auth.authenticationError');
            errorDiv.className = 'error';
            return errorDiv;
        }

        const cardDiv: HTMLDivElement = document.createElement('div');
        cardDiv.className = 'memory-card';
        cardDiv.dataset.cardId = card.id.toString(); // dataset.cardId ist immer ein String



         cardDiv.addEventListener('dblclick', function (): void {
            // Sicherstellen, dass strokesSpan auch wirklich vom Typ HTMLLabelElement ist
            showCommentPopup(card.id!, authToken!, url, strokesSpan); // '!' weil wir authToken und card.id hier erwarten
         });


        const headerSection: HTMLDivElement = document.createElement('div');
        headerSection.className = 'card-header';

        const topicSection: HTMLDivElement = document.createElement('div');
        topicSection.className = 'card-topic';
        topicSection.style.color = '#212529'; // Darker text
        topicSection.style.marginBottom = '8px';
        topicSection.style.fontWeight = '500';
        // Difficulty stars display
        const difficultyStars = '★'.repeat(card.difficulty || 1) + '☆'.repeat(5 - (card.difficulty || 1));
        
        topicSection.innerHTML = `<span class="card-id" style="color: #495057; font-weight: bold;">#${card.id!}</span> - <span style="color: #212529;">${card.category || i18n.t('cards.unknown')}</span> - <span style="color: #ff6b35; font-weight: bold; margin-left: 10px;" title="${i18n.t('learn.difficultyTitle')}: ${card.difficulty || 1}/5">${difficultyStars}</span>`;

        headerSection.appendChild(topicSection);
        cardDiv.appendChild(headerSection);


        const questionSection: HTMLDivElement = document.createElement('div');
        questionSection.className = 'card-question';
        questionSection.textContent = card.question;

        const strokesSpan: HTMLLabelElement = document.createElement('label');
        strokesSpan.className = 'stroke-question';
        strokesSpan.textContent = ''; // Leerer Text initial

        questionSection.appendChild(strokesSpan);


        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then((response: Response) => {
                if (response.status === 404) {
                    // 404 is expected for cards without stroke data - handle silently
                    return { number: 0 };
                }
                if (!response.ok) {
                    throw new Error(i18n.t('common.networkError'));
                }
                return response.json();
            })
            .then((data: StrokeCountResponse) => { // Typisieren der Daten
                strokesSpan.textContent = `Rate: ${data.number}`;
            })
            .catch((error: Error) => {
                // Only log actual errors, not 404s
                if (!error.message.includes('404')) {
                    console.error(i18n.t('cards.loadError'), error);
                }
                strokesSpan.textContent = 'Rate: 0';
            });


        cardDiv.appendChild(questionSection);

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

        const answersSection: HTMLDivElement = document.createElement('div');
        answersSection.className = 'card-answers';

        // Parse answers and display as numbered blue lines
        let answerLines: string[] = [];
        try {
            // Try to parse as JSON first (new format)
            interface CardAnswer {
                text: string;
                isCorrect: boolean;
            }
            const cardAnswers: CardAnswer[] = JSON.parse(card.answer);
            answerLines = cardAnswers.map((answer, index) => 
                `${index + 1}. ${answer.text} ${answer.isCorrect ? '(✓)' : ''}`
            );
        } catch (e) {
            // Fallback to old newline-separated format
            answerLines = card.answer.split('\n').filter(line => line.trim());
        }
        answerLines.forEach((line, index) => {
            const answerDiv: HTMLDivElement = document.createElement('div');
            answerDiv.className = 'card-answer-line';
            answerDiv.style.backgroundColor = '#f0f8ff'; // Lighter blue background  
            answerDiv.style.border = '1px solid #87ceeb'; // Lighter blue border
            answerDiv.style.borderRadius = '6px';
            answerDiv.style.padding = '10px';
            answerDiv.style.margin = '5px 0';
            answerDiv.style.display = 'flex';
            answerDiv.style.alignItems = 'center';

            const numberSpan: HTMLSpanElement = document.createElement('span');
            numberSpan.className = 'answer-number';
            numberSpan.textContent = `${index + 1}.`;
            numberSpan.style.fontWeight = 'bold';
            numberSpan.style.color = '#0d47a1'; // Darker blue for number
            numberSpan.style.marginRight = '10px';
            numberSpan.style.minWidth = '25px';

            const answerText: HTMLSpanElement = document.createElement('span');
            answerText.className = 'answer-text';
            answerText.innerHTML = line.trim().replace(/\n/g, '<br>');
            answerText.style.flex = '1';

            // Check if line contains checkmark for correct answer
            if (line.includes('(✓)')) {
                answerDiv.style.backgroundColor = '#e8f5e8'; // Light green for correct
                answerDiv.style.borderColor = '#4caf50'; // Green border
                numberSpan.style.color = '#2e7d32'; // Dark green number
                
                const checkIcon: HTMLSpanElement = document.createElement('span');
                checkIcon.innerHTML = '✓';
                checkIcon.style.color = '#4caf50';
                checkIcon.style.fontWeight = 'bold';
                checkIcon.style.marginLeft = '10px';
                answerDiv.appendChild(checkIcon);
            }

            answerDiv.appendChild(numberSpan);
            answerDiv.appendChild(answerText);
            answersSection.appendChild(answerDiv);
        });

        // WICHTIG: Vermeide doppeltes Anhängen von Elementen!
        // topicSection und questionSection werden bereits oben angehängt.
        // Nur answersSection, falls es nicht bereits angehängt ist (dieser Code fügt es nur einmal an)
        cardDiv.appendChild(answersSection);

        return cardDiv;
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