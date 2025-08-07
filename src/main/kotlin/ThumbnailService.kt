package com.shut

import org.imgscalr.Scalr
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.InputStream
import java.util.UUID
import javax.imageio.ImageIO

class ThumbnailService {
    companion object {
        private const val THUMBNAIL_WIDTH = 200
        private const val THUMBNAIL_HEIGHT = 200
    }

    private val cas = ContentAddressableStorage.create()
    fun createThumbnail(
        inputStream: InputStream,
        originalFilename: String,
        fileExtension: String
    ): String {
        val originalImage = ImageIO.read(inputStream)
        val thumbnail = Scalr.resize(
            originalImage,
            Scalr.Method.QUALITY,
            Scalr.Mode.FIT_TO_WIDTH,
            THUMBNAIL_WIDTH,
            THUMBNAIL_HEIGHT
        )
        
        // Convert thumbnail to byte array
        val outputStream = ByteArrayOutputStream()
        ImageIO.write(thumbnail, fileExtension, outputStream)
        val thumbnailBytes = ByteArrayInputStream(outputStream.toByteArray())
        
        // Store in CAS and return hash
        return try {
            val result = cas.store(thumbnailBytes)
            result.hash
        } catch (e: Exception) {
            println("ERROR: CAS storage failed for thumbnail: ${e.message}")
            e.printStackTrace()
            throw RuntimeException("Failed to store thumbnail in CAS: ${e.message}", e)
        }
    }
    
    fun getThumbnailStream(hash: String): InputStream? {
        // First try to find if this hash is the original image hash in database
        val thumbnailHash = findThumbnailHashForOriginal(hash)
        if (thumbnailHash != null) {
            // Use the stored thumbnail hash
            val thumbnailStream = cas.retrieveAsStream(thumbnailHash)
            if (thumbnailStream != null) {
                return thumbnailStream
            }
        }
        
        // Fallback: try to get file directly (legacy behavior or direct thumbnail hash)
        val directStream = cas.retrieveAsStream(hash)
        if (directStream != null) {
            // Check if this is already a thumbnail-sized image or original
            return directStream
        }
        
        // Last resort: generate thumbnail from original if this is an original hash
        return generateThumbnailFromOriginal(hash)
    }
    
    private fun findThumbnailHashForOriginal(originalHash: String): String? {
        return try {
            org.jetbrains.exposed.sql.transactions.transaction {
                ImageTab.selectAll()
                    .where { ImageTab.location eq originalHash }
                    .firstOrNull()
                    ?.get(ImageTab.thumbnailHash)
            }
        } catch (e: Exception) {
            null
        }
    }
    
    private fun generateThumbnailFromOriginal(originalHash: String): InputStream? {
        return try {
            val originalStream = cas.retrieveAsStream(originalHash) ?: return null
            val originalImage = ImageIO.read(originalStream)
            val thumbnail = Scalr.resize(
                originalImage,
                Scalr.Method.QUALITY,
                Scalr.Mode.FIT_TO_WIDTH,
                THUMBNAIL_WIDTH,
                THUMBNAIL_HEIGHT
            )
            
            val outputStream = ByteArrayOutputStream()
            ImageIO.write(thumbnail, "jpg", outputStream)
            ByteArrayInputStream(outputStream.toByteArray())
        } catch (e: Exception) {
            null
        }
    }
}

class ResizeService {
    companion object {
        private const val RESIZE_WIDTH = 800
        private const val RESIZE_HEIGHT = 400
    }

    private val cas = ContentAddressableStorage.create()
    fun createResized(
        inputStream: InputStream,
        originalFilename: String,
        fileExtension: String
    ): String {
        val originalImage = ImageIO.read(inputStream)
        val resized = Scalr.resize(
            originalImage,
            Scalr.Method.QUALITY,
            Scalr.Mode.FIT_TO_WIDTH,
            RESIZE_WIDTH,
            RESIZE_HEIGHT
        )
        
        // Convert resized image to byte array
        val outputStream = ByteArrayOutputStream()
        ImageIO.write(resized, fileExtension, outputStream)
        val resizedBytes = ByteArrayInputStream(outputStream.toByteArray())
        
        // Store in CAS and return hash
        return try {
            val result = cas.store(resizedBytes)
            result.hash
        } catch (e: Exception) {
            println("ERROR: CAS storage failed for resized image: ${e.message}")
            e.printStackTrace()
            throw RuntimeException("Failed to store resized image in CAS: ${e.message}", e)
        }
    }
    
    fun getResizedStream(hash: String): InputStream? {
        // First try to find if this hash is the original image hash in database
        val resizedHash = findResizedHashForOriginal(hash)
        if (resizedHash != null) {
            // Use the stored resized hash
            val resizedStream = cas.retrieveAsStream(resizedHash)
            if (resizedStream != null) {
                return resizedStream
            }
        }
        
        // Fallback: try to get file directly (legacy behavior or direct resized hash)
        val directStream = cas.retrieveAsStream(hash)
        if (directStream != null) {
            return directStream
        }
        
        // Last resort: generate resized image from original if this is an original hash
        return generateResizedFromOriginal(hash)
    }
    
    private fun findResizedHashForOriginal(originalHash: String): String? {
        return try {
            transaction {
                ImageTab.selectAll()
                    .where { ImageTab.location eq originalHash }
                    .firstOrNull()
                    ?.get(ImageTab.resizedHash)
            }
        } catch (e: Exception) {
            null
        }
    }
    
    private fun generateResizedFromOriginal(originalHash: String): InputStream? {
        return try {
            val originalStream = cas.retrieveAsStream(originalHash) ?: return null
            val originalImage = ImageIO.read(originalStream)
            val resized = Scalr.resize(
                originalImage,
                Scalr.Method.QUALITY,
                Scalr.Mode.FIT_TO_WIDTH,
                RESIZE_WIDTH,
                RESIZE_HEIGHT
            )
            
            val outputStream = ByteArrayOutputStream()
            ImageIO.write(resized, "jpg", outputStream)
            ByteArrayInputStream(outputStream.toByteArray())
        } catch (e: Exception) {
            null
        }
    }


}