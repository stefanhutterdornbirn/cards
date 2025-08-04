import {clearContentScreen, getCurrentPage} from './common.js';
import { i18n } from './i18n/TranslationService.js';


const MATERIAL_PAGE: string = "MATERIAL_PAGE";

// --- Interfaces ---
interface Image {
    id: number;
    name: string;
    extension?: string;
    location?: string;
}

interface Packet {
    id: number;
    name: string;
    beschreibung: string;
    image: Image;
}

interface Unterlage {
    id: number;
    packet: Packet;
    name: string;
    material: Material;
}

interface Material {
    content: string;
    originalFilename?: string;
}

interface UnterlageInfo {
    id: number;
    paketName: string;
    name: string;
    material: MaterialInfo[];
}

interface MaterialInfo {
    id: number;
    name: string;
    type: string;
    sizeByte: number;
    location: string;
}

// --- Globale Zustandsvariablen für die Paginierung ---
let currentPage: number = 1;
let currentItemsPerPage: number = 50;
let isLoading: boolean = false;
let allUnterlagen: UnterlageInfo[] = [];
let noMoreData: boolean = false;
let currentElement: number = 1;
let maxElement: number = 1;
let currentSearchTerm: string = '';

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded!');
    const materialLink = document.getElementById('materialLink');
    const materialContent = document.getElementById('materialContent');


    materialLink?.addEventListener('click', function (e) {
        e.preventDefault();
        currentPage = 1;
        allUnterlagen = [];
        noMoreData = false;
        currentSearchTerm = '';
        // Ladeindikator zeigen, bevor die erste Anfrage gesendet wird
        updateLoadingIndicator(true);
        loadUnterlagen(currentPage, currentItemsPerPage, true);
        loadUnterlagenAnz();
    });

    if (materialContent) {
        console.log("Material Content Element gefunden.");
    }

    materialContent?.addEventListener('click', (event) => {
        console.log("Click Event auf dem Material Content Element");
    });

    window?.addEventListener('scroll', (event) => {
        var currentScreen: string = getCurrentPage();
        if (currentScreen === MATERIAL_PAGE) {
            console.log("Scroll Event auf dem Window Element");
            // Scroll-Position und Dokumenthöhe berechnen
            const scrollPosition = window.scrollY + window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            // Buffer für früheres Laden (200px vor Ende)
            const buffer = 200;
            const scrolledToBottom = scrollPosition >= (documentHeight - buffer);
            if (scrolledToBottom && !isLoading && !noMoreData) {
                console.log("Lade nächste Seite...");
                currentPage++;
                updateLoadingIndicator(true);
                loadUnterlagen(currentPage, currentItemsPerPage, false);
            } else {
                console.log("Kein Laden der nächsten Seite, weil:");
                console.log("scrolledToBottom:", scrolledToBottom);
                console.log("!isLoading:", !isLoading);
                console.log("!noMoreData:", !noMoreData);
            }
        } else {
            console.log("Scroll Event auf dem Window Element, aber nicht auf dem Material Content Element, current Screen", currentScreen);
        }
    });
});

function updatePaginationControls() {
    const prevButton = document.querySelector('.prev-page') as HTMLButtonElement;
    const nextButton = document.querySelector('.next-page') as HTMLButtonElement;
    const pageIndicator = document.querySelector('.page-indicator');

    if (prevButton) {
        prevButton.disabled = currentPage <= 1;
    }

    if (nextButton) {
        nextButton.disabled = noMoreData;
    }

    if (pageIndicator) {
        pageIndicator.textContent = i18n.t('materials.page') + ` ${currentPage}`;
    }
}

