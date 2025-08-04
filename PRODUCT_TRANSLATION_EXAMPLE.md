# Produktübersetzungen - Verwendungsbeispiele

## Verfügbare Funktionen

```typescript
import { getProductName, getProductDescription, getProductTranslations } from './common.js';

// Produktname abrufen
const productName = getProductName(1); // "Lernkarten" (DE) / "Learning Cards" (EN)

// Produktbeschreibung abrufen  
const productDesc = getProductDescription(1); // "Effektives Lernen mit digitalen Karteikarten..."

// Beide zusammen abrufen
const product = getProductTranslations(1); 
// { name: "Lernkarten", description: "Effektives Lernen..." }
```

## Produkt-IDs und ihre Übersetzungen

| ID | Deutsch | English | Français | Nederlands |
|----|---------|---------|----------|------------|
| 1  | Lernkarten | Learning Cards | Cartes d'Apprentissage | Leerkaarten |
| 2  | Bilderverwaltung | Image Management | Gestion d'Images | Afbeeldingsbeheer |
| 3  | Buchungskarten | Billing Cards | Cartes de Facturation | Factureringskaarten |
| 4  | Lernmaterial | Learning Materials | Matériel d'Apprentissage | Leermateriaal |
| 5  | Card DMS | Card DMS | Card DMS | Card DMS |

## Verwendung im Frontend

### HTML mit dynamischen Übersetzungen
```html
<div class="product-card" data-product-id="1">
    <h3 class="product-name"><!-- Wird durch JavaScript ersetzt --></h3>
    <p class="product-description"><!-- Wird durch JavaScript ersetzt --></p>
</div>
```

### JavaScript Implementation
```javascript
// Alle Produktkarten übersetzen
document.querySelectorAll('.product-card').forEach(card => {
    const productId = parseInt(card.dataset.productId);
    const translations = getProductTranslations(productId);
    
    card.querySelector('.product-name').textContent = translations.name;
    card.querySelector('.product-description').textContent = translations.description;
});

// Bei Sprachwechsel automatisch aktualisieren
i18n.subscribe((language) => {
    // Produktkarten neu übersetzen
    updateProductCards();
});
```

### Backend Integration
```typescript
// Produkt aus Datenbank laden
interface Product {
    id: number;
    // ... andere Felder
}

// Frontend: Übersetzung anwenden
function renderProduct(product: Product) {
    return {
        id: product.id,
        name: getProductName(product.id),
        description: getProductDescription(product.id)
    };
}
```

## Automatische Sprachumschaltung

Die Übersetzungen werden automatisch aktualisiert, wenn der Benutzer die Sprache wechselt, da sie das bestehende i18n-System verwenden.

## Neue Produkte hinzufügen

Um ein neues Produkt hinzuzufügen:

1. Produkt in Datenbank mit neuer ID erstellen
2. Übersetzungen in `src/main/typescript/i18n/translations/products.ts` hinzufügen:

```typescript
'6': {
    name: 'Neues Produkt',
    description: 'Beschreibung des neuen Produkts'
}
```

3. Für alle 4 Sprachen (de, en, fr, nl) hinzufügen
4. TypeScript neu kompilieren: `npm run build`