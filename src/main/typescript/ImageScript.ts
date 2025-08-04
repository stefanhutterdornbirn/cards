import {clearContentScreen} from './common.js';
import { i18n } from './i18n/TranslationService.js';

const IMAGE_PAGE = "IMAGE_PAGE";

// TypeScript Interfaces
interface ImageData {
    id: number;
    name: string;
    extension: string;
    location: string;
}

interface UploadResponse {
    id: string;
}

interface ApiResponse {
    [key: string]: any;
}

// Global Functions
function showImageUploadForm(): void {
    console.log('showImageUploadForm() called');
    const imageContent = document.getElementById('imageContent') as HTMLElement;
    
    if (!imageContent) {
        console.error(i18n.t('common.elementNotFound'));
        return;
    }
    
    // Prüfen ob bereits eine Upload-Form existiert
    const existingForm = imageContent.querySelector('.image-upload-form');
    if (existingForm) {
        existingForm.remove();
    }
    
    // Upload-Form erstellen
    const uploadForm = document.createElement('div');
    uploadForm.className = 'image-upload-form';
    uploadForm.innerHTML = `
        <h3 class="image-upload-title">${i18n.t('images.uploadImage')}</h3>
        <div class="image-upload-area" id="uploadArea">
            <div class="image-upload-icon">📁</div>
            <div class="image-upload-text">${i18n.t('images.dragDropFiles')}</div>
            <div class="image-upload-hint">${i18n.t('images.supportedFormats')}</div>
        </div>
        <input type="file" id="fileInput" style="display: none;" accept="image/*" multiple>
        <div style="margin-top: 20px; text-align: center;">
            <button class="btn-success" id="selectFilesBtn">
                ${i18n.t('images.selectFiles')}
            </button>
            <button class="btn-danger" id="cancelUploadBtn">
                ${i18n.t('common.cancel')}
            </button>
        </div>
    `;
    
    imageContent.insertBefore(uploadForm, imageContent.firstChild);
    
    // Event listeners for upload area
    const uploadArea = uploadForm.querySelector('#uploadArea') as HTMLElement;
    const fileInput = uploadForm.querySelector('#fileInput') as HTMLInputElement;
    const selectFilesBtn = uploadForm.querySelector('#selectFilesBtn') as HTMLButtonElement;
    const cancelUploadBtn = uploadForm.querySelector('#cancelUploadBtn') as HTMLButtonElement;
    
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    cancelUploadBtn.addEventListener('click', () => uploadForm.remove());
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer?.files) {
            handleFileUpload(e.dataTransfer.files);
        }
    });
    
    fileInput.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files) {
            handleFileUpload(target.files);
        }
    });
}