function loadUnterlagen(page: number, pageSize: number, clearExisting: boolean): void {
    console.log("load Unterlade", page, pageSize, clearExisting)
    if (isLoading) {
        console.log(i18n.t('materials.alreadyLoading'));
        return;
    }
    isLoading = true;

    const authToken = localStorage.getItem('authToken');
    const url = currentSearchTerm ? 
        `/unterlagen/search?q=${encodeURIComponent(currentSearchTerm)}&page=${page}&pageSize=${pageSize}` :
        `/unterlagen?page=${page}&pageSize=${pageSize}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            updateLoadingIndicator(false); // Ladeindikator ausblenden, da eine Antwort empfangen wurde
            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error(i18n.t('materials.invalidParameters'));
                }
                if (response.status === 401 || response.status === 403) {
                    throw new Error(i18n.t('materials.notAuthorized'));
                }
                throw new Error(i18n.t('forms.networkError') + `: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then((unterlagenInfo: UnterlageInfo[]) => {
            isLoading = false;
            if (clearExisting) {
                allUnterlagen = unterlagenInfo;
                noMoreData = false;
            } else {
                if (unterlagenInfo.length === 0) {
                    noMoreData = true;
                    currentPage--;
                    console.log(i18n.t('materials.noMoreMaterialsFound'));
                } else {
                    allUnterlagen = [...allUnterlagen, ...unterlagenInfo];
                }
            }
            currentElement = page * pageSize
            updateEndOfResultsMessage(noMoreData);
            displayMaterialCards(allUnterlagen, currentPage, currentItemsPerPage);
        })
        .catch(error => {
            isLoading = false;
            updateLoadingIndicator(false);
            console.error(i18n.t('materials.loadError') + ':', error);
            const materialContent = document.getElementById('materialContent');
            if (materialContent) {
                materialContent.innerHTML = `<p class="error">${i18n.t('materials.loadError')}: ${error.message}</p>`;
                updateEndOfResultsMessage(true);
            }
        });
}


