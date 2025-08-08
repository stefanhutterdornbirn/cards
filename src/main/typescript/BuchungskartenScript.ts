import {clearContentScreen} from './common.js';
import { i18n } from './i18n/TranslationService.js';

const BUCHUNGSKARTEN_PAGE: string = "BUCHUNGSKARTEN_PAGE";

// Datenmodell für Buchungskarten - Einzelne Buchungen mit Belegen

// Enum für Buchungsarten
enum BuchungsArt {
    EINNAHME = "EINNAHME",
    AUSGABE = "AUSGABE"
}

// Enum für Buchungskategorien
enum BuchungsKategorie {
    // Einnahmen
    VERKAUF = "VERKAUF",
    DIENSTLEISTUNG = "DIENSTLEISTUNG", 
    ZINSEN = "ZINSEN",
    SONSTIGE_EINNAHMEN = "SONSTIGE_EINNAHMEN",
    
    // Ausgaben
    BUEROKOSTEN = "BUEROKOSTEN",
    REISEKOSTEN = "REISEKOSTEN",
    MARKETING = "MARKETING",
    MIETE = "MIETE",
    STROM = "STROM",
    TELEFON = "TELEFON",
    VERSICHERUNG = "VERSICHERUNG",
    SONSTIGE_AUSGABEN = "SONSTIGE_AUSGABEN"
}

// Interface für Dokument/Beleg
interface Dokument {
    id: number;
    name: string;
    dateityp: string; // z.B. "pdf", "jpg", "png"
    groesse: number; // in Bytes
    pfad: string; // Pfad zur Datei
    hochgeladen: Date;
}

// Interface für bestehende Image (wiederverwendet)
interface Image {
    id: number;
    name: string;
    extension?: string;
    location?: string;
}

// Interface für eine Buchungskarte (einzelne Buchung)
interface BuchungsKarte {
    id: number;
    datum: Date;
    buchungsArt: BuchungsArt;
    kategorie: BuchungsKategorie;
    beschreibung: string;
    betrag: number; // Immer positiv, Art wird durch buchungsArt bestimmt
    belegnummer?: string; // Optional: Rechnungsnummer, Quittungsnummer, etc.
    ustBetrag?: number; // USt-Betrag
    ustSatz?: number; // USt-Satz in Prozent
    
    // Beleg (Pflichtfeld)
    dokument: Dokument;
    
    // Optionales Bild (verwendet bestehende Image-Struktur)
    image?: Image;
    
    // Metadaten
    erstellt: Date;
    geaendert?: Date;
}

// Enum für Zeitraumtyp
enum ZeitraumTyp {
    TAG = "TAG",
    WOCHE = "WOCHE",
    MONAT = "MONAT",
    QUARTAL = "QUARTAL",
    JAHR = "JAHR",
    BENUTZERDEFINIERT = "BENUTZERDEFINIERT"
}

// Interface für eine Übersichtskarte
interface UebersichtsKarte {
    id: number;
    titel: string;
    datumVon: string;
    datumBis: string;
    zeitraumTyp: ZeitraumTyp;
    gesamtEinnahmen: number;
    gesamtAusgaben: number;
    saldo: number;
    ausgangsUst?: number; // Ausgangs-USt (USt aus Einnahmen)
    eingangsUst?: number; // Eingangs-USt (USt aus Ausgaben)
    ustSaldo?: number; // USt-Saldo (Ausgangs-USt - Eingangs-USt)
    anzahlBuchungen: number;
    anzahlEinnahmen: number;
    anzahlAusgaben: number;
    erstellt: string;
    geaendert?: string;
}

document.addEventListener('DOMContentLoaded', () => {
    const buchungskartenNeuLink = document.getElementById('buchungskartenNeuLink') as HTMLElement;
    const buchungskartenUebersichtLink = document.getElementById('buchungskartenUebersichtLink') as HTMLElement;
    const buchungskartenAuswertungenLink = document.getElementById('buchungskartenAuswertungenLink') as HTMLElement;
    const buchungskartenContent = document.getElementById('buchungskartenContent') as HTMLElement;

    buchungskartenNeuLink.addEventListener('click', (e: Event) => {
        e.preventDefault();
        showBuchungskarten();
    });

    buchungskartenUebersichtLink.addEventListener('click', (e: Event) => {
        e.preventDefault();
        showBuchungskartenUebersicht();
    });

    buchungskartenAuswertungenLink.addEventListener('click', (e: Event) => {
        e.preventDefault();
        showBuchungskartenAuswertungen();
    });
});

function showBuchungskarten(): void {
    const buchungskartenContent = document.getElementById('buchungskartenContent') as HTMLElement;
    clearContentScreen(BUCHUNGSKARTEN_PAGE);

    // Überschrift
    const heading = document.createElement('h2');
    heading.textContent = i18n.t('buchungskarten.createNewBookingCard');
    buchungskartenContent.appendChild(heading);

    // Einzelne Buchungskarte
    const buchungsKarte = document.createElement('div');
    buchungsKarte.className = 'memory-card';
    buchungsKarte.style.maxWidth = '1200px';
    buchungsKarte.style.margin = '0 auto';
    buchungsKarte.style.width = '100%';
    buchungsKarte.style.padding = '20px';
    buchungsKarte.style.border = '2px solid #4CAF50';
    buchungsKarte.style.borderRadius = '12px';
    buchungsKarte.style.background = 'linear-gradient(135deg, #f8fffe 0%, #f0f8f0 100%)';
    buchungsKarte.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.15)';

    // Header-Bereich mit Buchungsart und Datum
    const headerSection = document.createElement('div');
    headerSection.className = 'card-header';
    headerSection.style.display = 'flex';
    headerSection.style.gap = '20px';
    headerSection.style.marginBottom = '20px';
    headerSection.style.padding = '15px';
    headerSection.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
    headerSection.style.borderRadius = '8px';
    headerSection.style.color = 'white';
    headerSection.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';

    // Buchungsart
    const artLabel = document.createElement('label');
    artLabel.textContent = i18n.t('buchungskarten.bookingType');
    artLabel.setAttribute('for', 'artSelect');
    artLabel.style.color = 'white';
    artLabel.style.fontWeight = 'bold';

    const artSelect = document.createElement('select');
    artSelect.id = 'artSelect';
    artSelect.className = 'topic-filter';
    artSelect.style.marginLeft = '10px';
    artSelect.style.width = '200px';

    const einnahmeOption = document.createElement('option');
    einnahmeOption.value = 'EINNAHME';
    einnahmeOption.textContent = i18n.t('buchungskarten.buchungsArt.EINNAHME');
    artSelect.appendChild(einnahmeOption);

    const ausgabeOption = document.createElement('option');
    ausgabeOption.value = 'AUSGABE';
    ausgabeOption.textContent = i18n.t('buchungskarten.buchungsArt.AUSGABE');
    artSelect.appendChild(ausgabeOption);

    const artContainer = document.createElement('div');
    artContainer.appendChild(artLabel);
    artContainer.appendChild(artSelect);

    // Datum
    const datumLabel = document.createElement('label');
    datumLabel.textContent = i18n.t('buchungskarten.date');
    datumLabel.setAttribute('for', 'datumInput');
    datumLabel.style.color = 'white';
    datumLabel.style.fontWeight = 'bold';

    const datumInput = document.createElement('input');
    datumInput.id = 'datumInput';
    datumInput.type = 'date';
    datumInput.className = 'form-control';
    datumInput.style.marginLeft = '10px';
    datumInput.style.padding = '8px';
    datumInput.style.borderRadius = '5px';
    datumInput.style.border = '1px solid #ddd';
    // Setze heute als Standard
    datumInput.value = new Date().toISOString().split('T')[0];

    const datumContainer = document.createElement('div');
    datumContainer.appendChild(datumLabel);
    datumContainer.appendChild(datumInput);

    headerSection.appendChild(artContainer);
    headerSection.appendChild(datumContainer);
    buchungsKarte.appendChild(headerSection);

    // Kategorie-Bereich
    const kategorieSection = document.createElement('div');
    kategorieSection.style.marginBottom = '20px';
    kategorieSection.style.padding = '15px';
    kategorieSection.style.background = '#f8f9fa';
    kategorieSection.style.borderRadius = '8px';
    kategorieSection.style.border = '1px solid #e9ecef';

    const kategorieLabel = document.createElement('label');
    kategorieLabel.textContent = i18n.t('buchungskarten.category');
    kategorieLabel.setAttribute('for', 'kategorieSelect');
    kategorieLabel.style.display = 'block';
    kategorieLabel.style.marginBottom = '8px';
    kategorieLabel.style.color = '#2c3e50';
    kategorieLabel.style.fontWeight = 'bold';

    const kategorieSelect = document.createElement('select');
    kategorieSelect.id = 'kategorieSelect';
    kategorieSelect.className = 'topic-filter';
    kategorieSelect.style.width = '100%';

    kategorieSection.appendChild(kategorieLabel);
    kategorieSection.appendChild(kategorieSelect);
    buchungsKarte.appendChild(kategorieSection);

    // Beschreibung-Bereich
    const beschreibungSection = document.createElement('div');
    beschreibungSection.style.marginBottom = '20px';
    beschreibungSection.style.padding = '15px';
    beschreibungSection.style.background = '#f8f9fa';
    beschreibungSection.style.borderRadius = '8px';
    beschreibungSection.style.border = '1px solid #e9ecef';

    const beschreibungLabel = document.createElement('label');
    beschreibungLabel.textContent = i18n.t('buchungskarten.description');
    beschreibungLabel.setAttribute('for', 'beschreibungInput');
    beschreibungLabel.style.display = 'block';
    beschreibungLabel.style.marginBottom = '8px';
    beschreibungLabel.style.color = '#2c3e50';
    beschreibungLabel.style.fontWeight = 'bold';

    const beschreibungInput = document.createElement('textarea');
    beschreibungInput.id = 'beschreibungInput';
    beschreibungInput.className = 'form-control';
    beschreibungInput.rows = 3;
    beschreibungInput.placeholder = i18n.t('buchungskarten.descriptionPlaceholder');
    beschreibungInput.style.width = '100%';
    beschreibungInput.style.padding = '8px';
    beschreibungInput.style.borderRadius = '5px';
    beschreibungInput.style.border = '1px solid #ddd';

    beschreibungSection.appendChild(beschreibungLabel);
    beschreibungSection.appendChild(beschreibungInput);
    buchungsKarte.appendChild(beschreibungSection);

    // Betrag und Belegnummer
    const betragSection = document.createElement('div');
    betragSection.style.display = 'flex';
    betragSection.style.gap = '20px';
    betragSection.style.marginBottom = '20px';
    betragSection.style.padding = '15px';
    betragSection.style.background = '#fff3e0';
    betragSection.style.borderRadius = '8px';
    betragSection.style.border = '1px solid #ffcc80';

    // Betrag
    const betragLabel = document.createElement('label');
    betragLabel.textContent = i18n.t('buchungskarten.amount');
    betragLabel.setAttribute('for', 'betragInput');
    betragLabel.style.color = '#e65100';
    betragLabel.style.fontWeight = 'bold';

    const betragInput = document.createElement('input');
    betragInput.id = 'betragInput';
    betragInput.type = 'number';
    betragInput.step = '0.01';
    betragInput.min = '0';
    betragInput.className = 'form-control';
    betragInput.style.marginLeft = '10px';
    betragInput.style.padding = '8px';
    betragInput.style.borderRadius = '5px';
    betragInput.style.border = '1px solid #ddd';
    betragInput.style.width = '150px';

    const betragContainer = document.createElement('div');
    betragContainer.appendChild(betragLabel);
    betragContainer.appendChild(betragInput);

    // Belegnummer (optional)
    const belegLabel = document.createElement('label');
    belegLabel.textContent = i18n.t('buchungskarten.receiptNumber');
    belegLabel.setAttribute('for', 'belegInput');
    belegLabel.style.color = '#e65100';
    belegLabel.style.fontWeight = 'bold';

    const belegInput = document.createElement('input');
    belegInput.id = 'belegInput';
    belegInput.type = 'text';
    belegInput.className = 'form-control';
    belegInput.style.marginLeft = '10px';
    belegInput.style.padding = '8px';
    belegInput.style.borderRadius = '5px';
    belegInput.style.border = '1px solid #ddd';
    belegInput.style.width = '200px';

    const belegContainer = document.createElement('div');
    belegContainer.appendChild(belegLabel);
    belegContainer.appendChild(belegInput);

    // USt-Satz (optional)
    const ustSatzLabel = document.createElement('label');
    ustSatzLabel.textContent = i18n.t('buchungskarten.vatRate');
    ustSatzLabel.setAttribute('for', 'ustSatzInput');
    ustSatzLabel.style.color = '#e65100';
    ustSatzLabel.style.fontWeight = 'bold';

    const ustSatzInput = document.createElement('input');
    ustSatzInput.id = 'ustSatzInput';
    ustSatzInput.type = 'number';
    ustSatzInput.step = '0.01';
    ustSatzInput.min = '0';
    ustSatzInput.max = '100';
    ustSatzInput.className = 'form-control';
    ustSatzInput.style.marginLeft = '10px';
    ustSatzInput.style.padding = '8px';
    ustSatzInput.style.borderRadius = '5px';
    ustSatzInput.style.border = '1px solid #ddd';
    ustSatzInput.style.width = '100px';

    const ustSatzContainer = document.createElement('div');
    ustSatzContainer.appendChild(ustSatzLabel);
    ustSatzContainer.appendChild(ustSatzInput);

    // USt-Betrag (optional)
    const ustBetragLabel = document.createElement('label');
    ustBetragLabel.textContent = i18n.t('buchungskarten.vatAmount');
    ustBetragLabel.setAttribute('for', 'ustBetragInput');
    ustBetragLabel.style.color = '#e65100';
    ustBetragLabel.style.fontWeight = 'bold';

    const ustBetragInput = document.createElement('input');
    ustBetragInput.id = 'ustBetragInput';
    ustBetragInput.type = 'number';
    ustBetragInput.step = '0.01';
    ustBetragInput.min = '0';
    ustBetragInput.className = 'form-control';
    ustBetragInput.style.marginLeft = '10px';
    ustBetragInput.style.padding = '8px';
    ustBetragInput.style.borderRadius = '5px';
    ustBetragInput.style.border = '1px solid #ddd';
    ustBetragInput.style.width = '150px';

    const ustBetragContainer = document.createElement('div');
    ustBetragContainer.appendChild(ustBetragLabel);
    ustBetragContainer.appendChild(ustBetragInput);

    betragSection.appendChild(betragContainer);
    betragSection.appendChild(belegContainer);
    betragSection.appendChild(ustSatzContainer);
    betragSection.appendChild(ustBetragContainer);
    buchungsKarte.appendChild(betragSection);

    // Dokument-Upload
    const dokumentSection = document.createElement('div');
    dokumentSection.style.marginBottom = '20px';
    dokumentSection.style.padding = '15px';
    betragSection.style.background = '#e8f5e8';
    dokumentSection.style.borderRadius = '8px';
    dokumentSection.style.border = '1px solid #81c784';

    const dokumentLabel = document.createElement('label');
    dokumentLabel.textContent = i18n.t('buchungskarten.receiptDocument');
    dokumentLabel.setAttribute('for', 'dokumentInput');
    dokumentLabel.style.display = 'block';
    dokumentLabel.style.marginBottom = '8px';
    dokumentLabel.style.color = '#2e7d32';
    dokumentLabel.style.fontWeight = 'bold';

    // Custom file input wrapper
    const fileInputWrapper = document.createElement('div');
    fileInputWrapper.style.position = 'relative';
    fileInputWrapper.style.display = 'inline-block';
    fileInputWrapper.style.width = '100%';

    const dokumentInput = document.createElement('input');
    dokumentInput.id = 'dokumentInput';
    dokumentInput.type = 'file';
    dokumentInput.accept = '.pdf,.jpg,.jpeg,.png';
    dokumentInput.style.position = 'absolute';
    dokumentInput.style.left = '-9999px';
    dokumentInput.style.opacity = '0';

    const customFileButton = document.createElement('button');
    customFileButton.type = 'button';
    customFileButton.className = 'form-control';
    customFileButton.style.width = '100%';
    customFileButton.style.padding = '8px 12px';
    customFileButton.style.borderRadius = '5px';
    customFileButton.style.border = '1px solid #ddd';
    customFileButton.style.backgroundColor = '#f8f9fa';
    customFileButton.style.cursor = 'pointer';
    customFileButton.style.textAlign = 'left';
    customFileButton.style.display = 'flex';
    customFileButton.style.justifyContent = 'space-between';
    customFileButton.style.alignItems = 'center';

    const fileNameSpan = document.createElement('span');
    fileNameSpan.textContent = i18n.t('buchungskarten.noFileSelected');
    fileNameSpan.style.color = '#6c757d';

    const chooseButtonSpan = document.createElement('span');
    chooseButtonSpan.textContent = i18n.t('buchungskarten.chooseFile');
    chooseButtonSpan.style.backgroundColor = '#007bff';
    chooseButtonSpan.style.color = 'white';
    chooseButtonSpan.style.padding = '4px 8px';
    chooseButtonSpan.style.borderRadius = '3px';
    chooseButtonSpan.style.fontSize = '12px';

    customFileButton.appendChild(fileNameSpan);
    customFileButton.appendChild(chooseButtonSpan);

    customFileButton.onclick = () => dokumentInput.click();

    // Event listener für PDF-Textextraktion und Dateiname-Update
    dokumentInput.addEventListener('change', function(event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            fileNameSpan.textContent = file.name;
            fileNameSpan.style.color = '#495057';
            if (file.type === 'application/pdf') {
                extractPdfText(file);
            }
        } else {
            fileNameSpan.textContent = i18n.t('buchungskarten.noFileSelected');
            fileNameSpan.style.color = '#6c757d';
        }
    });

    fileInputWrapper.appendChild(dokumentInput);
    fileInputWrapper.appendChild(customFileButton);

    dokumentSection.appendChild(dokumentLabel);
    dokumentSection.appendChild(fileInputWrapper);
    buchungsKarte.appendChild(dokumentSection);

    // Bild-Auswahl (optional)
    const imageSection = document.createElement('div');
    imageSection.style.marginBottom = '20px';
    imageSection.style.padding = '15px';
    imageSection.style.background = '#f3e5f5';
    imageSection.style.borderRadius = '8px';
    imageSection.style.border = '1px solid #ce93d8';

    const imageLabel = document.createElement('label');
    imageLabel.textContent = i18n.t('buchungskarten.selectImageLabel');
    imageLabel.setAttribute('for', 'imageSelect');
    imageLabel.style.display = 'block';
    imageLabel.style.marginBottom = '8px';
    imageLabel.style.color = '#7b1fa2';
    imageLabel.style.fontWeight = 'bold';

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
    buchungsKarte.appendChild(imageSection);

    // Button-Container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.justifyContent = 'flex-end';

    const saveButton = document.createElement('button');
    saveButton.className = 'save-card-button';
    saveButton.innerHTML = `<span class="material-icons">save</span> ${i18n.t('buchungskarten.save')}`;
    saveButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '8px';
    saveButton.style.padding = '12px 24px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.display = 'flex';
    saveButton.style.alignItems = 'center';
    saveButton.style.gap = '8px';
    saveButton.style.fontSize = '16px';
    saveButton.style.fontWeight = 'bold';
    saveButton.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
    saveButton.style.transition = 'all 0.3s ease';
    saveButton.onclick = saveBuchungsKarte;
    
    // Hover-Effekt
    saveButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
    });
    
    saveButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
    });

    buttonContainer.appendChild(saveButton);
    buchungsKarte.appendChild(buttonContainer);

    buchungskartenContent.appendChild(buchungsKarte);

    // Event Listener für Buchungsart-Änderung
    artSelect.addEventListener('change', updateKategorien);
    
    // Lade Bilder und initialisiere Kategorien
    loadImages();
    updateKategorien();
}

