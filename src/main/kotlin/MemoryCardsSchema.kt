package com.shut


import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.SchemaUtils


// Topic removed - using LearningTopic from UserSchema.kt for group-based isolation

@Serializable
data class Image(
    var id: Long,
    var name: String,
    var extension: String,
    var location: String, // Original image hash
    var thumbnailHash: String? = null, // Thumbnail hash
    var resizedHash: String? = null, // Resized image hash
    var groupId: Int = 0, // Will be properly assigned based on user's groups
    var createdBy: Int? = null
)



// Memorycard removed - using LearningCard from UserSchema.kt for group-based isolation


// MemorycardAll removed - using LearningCard from UserSchema.kt for group-based isolation


object ImageTab : Table("image") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 30)
    val extension = varchar("extension", 5)
    val location = varchar("location", 225) // Original image hash
    val thumbnailHash = varchar("thumbnail_hash", 64).nullable() // Thumbnail hash
    val resizedHash = varchar("resized_hash", 64).nullable() // Resized image hash
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE).default(1)
    val createdBy = integer("created_by").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE).nullable()
    val createdAt = varchar("created_at", 50).nullable()
    override val primaryKey = PrimaryKey(ImageTab.id)
}

// TopicTab removed - using LearningTopicsTab from UserSchema.kt for group-based isolation


// MemoryCardsTab removed - using LearningCardsTab from UserSchema.kt for group-based isolation

// MCard_AnswersTab removed - using LearningCardsTab from UserSchema.kt for group-based isolation

class MCardService {
    fun initialize() { //separate function for initialization
        transaction {
            if (!SchemaUtils.listTables().contains("image")) {
                SchemaUtils.create(ImageTab)
            } else {
                // Add new columns if they don't exist (migration)
                try {
                    SchemaUtils.addMissingColumnsStatements(ImageTab).forEach { statement ->
                        exec(statement)
                    }
                } catch (e: Exception) {
                    // Columns might already exist, that's okay
                }
            }
            // Note: topics, memory_cards, and mcards_answers tables removed
            // Use LearningTopicsTab, LearningCardsTab from UserSchema.kt for group-based isolation
        }
    }

    fun addImage(image: Image): Long {
        return transaction {
            ImageTab.insert {
                it[ImageTab.name] = image.name
                it[ImageTab.location] = image.location
                it[ImageTab.extension] = image.extension
                it[ImageTab.thumbnailHash] = image.thumbnailHash
                it[ImageTab.resizedHash] = image.resizedHash
                it[ImageTab.groupId] = image.groupId
                it[ImageTab.createdBy] = image.createdBy
                it[ImageTab.createdAt] = java.time.ZonedDateTime.now().toString()
            } get ImageTab.id
        }
    }


    fun getImageAll(): List<Image> {
        return transaction {
            ImageTab
                .selectAll()
                .map { row -> mapToImage(row) }
        }
    }

    fun getImagesForUser(userId: Int): List<Image> {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - only see own images
                getImagesCreatedByUser(userId)
            } else {
                // User is in other groups - see all images of those groups
                getImagesForGroups(userGroups)
            }
        }
    }
    
    private fun getUserGroups(userId: Int): List<Int> {
        return UserGroupsTab.selectAll()
            .where { UserGroupsTab.userId eq userId }
            .map { it[UserGroupsTab.groupId] }
    }
    
    private fun getSingleGroupId(): Int? {
        return GroupsTab.selectAll()
            .where { GroupsTab.name eq "Single" }
            .map { it[GroupsTab.id] }
            .firstOrNull()
    }
    
    private fun getImagesCreatedByUser(userId: Int): List<Image> {
        return ImageTab.selectAll()
            .where { ImageTab.createdBy eq userId }
            .map { mapToImage(it) }
    }
    
    private fun getImagesForGroups(groupIds: List<Int>): List<Image> {
        return if (groupIds.isNotEmpty()) {
            ImageTab.selectAll()
                .where { ImageTab.groupId inList groupIds }
                .map { mapToImage(it) }
        } else {
            emptyList()
        }
    }
    
    private fun mapToImage(row: ResultRow): Image {
        return Image(
            row[ImageTab.id],
            row[ImageTab.name],
            row[ImageTab.extension],
            row[ImageTab.location],
            row[ImageTab.thumbnailHash],
            row[ImageTab.resizedHash],
            row[ImageTab.groupId],
            row[ImageTab.createdBy]
        )
    }

    fun getImagebyID(id: Long): Image {
        return transaction {
            ImageTab
                .selectAll()
                .where { ImageTab.id eq id }
                .singleOrNull()
                ?.let { row -> mapToImage(row) }
                ?: Image(-1L, "", "", "", null, null, 0, null)
        }
    }

    fun createImage(image: Image, userId: Int): Long {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            val targetGroupId = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - assign to Single group
                singleGroupId!!
            } else {
                // Use the provided group ID if valid and user has access, otherwise default to first group
                if (image.groupId > 0 && userGroups.contains(image.groupId)) {
                    image.groupId
                } else {
                    // Default to first group if provided groupId is 0 or invalid
                    userGroups.firstOrNull() ?: singleGroupId!!
                }
            }
            
            ImageTab.insert {
                it[name] = image.name
                it[location] = image.location
                it[extension] = image.extension
                it[thumbnailHash] = image.thumbnailHash
                it[resizedHash] = image.resizedHash
                it[groupId] = targetGroupId
                it[createdBy] = userId
                it[createdAt] = java.time.ZonedDateTime.now().toString()
            } get ImageTab.id
        }
    }
    
    fun updateImage(image: Image, userId: Int): Int {
        return transaction {
            val existingImage = ImageTab.selectAll()
                .where { ImageTab.id eq image.id }
                .firstOrNull()
            
            if (existingImage != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val imageGroupId = existingImage[ImageTab.groupId]
                val imageCreatedBy = existingImage[ImageTab.createdBy]
                
                val canEdit = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only edit own images
                    imageCreatedBy == userId
                } else {
                    // User is in other groups - can edit images in same groups
                    userGroups.contains(imageGroupId)
                }
                
                if (canEdit) {
                    ImageTab.update({ ImageTab.id eq image.id }) {
                        it[name] = image.name
                        it[location] = image.location
                        it[extension] = image.extension
                        it[thumbnailHash] = image.thumbnailHash
                        it[resizedHash] = image.resizedHash
                    }
                } else {
                    0
                }
            } else {
                0
            }
        }
    }
    
    fun deleteImage(id: Long, userId: Int): Int {
        return transaction {
            val existingImage = ImageTab.selectAll()
                .where { ImageTab.id eq id }
                .firstOrNull()
            
            if (existingImage != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val imageGroupId = existingImage[ImageTab.groupId]
                val imageCreatedBy = existingImage[ImageTab.createdBy]
                
                val canDelete = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only delete own images
                    imageCreatedBy == userId
                } else {
                    // User is in other groups - can delete images in same groups
                    userGroups.contains(imageGroupId)
                }
                
                if (canDelete) {
                    ImageTab.deleteWhere { ImageTab.id eq id }
                } else {
                    0
                }
            } else {
                0
            }
        }
    }


    // Legacy function replaced with group-based version


    // Legacy function replaced with group-based version

    fun deleteAllData(): Int {
        var totalDeleted = 0

        return transaction {
            totalDeleted += UnterlageMaterialTab.deleteAll()
            totalDeleted += UnterlagenTab.deleteAll()
            totalDeleted += MaterialTab.deleteAll()
            totalDeleted += PacketTab.deleteAll()
            totalDeleted += ImageTab.deleteAll()
            totalDeleted
        }
    }
}