function loadUnterlagenAnz(): void {
    console.log("load Unterlagen Anz")
    const authToken = localStorage.getItem('authToken');
    const url = currentSearchTerm ? 
        `/unterlagen/search/anz?q=${encodeURIComponent(currentSearchTerm)}` :
        `/unterlagen/anz`;
    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            updateLoadingIndicator(false); // Ladeindikator ausblenden, da eine Antwort empfangen wurde
            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error(i18n.t('materials.invalidParameters'));
                }
                if (response.status === 401 || response.status === 403) {
                    throw new Error(i18n.t('materials.notAuthorized'));
                }
                throw new Error(i18n.t('forms.networkError') + `: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then((data) => {
            maxElement = data.count;
            console.log(i18n.t('materials.maxElementsIs'), maxElement);
        })
        .catch(error => {
            updateLoadingIndicator(false);
            console.error(i18n.t('materials.loadError') + ':', error);
        });
}


function displayMaterialCards(unterlagenInfo: UnterlageInfo[], page: number, pageSize: number): void {
    clearContentScreen(MATERIAL_PAGE);
    const materialContent = document.getElementById('materialContent');
    if (!materialContent) return;
    materialContent.innerHTML = `<h2>${i18n.t('materials.learningMaterials')}</h2>`;

    // Search and Filter Container
    const searchFilterContainer = document.createElement('div');
    searchFilterContainer.className = 'filter-container';

    // Search Input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'searchInput';
    searchInput.className = 'topic-filter';
    searchInput.placeholder = i18n.t('materials.searchPlaceholder');
    searchInput.value = currentSearchTerm;

    // Search function
    const performSearch = () => {
        const searchTerm = searchInput.value.trim();
        currentSearchTerm = searchTerm;
        currentPage = 1;
        allUnterlagen = [];
        noMoreData = false;
        updateLoadingIndicator(true);
        loadUnterlagen(currentPage, currentItemsPerPage, true);
        loadUnterlagenAnz();
    };

    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Search Button
    const searchBtn = document.createElement('button');
    searchBtn.className = 'btn-primary btn-small';
    searchBtn.textContent = i18n.t('materials.search');
    searchBtn.style.marginLeft = '10px';
    searchBtn.addEventListener('click', performSearch);

    // Clear Search Button
    const clearSearchBtn = document.createElement('button');
    clearSearchBtn.className = 'btn-danger btn-small';
    clearSearchBtn.textContent = i18n.t('materials.clear');
    clearSearchBtn.style.marginLeft = '5px';
    clearSearchBtn.addEventListener('click', () => {
        currentSearchTerm = '';
        searchInput.value = '';
        currentPage = 1;
        allUnterlagen = [];
        noMoreData = false;
        updateLoadingIndicator(true);
        loadUnterlagen(currentPage, currentItemsPerPage, true);
        loadUnterlagenAnz();
    });

    // Search Container
    const searchContainer = document.createElement('div');
    searchContainer.style.display = 'flex';
    searchContainer.style.alignItems = 'center';
    searchContainer.style.marginBottom = '15px';
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchBtn);
    searchContainer.appendChild(clearSearchBtn);

    // Topic-Filter hinzufügen
    const packete = [...new Set(allUnterlagen.map(unterlage => unterlage.paketName))];
    const packetSelect = document.createElement('select');
    packetSelect.id = 'packetFilter';
    packetSelect.className = 'topic-filter';

    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = i18n.t('materials.allPackages');
    packetSelect.appendChild(allOption);

    packete.forEach(packet => {
        const option = document.createElement('option');
        option.value = packet;
        option.textContent = packet;
        packetSelect.appendChild(option);
    });

    searchFilterContainer.appendChild(searchContainer);
    searchFilterContainer.appendChild(packetSelect);
    materialContent.appendChild(searchFilterContainer);

    const cardsContainer: HTMLDivElement = document.createElement('div');
    cardsContainer.className = 'cards-container';
    materialContent.appendChild(cardsContainer);

    packetSelect.addEventListener('change', () => {
        const selectedPacket = packetSelect.value;
        const filteredUnterlagen = selectedPacket
            ? allUnterlagen.filter(unterlage => unterlage.paketName === selectedPacket)
            : allUnterlagen;

        updateCardsDisplay(filteredUnterlagen, cardsContainer);
    });

    updateCardsDisplay(allUnterlagen, cardsContainer);

    // --- Manuelle Pagination Controls erstellen und anhängen ---
    const paginationControls = document.createElement('div');
    paginationControls.className = 'pagination-controls';

    const labelNavigation = document.createElement('label');
    const searchLabel = currentSearchTerm ? ` (${i18n.t('materials.search')}: "${currentSearchTerm}")` : '';
    labelNavigation.textContent = `${i18n.t('materials.element')} ${currentElement} ${i18n.t('materials.of')} ${maxElement} ${i18n.t('materials.elementsLoaded')}${searchLabel}`;
    paginationControls.appendChild(labelNavigation);
    materialContent.appendChild(paginationControls);

    // --- Lade- und Ende-der-Ergebnisse-Indikatoren dynamisch erstellen ---
    let loadingDiv = document.getElementById('loadingIndicator');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.style.display = 'none';
        loadingDiv.style.textAlign = 'center';
        loadingDiv.style.padding = '20px';
        loadingDiv.textContent = i18n.t('materials.loadingMore');
        materialContent.appendChild(loadingDiv);
    }

    let endDiv = document.getElementById('endOfResults');
    if (!endDiv) {
        endDiv = document.createElement('div');
        endDiv.id = 'endOfResults';
        endDiv.style.display = 'none';
        endDiv.style.textAlign = 'center';
        endDiv.style.padding = '20px';
        endDiv.style.color = 'gray';
        endDiv.textContent = i18n.t('materials.noMoreMaterials');
        materialContent.appendChild(endDiv);
    }
}

function updateCardsDisplay(unterlagenInfo: UnterlageInfo[], container: HTMLDivElement) {
    container.innerHTML = '';
    if (unterlagenInfo.length === 0) {
        container.innerHTML = `<p class="no-results">${i18n.t('materials.noMaterialsFound')}</p>`;
    } else {
        unterlagenInfo.forEach(unterlage => {
            const cardElement = createCardElement(unterlage);
            container.appendChild(cardElement);
        });
    }
}

function createCardElement(unterlage: UnterlageInfo): HTMLDivElement {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'memory-card';
    cardDiv.dataset.cardId = unterlage.id.toString();

    const headerSection = document.createElement('div');
    headerSection.className = 'card-header';

    const topicSection = document.createElement('div');
    topicSection.className = 'card-topic';
    topicSection.innerHTML = `<span class="card-id">#${unterlage.id}</span> - ${unterlage.paketName}`;

    headerSection.appendChild(topicSection);
    cardDiv.appendChild(headerSection);


    const questionSection = document.createElement('div');
    questionSection.className = 'card-unterlage';
    questionSection.textContent = unterlage.name;


    cardDiv.appendChild(questionSection);


    const materialSection = document.createElement('div');
    materialSection.className = 'card-material';
    
    // Material section uses CSS class for styling

    unterlage.material.forEach(material => {
        const materialContent = document.createElement('div');
        materialContent.className = 'material-content';
        
        materialContent.addEventListener('click', () => {
            handleMaterialClick(material);
        });

        const answerText = document.createElement('span');
        answerText.className = 'material-text';
        answerText.textContent = material.name;

        const materialIcon = document.createElement('span');
        materialIcon.className = 'material-icons';

        materialContent.appendChild(answerText);
        materialContent.appendChild(materialIcon);
        materialSection.appendChild(materialContent);
    });

    cardDiv.appendChild(topicSection);
    cardDiv.appendChild(questionSection);
    cardDiv.appendChild(materialSection);

    return cardDiv;
}