function updateKategorien(): void {
    const artSelect = document.getElementById('artSelect') as HTMLSelectElement;
    const kategorieSelect = document.getElementById('kategorieSelect') as HTMLSelectElement;
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }
    
    kategorieSelect.innerHTML = '';
    
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = i18n.t('buchungskarten.selectCategory');
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    kategorieSelect.appendChild(placeholderOption);

    if (artSelect.value) {
        // Lade Kategorien für die ausgewählte Buchungsart
        const buchungsartId = getBuchungsartIdByName(artSelect.value);
        
        fetch(`/buchungskategorien/${buchungsartId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then((kategorien: any[]) => {
            kategorien.forEach((kategorie: any) => {
                const option = document.createElement('option');
                option.value = kategorie.id.toString();
                // Try to get translation, fallback to kategorie.name if translation doesn't exist
                const translationKey = `buchungskarten.buchungsKategorie.${kategorie.name}`;
                const translatedName = i18n.t(translationKey);
                option.textContent = translatedName !== translationKey ? translatedName : kategorie.name;
                kategorieSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Fehler beim Laden der Kategorien:', error);
            alert(i18n.t('buchungskarten.errorLoadingCategories'));
        });
    }
}

function getBuchungsartIdByName(name: string): number {
    // Diese Funktion sollte die ID basierend auf dem Namen zurückgeben
    // Für Einnahme/Ausgabe verwenden wir feste IDs (1 für Einnahme, 2 für Ausgabe)
    if (name === 'EINNAHME') return 1;
    if (name === 'AUSGABE') return 2;
    return 1; // Standard-Fallback
}

function loadImages(): void {
    const imageSelect = document.getElementById('imageSelect') as HTMLSelectElement;
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }

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
        .then((images: Image[]) => {
            const sortedImages = images.sort((a, b) => a.id - b.id);

            imageSelect.innerHTML = '';

            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = i18n.t('buchungskarten.noImage');
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
            console.error('Fehler beim Laden der Bilder:', error);
            alert(i18n.t('buchungskarten.errorLoadingImages'));
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
            imagePreview.alt = 'Bildvorschau';
            imagePreview.className = 'question-image';
            imagePreview.style.maxWidth = '300px';
            imagePreview.style.maxHeight = '300px';
            imagePreview.style.marginTop = '10px';

            previewContainer.appendChild(imagePreview);
        }
    }
}

function saveBuchungsKarte(): void {
    const artSelect = document.getElementById('artSelect') as HTMLSelectElement;
    const datumInput = document.getElementById('datumInput') as HTMLInputElement;
    const kategorieSelect = document.getElementById('kategorieSelect') as HTMLSelectElement;
    const beschreibungInput = document.getElementById('beschreibungInput') as HTMLTextAreaElement;
    const betragInput = document.getElementById('betragInput') as HTMLInputElement;
    const belegInput = document.getElementById('belegInput') as HTMLInputElement;
    const ustSatzInput = document.getElementById('ustSatzInput') as HTMLInputElement;
    const ustBetragInput = document.getElementById('ustBetragInput') as HTMLInputElement;
    const dokumentInput = document.getElementById('dokumentInput') as HTMLInputElement;
    const imageSelect = document.getElementById('imageSelect') as HTMLSelectElement;
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }

    // Validierung
    if (!artSelect.value) {
        alert(i18n.t('buchungskarten.pleaseSelectBookingType'));
        return;
    }

    if (!datumInput.value) {
        alert(i18n.t('buchungskarten.pleaseEnterDate'));
        return;
    }

    if (!kategorieSelect.value) {
        alert(i18n.t('buchungskarten.pleaseSelectCategory'));
        return;
    }

    if (!beschreibungInput.value.trim()) {
        alert(i18n.t('buchungskarten.pleaseEnterDescription'));
        return;
    }

    if (!betragInput.value || parseFloat(betragInput.value) <= 0) {
        alert(i18n.t('buchungskarten.pleaseEnterValidAmount'));
        return;
    }

    if (!dokumentInput.files || dokumentInput.files.length === 0) {
        alert(i18n.t('buchungskarten.pleaseSelectDocument'));
        return;
    }

    // Speichere Button deaktivieren während der Verarbeitung
    const saveButton = document.querySelector('.save-card-button') as HTMLButtonElement;
    const originalContent = saveButton.innerHTML;
    saveButton.innerHTML = '<span class="material-icons spinning">hourglass_top</span> Speichern...';
    saveButton.disabled = true;

    // Zuerst das Dokument hochladen
    const file = dokumentInput.files[0];
    uploadDokument(file)
        .then(dokumentId => {
            // Dann die Buchungskarte erstellen
            const buchungsKarte = {
                id: 0, // Wird von der Datenbank generiert
                datum: datumInput.value,
                buchungsart: {
                    id: getBuchungsartIdByName(artSelect.value) || 1,
                    name: artSelect.value,
                    beschreibung: artSelect.value === 'EINNAHME' ? 'Einnahmen' : 'Ausgaben'
                },
                kategorie: {
                    id: parseInt(kategorieSelect.value),
                    name: kategorieSelect.options[kategorieSelect.selectedIndex].textContent || '',
                    beschreibung: '',
                    buchungsartId: getBuchungsartIdByName(artSelect.value) || 1
                },
                beschreibung: beschreibungInput.value.trim(),
                betrag: parseFloat(betragInput.value),
                belegnummer: belegInput.value.trim() || undefined,
                ustBetrag: ustBetragInput.value ? parseFloat(ustBetragInput.value) : undefined,
                ustSatz: ustSatzInput.value ? parseFloat(ustSatzInput.value) : undefined,
                dokument: {
                    id: dokumentId,
                    name: file.name,
                    originalName: file.name,
                    dateityp: file.type,
                    groesse: file.size,
                    pfad: '', // Wird vom Server gesetzt
                    hochgeladen: new Date().toISOString()
                },
                image: imageSelect.value ? {
                    id: parseInt(imageSelect.value),
                    name: imageSelect.options[imageSelect.selectedIndex].textContent || '',
                    extension: '',
                    location: imageSelect.options[imageSelect.selectedIndex].dataset.location || ''
                } : undefined,
                erstellt: new Date().toISOString(),
                geaendert: undefined
            };

            return fetch('/buchungskarten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(buchungsKarte)
            });
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(`Fehler beim Speichern: ${errorData.error || 'Unbekannter Fehler'}`);
                });
            }
            return response.json();
        })
        .then(() => {
            alert('Buchungskarte erfolgreich gespeichert!');
            
            // Formular zurücksetzen
            artSelect.selectedIndex = 0;
            datumInput.value = new Date().toISOString().split('T')[0];
            kategorieSelect.innerHTML = '';
            beschreibungInput.value = '';
            betragInput.value = '';
            belegInput.value = '';
            dokumentInput.value = '';
            imageSelect.selectedIndex = 0;
            
            const previewContainer = document.querySelector('.image-preview-container') as HTMLElement;
            previewContainer.innerHTML = '';
            
            // Kategorien neu laden
            updateKategorien();
        })
        .catch(error => {
            console.error('Fehler beim Speichern der Buchungskarte:', error);
            alert(error.message);
        })
        .finally(() => {
            // Button wieder aktivieren
            saveButton.innerHTML = originalContent;
            saveButton.disabled = false;
        });
}

function uploadDokument(file: File): Promise<number> {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        return Promise.reject(new Error('Keine Authentifizierung gefunden. Bitte melden Sie sich an.'));
    }
    
    return fetch('/dokument/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'X-File-Name': file.name,
            'X-File-Type': file.type,
            'X-File-Size': file.size.toString()
        },
        body: file
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Hochladen des Dokuments');
        }
        return response.json();
    })
    .then(data => {
        return data.id;
    });
}

function showBuchungskartenUebersicht(): void {
    const buchungskartenContent = document.getElementById('buchungskartenContent') as HTMLElement;
    clearContentScreen(BUCHUNGSKARTEN_PAGE);

    // Überschrift
    const heading = document.createElement('h2');
    heading.textContent = i18n.t('buchungskarten.overviewTitle');
    heading.style.marginBottom = '20px';
    heading.style.color = '#ffffff';
    heading.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
    heading.style.padding = '15px 25px';
    heading.style.borderRadius = '10px';
    heading.style.fontSize = '28px';
    heading.style.fontWeight = 'bold';
    heading.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
    heading.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
    heading.style.textAlign = 'center';
    buchungskartenContent.appendChild(heading);

    // Container für die Tabelle
    const tableContainer = document.createElement('div');
    tableContainer.style.overflowX = 'auto';
    tableContainer.style.marginTop = '20px';
    tableContainer.style.border = '2px solid #e3f2fd';
    tableContainer.style.borderRadius = '12px';
    tableContainer.style.backgroundColor = '#fff';
    tableContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    tableContainer.style.background = 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)';

    // Tabelle erstellen
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '14px';

    // Tabellenkopf
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.background = 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
    headerRow.style.borderBottom = '3px solid #1a252f';
    headerRow.style.boxShadow = '0 2px 8px rgba(44, 62, 80, 0.3)';

    const headers = [
        i18n.t('buchungskarten.tableHeaders.id'),
        i18n.t('buchungskarten.tableHeaders.date'),
        i18n.t('buchungskarten.tableHeaders.bookingType'),
        i18n.t('buchungskarten.tableHeaders.category'),
        i18n.t('buchungskarten.tableHeaders.description'),
        i18n.t('buchungskarten.tableHeaders.amount'),
        i18n.t('buchungskarten.tableHeaders.receiptNumber'),
        i18n.t('buchungskarten.tableHeaders.vatRate'),
        i18n.t('buchungskarten.tableHeaders.vatAmount'),
        i18n.t('buchungskarten.tableHeaders.document'),
        i18n.t('buchungskarten.tableHeaders.image'),
        i18n.t('buchungskarten.tableHeaders.created'),
        i18n.t('buchungskarten.tableHeaders.actions')
    ];

    // Sortierungsstate für jede Spalte (asc, desc, none)
    let sortState: {[key: number]: 'asc' | 'desc' | 'none'} = {};
    let buchungskartenData: any[] = [];

    headers.forEach((headerText, index) => {
        const th = document.createElement('th');
        
        // Sortierungsstate initialisieren
        sortState[index] = 'none';
        
        // Container für Header Text und Sort Indicator
        const headerContainer = document.createElement('div');
        headerContainer.style.display = 'flex';
        headerContainer.style.alignItems = 'center';
        headerContainer.style.justifyContent = 'space-between';
        
        const headerTextElement = document.createElement('span');
        headerTextElement.textContent = headerText;
        
        const sortIndicator = document.createElement('span');
        sortIndicator.innerHTML = '⇅';
        sortIndicator.style.marginLeft = '8px';
        sortIndicator.style.fontSize = '12px';
        sortIndicator.style.opacity = '0.6';
        
        headerContainer.appendChild(headerTextElement);
        if (index < headers.length - 1) { // Keine Sortierung für die Aktionen-Spalte
            headerContainer.appendChild(sortIndicator);
        }
        
        th.appendChild(headerContainer);
        th.style.padding = '16px 12px';
        th.style.textAlign = 'left';
        th.style.fontWeight = 'bold';
        th.style.color = '#ffffff';
        th.style.borderRight = '1px solid rgba(255, 255, 255, 0.2)';
        th.style.fontSize = '14px';
        th.style.letterSpacing = '0.8px';
        th.style.textTransform = 'uppercase';
        th.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.5)';
        th.style.fontFamily = 'Arial, sans-serif';
        
        // Cursor nur für sortierbare Spalten
        if (index < headers.length - 1) {
            th.style.cursor = 'pointer';
            th.style.userSelect = 'none';
            
            // Sortierung Event Listener
            th.addEventListener('click', () => {
                // Sortierungsstate aktualisieren
                let newState: 'asc' | 'desc' | 'none';
                if (sortState[index] === 'none') {
                    newState = 'asc';
                } else if (sortState[index] === 'asc') {
                    newState = 'desc';
                } else {
                    newState = 'none';
                }
                
                // Alle anderen Spalten auf 'none' zurücksetzen
                Object.keys(sortState).forEach(key => {
                    const keyNum = parseInt(key);
                    if (keyNum !== index) {
                        sortState[keyNum] = 'none';
                        const otherTh = headerRow.children[keyNum] as HTMLElement;
                        const otherIndicator = otherTh.querySelector('span:last-child') as HTMLElement;
                        if (otherIndicator && keyNum < headers.length - 1) {
                            otherIndicator.innerHTML = '⇅';
                            otherIndicator.style.opacity = '0.6';
                        }
                    }
                });
                
                sortState[index] = newState;
                
                // Sort Indicator aktualisieren
                if (newState === 'asc') {
                    sortIndicator.innerHTML = '↑';
                    sortIndicator.style.opacity = '1';
                } else if (newState === 'desc') {
                    sortIndicator.innerHTML = '↓';
                    sortIndicator.style.opacity = '1';
                } else {
                    sortIndicator.innerHTML = '⇅';
                    sortIndicator.style.opacity = '0.6';
                }
                
                // Daten sortieren und Tabelle neu rendern
                sortAndRenderTable(tbody, buchungskartenData, index, newState, headers.length);
            });
        }
        
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Tabellenkörper
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    tableContainer.appendChild(table);
    buchungskartenContent.appendChild(tableContainer);

    // Loading-Anzeige
    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');
    loadingCell.colSpan = headers.length;
    loadingCell.textContent = i18n.t('buchungskarten.loading');
    loadingCell.style.padding = '20px';
    loadingCell.style.textAlign = 'center';
    loadingCell.style.fontStyle = 'italic';
    loadingCell.style.color = '#6c757d';
    loadingRow.appendChild(loadingCell);
    tbody.appendChild(loadingRow);

    // Daten laden
    loadBuchungskartenData(tbody, headers.length, buchungskartenData);
}

function loadBuchungskartenData(tbody: HTMLElement, headerCount: number, buchungskartenData: any[]): void {
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        tbody.innerHTML = '';
        const errorRow = document.createElement('tr');
        const errorCell = document.createElement('td');
        errorCell.colSpan = headerCount;
        errorCell.textContent = i18n.t('buchungskarten.noAuthForTable');
        errorCell.style.padding = '20px';
        errorCell.style.textAlign = 'center';
        errorCell.style.color = '#dc3545';
        errorRow.appendChild(errorCell);
        tbody.appendChild(errorRow);
        return;
    }

    fetch('/buchungskarten', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(i18n.t('buchungskarten.errorLoadingBookingsTable'));
        }
        return response.json();
    })
    .then((buchungskarten: any[]) => {
        // Daten in Array speichern für Sortierung
        buchungskartenData.length = 0; // Array leeren
        buchungskartenData.push(...buchungskarten);
        
        // Tabelle rendern
        renderBuchungskartenTable(tbody, buchungskartenData, headerCount);
    })
    .catch(error => {
        console.error('Fehler beim Laden der Buchungskarten:', error);
        tbody.innerHTML = '';
        
        const errorRow = document.createElement('tr');
        const errorCell = document.createElement('td');
        errorCell.colSpan = headerCount;
        errorCell.textContent = 'Fehler beim Laden der Buchungskarten: ' + error.message;
        errorCell.style.padding = '20px';
        errorCell.style.textAlign = 'center';
        errorCell.style.color = '#dc3545';
        errorRow.appendChild(errorCell);
        tbody.appendChild(errorRow);
    });
}

function renderBuchungskartenTable(tbody: HTMLElement, buchungskartenData: any[], headerCount: number): void {
    // Loading-Zeile entfernen
    tbody.innerHTML = '';

    if (buchungskartenData.length === 0) {
        const noDataRow = document.createElement('tr');
        const noDataCell = document.createElement('td');
        noDataCell.colSpan = headerCount;
        noDataCell.textContent = i18n.t('buchungskarten.noBookings');
        noDataCell.style.padding = '20px';
        noDataCell.style.textAlign = 'center';
        noDataCell.style.fontStyle = 'italic';
        noDataCell.style.color = '#6c757d';
        noDataRow.appendChild(noDataCell);
        tbody.appendChild(noDataRow);
        return;
    }

    // Datenzeilen erstellen
    buchungskartenData.forEach((buchungskarte: any, index: number) => {
        const row = document.createElement('tr');
        
        // Zebra-Streifenmuster mit Farben
        if (index % 2 === 0) {
            row.style.background = 'linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%)';
        } else {
            row.style.background = 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)';
        }
        
        row.style.borderBottom = '1px solid #e3f2fd';
        row.style.transition = 'all 0.3s ease';
        
        // Hover-Effekt mit Farbe
        row.addEventListener('mouseenter', () => {
            row.style.background = 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)';
            row.style.transform = 'translateY(-1px)';
            row.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });
        
        row.addEventListener('mouseleave', () => {
            if (index % 2 === 0) {
                row.style.background = 'linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%)';
            } else {
                row.style.background = 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)';
            }
            row.style.transform = 'translateY(0)';
            row.style.boxShadow = 'none';
        });

        // Zellen erstellen
        const cells = [
            buchungskarte.id.toString(),
            buchungskarte.datum,
            i18n.t(`buchungskarten.buchungsArt.${buchungskarte.buchungsart.name}`),
            i18n.t(`buchungskarten.buchungsKategorie.${buchungskarte.kategorie.name}`),
            buchungskarte.beschreibung,
            buchungskarte.betrag.toFixed(2),
            buchungskarte.belegnummer || '-',
            buchungskarte.ustSatz ? buchungskarte.ustSatz.toFixed(2) : '-',
            buchungskarte.ustBetrag ? buchungskarte.ustBetrag.toFixed(2) : '-',
            buchungskarte.dokument.originalName,
            buchungskarte.image ? buchungskarte.image.name : '-',
            new Date(buchungskarte.erstellt).toLocaleDateString('de-DE'),
            '' // Placeholder für Delete-Button
        ];

        cells.forEach((cellText, cellIndex) => {
            const td = document.createElement('td');
            
            // Spezialbehandlung für die Aktionen-Spalte
            if (cellIndex === 12) { // Aktionen-Spalte
                // Edit Button
                const editButton = document.createElement('button');
                editButton.innerHTML = '✏️';
                editButton.title = i18n.t('buchungskarten.editBooking');
                editButton.style.background = 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)';
                editButton.style.color = 'white';
                editButton.style.border = 'none';
                editButton.style.borderRadius = '6px';
                editButton.style.padding = '6px 10px';
                editButton.style.cursor = 'pointer';
                editButton.style.fontSize = '14px';
                editButton.style.transition = 'all 0.3s ease';
                editButton.style.boxShadow = '0 2px 4px rgba(8, 145, 178, 0.3)';
                editButton.style.marginRight = '5px';
                
                editButton.addEventListener('mouseenter', () => {
                    editButton.style.transform = 'scale(1.1)';
                    editButton.style.boxShadow = '0 4px 8px rgba(8, 145, 178, 0.4)';
                });
                
                editButton.addEventListener('mouseleave', () => {
                    editButton.style.transform = 'scale(1)';
                    editButton.style.boxShadow = '0 2px 4px rgba(8, 145, 178, 0.3)';
                });
                
                editButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditBuchungsKarteOverlay(buchungskarte);
                });
                
                // Delete Button
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '🗑️';
                deleteButton.title = i18n.t('buchungskarten.deleteBooking');
                deleteButton.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                deleteButton.style.color = 'white';
                deleteButton.style.border = 'none';
                deleteButton.style.borderRadius = '6px';
                deleteButton.style.padding = '6px 10px';
                deleteButton.style.cursor = 'pointer';
                deleteButton.style.fontSize = '14px';
                deleteButton.style.transition = 'all 0.3s ease';
                deleteButton.style.boxShadow = '0 2px 4px rgba(220, 53, 69, 0.3)';
                
                deleteButton.addEventListener('mouseenter', () => {
                    deleteButton.style.transform = 'scale(1.1)';
                    deleteButton.style.boxShadow = '0 4px 8px rgba(220, 53, 69, 0.4)';
                });
                
                deleteButton.addEventListener('mouseleave', () => {
                    deleteButton.style.transform = 'scale(1)';
                    deleteButton.style.boxShadow = '0 2px 4px rgba(220, 53, 69, 0.3)';
                });
                
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteBuchungsKarte(buchungskarte.id, row);
                });
                
                td.appendChild(editButton);
                td.appendChild(deleteButton);
                td.style.textAlign = 'center';
                td.style.padding = '8px';
            } else {
                td.textContent = cellText;
            }
            td.style.padding = '12px 10px';
            td.style.borderRight = '1px solid #e3f2fd';
            td.style.maxWidth = '200px';
            td.style.overflow = 'hidden';
            td.style.textOverflow = 'ellipsis';
            td.style.whiteSpace = 'nowrap';
            
            // Farbcodierung basierend auf Zellentyp
            switch (cellIndex) {
                case 0: // ID
                    td.style.fontWeight = 'bold';
                    td.style.color = '#6366f1';
                    td.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                    break;
                case 1: // Datum
                    td.style.color = '#059669';
                    td.style.fontWeight = '500';
                    break;
                case 2: // Buchungsart
                    if (buchungskarte.buchungsart.name === 'EINNAHME') {
                        td.style.color = '#16a34a';
                        td.style.backgroundColor = 'rgba(22, 163, 74, 0.1)';
                        td.style.fontWeight = 'bold';
                    } else {
                        td.style.color = '#dc2626';
                        td.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                        td.style.fontWeight = 'bold';
                    }
                    break;
                case 3: // Kategorie
                    td.style.color = '#7c3aed';
                    td.style.fontWeight = '500';
                    break;
                case 4: // Beschreibung
                    td.style.color = '#374151';
                    break;
                case 5: // Betrag
                    td.style.fontWeight = 'bold';
                    td.style.textAlign = 'right';
                    if (buchungskarte.buchungsart.name === 'EINNAHME') {
                        td.style.color = '#16a34a';
                    } else {
                        td.style.color = '#dc2626';
                    }
                    break;
                case 6: // Belegnummer
                    td.style.color = '#6b7280';
                    td.style.fontFamily = 'monospace';
                    break;
                case 7: // USt-Satz
                    td.style.color = '#7c3aed';
                    td.style.fontWeight = '500';
                    td.style.textAlign = 'right';
                    if (cellText !== '-') {
                        td.textContent = cellText + '%';
                    }
                    break;
                case 8: // USt-Betrag
                    td.style.color = '#7c3aed';
                    td.style.fontWeight = '500';
                    td.style.textAlign = 'right';
                    if (cellText !== '-') {
                        td.textContent = '€' + cellText;
                    }
                    break;
                case 9: // Dokument
                    td.style.color = '#0891b2';
                    td.style.fontWeight = '500';
                    td.style.cursor = 'pointer';
                    td.style.textDecoration = 'underline';
                    td.title = 'Klicken zum Anzeigen/Herunterladen';
                    
                    // Click-Handler für Dokument
                    td.addEventListener('click', (e) => {
                        e.stopPropagation();
                        handleDokumentClick(buchungskarte.dokument);
                    });
                    
                    // Hover-Effekt für Dokument
                    td.addEventListener('mouseenter', () => {
                        td.style.backgroundColor = 'rgba(8, 145, 178, 0.1)';
                        td.style.transform = 'scale(1.05)';
                    });
                    
                    td.addEventListener('mouseleave', () => {
                        td.style.backgroundColor = 'transparent';
                        td.style.transform = 'scale(1)';
                    });
                    break;
                case 10: // Bild
                    td.style.color = '#9333ea';
                    if (cellText !== '-') {
                        td.style.fontWeight = '500';
                    }
                    break;
                case 11: // Erstellt
                    td.style.color = '#6b7280';
                    td.style.fontSize = '12px';
                    break;
                case 12: // Aktionen
                    // Styling wird bereits in der Spezialbehandlung oben gesetzt
                    break;
            }
            
            // Tooltip für längere Texte
            if (cellText.length > 30) {
                td.title = cellText;
            }
            
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });
}

function sortAndRenderTable(tbody: HTMLElement, buchungskartenData: any[], columnIndex: number, sortDirection: 'asc' | 'desc' | 'none', headerCount: number): void {
    if (sortDirection === 'none') {
        // Ursprüngliche Reihenfolge wiederherstellen (nach ID sortieren)
        renderBuchungskartenTable(tbody, buchungskartenData, headerCount);
        return;
    }

    // Daten sortieren
    const sortedData = [...buchungskartenData].sort((a, b) => {
        let valueA: any;
        let valueB: any;
        
        // Werte basierend auf Spaltenindex extrahieren
        switch (columnIndex) {
            case 0: // ID
                valueA = a.id;
                valueB = b.id;
                break;
            case 1: // Datum
                valueA = new Date(a.datum);
                valueB = new Date(b.datum);
                break;
            case 2: // Buchungsart
                valueA = i18n.t(`buchungskarten.buchungsArt.${a.buchungsart.name}`);
                valueB = i18n.t(`buchungskarten.buchungsArt.${b.buchungsart.name}`);
                break;
            case 3: // Kategorie
                valueA = i18n.t(`buchungskarten.buchungsKategorie.${a.kategorie.name}`);
                valueB = i18n.t(`buchungskarten.buchungsKategorie.${b.kategorie.name}`);
                break;
            case 4: // Beschreibung
                valueA = a.beschreibung;
                valueB = b.beschreibung;
                break;
            case 5: // Betrag
                valueA = a.betrag;
                valueB = b.betrag;
                break;
            case 6: // Belegnummer
                valueA = a.belegnummer || '';
                valueB = b.belegnummer || '';
                break;
            case 7: // USt-Satz
                valueA = a.ustSatz || 0;
                valueB = b.ustSatz || 0;
                break;
            case 8: // USt-Betrag
                valueA = a.ustBetrag || 0;
                valueB = b.ustBetrag || 0;
                break;
            case 9: // Dokument
                valueA = a.dokument.originalName;
                valueB = b.dokument.originalName;
                break;
            case 10: // Bild
                valueA = a.image ? a.image.name : '';
                valueB = b.image ? b.image.name : '';
                break;
            case 11: // Erstellt
                valueA = new Date(a.erstellt);
                valueB = new Date(b.erstellt);
                break;
            default:
                return 0;
        }
        
        // Numerische Sortierung für Zahlen
        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }
        
        // Datums-Sortierung
        if (valueA instanceof Date && valueB instanceof Date) {
            return sortDirection === 'asc' ? valueA.getTime() - valueB.getTime() : valueB.getTime() - valueA.getTime();
        }
        
        // String-Sortierung (case-insensitive)
        const stringA = valueA.toString().toLowerCase();
        const stringB = valueB.toString().toLowerCase();
        
        if (sortDirection === 'asc') {
            return stringA.localeCompare(stringB);
        } else {
            return stringB.localeCompare(stringA);
        }
    });

    // Tabelle mit sortierten Daten rendern
    renderBuchungskartenTable(tbody, sortedData, headerCount);
}

function deleteBuchungsKarte(buchungskarteId: number, row: HTMLTableRowElement): void {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }
    
    // Bestätigungsdialog
    const confirmed = confirm(i18n.t('buchungskarten.confirmDelete'));
    if (!confirmed) {
        return;
    }
    
    // Button während des Löschvorgangs deaktivieren
    const deleteButton = row.querySelector('button') as HTMLButtonElement;
    const originalContent = deleteButton.innerHTML;
    deleteButton.innerHTML = '⏳';
    deleteButton.disabled = true;
    deleteButton.style.cursor = 'not-allowed';
    
    // API-Aufruf zum Löschen
    fetch(`/buchungskarten/${buchungskarteId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        // Erfolgreich gelöscht - Zeile aus der Tabelle entfernen
        row.style.transition = 'all 0.3s ease';
        row.style.backgroundColor = '#f8d7da';
        row.style.transform = 'translateX(-100%)';
        row.style.opacity = '0';
        
        setTimeout(() => {
            if (row.parentNode) {
                row.parentNode.removeChild(row);
            }
        }, 300);
        
        // Erfolgsbenachrichtigung
        showDeleteNotification(true, 'Buchung erfolgreich gelöscht');
    })
    .catch(error => {
        console.error('Fehler beim Löschen der Buchung:', error);
        
        // Button wieder aktivieren
        deleteButton.innerHTML = originalContent;
        deleteButton.disabled = false;
        deleteButton.style.cursor = 'pointer';
        
        // Fehlerbenachrichtigung
        showDeleteNotification(false, 'Fehler beim Löschen: ' + error.message);
    });
}