function handleFileUpload(files: FileList): void {
    const authToken = localStorage.getItem('authToken');
    
    Array.from(files).forEach((file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        fetch(`/images/content/${file.name}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: file
        })
        .then((response: Response) => {
            if (!response.ok) {
                throw new Error(i18n.t('forms.uploadFailed'));
            }
            return response.json() as Promise<UploadResponse>;
        })
        .then((data: UploadResponse) => {
            console.log('File uploaded:', data);
            // Nach Upload: Name-Bearbeitung anzeigen
            showNameEditForm(file.name, data.id);
        })
        .catch((error: Error) => {
            console.error('Upload error:', error);
            alert(`${i18n.t('forms.uploadError')} ${file.name}`);
        });
    });
}

function showNameEditForm(originalFileName: string, locationId: string): void {
    const imageContent = document.getElementById('imageContent') as HTMLElement;
    
    // Upload-Form entfernen
    const uploadForm = document.querySelector('.image-upload-form');
    if (uploadForm) {
        uploadForm.remove();
    }
    
    // Name-Bearbeitung Form erstellen
    const nameEditForm = document.createElement('div');
    nameEditForm.className = 'name-edit-form';
    
    const fileName = originalFileName.replace(/\.[^/.]+$/, "");
    const fileExtension = originalFileName.split('.').pop() || '';
    
    nameEditForm.innerHTML = `
        <h3 class="name-edit-title">${i18n.t('images.editImageName')}</h3>
        <div class="name-edit-content">
            <div class="form-group">
                <label for="imageName">${i18n.t('common.name')}:</label>
                <input type="text" id="imageName" value="${fileName}" class="form-input">
            </div>
            <div class="form-group">
                <label for="imageExtension">${i18n.t('images.fileExtension')}:</label>
                <input type="text" id="imageExtension" value="${fileExtension}" class="form-input">
            </div>
            <div class="form-actions">
                <button class="btn-success" id="saveImageBtn">${i18n.t('common.save')}</button>
                <button class="btn-danger" id="cancelImageBtn">${i18n.t('common.cancel')}</button>
            </div>
        </div>
    `;
    
    imageContent.insertBefore(nameEditForm, imageContent.firstChild);
    
    // Event listeners
    const saveBtn = nameEditForm.querySelector('#saveImageBtn') as HTMLButtonElement;
    const cancelBtn = nameEditForm.querySelector('#cancelImageBtn') as HTMLButtonElement;
    const nameInput = nameEditForm.querySelector('#imageName') as HTMLInputElement;
    
    saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const extension = (nameEditForm.querySelector('#imageExtension') as HTMLInputElement).value.trim();
        
        if (!name) {
            alert(i18n.t('forms.pleaseEnterName'));
            return;
        }
        
        saveImageToDatabase(name, extension, locationId, nameEditForm);
    });
    
    cancelBtn.addEventListener('click', () => {
        nameEditForm.remove();
        loadImages();
    });
    
    // Focus auf Input
    nameInput.focus();
    nameInput.select();
}

function saveImageToDatabase(name: string, extension: string, locationId: string, formElement: HTMLElement): void {
    const authToken = localStorage.getItem('authToken');
    
    fetch('/images', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            name: name,
            extension: extension,
            location: locationId
        })
    })
    .then((response: Response) => {
        if (!response.ok) {
            throw new Error(i18n.t('images.saveError'));
        }
        return response.json() as Promise<ImageData>;
    })
    .then((imageData: ImageData) => {
        console.log('Image successfully saved:', imageData);
        formElement.remove();
        loadImages();
    })
    .catch((error: Error) => {
        console.error('Error saving:', error);
        alert(i18n.t('images.saveError') + ': ' + error.message);
    });
}

function handleDeleteImage(imageId: number): void {
    if (confirm(i18n.t('images.confirmDelete'))) {
        const authToken = localStorage.getItem('authToken');
        
        fetch(`/images/${imageId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then((response: Response) => {
            if (!response.ok) {
                throw new Error(i18n.t('forms.deleteError'));
            }
            return response.json() as Promise<ApiResponse>;
        })
        .then((data: ApiResponse) => {
            // Bild aus der Ansicht entfernen
            const imageCard = document.querySelector(`[data-image-id="${imageId}"]`);
            if (imageCard) {
                imageCard.remove();
            }
            
            // Statistiken aktualisieren
            loadImages();
        })
        .catch((error: Error) => {
            console.error('Error deleting:', error);
            alert(i18n.t('images.deleteError'));
        });
    }
}

function loadImages(): void {
    const authToken = localStorage.getItem('authToken');
    const imageContent = document.getElementById('imageContent') as HTMLElement;

    fetch('/images', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then((response: Response) => {
        if (!response.ok) {
            throw new Error(i18n.t('forms.networkError'));
        }
        return response.json() as Promise<ImageData[]>;
    })
    .then((data: ImageData[]) => {
        displayImages(data);
    })
    .catch((error: Error) => {
        console.error('Error fetching images:', error);
        if (imageContent) {
            imageContent.innerHTML = `<p class="error">${i18n.t('images.loadError')}. Bitte versuchen Sie es später erneut.</p>`;
        }
    });
}

function displayImages(images: ImageData[]): void {
    const sortedImages = images.sort((a, b) => a.id - b.id);
    const imageContent = document.getElementById('imageContent') as HTMLElement;
    clearContentScreen(IMAGE_PAGE);

    // Container für die moderne Ansicht
    const container = document.createElement('div');
    container.className = 'images-container';

    // Header
    const header = document.createElement('div');
    header.className = 'images-header';
    header.textContent = i18n.t('images.management');
    container.appendChild(header);

    // Statistiken
    const stats = document.createElement('div');
    stats.className = 'image-stats';
    
    const totalImages = sortedImages.length;
    const withThumbnails = sortedImages.filter(img => img.location && (img.location.includes('-') || img.location.length > 20)).length;
    const withoutThumbnails = totalImages - withThumbnails;

    stats.innerHTML = `
        <div class="image-stat">
            <div class="image-stat-number">${totalImages}</div>
            <div class="image-stat-label">${i18n.t('images.totalImages')}</div>
        </div>
        <div class="image-stat">
            <div class="image-stat-number">${withThumbnails}</div>
            <div class="image-stat-label">${i18n.t('images.withThumbnail')}</div>
        </div>
        <div class="image-stat">
            <div class="image-stat-number">${withoutThumbnails}</div>
            <div class="image-stat-label">${i18n.t('images.withoutThumbnail')}</div>
        </div>
    `;
    container.appendChild(stats);

    // Neues Bild Button
    const newImageButton = document.createElement('button');
    newImageButton.textContent = i18n.t('images.addNewImage');
    newImageButton.className = 'btn-new-image';
    newImageButton.addEventListener('click', function(e: Event) {
        e.preventDefault();
        console.log('Button clicked');
        showImageUploadForm();
    });
    container.appendChild(newImageButton);

    // Grid für Bilder
    const grid = document.createElement('div');
    grid.className = 'images-grid';
    
    sortedImages.forEach((image: ImageData) => {
        grid.appendChild(createImageCard(image));
    });

    container.appendChild(grid);

    imageContent.appendChild(container);
}

document.addEventListener('DOMContentLoaded', function (): void {
    const imageLink = document.getElementById('imageLink') as HTMLElement;
    const imageContent = document.getElementById('imageContent') as HTMLElement;

    imageLink.addEventListener('click', function (e: Event) {
        e.preventDefault();
        loadImages();
    });
});

function createImageCard(image: ImageData): HTMLElement {
    const card = document.createElement('div');
    card.className = 'image-card';
    (card as any).dataset.imageId = image.id.toString();

    // Header mit Titel und ID
    const header = document.createElement('div');
    header.className = 'image-card-header';
    header.innerHTML = `
        <h3 class="image-card-title">${image.name}</h3>
        <span class="image-card-id">ID: ${image.id}</span>
    `;
    card.appendChild(header);

    // Thumbnail oder Placeholder
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'image-card-thumbnail';
    
    if (image.location && (image.location.includes('-') || image.location.length > 20)) {
        const thumbnail = document.createElement('img');
        thumbnail.src = `/thumbnails/${image.location}`;
        thumbnail.alt = image.name;
        thumbnail.className = 'image-thumbnail';
        thumbnailContainer.appendChild(thumbnail);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-no-thumbnail';
        placeholder.innerHTML = `
            <div class="material-icons">image</div>
            <div>${i18n.t('images.noThumbnailAvailable')}</div>
        `;
        thumbnailContainer.appendChild(placeholder);
    }
    card.appendChild(thumbnailContainer);

    // Details
    const details = document.createElement('div');
    details.className = 'image-card-details';
    details.innerHTML = `
        <div class="image-detail-row">
            <span class="image-detail-label">${i18n.t('images.type')}:</span>
            <span class="image-detail-value">${image.extension || i18n.t('images.unknown')}</span>
        </div>
        <div class="image-detail-row">
            <span class="image-detail-label">${i18n.t('images.name')}:</span>
            <span class="image-detail-value">${image.name || i18n.t('images.notAvailable')}</span>
        </div>
    `;
    card.appendChild(details);

    // Aktionen
    const actions = document.createElement('div');
    actions.className = 'image-card-actions';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-download';
    downloadBtn.innerHTML = '<span class="material-icons">download</span>' + i18n.t('images.download');
    downloadBtn.addEventListener('click', () => {
        downloadImage(image.location, `${image.name}.${image.extension}`);
    });
    actions.appendChild(downloadBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete-image';
    deleteBtn.innerHTML = '<span class="material-icons">delete</span>' + i18n.t('images.delete');
    deleteBtn.addEventListener('click', () => {
        handleDeleteImage(image.id);
    });
    actions.appendChild(deleteBtn);

    card.appendChild(actions);

    return card;
}

function downloadImage(filename: string, displayName: string): void {
    const authToken = localStorage.getItem('authToken');

    console.log('Download started for:', filename, 'as', displayName);
    const downloadUrl = `/content/${filename}`;
    console.log('Download URL:', downloadUrl);
    
    fetch(`/content/${filename}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then((response: Response) => {
        if (!response.ok) {
            throw new Error(i18n.t('forms.downloadError'));
        }
        return response.blob();
    })
    .then((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = displayName;
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    })
    .catch((error: Error) => {
        console.error('Fehler beim Herunterladen des Bildes:', error);
        alert(i18n.t('forms.downloadError') + ': ' + error.message);
    });
}