function downloadMaterialContent(material: MaterialInfo, authToken: string): void {
    const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    };

    const filename = material.name;
    
    // Debug logging
    console.log('Opening material:', {
        name: material.name,
        type: material.type,
        location: material.location
    });

    fetch(`/material/content/${material.location}`, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(i18n.t('materials.downloadFailed'));
            }

            const contentType = response.headers.get('content-type');
            console.log('Material content type:', contentType);
            return response.blob().then(blob => ({blob, contentType}));
        })
        .then(({blob, contentType}) => {
            // Determine file type from content type, filename, or material.type
            const fileType = determineFileType(contentType, filename, material.type);
            console.log('Determined file type:', fileType);
            
            switch (fileType) {
                case 'pdf':
                    showPdfOverlay(blob, filename, authToken);
                    break;
                case 'audio':
                    showAudioOverlay(blob, filename, authToken);
                    break;
                case 'zip':
                case 'download':
                default:
                    downloadFile(blob, filename);
                    break;
            }
        })
        .catch(error => {
            console.error(i18n.t('materials.downloadError') + ':', error);
            alert(i18n.t('materials.downloadError'));
        });
}

function determineFileType(contentType: string | null, filename: string, materialType: string): string {
    // Check content type first
    if (contentType?.includes('pdf')) return 'pdf';
    if (contentType?.includes('audio')) return 'audio';
    if (contentType?.includes('zip')) return 'zip';
    
    // Check filename extension
    const extension = filename.toLowerCase().split('.').pop();
    if (extension === 'pdf') return 'pdf';
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension || '')) return 'audio';
    if (['zip', 'rar', '7z'].includes(extension || '')) return 'zip';
    
    // Check material type
    if (materialType?.toLowerCase().includes('pdf')) return 'pdf';
    if (materialType?.toLowerCase().includes('audio')) return 'audio';
    if (materialType?.toLowerCase().includes('zip')) return 'zip';
    
    return 'download';
}