function showDeleteNotification(success: boolean, message: string): void {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = success ? '#4CAF50' : '#f44336';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '10000';
    notification.style.fontSize = '14px';
    notification.style.maxWidth = '300px';
    notification.style.transition = 'opacity 0.3s ease';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>${success ? '✓' : '✗'}</span>
            <div>${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Automatisch nach 3 Sekunden ausblenden
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            safeRemoveElement(notification);
        }, 300);
    }, 3000);
}

function showBuchungskartenAuswertungen(): void {
    const buchungskartenContent = document.getElementById('buchungskartenContent') as HTMLElement;
    clearContentScreen(BUCHUNGSKARTEN_PAGE);

    // Überschrift
    const heading = document.createElement('h2');
    heading.textContent = i18n.t('buchungskarten.evaluationsPageTitle');
    heading.style.marginBottom = '20px';
    heading.style.color = '#ffffff';
    heading.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
    heading.style.padding = '15px 25px';
    heading.style.borderRadius = '10px';
    heading.style.fontSize = '28px';
    heading.style.fontWeight = 'bold';
    heading.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
    heading.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
    heading.style.textAlign = 'center';
    buchungskartenContent.appendChild(heading);

    // Container für Auswertungsformular
    const formContainer = document.createElement('div');
    formContainer.style.maxWidth = '800px';
    formContainer.style.margin = '0 auto';
    formContainer.style.backgroundColor = '#fff';
    formContainer.style.padding = '30px';
    formContainer.style.borderRadius = '12px';
    formContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    formContainer.style.marginBottom = '30px';

    // Formular-Überschrift
    const formHeading = document.createElement('h3');
    formHeading.textContent = i18n.t('buchungskarten.createNewEvaluation');
    formHeading.style.marginBottom = '20px';
    formHeading.style.color = '#2c3e50';
    formHeading.style.borderBottom = '2px solid #4CAF50';
    formHeading.style.paddingBottom = '10px';
    formContainer.appendChild(formHeading);

    // Zeitraum-Typ Auswahl
    const zeitraumSection = document.createElement('div');
    zeitraumSection.style.marginBottom = '20px';
    zeitraumSection.style.padding = '15px';
    zeitraumSection.style.backgroundColor = '#f8f9fa';
    zeitraumSection.style.borderRadius = '8px';
    zeitraumSection.style.border = '1px solid #e9ecef';

    const zeitraumLabel = document.createElement('label');
    zeitraumLabel.textContent = i18n.t('buchungskarten.periodType');
    zeitraumLabel.style.display = 'block';
    zeitraumLabel.style.marginBottom = '8px';
    zeitraumLabel.style.fontWeight = 'bold';
    zeitraumLabel.style.color = '#2c3e50';

    const zeitraumSelect = document.createElement('select');
    zeitraumSelect.id = 'zeitraumSelect';
    zeitraumSelect.style.width = '100%';
    zeitraumSelect.style.padding = '10px';
    zeitraumSelect.style.borderRadius = '5px';
    zeitraumSelect.style.border = '1px solid #ddd';
    zeitraumSelect.style.fontSize = '14px';

    // Zeitraum-Optionen
    const zeitraumOptions = [
        { value: 'TAG', text: i18n.t('buchungskarten.periodTypes.TAG') },
        { value: 'WOCHE', text: i18n.t('buchungskarten.periodTypes.WOCHE') },
        { value: 'MONAT', text: i18n.t('buchungskarten.periodTypes.MONAT') },
        { value: 'QUARTAL', text: i18n.t('buchungskarten.periodTypes.QUARTAL') },
        { value: 'JAHR', text: i18n.t('buchungskarten.periodTypes.JAHR') },
        { value: 'BENUTZERDEFINIERT', text: i18n.t('buchungskarten.periodTypes.BENUTZERDEFINIERT') }
    ];

    zeitraumOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        zeitraumSelect.appendChild(optionElement);
    });

    zeitraumSection.appendChild(zeitraumLabel);
    zeitraumSection.appendChild(zeitraumSelect);
    formContainer.appendChild(zeitraumSection);

    // Datum Von und Bis
    const dateSection = document.createElement('div');
    dateSection.style.display = 'flex';
    dateSection.style.gap = '20px';
    dateSection.style.marginBottom = '20px';

    // Datum Von
    const datumVonSection = document.createElement('div');
    datumVonSection.style.flex = '1';
    datumVonSection.style.padding = '15px';
    datumVonSection.style.backgroundColor = '#e8f5e8';
    datumVonSection.style.borderRadius = '8px';
    datumVonSection.style.border = '1px solid #81c784';

    const datumVonLabel = document.createElement('label');
    datumVonLabel.textContent = i18n.t('buchungskarten.dateFrom');
    datumVonLabel.style.display = 'block';
    datumVonLabel.style.marginBottom = '8px';
    datumVonLabel.style.fontWeight = 'bold';
    datumVonLabel.style.color = '#2e7d32';

    const datumVonInput = document.createElement('input');
    datumVonInput.id = 'datumVonInput';
    datumVonInput.type = 'date';
    datumVonInput.style.width = '100%';
    datumVonInput.style.padding = '10px';
    datumVonInput.style.borderRadius = '5px';
    datumVonInput.style.border = '1px solid #ddd';

    datumVonSection.appendChild(datumVonLabel);
    datumVonSection.appendChild(datumVonInput);

    // Datum Bis
    const datumBisSection = document.createElement('div');
    datumBisSection.style.flex = '1';
    datumBisSection.style.padding = '15px';
    datumBisSection.style.backgroundColor = '#e8f5e8';
    datumBisSection.style.borderRadius = '8px';
    datumBisSection.style.border = '1px solid #81c784';

    const datumBisLabel = document.createElement('label');
    datumBisLabel.textContent = i18n.t('buchungskarten.dateTo');
    datumBisLabel.style.display = 'block';
    datumBisLabel.style.marginBottom = '8px';
    datumBisLabel.style.fontWeight = 'bold';
    datumBisLabel.style.color = '#2e7d32';

    const datumBisInput = document.createElement('input');
    datumBisInput.id = 'datumBisInput';
    datumBisInput.type = 'date';
    datumBisInput.style.width = '100%';
    datumBisInput.style.padding = '10px';
    datumBisInput.style.borderRadius = '5px';
    datumBisInput.style.border = '1px solid #ddd';

    datumBisSection.appendChild(datumBisLabel);
    datumBisSection.appendChild(datumBisInput);

    dateSection.appendChild(datumVonSection);
    dateSection.appendChild(datumBisSection);
    formContainer.appendChild(dateSection);

    // Titel (optional)
    const titelSection = document.createElement('div');
    titelSection.style.marginBottom = '20px';
    titelSection.style.padding = '15px';
    titelSection.style.backgroundColor = '#f3e5f5';
    titelSection.style.borderRadius = '8px';
    titelSection.style.border = '1px solid #ce93d8';

    const titelLabel = document.createElement('label');
    titelLabel.textContent = i18n.t('buchungskarten.titleOptional');
    titelLabel.style.display = 'block';
    titelLabel.style.marginBottom = '8px';
    titelLabel.style.fontWeight = 'bold';
    titelLabel.style.color = '#7b1fa2';

    const titelInput = document.createElement('input');
    titelInput.id = 'titelInput';
    titelInput.type = 'text';
    titelInput.placeholder = i18n.t('buchungskarten.evaluationTitle');
    titelInput.style.width = '100%';
    titelInput.style.padding = '10px';
    titelInput.style.borderRadius = '5px';
    titelInput.style.border = '1px solid #ddd';

    titelSection.appendChild(titelLabel);
    titelSection.appendChild(titelInput);
    formContainer.appendChild(titelSection);

    // Buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '15px';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.marginTop = '25px';

    const erstellenButton = document.createElement('button');
    erstellenButton.textContent = i18n.t('buchungskarten.createEvaluation');
    erstellenButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
    erstellenButton.style.color = 'white';
    erstellenButton.style.border = 'none';
    erstellenButton.style.borderRadius = '8px';
    erstellenButton.style.padding = '12px 30px';
    erstellenButton.style.fontSize = '16px';
    erstellenButton.style.fontWeight = 'bold';
    erstellenButton.style.cursor = 'pointer';
    erstellenButton.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
    erstellenButton.style.transition = 'all 0.3s ease';
    erstellenButton.onclick = createUebersichtsKarte;

    const ladeButton = document.createElement('button');
    ladeButton.textContent = i18n.t('buchungskarten.loadExistingEvaluations');
    ladeButton.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
    ladeButton.style.color = 'white';
    ladeButton.style.border = 'none';
    ladeButton.style.borderRadius = '8px';
    ladeButton.style.padding = '12px 30px';
    ladeButton.style.fontSize = '16px';
    ladeButton.style.fontWeight = 'bold';
    ladeButton.style.cursor = 'pointer';
    ladeButton.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
    ladeButton.style.transition = 'all 0.3s ease';
    ladeButton.onclick = loadExistingAuswertungen;

    // Hover-Effekte
    erstellenButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
    });

    erstellenButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
    });

    ladeButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.4)';
    });

    ladeButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
    });

    buttonContainer.appendChild(erstellenButton);
    buttonContainer.appendChild(ladeButton);
    formContainer.appendChild(buttonContainer);

    buchungskartenContent.appendChild(formContainer);

    // Container für Auswertungs-Ergebnisse
    const resultContainer = document.createElement('div');
    resultContainer.id = 'auswertungResultContainer';
    resultContainer.style.maxWidth = '1200px';
    resultContainer.style.margin = '0 auto';
    buchungskartenContent.appendChild(resultContainer);

    // Event Listener für Zeitraum-Typ Änderung
    zeitraumSelect.addEventListener('change', updateDateInputs);
    
    // Initialisierung der Datum-Inputs
    updateDateInputs();
}

