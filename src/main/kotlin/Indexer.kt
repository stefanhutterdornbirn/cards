package com.shut

import java.io.FileInputStream
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.text.DecimalFormat
import kotlin.io.path.Path
import java.io.File
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import java.io.IOException
import java.nio.file.Paths

fun startIndexer() {
    index("data/data")
}

fun index(dir: String) {
    val rootDir = File(dir)

    // Überprüfen, ob das Verzeichnis existiert
    if (!rootDir.exists() || !rootDir.isDirectory) {
        println("Verzeichnis existiert nicht: $dir")
        return
    }

    // Initialize Content Addressable Storage
    val cas = ContentAddressableStorage.create()

    // Liste aller Unterverzeichnisse im Hauptverzeichnis
    val directories = rootDir.listFiles()?.filter { it.isDirectory && it.name != "store" } ?: emptyList()

    // Falls keine Unterverzeichnisse gefunden wurden
    if (directories.isEmpty()) {
        println("Keine Unterverzeichnisse im Verzeichnis $dir gefunden")
        return
    }

    // Erstelle einen Index.txt im Hauptverzeichnis
    val indexFile = File(rootDir, "Index.txt")

    // Formatierung für Dateigröße
    val sizeFormatter = DecimalFormat("#,###")

    // Map zum Tracking von bereits verarbeiteten Hashes (für Deduplizierung)
    val processedHashes = mutableMapOf<String, String>()
    var gesamtDateiAnzahl = 0
    var gesamtEinzigartigeDateien = 0
    // Beginne mit dem Schreiben in die Indexdatei

    // Lade hier die Stopwords
    val stopwords = Files.readAllLines(Paths.get("stopwords/deutsche_stopwords_nltk.txt")).toSet()

    val lms = LernmaterialService()
    lms.initialize()

    val mcardService = MCardService()

    indexFile.bufferedWriter().use { writer ->
        writer.write("Laufnummer | Verzeichnisname | Schlagwörter | Dateiname | Typ der Datei | Größe (Bytes) | ContentID\n")
        writer.write("----------------------------------------------------------------------------------------------------------\n")

        var gesamtLaufnummer = 1


        val logoImage = mcardService.getImagebyID(1)
        val packet = Packet(
            0,
            "Fragen der Zentralmatura",
            "Die Unterlagen von https://www.matura.gv.at/downloads",
            logoImage
        )
        packet.id = lms.addPacket(packet)


        // Iteriere durch alle Unterverzeichnisse
        directories.forEachIndexed { dirIndex, directory ->
            val directoryName = directory.name


            // Extrahiere Schlagwörter (Wörter getrennt durch Leerzeichen oder Bindestriche)
            val keywords = directoryName
                .split(" ", "-")
                .filter { it.isNotBlank() }
                .map { it.trim() }
                .distinct()


            val keywordString = keywords.joinToString(", ")
            val dirLaufnummer = dirIndex + 1

            // Iteriere durch alle Dateien im Verzeichnis (rekursiv)
            val files = directory.walkTopDown().filter { it.isFile }.toList()
            val materialien: MutableList<Material> = mutableListOf()

            if (files.isEmpty()) {
                // Wenn der Ordner keine Dateien enthält, schreibe trotzdem eine Zeile für den Ordner
                writer.write("$gesamtLaufnummer | $directoryName | $keywordString | - | Verzeichnis | - | -\n")
                gesamtLaufnummer++
            } else {
                // Für jede Datei im Verzeichnis eine Zeile hinzufügen

                files.forEach { file ->

                    val fileName = file.name
                    val fileExtension = fileName.substringAfterLast('.', "bin")
                    val fileSize = file.length()
                    val formattedSize = sizeFormatter.format(fileSize)

                    // Store file in CAS and get hash
                    val storageResult = cas.store(file)
                    val contentId = storageResult.hash

                    // Track if this is a new unique file
                    if (!processedHashes.containsKey(contentId)) {
                        processedHashes[contentId] = contentId
                        gesamtEinzigartigeDateien++
                    }

                    // INdex the File
                    val content = extractTextFromPdf(file.absolutePath)
                    val cleanStopwords = removeStopwords(content, stopwords)
                    if (cleanStopwords == null) throw Exception("Content darf nicht null sein")
                    // Relativer Pfad vom Verzeichnis zur Datei für bessere Übersicht
                    val relativePath = file.absolutePath.substringAfter(directory.absolutePath + File.separator)

                    writer.write("$gesamtLaufnummer | $directoryName | $keywordString | $relativePath | $fileExtension | $formattedSize | $contentId\n")
                    gesamtLaufnummer++
                    gesamtDateiAnzahl++
                    // Erzeuge die Inhalte
                    materialien.add(
                        Material(
                            0,
                            fileName,
                            fileExtension,
                            storageResult.size,
                            contentId,
                            cleanStopwords
                        )
                    )
                }
            }
            val unterlage = Unterlage(0, packet, directoryName, materialien)
            unterlage.id = lms.addUnterlage(unterlage)


            println("Verzeichnis verarbeitet: $directoryName (Laufnummer: $dirLaufnummer) - ${files.size} Dateien")
            println("Unterlage wurde in die Datenbank gespeichert $unterlage")
        }

        // Abschluss der Indexerstellung
        writer.write("----------------------------------------------------------------------------------------------------------\n")
        writer.write("Insgesamt ${directories.size} Verzeichnisse und $gesamtDateiAnzahl Dateien indiziert.")
        writer.write("\nDavon $gesamtEinzigartigeDateien einzigartige Dateien im Store-Verzeichnis gespeichert.")
    }

    println("Index wurde erfolgreich erstellt: ${indexFile.absolutePath}")
    println("Insgesamt wurden ${directories.size} Verzeichnisse und $gesamtDateiAnzahl Dateien indiziert.")
    println("Davon wurden $gesamtEinzigartigeDateien einzigartige Dateien im Store-Verzeichnis gespeichert.")
}

/**
 * Berechnet den SHA-256 Hash einer Datei
 */
fun calculateSHA256(file: File): String {
    val digest = MessageDigest.getInstance("SHA-256")
    val buffer = ByteArray(8192)
    FileInputStream(file).use { fis ->
        var bytesRead: Int
        while (fis.read(buffer).also { bytesRead = it } != -1) {
            digest.update(buffer, 0, bytesRead)
        }
    }

    // Konvertiere den Hash in einen Hex-String
    return digest.digest().joinToString("") { "%02x".format(it) }
}

fun extractTextFromPdf(filePath: String): String {
    var content: String = " "
    try {
        if (filePath.endsWith("pdf")) {
            PDDocument.load(File(filePath)).use { document ->
                if (!document.isEncrypted) {
                    val stripper = PDFTextStripper()
                    content = stripper.getText(document)
                    if (content == null) content = " "
                } else {
                    println("PDF is encrypted, cannot extract text: $filePath")
                    null
                }
            }
        }
    } catch (e: IOException) {
        println("Error extracting text from PDF $filePath: ${e.message}")
        throw e
    }
    return content
}

fun removeStopwords(textString: String, stopwordsList: Set<String>): String {
    val normalizedStopwords = stopwordsList.map { it.lowercase() }.toSet()
    val words = textString.split(Regex("\\s+")) // Teilt den String an einem oder mehreren Leerzeichen
    val filteredWords = words.filter { word ->
        val cleanedWord = word.replace(Regex("[^\\p{L}\\p{N}]+"), "").lowercase()
        cleanedWord.isNotBlank() && cleanedWord !in normalizedStopwords
    }
    return filteredWords.joinToString(" ")
}