function showPdfOverlay(blob: Blob, filename: string, authToken: string): void {
    // Create PDF blob with correct MIME type
    const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'pdf-modal';
    
    // Modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'pdf-modal-content';
    
    // Header
    const header = document.createElement('div');
    header.className = 'pdf-modal-header';
    
    const title = document.createElement('h3');
    title.className = 'pdf-modal-title';
    title.textContent = filename;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'pdf-modal-close';
    closeButton.textContent = '✕';
    
    closeButton.addEventListener('click', () => {
        safeRemoveElement(modal);
        URL.revokeObjectURL(pdfUrl);
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // PDF container
    const pdfContainer = document.createElement('div');
    pdfContainer.className = 'pdf-modal-body';
    
    // Create PDF URL with proper filename
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(pdfFile);
    const pdfEmbed = document.createElement('embed');
    pdfEmbed.className = 'pdf-embed';
    pdfEmbed.src = pdfUrl;
    pdfEmbed.type = 'application/pdf';
    
    pdfContainer.appendChild(pdfEmbed);
    
    // Download button container
    const downloadContainer = document.createElement('div');
    downloadContainer.style.padding = '10px 20px';
    downloadContainer.style.borderTop = '1px solid #e9ecef';
    downloadContainer.style.backgroundColor = '#f8f9fa';
    downloadContainer.style.borderRadius = '0 0 10px 10px';
    downloadContainer.style.textAlign = 'center';
    
    const downloadButton = document.createElement('button');
    downloadButton.className = 'btn-pdf';
    downloadButton.textContent = '📥 ' + i18n.t('materials.downloadPdf');
    
    downloadButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = filename; // Use original filename
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        safeRemoveElement(link);
    });
    
    downloadContainer.appendChild(downloadButton);
    
    modalContent.appendChild(header);
    modalContent.appendChild(pdfContainer);
    modalContent.appendChild(downloadContainer);
    modal.appendChild(modalContent);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            safeRemoveElement(modal);
            URL.revokeObjectURL(pdfUrl);
        }
    });
    
    document.body.appendChild(modal);
}

function showAudioOverlay(blob: Blob, filename: string, authToken: string): void {
    const audioUrl = URL.createObjectURL(blob);
    
    // Create modal overlay
    const modal = document.createElement('div');
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
    
    // Modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.borderRadius = '15px';
    modalContent.style.padding = '30px';
    modalContent.style.minWidth = '400px';
    modalContent.style.maxWidth = '600px';
    modalContent.style.position = 'relative';
    modalContent.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    
    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '20px';
    
    const title = document.createElement('h3');
    title.textContent = filename;
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
    
    closeButton.addEventListener('click', () => {
        safeRemoveElement(modal);
        URL.revokeObjectURL(audioUrl);
    });
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Audio player
    const audio = document.createElement('audio');
    audio.src = audioUrl;
    audio.controls = true;
    audio.style.width = '100%';
    audio.style.marginBottom = '20px';
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-primary';
    downloadBtn.textContent = i18n.t('materials.downloadFile');
    downloadBtn.style.display = 'block';
    downloadBtn.style.margin = '0 auto';
    
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = filename;
        link.click();
    });
    
    modalContent.appendChild(header);
    modalContent.appendChild(audio);
    modalContent.appendChild(downloadBtn);
    modal.appendChild(modalContent);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            safeRemoveElement(modal);
            URL.revokeObjectURL(audioUrl);
        }
    });
    
    document.body.appendChild(modal);
}

function downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    safeRemoveElement(link);
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

function handleMaterialClick(material: MaterialInfo): void {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        alert(i18n.t('materials.pleaseSignIn'));
        return;
    }

    if (material.location) {
        downloadMaterialContent(material, authToken);
    }
}

function updateLoadingIndicator(show: boolean) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = show ? 'block' : 'none';
    }
}

function updateEndOfResultsMessage(show: boolean) {
    const message = document.getElementById('endOfResults');
    if (message) {
        message.style.display = show ? 'block' : 'none';
    }
}