function updateDateInputs(): void {
    const zeitraumSelect = document.getElementById('zeitraumSelect') as HTMLSelectElement;
    const datumVonInput = document.getElementById('datumVonInput') as HTMLInputElement;
    const datumBisInput = document.getElementById('datumBisInput') as HTMLInputElement;
    
    const heute = new Date();
    const zeitraumTyp = zeitraumSelect.value;
    
    switch (zeitraumTyp) {
        case 'TAG':
            datumVonInput.value = heute.toISOString().split('T')[0];
            datumBisInput.value = heute.toISOString().split('T')[0];
            break;
        case 'WOCHE':
            const wochenStart = new Date(heute);
            wochenStart.setDate(heute.getDate() - heute.getDay() + 1); // Montag
            const wochenEnde = new Date(wochenStart);
            wochenEnde.setDate(wochenStart.getDate() + 6); // Sonntag
            datumVonInput.value = wochenStart.toISOString().split('T')[0];
            datumBisInput.value = wochenEnde.toISOString().split('T')[0];
            break;
        case 'MONAT':
            const monatsStart = new Date(heute.getFullYear(), heute.getMonth(), 1);
            const monatsEnde = new Date(heute.getFullYear(), heute.getMonth() + 1, 0);
            datumVonInput.value = monatsStart.toISOString().split('T')[0];
            datumBisInput.value = monatsEnde.toISOString().split('T')[0];
            break;
        case 'QUARTAL':
            const quartal = Math.floor(heute.getMonth() / 3);
            const quartalStart = new Date(heute.getFullYear(), quartal * 3, 1);
            const quartalEnde = new Date(heute.getFullYear(), quartal * 3 + 3, 0);
            datumVonInput.value = quartalStart.toISOString().split('T')[0];
            datumBisInput.value = quartalEnde.toISOString().split('T')[0];
            break;
        case 'JAHR':
            const jahresStart = new Date(heute.getFullYear(), 0, 1);
            const jahresEnde = new Date(heute.getFullYear(), 11, 31);
            datumVonInput.value = jahresStart.toISOString().split('T')[0];
            datumBisInput.value = jahresEnde.toISOString().split('T')[0];
            break;
        case 'BENUTZERDEFINIERT':
            // Lasse die Inputs leer für benutzerdefinierte Eingabe
            break;
    }
}

function createUebersichtsKarte(): void {
    const zeitraumSelect = document.getElementById('zeitraumSelect') as HTMLSelectElement;
    const datumVonInput = document.getElementById('datumVonInput') as HTMLInputElement;
    const datumBisInput = document.getElementById('datumBisInput') as HTMLInputElement;
    const titelInput = document.getElementById('titelInput') as HTMLInputElement;
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }

    // Validierung
    if (!datumVonInput.value || !datumBisInput.value) {
        alert(i18n.t('buchungskarten.pleaseEnterDates'));
        return;
    }

    if (new Date(datumVonInput.value) > new Date(datumBisInput.value)) {
        alert('Das Startdatum muss vor dem Enddatum liegen.');
        return;
    }

    // Button deaktivieren während der Verarbeitung
    const erstellenButton = document.querySelector('button') as HTMLButtonElement;
    const originalText = erstellenButton.textContent;
    erstellenButton.textContent = 'Erstelle Auswertung...';
    erstellenButton.disabled = true;

    // API-Anfrage
    const requestData = {
        datumVon: datumVonInput.value,
        datumBis: datumBisInput.value,
        zeitraumTyp: zeitraumSelect.value,
        titel: titelInput.value || null
    };

    fetch('/uebersichtskarten', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Erstellen der Auswertung');
        }
        return response.json();
    })
    .then((uebersichtsKarte: UebersichtsKarte) => {
        displayUebersichtsKarte(uebersichtsKarte);
        
        // Formular zurücksetzen
        titelInput.value = '';
        updateDateInputs();
    })
    .catch(error => {
        console.error('Fehler beim Erstellen der Auswertung:', error);
        alert(i18n.t('buchungskarten.errorCreatingEvaluation') + ': ' + error.message);
    })
    .finally(() => {
        // Button wieder aktivieren
        erstellenButton.textContent = originalText;
        erstellenButton.disabled = false;
    });
}

function loadExistingAuswertungen(): void {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }
    
    fetch('/uebersichtskarten', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Auswertungen');
        }
        return response.json();
    })
    .then((auswertungen: UebersichtsKarte[]) => {
        displayAuswertungenListe(auswertungen);
    })
    .catch(error => {
        console.error('Fehler beim Laden der Auswertungen:', error);
        alert(i18n.t('buchungskarten.errorLoadingEvaluations') + ': ' + error.message);
    });
}

function displayUebersichtsKarte(uebersichtsKarte: UebersichtsKarte): void {
    const resultContainer = document.getElementById('auswertungResultContainer') as HTMLElement;
    resultContainer.innerHTML = '';

    // Auswertungs-Karte
    const karteContainer = document.createElement('div');
    karteContainer.className = 'evaluation-card';

    // Titel
    const titel = document.createElement('h3');
    titel.textContent = uebersichtsKarte.titel;
    titel.className = 'evaluation-title';
    karteContainer.appendChild(titel);

    // Zeitraum-Info
    const zeitraumInfo = document.createElement('div');
    zeitraumInfo.className = 'zeitraum-info';
    zeitraumInfo.innerHTML = `
        <strong>${i18n.t('buchungskarten.period')}</strong> ${uebersichtsKarte.datumVon} ${i18n.t('buchungskarten.to')} ${uebersichtsKarte.datumBis}<br>
        <strong>${i18n.t('buchungskarten.type')}</strong> ${uebersichtsKarte.zeitraumTyp}
    `;
    karteContainer.appendChild(zeitraumInfo);

    // Statistiken-Container
    const statistikContainer = document.createElement('div');
    statistikContainer.className = 'statistik-container';

    // Einnahmen-Karte
    const einnahmenKarte = createStatistikKarte(
        i18n.t('buchungskarten.income'),
        `€ ${uebersichtsKarte.gesamtEinnahmen.toFixed(2)}`,
        `${uebersichtsKarte.anzahlEinnahmen} ${i18n.t('buchungskarten.bookings')}`,
        'statistik-einnahmen'
    );
    statistikContainer.appendChild(einnahmenKarte);

    // Ausgaben-Karte
    const ausgabenKarte = createStatistikKarte(
        i18n.t('buchungskarten.expenses'),
        `€ ${uebersichtsKarte.gesamtAusgaben.toFixed(2)}`,
        `${uebersichtsKarte.anzahlAusgaben} ${i18n.t('buchungskarten.bookings')}`,
        'statistik-ausgaben'
    );
    statistikContainer.appendChild(ausgabenKarte);

    // Saldo-Karte
    const saldoFarbe = uebersichtsKarte.saldo >= 0 ? 
        'statistik-saldo-positive' : 
        'statistik-saldo-negative';
    
    const saldoKarte = createStatistikKarte(
        i18n.t('buchungskarten.balance'),
        `€ ${uebersichtsKarte.saldo.toFixed(2)}`,
        `${uebersichtsKarte.anzahlBuchungen} ${i18n.t('buchungskarten.totalBookings')}`,
        saldoFarbe
    );
    statistikContainer.appendChild(saldoKarte);

    // VAT-Karten hinzufügen, falls USt-Daten vorhanden
    if (uebersichtsKarte.ausgangsUst !== undefined || uebersichtsKarte.eingangsUst !== undefined) {
        // Ausgangs-USt-Karte
        const ausgangsUstKarte = createStatistikKarte(
            i18n.t('buchungskarten.outgoingVat'),
            `€ ${(uebersichtsKarte.ausgangsUst || 0).toFixed(2)}`,
            i18n.t('buchungskarten.vatFromIncome'),
            'statistik-ausgangs-ust'
        );
        statistikContainer.appendChild(ausgangsUstKarte);

        // Eingangs-USt-Karte
        const eingangsUstKarte = createStatistikKarte(
            i18n.t('buchungskarten.incomingVat'),
            `€ ${(uebersichtsKarte.eingangsUst || 0).toFixed(2)}`,
            i18n.t('buchungskarten.vatFromExpenses'),
            'statistik-eingangs-ust'
        );
        statistikContainer.appendChild(eingangsUstKarte);

        // USt-Saldo-Karte
        const ustSaldo = uebersichtsKarte.ustSaldo || 0;
        const ustSaldoFarbe = ustSaldo >= 0 ? 
            'statistik-ust-saldo-positive' : 
            'statistik-ust-saldo-negative';
        
        const ustSaldoKarte = createStatistikKarte(
            i18n.t('buchungskarten.vatBalance'),
            `€ ${ustSaldo.toFixed(2)}`,
            ustSaldo >= 0 ? i18n.t('buchungskarten.taxPayable') : i18n.t('buchungskarten.taxRefundable'),
            ustSaldoFarbe
        );
        statistikContainer.appendChild(ustSaldoKarte);
    }

    karteContainer.appendChild(statistikContainer);
    
    // "List Buchungen" Button
    const listButtonContainer = document.createElement('div');
    listButtonContainer.style.textAlign = 'center';
    listButtonContainer.style.marginTop = '25px';
    
    const listBuchungenButton = document.createElement('button');
    listBuchungenButton.textContent = i18n.t('buchungskarten.listBookings');
    listBuchungenButton.style.background = 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)';
    listBuchungenButton.style.color = 'white';
    listBuchungenButton.style.border = 'none';
    listBuchungenButton.style.borderRadius = '8px';
    listBuchungenButton.style.padding = '12px 25px';
    listBuchungenButton.style.fontSize = '16px';
    listBuchungenButton.style.fontWeight = 'bold';
    listBuchungenButton.style.cursor = 'pointer';
    listBuchungenButton.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
    listBuchungenButton.style.transition = 'all 0.3s ease';
    
    // Button Icon
    const buttonIcon = document.createElement('span');
    buttonIcon.id = 'listBuchungenIcon';
    buttonIcon.textContent = '▼';
    buttonIcon.style.marginLeft = '8px';
    buttonIcon.style.fontSize = '12px';
    buttonIcon.style.transition = 'transform 0.3s ease';
    listBuchungenButton.appendChild(buttonIcon);
    
    // Hover-Effekt
    listBuchungenButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.4)';
    });
    
    listBuchungenButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
    });
    
    // Click-Event für Expandable View
    listBuchungenButton.addEventListener('click', () => {
        toggleBuchungenListe(uebersichtsKarte);
    });
    
    listButtonContainer.appendChild(listBuchungenButton);
    karteContainer.appendChild(listButtonContainer);
    
    // Container für expandierbare Buchungsliste
    const buchungenListContainer = document.createElement('div');
    buchungenListContainer.id = 'buchungenListContainer';
    buchungenListContainer.style.display = 'none';
    buchungenListContainer.style.marginTop = '20px';
    buchungenListContainer.style.padding = '20px';
    buchungenListContainer.style.backgroundColor = '#f8f9fa';
    buchungenListContainer.style.borderRadius = '8px';
    buchungenListContainer.style.border = '1px solid #e9ecef';
    buchungenListContainer.style.transition = 'all 0.3s ease';
    
    karteContainer.appendChild(buchungenListContainer);
    resultContainer.appendChild(karteContainer);
}

