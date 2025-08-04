package com.shut

import net.lingala.zip4j.ZipFile
import java.io.File

fun main(args: Array<String>) {
    unzipAllFilesInDirectory("data/ReifeAufgaben", "data/data")
}

/**
 * Entpackt alle ZIP-Dateien in einem Quellverzeichnis in ein Zielverzeichnis
 *
 * @param sourceDir Das Quellverzeichnis, das die ZIP-Dateien enthält
 * @param targetDir Das Zielverzeichnis, in dem die entpackten Dateien gespeichert werden
 */
fun unzipAllFilesInDirectory(sourceDir: String, targetDir: String) {
    // Stelle sicher, dass die Verzeichnisse existieren
    val sourceDirFile = File(sourceDir)
    val targetDirFile = File(targetDir)

    if (!sourceDirFile.exists() || !sourceDirFile.isDirectory) {
        println("Quellverzeichnis existiert nicht: $sourceDir")
        return
    }

    // Erstelle das Zielverzeichnis, falls es nicht existiert
    if (!targetDirFile.exists()) {
        targetDirFile.mkdirs()
    }

    // Finde alle ZIP-Dateien im Quellverzeichnis
    val zipFiles = sourceDirFile.listFiles { file ->
        file.isFile && file.name.lowercase().endsWith(".zip")
    }

    if (zipFiles.isNullOrEmpty()) {
        println("Keine ZIP-Dateien im Verzeichnis $sourceDir gefunden")
        return
    }

    // Entpacke jede ZIP-Datei mit zip4j
    var erfolgreichEntpackt = 0
    zipFiles.forEach { zipFile ->
        try {
            val zip = ZipFile(zipFile)
            val name = zipFile.name.substringBeforeLast(".")
            val zipTo = "${targetDir}/${name}"
            zip.extractAll(zipTo)
            println("Erfolgreich entpackt: ${zipFile.name}")
            erfolgreichEntpackt++
        } catch (e: Exception) {
            println("Fehler beim Entpacken von ${zipFile.name}: ${e.message}")
        }
    }

    println("Entpacken abgeschlossen. $erfolgreichEntpackt von ${zipFiles.size} Dateien wurden erfolgreich entpackt.")
}
