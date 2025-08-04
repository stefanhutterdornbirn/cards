import nltk
# Dies öffnet einen NLTK Downloader, wo du 'stopwords' auswählen und herunterladen kannst.
# Wenn du es noch nicht heruntergeladen hast, wirst du dazu aufgefordert.
nltk.download('stopwords')

from nltk.corpus import stopwords

# Zugriff auf die deutsche Stoppwortliste
german_stopwords = stopwords.words('german')

# Du kannst sie ausgeben, um sie zu sehen
print(german_stopwords)

# Oder sie in eine Datei schreiben, wenn du unbedingt eine lokale Datei möchtest
with open("deutsche_stopwords_nltk.txt", "w", encoding="utf-8") as f:
    for word in german_stopwords:
        f.write(word + "\n")