function createStatistikKarte(titel: string, wert: string, zusatz: string, colorClass: string): HTMLElement {
    const karte = document.createElement('div');
    karte.className = `statistik-card ${colorClass}`;

    const titelElement = document.createElement('h4');
    titelElement.textContent = titel;

    const wertElement = document.createElement('div');
    wertElement.textContent = wert;
    wertElement.className = 'value';

    const zusatzElement = document.createElement('div');
    zusatzElement.textContent = zusatz;
    zusatzElement.className = 'additional';

    karte.appendChild(titelElement);
    karte.appendChild(wertElement);
    karte.appendChild(zusatzElement);

    return karte;
}

function displayAuswertungenListe(auswertungen: UebersichtsKarte[]): void {
    const resultContainer = document.getElementById('auswertungResultContainer') as HTMLElement;
    resultContainer.innerHTML = '';

    if (auswertungen.length === 0) {
        const noDataMessage = document.createElement('div');
        noDataMessage.textContent = i18n.t('buchungskarten.noEvaluationsFound');
        noDataMessage.style.textAlign = 'center';
        noDataMessage.style.padding = '20px';
        noDataMessage.style.color = '#6c757d';
        noDataMessage.style.fontStyle = 'italic';
        resultContainer.appendChild(noDataMessage);
        return;
    }

    // Titel für die Liste
    const listTitle = document.createElement('h3');
    listTitle.textContent = i18n.t('buchungskarten.existingEvaluations');
    listTitle.style.marginBottom = '20px';
    listTitle.style.color = '#2c3e50';
    listTitle.style.textAlign = 'center';
    resultContainer.appendChild(listTitle);

    // Liste der Auswertungen
    auswertungen.forEach(auswertung => {
        const auswertungElement = document.createElement('div');
        auswertungElement.style.backgroundColor = '#fff';
        auswertungElement.style.borderRadius = '8px';
        auswertungElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        auswertungElement.style.padding = '20px';
        auswertungElement.style.marginBottom = '15px';
        auswertungElement.style.border = '1px solid #e9ecef';
        auswertungElement.style.cursor = 'pointer';
        auswertungElement.style.transition = 'all 0.3s ease';

        auswertungElement.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });

        auswertungElement.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        });

        auswertungElement.addEventListener('click', () => {
            displayUebersichtsKarte(auswertung);
        });

        auswertungElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 8px 0; color: #2c3e50;">${auswertung.titel}</h4>
                    <p style="margin: 0; color: #6c757d;">
                        ${auswertung.datumVon} - ${auswertung.datumBis} | 
                        Saldo: <span style="color: ${auswertung.saldo >= 0 ? '#4CAF50' : '#f44336'}; font-weight: bold;">
                            €${auswertung.saldo.toFixed(2)}
                        </span>
                    </p>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px;">
                    <div style="text-align: right; color: #6c757d; font-size: 14px;">
                        ${auswertung.anzahlBuchungen} ${i18n.t('buchungskarten.bookings')}<br>
                        ${new Date(auswertung.erstellt).toLocaleDateString('de-DE')}
                    </div>
                    <div class="btn-group">
                        <button class="pdf-report-button btn-pdf" data-auswertung-id="${auswertung.id}">
                            📄 ${i18n.t('buchungskarten.pdfReport')}
                        </button>
                        <button class="delete-evaluation-button btn-delete" data-auswertung-id="${auswertung.id}">
                            🗑️ ${i18n.t('buchungskarten.delete')}
                        </button>
                    </div>
                </div>
            </div>
        `;

        resultContainer.appendChild(auswertungElement);
        
        // Add event listeners after the element is added to DOM
        const pdfButton = auswertungElement.querySelector('.pdf-report-button') as HTMLButtonElement;
        if (pdfButton) {
            pdfButton.addEventListener('click', (e) => {
                e.stopPropagation();
                generatePdfReport(auswertung);
            });
        }
        
        const deleteButton = auswertungElement.querySelector('.delete-evaluation-button') as HTMLButtonElement;
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteEvaluation(auswertung.id);
            });
        }
    });
}

function generatePdfReport(auswertung: UebersichtsKarte): void {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }
    
    // Loading-Anzeige
    const loadingNotification = document.createElement('div');
    loadingNotification.id = 'pdfLoadingNotification';
    loadingNotification.style.position = 'fixed';
    loadingNotification.style.top = '20px';
    loadingNotification.style.right = '20px';
    loadingNotification.style.backgroundColor = '#17a2b8';
    loadingNotification.style.color = 'white';
    loadingNotification.style.padding = '15px 20px';
    loadingNotification.style.borderRadius = '8px';
    loadingNotification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    loadingNotification.style.zIndex = '10000';
    loadingNotification.style.fontSize = '14px';
    loadingNotification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <div>${i18n.t('buchungskarten.pdfReportCreating')}</div>
        </div>
    `;
    
    // CSS für Spinner-Animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(loadingNotification);
    
    // Lade Buchungen für den Zeitraum
    fetch(`/buchungskarten/zeitraum?datumVon=${auswertung.datumVon}&datumBis=${auswertung.datumBis}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then((buchungen: any[]) => {
        // Sortiere Buchungen nach Datum absteigend
        const sortedBuchungen = buchungen.sort((a, b) => {
            return new Date(b.datum).getTime() - new Date(a.datum).getTime();
        });
        
        // Erstelle PDF
        createPdfReport(auswertung, sortedBuchungen);
    })
    .catch(error => {
        console.error('Fehler beim Laden der Buchungen für PDF:', error);
        alert(i18n.t('buchungskarten.errorLoadingBookings') + error.message);
    })
    .finally(() => {
        // Entferne Loading-Anzeige
        const notification = document.getElementById('pdfLoadingNotification');
        if (notification) {
            safeRemoveElement(notification);
        }
        document.head.removeChild(style);
    });
}

function createPdfReport(auswertung: UebersichtsKarte, buchungen: any[]): void {
    // Da jsPDF nicht direkt verfügbar ist, erstellen wir einen HTML-basierten PDF-Report
    // der über das Browser-Drucksystem zu PDF konvertiert werden kann
    
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
        alert(i18n.t('buchungskarten.popupBlocker'));
        return;
    }
    
    // Berechne Statistiken
    const einnahmen = buchungen.filter(b => b.buchungsart.name === 'EINNAHME');
    const ausgaben = buchungen.filter(b => b.buchungsart.name === 'AUSGABE');
    const gesamtEinnahmen = einnahmen.reduce((sum, b) => sum + b.betrag, 0);
    const gesamtAusgaben = ausgaben.reduce((sum, b) => sum + b.betrag, 0);
    
    // VAT-Berechnungen
    const ausgangsUst = einnahmen.reduce((sum, b) => sum + (b.ustBetrag || 0), 0);
    const eingangsUst = ausgaben.reduce((sum, b) => sum + (b.ustBetrag || 0), 0);
    const ustSaldo = ausgangsUst - eingangsUst;
    
    // Extract translations for use in PDF template
    const translations = {
        evaluationReport: i18n.t('buchungskarten.evaluationReport'),
        periodLabel: i18n.t('buchungskarten.periodLabel'),
        createdOn: i18n.t('buchungskarten.createdOn'),
        income: i18n.t('buchungskarten.income'),
        expenses: i18n.t('buchungskarten.expenses'),
        balance: i18n.t('buchungskarten.balance'),
        bookings: i18n.t('buchungskarten.bookings'),
        bookingsTotal: i18n.t('buchungskarten.bookingsTotal'),
        outgoingVat: i18n.t('buchungskarten.outgoingVat'),
        incomingVat: i18n.t('buchungskarten.incomingVat'),
        vatBalance: i18n.t('buchungskarten.vatBalance'),
        vatFromIncome: i18n.t('buchungskarten.vatFromIncome'),
        vatFromExpenses: i18n.t('buchungskarten.vatFromExpenses'),
        taxPayable: i18n.t('buchungskarten.taxPayable'),
        taxRefundable: i18n.t('buchungskarten.taxRefundable'),
        bookingsDescending: i18n.t('buchungskarten.bookingsDescending'),
        autoGenerated: i18n.t('buchungskarten.autoGenerated'),
        status: i18n.t('buchungskarten.status'),
        pdfTableHeaders: {
            date: i18n.t('buchungskarten.pdfTableHeaders.date'),
            type: i18n.t('buchungskarten.pdfTableHeaders.type'),
            category: i18n.t('buchungskarten.pdfTableHeaders.category'),
            description: i18n.t('buchungskarten.pdfTableHeaders.description'),
            amount: i18n.t('buchungskarten.pdfTableHeaders.amount'),
            receiptNumber: i18n.t('buchungskarten.pdfTableHeaders.receiptNumber'),
            vatRate: i18n.t('buchungskarten.pdfTableHeaders.vatRate'),
            vatAmount: i18n.t('buchungskarten.pdfTableHeaders.vatAmount'),
            document: i18n.t('buchungskarten.pdfTableHeaders.document')
        },
        // Enum translations for table content
        buchungsArt: {
            EINNAHME: i18n.t('buchungskarten.buchungsArt.EINNAHME'),
            AUSGABE: i18n.t('buchungskarten.buchungsArt.AUSGABE')
        },
        buchungsKategorie: {
            VERKAUF: i18n.t('buchungskarten.buchungsKategorie.VERKAUF'),
            DIENSTLEISTUNG: i18n.t('buchungskarten.buchungsKategorie.DIENSTLEISTUNG'),
            ZINSEN: i18n.t('buchungskarten.buchungsKategorie.ZINSEN'),
            SONSTIGE_EINNAHMEN: i18n.t('buchungskarten.buchungsKategorie.SONSTIGE_EINNAHMEN'),
            BUEROKOSTEN: i18n.t('buchungskarten.buchungsKategorie.BUEROKOSTEN'),
            REISEKOSTEN: i18n.t('buchungskarten.buchungsKategorie.REISEKOSTEN'),
            MARKETING: i18n.t('buchungskarten.buchungsKategorie.MARKETING'),
            MIETE: i18n.t('buchungskarten.buchungsKategorie.MIETE'),
            STROM: i18n.t('buchungskarten.buchungsKategorie.STROM'),
            TELEFON: i18n.t('buchungskarten.buchungsKategorie.TELEFON'),
            VERSICHERUNG: i18n.t('buchungskarten.buchungsKategorie.VERSICHERUNG'),
            SONSTIGE_AUSGABEN: i18n.t('buchungskarten.buchungsKategorie.SONSTIGE_AUSGABEN')
        }
    };
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${translations.evaluationReport} - ${auswertung.titel}</title>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #333;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #4CAF50;
                    padding-bottom: 20px;
                }
                .header h1 {
                    color: #2c3e50;
                    margin: 0;
                    font-size: 28px;
                }
                .header p {
                    color: #6c757d;
                    margin: 10px 0 0 0;
                    font-size: 16px;
                }
                .summary {
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 30px;
                    text-align: center;
                }
                .summary-item {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #dee2e6;
                    min-width: 150px;
                }
                .summary-item h3 {
                    margin: 0 0 10px 0;
                    color: #495057;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .summary-item .amount {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 0;
                }
                .summary-item .count {
                    color: #6c757d;
                    font-size: 14px;
                    margin: 5px 0 0 0;
                }
                .einnahmen { color: #28a745; }
                .ausgaben { color: #dc3545; }
                .saldo { color: ${auswertung.saldo >= 0 ? '#28a745' : '#dc3545'}; }
                
                .buchungen-section {
                    margin-top: 30px;
                }
                .buchungen-section h2 {
                    color: #2c3e50;
                    border-bottom: 1px solid #dee2e6;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 12px;
                }
                th, td {
                    border: 1px solid #dee2e6;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background: #f8f9fa;
                    font-weight: bold;
                    color: #495057;
                }
                tr:nth-child(even) {
                    background: #f8f9fa;
                }
                .einnahme-row {
                    background: rgba(40, 167, 69, 0.1);
                }
                .ausgabe-row {
                    background: rgba(220, 53, 69, 0.1);
                }
                .betrag {
                    text-align: right;
                    font-weight: bold;
                }
                .datum {
                    width: 80px;
                }
                .beschreibung {
                    max-width: 200px;
                    word-wrap: break-word;
                }
                
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #6c757d;
                    font-size: 12px;
                    border-top: 1px solid #dee2e6;
                    padding-top: 20px;
                }
                
                @media print {
                    body {
                        margin: 0;
                        padding: 15px;
                    }
                    .header h1 {
                        font-size: 22px;
                    }
                    .summary-item .amount {
                        font-size: 18px;
                    }
                    table {
                        font-size: 10px;
                    }
                    th, td {
                        padding: 6px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${translations.evaluationReport}</h1>
                <p>${auswertung.titel}</p>
                <p>${translations.periodLabel} ${auswertung.datumVon} - ${auswertung.datumBis}</p>
                <p>${translations.createdOn} ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}</p>
            </div>
            
            <div class="summary">
                <div class="summary-item">
                    <h3>${translations.income}</h3>
                    <p class="amount einnahmen">€${gesamtEinnahmen.toFixed(2)}</p>
                    <p class="count">${einnahmen.length} ${translations.bookings}</p>
                </div>
                <div class="summary-item">
                    <h3>${translations.expenses}</h3>
                    <p class="amount ausgaben">€${gesamtAusgaben.toFixed(2)}</p>
                    <p class="count">${ausgaben.length} ${translations.bookings}</p>
                </div>
                <div class="summary-item">
                    <h3>${translations.balance}</h3>
                    <p class="amount saldo">€${auswertung.saldo.toFixed(2)}</p>
                    <p class="count">${buchungen.length} ${translations.bookingsTotal}</p>
                </div>
            </div>
            
            ${(ausgangsUst > 0 || eingangsUst > 0) ? `
            <div class="summary" style="margin-top: 20px;">
                <div class="summary-item">
                    <h3>${translations.outgoingVat}</h3>
                    <p class="amount" style="color: #9C27B0;">€${ausgangsUst.toFixed(2)}</p>
                    <p class="count">${translations.vatFromIncome}</p>
                </div>
                <div class="summary-item">
                    <h3>${translations.incomingVat}</h3>
                    <p class="amount" style="color: #FF9800;">€${eingangsUst.toFixed(2)}</p>
                    <p class="count">${translations.vatFromExpenses}</p>
                </div>
                <div class="summary-item">
                    <h3>${translations.vatBalance}</h3>
                    <p class="amount" style="color: ${ustSaldo >= 0 ? '#3F51B5' : '#E91E63'};">€${ustSaldo.toFixed(2)}</p>
                    <p class="count">${ustSaldo >= 0 ? translations.taxPayable : translations.taxRefundable}</p>
                </div>
            </div>
            ` : ''}
            
            <div class="buchungen-section">
                <h2>${translations.bookingsDescending}</h2>
                <table>
                    <thead>
                        <tr>
                            <th class="datum">${translations.pdfTableHeaders.date}</th>
                            <th>${translations.pdfTableHeaders.type}</th>
                            <th>${translations.pdfTableHeaders.category}</th>
                            <th class="beschreibung">${translations.pdfTableHeaders.description}</th>
                            <th class="betrag">${translations.pdfTableHeaders.amount}</th>
                            <th>${translations.pdfTableHeaders.receiptNumber}</th>
                            <th>${translations.pdfTableHeaders.vatRate}</th>
                            <th>${translations.pdfTableHeaders.vatAmount}</th>
                            <th>${translations.pdfTableHeaders.document}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${buchungen.map(buchung => `
                            <tr class="${buchung.buchungsart.name === 'EINNAHME' ? 'einnahme-row' : 'ausgabe-row'}">
                                <td class="datum">${new Date(buchung.datum).toLocaleDateString('de-DE')}</td>
                                <td>${(translations.buchungsArt as any)[buchung.buchungsart.name] || buchung.buchungsart.name}</td>
                                <td>${(translations.buchungsKategorie as any)[buchung.kategorie.name] || buchung.kategorie.name}</td>
                                <td class="beschreibung">${buchung.beschreibung}</td>
                                <td class="betrag ${buchung.buchungsart.name === 'EINNAHME' ? 'einnahmen' : 'ausgaben'}">€${buchung.betrag.toFixed(2)}</td>
                                <td>${buchung.belegnummer || '-'}</td>
                                <td>${buchung.ustSatz ? buchung.ustSatz.toFixed(2) + '%' : '-'}</td>
                                <td>${buchung.ustBetrag ? '€' + buchung.ustBetrag.toFixed(2) : '-'}</td>
                                <td>${buchung.dokument.originalName}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="footer">
                <p>${translations.autoGenerated}</p>
                <p>${translations.status} ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}</p>
            </div>
            
            <script>
                // Automatisch Druckdialog öffnen
                window.addEventListener('load', function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                });
                
                // Fenster nach dem Drucken schließen
                window.addEventListener('afterprint', function() {
                    setTimeout(function() {
                        window.close();
                    }, 1000);
                });
            </script>
        </body>
        </html>
    `;
    
    reportWindow.document.write(html);
    reportWindow.document.close();
}

function extractPdfText(file: File): void {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }
    
    // Zeige Loading-Indikator
    const beschreibungInput = document.getElementById('beschreibungInput') as HTMLTextAreaElement;
    const originalPlaceholder = beschreibungInput.placeholder;
    beschreibungInput.placeholder = 'Extrahiere Text aus PDF...';
    beschreibungInput.disabled = true;
    
    // Sende PDF direkt als Binary-Stream an Backend für Textextraktion
    fetch('/extract-pdf-text', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/pdf'
        },
        body: file
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        // Setze extrahierten Text in das Beschreibungsfeld
        if (data.text && data.text.trim()) {
            // Verwende den extrahierten Text direkt ohne Bereinigung
            let cleanText = data.text.trim();
            
            // Kürze auf 2000 Zeichen für bessere Übersicht (aber mehr Text als vorher)
            if (cleanText.length > 2000) {
                cleanText = cleanText.substring(0, 2000) + '...';
            }
            
            beschreibungInput.value = cleanText;
            
            // Zeige Erfolgsnotification
            showPdfExtractionNotification(true, 'PDF-Text erfolgreich extrahiert');
        } else {
            showPdfExtractionNotification(false, 'Kein Text im PDF gefunden');
        }
    })
    .catch(error => {
        console.error('Fehler bei PDF-Textextraktion:', error);
        showPdfExtractionNotification(false, 'Fehler bei der Textextraktion: ' + error.message);
    })
    .finally(() => {
        // Restore original state
        beschreibungInput.placeholder = originalPlaceholder;
        beschreibungInput.disabled = false;
    });
}

function showPdfExtractionNotification(success: boolean, message: string): void {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = success ? '#4CAF50' : '#ff9800';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '10000';
    notification.style.fontSize = '14px';
    notification.style.maxWidth = '300px';
    notification.style.transition = 'opacity 0.3s ease';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>${success ? '📄' : '⚠️'}</span>
            <div>${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Automatisch nach 4 Sekunden ausblenden
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            safeRemoveElement(notification);
        }, 300);
    }, 4000);
}

function toggleBuchungenListe(uebersichtsKarte: UebersichtsKarte): void {
    const buchungenListContainer = document.getElementById('buchungenListContainer') as HTMLElement;
    const buttonIcon = document.getElementById('listBuchungenIcon') as HTMLElement;
    
    if (buchungenListContainer.style.display === 'none') {
        // Expandieren: Liste laden und anzeigen
        loadBuchungenForPeriod(uebersichtsKarte);
        buchungenListContainer.style.display = 'block';
        buttonIcon.textContent = '▲';
        buttonIcon.style.transform = 'rotate(180deg)';
    } else {
        // Kollabieren: Liste ausblenden
        buchungenListContainer.style.display = 'none';
        buttonIcon.textContent = '▼';
        buttonIcon.style.transform = 'rotate(0deg)';
    }
}

function loadBuchungenForPeriod(uebersichtsKarte: UebersichtsKarte): void {
    const buchungenListContainer = document.getElementById('buchungenListContainer') as HTMLElement;
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        buchungenListContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Keine Authentifizierung gefunden. Bitte melden Sie sich an.</div>';
        return;
    }
    
    // Loading-Anzeige
    buchungenListContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">Lade Buchungen...</div>';
    
    // API-Aufruf mit Datumsbereich
    fetch(`/buchungskarten/zeitraum?datumVon=${uebersichtsKarte.datumVon}&datumBis=${uebersichtsKarte.datumBis}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Buchungen');
        }
        return response.json();
    })
    .then((buchungen: any[]) => {
        displayBuchungenInExpandableView(buchungen, uebersichtsKarte);
    })
    .catch(error => {
        console.error('Fehler beim Laden der Buchungen:', error);
        buchungenListContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">Fehler beim Laden der Buchungen: ' + error.message + '</div>';
    });
}

function displayBuchungenInExpandableView(buchungen: any[], uebersichtsKarte: UebersichtsKarte): void {
    const buchungenListContainer = document.getElementById('buchungenListContainer') as HTMLElement;
    buchungenListContainer.innerHTML = '';
    
    if (buchungen.length === 0) {
        buchungenListContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: #6c757d; font-style: italic;">${i18n.t('buchungskarten.noBookingsInPeriod')}</div>`;
        return;
    }
    
    // Titel für die Buchungsliste
    const listTitle = document.createElement('h4');
    listTitle.textContent = `${i18n.t('buchungskarten.bookingsForCard')} ${uebersichtsKarte.titel}`;
    listTitle.style.marginBottom = '15px';
    listTitle.style.color = '#2c3e50';
    listTitle.style.textAlign = 'center';
    listTitle.style.borderBottom = '2px solid #4CAF50';
    listTitle.style.paddingBottom = '8px';
    buchungenListContainer.appendChild(listTitle);
    
    // Zusammenfassung
    const summary = document.createElement('div');
    summary.style.marginBottom = '20px';
    summary.style.padding = '10px';
    summary.style.backgroundColor = '#e8f5e8';
    summary.style.borderRadius = '6px';
    summary.style.border = '1px solid #81c784';
    summary.style.textAlign = 'center';
    summary.style.fontSize = '14px';
    summary.style.color = '#2e7d32';
    summary.innerHTML = `
        <strong>${buchungen.length} ${i18n.t('buchungskarten.bookings')}</strong> ${i18n.t('buchungskarten.from')} ${uebersichtsKarte.datumVon} ${i18n.t('buchungskarten.to')} ${uebersichtsKarte.datumBis}
    `;
    buchungenListContainer.appendChild(summary);
    
    // Scrollbare Container für die Buchungen
    const scrollContainer = document.createElement('div');
    scrollContainer.style.maxHeight = '400px';
    scrollContainer.style.overflowY = 'auto';
    scrollContainer.style.border = '1px solid #dee2e6';
    scrollContainer.style.borderRadius = '6px';
    scrollContainer.style.backgroundColor = '#fff';
    
    // Buchungen nach Datum sortieren (neueste zuerst)
    const sortedBuchungen = buchungen.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
    
    // Buchungen anzeigen
    sortedBuchungen.forEach((buchung, index) => {
        const buchungElement = document.createElement('div');
        buchungElement.style.padding = '12px 15px';
        buchungElement.style.borderBottom = index < sortedBuchungen.length - 1 ? '1px solid #f0f0f0' : 'none';
        buchungElement.style.transition = 'background-color 0.2s ease';
        buchungElement.style.cursor = 'pointer';
        
        // Hover-Effekt
        buchungElement.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
        
        buchungElement.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#fff';
        });
        
        // Click-Event für Dokument-Anzeige
        buchungElement.addEventListener('click', () => {
            handleDokumentClick(buchung.dokument);
        });
        
        // Buchungsart-Farbe bestimmen
        const isEinnahme = buchung.buchungsart.name === 'EINNAHME';
        const artFarbe = isEinnahme ? '#4CAF50' : '#f44336';
        const artIcon = isEinnahme ? '↗' : '↘';
        
        buchungElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <span style="color: ${artFarbe}; font-size: 16px; margin-right: 5px;">${artIcon}</span>
                        <strong style="color: #2c3e50; font-size: 16px;">${buchung.beschreibung}</strong>
                    </div>
                    <div style="font-size: 13px; color: #6c757d; margin-bottom: 3px;">
                        <span style="color: #7c3aed; font-weight: 500;">${buchung.kategorie.name}</span>
                        ${buchung.belegnummer ? ` • ${i18n.t('buchungskarten.receipt')} ${buchung.belegnummer}` : ''}
                    </div>
                    <div style="font-size: 12px; color: #9ca3af;">
                        ${i18n.t('buchungskarten.document')} <span style="color: #0891b2; text-decoration: underline;">${buchung.dokument.originalName}</span>
                        ${buchung.image ? ` • ${i18n.t('buchungskarten.image')} ${buchung.image.name}` : ''}
                        <br><small style="color: #9ca3af;">🖱️ ${i18n.t('buchungskarten.clickFor')} ${buchung.dokument.dateityp.toLowerCase().includes('pdf') ? i18n.t('buchungskarten.pdfView') : i18n.t('buchungskarten.download')}</small>
                    </div>
                </div>
                <div style="text-align: right; min-width: 120px;">
                    <div style="color: ${artFarbe}; font-weight: bold; font-size: 16px; margin-bottom: 3px;">
                        ${isEinnahme ? '+' : '-'}€${buchung.betrag.toFixed(2)}
                    </div>
                    <div style="font-size: 12px; color: #6c757d;">
                        ${new Date(buchung.datum).toLocaleDateString('de-DE')}
                    </div>
                </div>
            </div>
        `;
        
        scrollContainer.appendChild(buchungElement);
    });
    
    buchungenListContainer.appendChild(scrollContainer);
    
    // Gruppierte Statistiken nach Buchungsart
    const statsContainer = document.createElement('div');
    statsContainer.style.marginTop = '15px';
    statsContainer.style.display = 'flex';
    statsContainer.style.gap = '15px';
    statsContainer.style.justifyContent = 'center';
    
    const einnahmen = sortedBuchungen.filter(b => b.buchungsart.name === 'EINNAHME');
    const ausgaben = sortedBuchungen.filter(b => b.buchungsart.name === 'AUSGABE');
    
    if (einnahmen.length > 0) {
        const einnahmenStat = document.createElement('div');
        einnahmenStat.style.padding = '8px 15px';
        einnahmenStat.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        einnahmenStat.style.borderRadius = '6px';
        einnahmenStat.style.border = '1px solid #4CAF50';
        einnahmenStat.style.textAlign = 'center';
        einnahmenStat.style.fontSize = '13px';
        einnahmenStat.innerHTML = `
            <div style="color: #4CAF50; font-weight: bold;">${einnahmen.length} ${i18n.t('buchungskarten.income')}</div>
            <div style="color: #2e7d32;">€${einnahmen.reduce((sum, b) => sum + b.betrag, 0).toFixed(2)}</div>
        `;
        statsContainer.appendChild(einnahmenStat);
    }
    
    if (ausgaben.length > 0) {
        const ausgabenStat = document.createElement('div');
        ausgabenStat.style.padding = '8px 15px';
        ausgabenStat.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
        ausgabenStat.style.borderRadius = '6px';
        ausgabenStat.style.border = '1px solid #f44336';
        ausgabenStat.style.textAlign = 'center';
        ausgabenStat.style.fontSize = '13px';
        ausgabenStat.innerHTML = `
            <div style="color: #f44336; font-weight: bold;">${ausgaben.length} ${i18n.t('buchungskarten.expenses')}</div>
            <div style="color: #c62828;">€${ausgaben.reduce((sum, b) => sum + b.betrag, 0).toFixed(2)}</div>
        `;
        statsContainer.appendChild(ausgabenStat);
    }
    
    buchungenListContainer.appendChild(statsContainer);
}

function handleDokumentClick(dokument: any): void {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }
    
    // Validate document object
    if (!dokument || !dokument.id) {
        console.error('Invalid document object:', dokument);
        alert(i18n.t('buchungskarten.invalidDocument'));
        return;
    }
    
    // Ensure we have the original filename for display/download
    const originalName = dokument.originalName || dokument.name || 'document';
    const fileType = dokument.dateityp || 'application/octet-stream';
    
    // Prüfe ob es sich um ein PDF handelt
    const isPdf = fileType.toLowerCase().includes('pdf') || 
                  originalName.toLowerCase().endsWith('.pdf');
    
    if (isPdf) {
        // PDF inline anzeigen
        showPdfInline(dokument, authToken);
    } else {
        // Datei herunterladen
        downloadDokument(dokument, authToken);
    }
}

function showPdfInline(dokument: any, authToken: string): void {
    // Debug logging
    console.log('Opening PDF inline for document:', {
        id: dokument.id,
        name: dokument.name,
        originalName: dokument.originalName,
        dateityp: dokument.dateityp
    });
    
    // Erstelle Modal für PDF-Anzeige
    const modal = document.createElement('div');
    modal.id = 'pdfModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    
    // Modal Content Container
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.borderRadius = '10px';
    modalContent.style.width = '90%';
    modalContent.style.height = '90%';
    modalContent.style.maxWidth = '1200px';
    modalContent.style.maxHeight = '800px';
    modalContent.style.position = 'relative';
    modalContent.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    
    // Header mit Titel und Schließen-Button
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '15px 20px';
    header.style.borderBottom = '1px solid #e9ecef';
    header.style.backgroundColor = '#f8f9fa';
    header.style.borderRadius = '10px 10px 0 0';
    
    const title = document.createElement('h3');
    title.textContent = dokument.originalName || dokument.name || 'PDF Document';
    title.style.margin = '0';
    title.style.color = '#2c3e50';
    title.style.fontSize = '18px';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#6c757d';
    closeButton.style.padding = '5px 10px';
    closeButton.style.borderRadius = '5px';
    closeButton.style.transition = 'background-color 0.2s ease';
    
    closeButton.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#e9ecef';
    });
    
    closeButton.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
    });
    
    closeButton.addEventListener('click', () => {
        safeRemoveElement(modal);
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // PDF Container
    const pdfContainer = document.createElement('div');
    pdfContainer.style.width = '100%';
    pdfContainer.style.height = 'calc(100% - 70px)';
    pdfContainer.style.padding = '10px';
    pdfContainer.style.boxSizing = 'border-box';
    
    // Loading-Anzeige
    const loadingDiv = document.createElement('div');
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.padding = '40px';
    loadingDiv.style.color = '#6c757d';
    loadingDiv.innerHTML = '<div style="font-size: 18px;">Lade PDF...</div>';
    pdfContainer.appendChild(loadingDiv);
    
    // Lade PDF mit authentifiziertem Fetch
    fetch(`/dokument/${dokument.id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        console.log('PDF fetch response:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.blob();
    })
    .then(blob => {
        console.log('PDF blob received, size:', blob.size, 'type:', blob.type);
        
        // Create PDF blob with correct MIME type if needed
        const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
        
        // Erstelle Blob URL für PDF
        const blobUrl = URL.createObjectURL(pdfBlob);
        
        // Entferne Loading-Anzeige safely
        if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
        
        // PDF Embed Element
        const pdfEmbed = document.createElement('embed');
        pdfEmbed.src = blobUrl;
        pdfEmbed.type = 'application/pdf';
        pdfEmbed.style.width = '100%';
        pdfEmbed.style.height = '100%';
        pdfEmbed.style.border = 'none';
        pdfEmbed.style.borderRadius = '5px';
    
        // Fallback für Browser ohne PDF-Support
        const fallbackMessage = document.createElement('div');
        fallbackMessage.style.textAlign = 'center';
        fallbackMessage.style.padding = '40px';
        fallbackMessage.style.color = '#6c757d';
        fallbackMessage.style.display = 'none';
        fallbackMessage.innerHTML = `
            <h4>PDF kann nicht angezeigt werden</h4>
            <p>Ihr Browser unterstützt keine PDF-Anzeige.</p>
            <button onclick="downloadDokument({id: ${dokument.id}, originalName: '${dokument.originalName}'}, '${authToken}')" 
                    style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                           color: white; border: none; padding: 10px 20px; 
                           border-radius: 5px; cursor: pointer; font-size: 14px;">
                PDF herunterladen
            </button>
        `;
        
        // Error handling für PDF-Laden
        pdfEmbed.addEventListener('error', () => {
            console.log('PDF embed error - showing fallback');
            if (pdfEmbed.parentNode) {
                pdfEmbed.parentNode.removeChild(pdfEmbed);
            }
            fallbackMessage.style.display = 'block';
        });
        
        pdfContainer.appendChild(pdfEmbed);
        pdfContainer.appendChild(fallbackMessage);
        
        // Cleanup: Blob URL nach Modal-Schließung freigeben
        const cleanup = () => {
            URL.revokeObjectURL(blobUrl);
        };
        
        // Modal schließen bei Klick außerhalb
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cleanup();
                safeRemoveElement(modal);
            }
        });
        
        // ESC-Taste zum Schließen
        document.addEventListener('keydown', function escKeyHandler(e) {
            if (e.key === 'Escape') {
                cleanup();
                safeRemoveElement(modal);
                document.removeEventListener('keydown', escKeyHandler);
            }
        });
        
        // Cleanup für Close-Button
        closeButton.addEventListener('click', () => {
            cleanup();
            safeRemoveElement(modal);
        });
    })
    .catch(error => {
        console.error('Fehler beim Laden des PDFs:', error);
        
        // Entferne Loading-Anzeige safely
        if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.style.textAlign = 'center';
        errorDiv.style.padding = '40px';
        errorDiv.style.color = '#dc3545';
        errorDiv.innerHTML = `
            <h4>Fehler beim Laden des PDFs</h4>
            <p>${error.message}</p>
            <button onclick="downloadDokument({id: ${dokument.id}, originalName: '${dokument.originalName}'}, '${authToken}')" 
                    style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                           color: white; border: none; padding: 10px 20px; 
                           border-radius: 5px; cursor: pointer; font-size: 14px;">
                Stattdessen herunterladen
            </button>
        `;
        pdfContainer.appendChild(errorDiv);
    });
    
    modalContent.appendChild(header);
    modalContent.appendChild(pdfContainer);
    modal.appendChild(modalContent);
    
    // Fallback-Handler falls PDF nicht geladen werden kann
    const fallbackCloseHandler = () => {
        safeRemoveElement(modal);
    };
    
    // Modal schließen bei Klick außerhalb (Fallback)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fallbackCloseHandler();
        }
    });
    
    // ESC-Taste zum Schließen (Fallback)
    const escapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            fallbackCloseHandler();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Fallback für Close-Button
    closeButton.addEventListener('click', fallbackCloseHandler);
    
    document.body.appendChild(modal);
}

function downloadDokument(dokument: any, authToken: string): void {
    // Ensure we have a proper filename
    const downloadName = dokument.originalName || dokument.name || `document_${dokument.id}`;
    const fileType = dokument.dateityp || 'application/octet-stream';
    
    // Debug logging
    console.log('Downloading document:', {
        id: dokument.id,
        name: dokument.name,
        originalName: dokument.originalName,
        dateityp: dokument.dateityp,
        pfad: dokument.pfad
    });
    
    // Fetch mit Authentifizierung
    fetch(`/dokument/${dokument.id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        console.log('Document download response:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Check if response has proper content type
        const contentType = response.headers.get('content-type');
        console.log('Document download - Content-Type:', contentType, 'Expected:', fileType);
        
        return response.blob();
    })
    .then(blob => {
        // Create blob with proper MIME type if needed
        const properBlob = new Blob([blob], { type: fileType });
        
        // Erstelle temporären Link für Download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(properBlob);
        link.download = downloadName;
        link.style.display = 'none';
        
        // Füge Link zum DOM hinzu, klicke und entferne ihn
        document.body.appendChild(link);
        link.click();
        safeRemoveElement(link);
        
        // Cleanup
        URL.revokeObjectURL(link.href);
        
        // Zeige Bestätigung
        showDownloadNotification(downloadName);
    })
    .catch(error => {
        console.error('Fehler beim Download:', error);
        console.error('Document object was:', dokument);
        alert(i18n.t('buchungskarten.errorDownloading') + ': ' + error.message);
    });
}

function showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? '✓' : '⚠';
    notification.innerHTML = `
        <div class="notification-content">
            <span>${icon}</span>
            <div>${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Automatisch nach 3 Sekunden ausblenden
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            safeRemoveElement(notification);
        }, 300);
    }, 3000);
}

function showDownloadNotification(fileName: string): void {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '10000';
    notification.style.fontSize = '14px';
    notification.style.maxWidth = '300px';
    notification.style.transition = 'opacity 0.3s ease';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>📄</span>
            <div>
                <strong>Download gestartet</strong><br>
                <small>${fileName}</small>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Automatisch nach 3 Sekunden ausblenden
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            safeRemoveElement(notification);
        }, 300);
    }, 3000);
}

function safeRemoveElement(element: HTMLElement): void {
    try {
        if (element && element.parentNode && document.body.contains(element)) {
            element.parentNode.removeChild(element);
        }
    } catch (e) {
        console.warn('Element could not be removed safely:', e);
    }
}

function deleteEvaluation(evaluationId: number): void {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }
    
    // Bestätigungsdialog
    const confirmed = confirm(i18n.t('buchungskarten.confirmDeleteEvaluation'));
    
    if (!confirmed) {
        return;
    }
    
    // Sende DELETE-Request
    fetch(`/uebersichtskarten/${evaluationId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        showNotification('Auswertung erfolgreich gelöscht', 'success');
        
        // Aktualisiere die Auswertungsliste
        loadExistingAuswertungen();
    })
    .catch(error => {
        console.error('Fehler beim Löschen der Auswertung:', error);
        showNotification('Fehler beim Löschen der Auswertung: ' + error.message, 'error');
    });
}

// Edit Buchungskarte functionality
function openEditBuchungsKarteOverlay(buchungskarte: any): void {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'editBuchungsKarteOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.animation = 'fadeIn 0.3s ease';
    
    // Create modal
    const modal = document.createElement('div');
    modal.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    modal.style.borderRadius = '20px';
    modal.style.padding = '0';
    modal.style.width = '95%';
    modal.style.maxWidth = '1200px';
    modal.style.maxHeight = '95vh';
    modal.style.overflowY = 'auto';
    modal.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.4)';
    modal.style.animation = 'slideIn 0.3s ease';
    modal.style.border = '3px solid rgba(255, 255, 255, 0.2)';
    
    // Create form
    const form = document.createElement('form');
    form.id = 'editBuchungsKarteForm';
    form.style.background = 'white';
    form.style.borderRadius = '16px';
    form.style.margin = '4px';
    form.style.padding = '30px';
    form.style.boxShadow = 'inset 0 2px 10px rgba(0, 0, 0, 0.1)';
    
    // Modal header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '30px';
    header.style.borderBottom = '3px solid #667eea';
    header.style.paddingBottom = '20px';
    header.style.background = 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)';
    header.style.margin = '-30px -30px 30px -30px';
    header.style.padding = '25px 30px';
    header.style.borderRadius = '16px 16px 0 0';
    
    const title = document.createElement('h2');
    title.textContent = i18n.t('buchungskarten.editBookingTitle');
    title.style.color = 'white';
    title.style.margin = '0';
    title.style.fontSize = '28px';
    title.style.fontWeight = '700';
    title.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.innerHTML = '✕';
    closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
    closeButton.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = 'white';
    closeButton.style.padding = '8px';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '45px';
    closeButton.style.height = '45px';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.transition = 'all 0.3s ease';
    closeButton.style.fontWeight = 'bold';
    closeButton.title = i18n.t('buchungskarten.close');
    
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        closeButton.style.transform = 'scale(1.1)';
        closeButton.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        closeButton.style.transform = 'scale(1)';
        closeButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    closeButton.addEventListener('click', () => {
        closeEditOverlay();
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Form fields - Reihenfolge entspricht dem "Neue Buchungskarte erstellen" Dialog
    const formFields = [
        {
            label: i18n.t('buchungskarten.editLabels.id'),
            name: 'id',
            type: 'text',
            value: buchungskarte.id.toString(),
            readonly: true,
            description: i18n.t('buchungskarten.cannotChangeIdDescription')
        },
        {
            label: i18n.t('buchungskarten.editLabels.date'),
            name: 'datum',
            type: 'date',
            value: buchungskarte.datum,
            required: true
        },
        {
            label: i18n.t('buchungskarten.editLabels.description'),
            name: 'beschreibung',
            type: 'textarea',
            value: buchungskarte.beschreibung,
            required: true
        },
        {
            label: i18n.t('buchungskarten.editLabels.amount'),
            name: 'betrag',
            type: 'number',
            value: buchungskarte.betrag.toString(),
            required: true,
            step: '0.01',
            min: '0'
        },
        {
            label: i18n.t('buchungskarten.editLabels.receiptNumber'),
            name: 'belegnummer',
            type: 'text',
            value: buchungskarte.belegnummer || '',
            required: false
        },
        {
            label: i18n.t('buchungskarten.editLabels.vatRate'),
            name: 'ustSatz',
            type: 'number',
            value: buchungskarte.ustSatz?.toString() || '',
            required: false,
            step: '0.01',
            min: '0',
            max: '100'
        },
        {
            label: i18n.t('buchungskarten.editLabels.vatAmount'),
            name: 'ustBetrag',
            type: 'number',
            value: buchungskarte.ustBetrag?.toString() || '',
            required: false,
            step: '0.01',
            min: '0'
        }
    ];
    
    // Create form grid
    const formGrid = document.createElement('div');
    formGrid.style.display = 'grid';
    formGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(350px, 1fr))';
    formGrid.style.gap = '25px';
    formGrid.style.marginBottom = '30px';
    formGrid.style.padding = '20px';
    formGrid.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    formGrid.style.borderRadius = '12px';
    formGrid.style.border = '1px solid rgba(102, 126, 234, 0.2)';
    formGrid.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
    
    // Create dropdowns for Buchungsart and Kategorie (before form fields)
    const buchungsartContainer = document.createElement('div');
    buchungsartContainer.style.display = 'flex';
    buchungsartContainer.style.flexDirection = 'column';
    
    const buchungsartLabel = document.createElement('label');
    buchungsartLabel.textContent = i18n.t('buchungskarten.editLabels.bookingType');
    buchungsartLabel.style.marginBottom = '8px';
    buchungsartLabel.style.fontWeight = '600';
    buchungsartLabel.style.color = '#374151';
    buchungsartLabel.style.fontSize = '14px';
    
    const buchungsartSelect = document.createElement('select');
    buchungsartSelect.name = 'buchungsartId';
    buchungsartSelect.required = true;
    buchungsartSelect.style.padding = '12px 16px';
    buchungsartSelect.style.border = '2px solid #e5e7eb';
    buchungsartSelect.style.borderRadius = '8px';
    buchungsartSelect.style.fontSize = '16px';
    buchungsartSelect.style.fontFamily = 'inherit';
    
    buchungsartContainer.appendChild(buchungsartLabel);
    buchungsartContainer.appendChild(buchungsartSelect);
    
    const kategorieContainer = document.createElement('div');
    kategorieContainer.style.display = 'flex';
    kategorieContainer.style.flexDirection = 'column';
    
    const kategorieLabel = document.createElement('label');
    kategorieLabel.textContent = i18n.t('buchungskarten.editLabels.category');
    kategorieLabel.style.marginBottom = '8px';
    kategorieLabel.style.fontWeight = '600';
    kategorieLabel.style.color = '#374151';
    kategorieLabel.style.fontSize = '14px';
    
    const kategorieSelect = document.createElement('select');
    kategorieSelect.name = 'kategorieId';
    kategorieSelect.required = true;
    kategorieSelect.style.padding = '12px 16px';
    kategorieSelect.style.border = '2px solid #e5e7eb';
    kategorieSelect.style.borderRadius = '8px';
    kategorieSelect.style.fontSize = '16px';
    kategorieSelect.style.fontFamily = 'inherit';
    
    kategorieContainer.appendChild(kategorieLabel);
    kategorieContainer.appendChild(kategorieSelect);
    
    // Create Dokument container
    const dokumentContainer = document.createElement('div');
    dokumentContainer.style.display = 'flex';
    dokumentContainer.style.flexDirection = 'column';
    
    const dokumentLabel = document.createElement('label');
    dokumentLabel.textContent = i18n.t('buchungskarten.editLabels.receiptDocument');
    dokumentLabel.style.marginBottom = '8px';
    dokumentLabel.style.fontWeight = '600';
    dokumentLabel.style.color = '#374151';
    dokumentLabel.style.fontSize = '14px';
    
    // Custom file input wrapper
    const fileInputWrapper = document.createElement('div');
    fileInputWrapper.style.position = 'relative';
    fileInputWrapper.style.display = 'inline-block';
    fileInputWrapper.style.width = '100%';

    const dokumentInput = document.createElement('input');
    dokumentInput.type = 'file';
    dokumentInput.accept = '.pdf,.jpg,.jpeg,.png';
    dokumentInput.name = 'dokument';
    dokumentInput.style.position = 'absolute';
    dokumentInput.style.left = '-9999px';
    dokumentInput.style.opacity = '0';

    const customFileButton = document.createElement('button');
    customFileButton.type = 'button';
    customFileButton.style.width = '100%';
    customFileButton.style.padding = '12px 16px';
    customFileButton.style.border = '2px solid #e5e7eb';
    customFileButton.style.borderRadius = '8px';
    customFileButton.style.backgroundColor = '#f8f9fa';
    customFileButton.style.cursor = 'pointer';
    customFileButton.style.textAlign = 'left';
    customFileButton.style.display = 'flex';
    customFileButton.style.justifyContent = 'space-between';
    customFileButton.style.alignItems = 'center';
    customFileButton.style.fontSize = '16px';
    customFileButton.style.fontFamily = 'inherit';

    const fileNameSpan = document.createElement('span');
    fileNameSpan.textContent = i18n.t('buchungskarten.noFileSelected');
    fileNameSpan.style.color = '#6c757d';

    const chooseButtonSpan = document.createElement('span');
    chooseButtonSpan.textContent = i18n.t('buchungskarten.chooseFile');
    chooseButtonSpan.style.backgroundColor = '#007bff';
    chooseButtonSpan.style.color = 'white';
    chooseButtonSpan.style.padding = '4px 8px';
    chooseButtonSpan.style.borderRadius = '3px';
    chooseButtonSpan.style.fontSize = '12px';

    customFileButton.appendChild(fileNameSpan);
    customFileButton.appendChild(chooseButtonSpan);

    customFileButton.onclick = () => dokumentInput.click();

    // Event listener for file selection
    dokumentInput.addEventListener('change', function(event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            fileNameSpan.textContent = file.name;
            fileNameSpan.style.color = '#495057';
        } else {
            fileNameSpan.textContent = i18n.t('buchungskarten.noFileSelected');
            fileNameSpan.style.color = '#6c757d';
        }
    });

    fileInputWrapper.appendChild(dokumentInput);
    fileInputWrapper.appendChild(customFileButton);
    
    // Current document info
    const currentDokumentInfo = document.createElement('div');
    currentDokumentInfo.style.marginBottom = '8px';
    currentDokumentInfo.style.fontSize = '12px';
    currentDokumentInfo.style.color = '#6b7280';
    currentDokumentInfo.innerHTML = `${i18n.t('buchungskarten.currentDocument')} <a href="/dokument/${buchungskarte.dokument.id}" target="_blank" style="color: #3b82f6; text-decoration: underline;">${buchungskarte.dokument.originalName}</a>`;
    
    dokumentContainer.appendChild(dokumentLabel);
    dokumentContainer.appendChild(currentDokumentInfo);
    dokumentContainer.appendChild(fileInputWrapper);
    
    // Create Bild container
    const bildContainer = document.createElement('div');
    bildContainer.style.display = 'flex';
    bildContainer.style.flexDirection = 'column';
    
    const bildLabel = document.createElement('label');
    bildLabel.textContent = i18n.t('buchungskarten.editLabels.imageOptional');
    bildLabel.style.marginBottom = '8px';
    bildLabel.style.fontWeight = '600';
    bildLabel.style.color = '#374151';
    bildLabel.style.fontSize = '14px';
    
    const bildSelect = document.createElement('select');
    bildSelect.name = 'imageId';
    bildSelect.style.padding = '12px 16px';
    bildSelect.style.border = '2px solid #e5e7eb';
    bildSelect.style.borderRadius = '8px';
    bildSelect.style.fontSize = '16px';
    bildSelect.style.fontFamily = 'inherit';
    
    // Image preview container
    const imagePreviewContainer = document.createElement('div');
    imagePreviewContainer.style.marginTop = '10px';
    imagePreviewContainer.style.textAlign = 'center';
    
    bildContainer.appendChild(bildLabel);
    bildContainer.appendChild(bildSelect);
    bildContainer.appendChild(imagePreviewContainer);
    
    // Add form fields with proper order
    formFields.forEach((field, index) => {
        const fieldContainer = document.createElement('div');
        fieldContainer.style.display = 'flex';
        fieldContainer.style.flexDirection = 'column';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        label.style.marginBottom = '8px';
        label.style.fontWeight = '600';
        label.style.color = '#374151';
        label.style.fontSize = '14px';
        
        let input: HTMLInputElement | HTMLTextAreaElement;
        
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
        } else {
            input = document.createElement('input');
            (input as HTMLInputElement).type = field.type;
            
            if (field.step) (input as HTMLInputElement).step = field.step;
            if (field.min) (input as HTMLInputElement).min = field.min;
            if (field.max) (input as HTMLInputElement).max = field.max;
        }
        
        input.name = field.name;
        input.value = field.value;
        input.required = field.required || false;
        input.readOnly = field.readonly || false;
        
        // Styling
        input.style.padding = '12px 16px';
        input.style.border = '2px solid #e5e7eb';
        input.style.borderRadius = '8px';
        input.style.fontSize = '16px';
        input.style.transition = 'border-color 0.2s ease';
        input.style.fontFamily = 'inherit';
        
        if (field.readonly) {
            input.style.backgroundColor = '#f9fafb';
            input.style.color = '#6b7280';
            input.style.cursor = 'not-allowed';
        } else {
            input.addEventListener('focus', () => {
                input.style.borderColor = '#3b82f6';
                input.style.outline = 'none';
            });
            
            input.addEventListener('blur', () => {
                input.style.borderColor = '#e5e7eb';
            });
        }
        
        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);
        
        // Add description if provided
        if (field.description) {
            const description = document.createElement('small');
            description.textContent = field.description;
            description.style.color = '#6b7280';
            description.style.fontSize = '12px';
            description.style.marginTop = '4px';
            fieldContainer.appendChild(description);
        }
        
        formGrid.appendChild(fieldContainer);
        
        // Add Buchungsart dropdown after ID field (index 0)
        if (index === 0) {
            formGrid.appendChild(buchungsartContainer);
        }
        
        // Add Kategorie dropdown after Datum field (index 1)
        if (index === 1) {
            formGrid.appendChild(kategorieContainer);
        }
        
        // Add Dokument field after USt-Betrag field (index 6)
        if (index === 6) {
            formGrid.appendChild(dokumentContainer);
        }
        
        // Add Bild field after Dokument field  
        if (index === 6) {
            formGrid.appendChild(bildContainer);
        }
    });
    
    
    // Form buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.gap = '12px';
    buttonsContainer.style.justifyContent = 'flex-end';
    buttonsContainer.style.marginTop = '30px';
    buttonsContainer.style.borderTop = '1px solid #e5e7eb';
    buttonsContainer.style.paddingTop = '20px';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = i18n.t('buchungskarten.cancel');
    cancelButton.style.padding = '12px 24px';
    cancelButton.style.border = '2px solid #e5e7eb';
    cancelButton.style.borderRadius = '8px';
    cancelButton.style.backgroundColor = 'white';
    cancelButton.style.color = '#374151';
    cancelButton.style.fontSize = '16px';
    cancelButton.style.fontWeight = '600';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.transition = 'all 0.2s ease';
    
    cancelButton.addEventListener('mouseenter', () => {
        cancelButton.style.backgroundColor = '#f9fafb';
        cancelButton.style.borderColor = '#d1d5db';
    });
    
    cancelButton.addEventListener('mouseleave', () => {
        cancelButton.style.backgroundColor = 'white';
        cancelButton.style.borderColor = '#e5e7eb';
    });
    
    cancelButton.addEventListener('click', () => {
        closeEditOverlay();
    });
    
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = i18n.t('buchungskarten.save');
    saveButton.style.padding = '12px 24px';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '8px';
    saveButton.style.backgroundColor = '#3b82f6';
    saveButton.style.color = 'white';
    saveButton.style.fontSize = '16px';
    saveButton.style.fontWeight = '600';
    saveButton.style.cursor = 'pointer';
    saveButton.style.transition = 'all 0.2s ease';
    
    saveButton.addEventListener('mouseenter', () => {
        saveButton.style.backgroundColor = '#2563eb';
        saveButton.style.transform = 'translateY(-1px)';
    });
    
    saveButton.addEventListener('mouseleave', () => {
        saveButton.style.backgroundColor = '#3b82f6';
        saveButton.style.transform = 'translateY(0)';
    });
    
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(saveButton);
    
    // Assemble form
    form.appendChild(header);
    form.appendChild(formGrid);
    form.appendChild(buttonsContainer);
    
    // Load buchungsarten and kategorien
    loadBuchungsArtenForEdit(buchungsartSelect, kategorieSelect, buchungskarte);
    
    // Load images for edit
    loadImagesForEdit(bildSelect, buchungskarte.image?.id || null, imagePreviewContainer);
    
    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEditedBuchungsKarte(buchungskarte.id, form);
    });
    
    // Close overlay when clicking outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeEditOverlay();
        }
    });
    
    // Escape key to close
    document.addEventListener('keydown', handleEscapeKey);
    
    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeEditOverlay(): void {
    const overlay = document.getElementById('editBuchungsKarteOverlay');
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = 'auto';
        document.removeEventListener('keydown', handleEscapeKey);
    }
}

function handleEscapeKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
        closeEditOverlay();
    }
}

function loadBuchungsArtenForEdit(buchungsartSelect: HTMLSelectElement, kategorieSelect: HTMLSelectElement, buchungskarte: any): void {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No auth token found');
        return;
    }
    
    // Load Buchungsarten
    fetch('/buchungsarten', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        console.log('Buchungsarten API response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(buchungsarten => {
        console.log('Received buchungsarten:', buchungsarten);
        
        if (buchungsarten && buchungsarten.length > 0) {
            buchungsartSelect.innerHTML = `<option value="">${i18n.t('buchungskarten.selectBookingType')}</option>`;
            
            buchungsarten.forEach((buchungsart: any) => {
                const option = document.createElement('option');
                option.value = buchungsart.id.toString();
                option.textContent = i18n.t(`buchungskarten.buchungsArt.${buchungsart.name}`);
                
                if (buchungsart.id === buchungskarte.buchungsart.id) {
                    option.selected = true;
                }
                
                buchungsartSelect.appendChild(option);
            });
            
            // Load initial categories
            if (buchungskarte.buchungsart.id) {
                loadKategorienForEdit(kategorieSelect, buchungskarte.buchungsart.id, buchungskarte.kategorie.id);
            }
        } else {
            console.log('No buchungsarten from API, using fallback');
            loadFallbackBuchungsarten(buchungsartSelect, kategorieSelect, buchungskarte);
        }
    })
    .catch(error => {
        console.error('Error loading buchungsarten:', error);
        console.log('Using fallback buchungsarten');
        loadFallbackBuchungsarten(buchungsartSelect, kategorieSelect, buchungskarte);
    });
    
    // Add event listener for buchungsart change
    buchungsartSelect.addEventListener('change', () => {
        const selectedBuchungsartId = buchungsartSelect.value;
        if (selectedBuchungsartId) {
            loadKategorienForEdit(kategorieSelect, parseInt(selectedBuchungsartId), null);
        } else {
            kategorieSelect.innerHTML = `<option value="">${i18n.t('buchungskarten.selectBookingTypeFirst')}</option>`;
        }
    });
}

function loadFallbackBuchungsarten(buchungsartSelect: HTMLSelectElement, kategorieSelect: HTMLSelectElement, buchungskarte: any): void {
    console.log('Loading fallback buchungsarten');
    
    // Create local fallback buchungsarten
    const fallbackBuchungsarten = [
        { id: 1, name: 'EINNAHME' },
        { id: 2, name: 'AUSGABE' }
    ];
    
    buchungsartSelect.innerHTML = `<option value="">${i18n.t('buchungskarten.selectBookingType')}</option>`;
    
    fallbackBuchungsarten.forEach((buchungsart) => {
        const option = document.createElement('option');
        option.value = buchungsart.id.toString();
        option.textContent = i18n.t(`buchungskarten.buchungsArt.${buchungsart.name}`);
        
        if (buchungsart.id === buchungskarte.buchungsart.id) {
            option.selected = true;
        }
        
        buchungsartSelect.appendChild(option);
    });
    
    // Load initial categories
    if (buchungskarte.buchungsart.id) {
        loadKategorienForEdit(kategorieSelect, buchungskarte.buchungsart.id, buchungskarte.kategorie.id);
    }
    
    // Add event listener for buchungsart change
    buchungsartSelect.addEventListener('change', () => {
        const selectedBuchungsartId = buchungsartSelect.value;
        if (selectedBuchungsartId) {
            loadKategorienForEdit(kategorieSelect, parseInt(selectedBuchungsartId), null);
        } else {
            kategorieSelect.innerHTML = `<option value="">${i18n.t('buchungskarten.selectBookingTypeFirst')}</option>`;
        }
    });
}

function loadKategorienForEdit(kategorieSelect: HTMLSelectElement, buchungsartId: number, selectedKategorieId: number | null): void {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No auth token found');
        return;
    }
    
    fetch(`/buchungskategorien/${buchungsartId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        console.log(`Categories API response for buchungsartId ${buchungsartId}:`, response.status);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(kategorien => {
        console.log(`Received categories for buchungsartId ${buchungsartId}:`, kategorien);
        kategorieSelect.innerHTML = `<option value="">${i18n.t('buchungskarten.selectCategoryLabel')}</option>`;
        
        kategorien.forEach((kategorie: any) => {
            const option = document.createElement('option');
            option.value = kategorie.id.toString();
            const translationKey = `buchungskarten.buchungsKategorie.${kategorie.name}`;
            const translatedName = i18n.t(translationKey);
            option.textContent = translatedName !== translationKey ? translatedName : kategorie.name;
            console.log(`Added category: ${kategorie.name} -> ${option.textContent}`);
            
            if (selectedKategorieId && kategorie.id === selectedKategorieId) {
                option.selected = true;
            }
            
            kategorieSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error loading kategorien:', error);
    });
}

function loadImagesForEdit(bildSelect: HTMLSelectElement, selectedImageId: number | null, imagePreviewContainer: HTMLElement): void {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        console.error('No auth token found');
        return;
    }
    
    fetch('/images', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then((images: any[]) => {
        const sortedImages = images.sort((a, b) => a.id - b.id);
        bildSelect.innerHTML = '';
        
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = i18n.t('buchungskarten.noImage');
        bildSelect.appendChild(placeholderOption);
        
        sortedImages.forEach(image => {
            const option = document.createElement('option');
            option.value = image.id.toString();
            option.textContent = image.name;
            option.dataset.location = image.location;
            
            if (selectedImageId && image.id === selectedImageId) {
                option.selected = true;
            }
            
            bildSelect.appendChild(option);
        });
        
        // Set up image preview
        bildSelect.addEventListener('change', () => {
            updateImagePreviewForEdit(bildSelect, imagePreviewContainer);
        });
        
        // Show initial preview if image is selected
        if (selectedImageId) {
            updateImagePreviewForEdit(bildSelect, imagePreviewContainer);
        }
    })
    .catch(error => {
        console.error('Error loading images:', error);
    });
}

function updateImagePreviewForEdit(bildSelect: HTMLSelectElement, imagePreviewContainer: HTMLElement): void {
    imagePreviewContainer.innerHTML = '';
    
    if (bildSelect.value) {
        const selectedOption = bildSelect.options[bildSelect.selectedIndex];
        const imageLocation = selectedOption.dataset.location;
        
        if (imageLocation) {
            const imagePreview = document.createElement('img');
            imagePreview.src = `/thumbnails/${imageLocation}`;
            imagePreview.alt = 'Bildvorschau';
            imagePreview.style.maxWidth = '300px';
            imagePreview.style.maxHeight = '300px';
            imagePreview.style.borderRadius = '8px';
            imagePreview.style.border = '2px solid #e5e7eb';
            imagePreview.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            
            imagePreviewContainer.appendChild(imagePreview);
        }
    }
}

function saveEditedBuchungsKarte(id: number, form: HTMLFormElement): void {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        alert(i18n.t('buchungskarten.noAuthFound'));
        return;
    }
    
    // Disable save button during request
    const saveButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const originalText = saveButton.textContent;
    saveButton.textContent = 'Speichern...';
    saveButton.disabled = true;
    
    // Get form data
    const formData = new FormData(form);
    const data: any = {};
    
    formData.forEach((value, key) => {
        if (key === 'datum') {
            data[key] = value;
        } else if (key === 'betrag' || key === 'ustSatz' || key === 'ustBetrag') {
            data[key] = value ? parseFloat(value as string) : null;
        } else if (key === 'buchungsartId' || key === 'kategorieId') {
            data[key] = parseInt(value as string);
        } else if (key === 'belegnummer') {
            data[key] = value || null;
        } else if (key === 'imageId') {
            data[key] = value ? parseInt(value as string) : null;
        } else if (key !== 'dokument') { // Skip file input for now
            data[key] = value;
        }
    });
    
    // Handle document upload if new file is selected
    const dokumentInput = form.querySelector('input[name="dokument"]') as HTMLInputElement;
    const hasNewDocument = dokumentInput && dokumentInput.files && dokumentInput.files.length > 0;
    
    if (hasNewDocument) {
        // First upload the new document
        const file = dokumentInput.files![0];
        uploadDokument(file)
            .then(dokumentId => {
                data.dokumentId = dokumentId;
                return updateBuchungsKarte(id, data, authToken);
            })
            .then(() => {
                showNotification('Buchungskarte erfolgreich aktualisiert', 'success');
                closeEditOverlay();
                showBuchungskartenUebersicht(); // Refresh the table
            })
            .catch(error => {
                console.error('Error updating buchungskarte:', error);
                showNotification('Fehler beim Aktualisieren der Buchungskarte: ' + error.message, 'error');
            })
            .finally(() => {
                saveButton.textContent = originalText;
                saveButton.disabled = false;
            });
    } else {
        // Update without new document
        updateBuchungsKarte(id, data, authToken)
            .then(() => {
                showNotification('Buchungskarte erfolgreich aktualisiert', 'success');
                closeEditOverlay();
                showBuchungskartenUebersicht(); // Refresh the table
            })
            .catch(error => {
                console.error('Error updating buchungskarte:', error);
                showNotification('Fehler beim Aktualisieren der Buchungskarte: ' + error.message, 'error');
            })
            .finally(() => {
                saveButton.textContent = originalText;
                saveButton.disabled = false;
            });
    }
}

function updateBuchungsKarte(id: number, data: any, authToken: string): Promise<void> {
    return fetch(`/buchungskarten/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(() => {
        return Promise.resolve();
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideIn {
        from { 
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
        }
        to { 
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
`;
document.head.appendChild(style);
