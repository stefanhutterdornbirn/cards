package com.shut


import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.koin.dsl.module
import java.time.ZonedDateTime
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString



val appModule = module {
    single { UserCredentialsService() }
    single { GroupService() }
    single { UserGroupService() }
    single { RoleService() }
    single { GroupRoleService() }
    single { ProductService() }
    single { GroupProductService() }
    single { LearningCardService() }
    single { LearningMaterialService() }
    single { LearningTopicService() }
    single { AssessmentService() }
}



// Datenklasse für die Anmeldeinformationen
@Serializable
data class UserCredentials(
    val id: Int? = null,
    val username: String,
    val password: String,
    val email: String?
)

// Datenklasse für Passwort-Änderungsanfrage
@Serializable
data class PasswordChangeRequest(
    val userId: Int,
    val newPassword: String
)

// Datenklasse für Benutzer (ohne Passwort für API-Responses)
@Serializable
data class User(
    val id: Int,
    val username: String,
    val email: String? = null
)

// Datenklasse für Gruppen
@Serializable
data class Group(
    val id: Int? = null,
    val name: String,
    val description: String? = null,
    val createdAt: String? = null
)

// Datenklasse für Benutzer-Gruppen-Zuordnung
@Serializable
data class UserGroup(
    val userId: Int,
    val groupId: Int,
    val joinedAt: String? = null
)

// Datenklasse für erweiterte Benutzerinfo mit Gruppen
@Serializable
data class UserWithGroups(
    val id: Int,
    val username: String,
    val email: String?,
    val groups: List<Group>
)

// Datenklasse für Rollen
@Serializable
data class Role(
    val id: Int? = null,
    val name: String,
    val description: String? = null,
    val permissions: List<String> = emptyList(),
    val createdAt: String? = null
)

// Datenklasse für Gruppen-Rollen-Zuordnung
@Serializable
data class GroupRole(
    val groupId: Int,
    val roleId: Int,
    val assignedAt: String? = null
)

// Datenklasse für erweiterte Gruppeninfo mit Rollen
@Serializable
data class GroupWithRoles(
    val id: Int,
    val name: String,
    val description: String?,
    val createdAt: String?,
    val roles: List<Role>
)

// Datenklasse für Produkte
@Serializable
data class Product(
    val id: Int? = null,
    val name: String,
    val description: String? = null,
    val createdAt: String? = null
)

// Datenklasse für Gruppen-Produkt-Zuordnung
@Serializable
data class GroupProduct(
    val groupId: Int,
    val productId: Int,
    val assignedAt: String? = null
)

// Datenklasse für erweiterte Produktinfo mit Gruppen
@Serializable
data class ProductWithGroups(
    val id: Int,
    val name: String,
    val description: String?,
    val createdAt: String?,
    val groups: List<Group>
)

// Datenklasse für Antworten
@Serializable
data class CardAnswer(
    val text: String,
    val isCorrect: Boolean
)

// Datenklasse für Lernkarten
@Serializable
data class LearningCard(
    val id: Int? = null,
    val title: String,
    val question: String,
    val answer: String, // JSON string containing List<CardAnswer>
    val category: String? = null,
    val difficulty: Int = 1, // 1-5
    val imageId: Long? = null, // Optional image ID
    val createdBy: Int, // User ID
    val groupId: Int = 0, // Will be properly assigned based on user's groups
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    // Helper methods for JSON answer handling
    fun getAnswersAsJson(): List<CardAnswer> {
        return try {
            Json.decodeFromString<List<CardAnswer>>(answer)
        } catch (e: Exception) {
            // Fallback for legacy newline-separated format
            answer.split('\n').filter { it.isNotBlank() }.map { line ->
                val isCorrect = line.contains("(✓)")
                val text = line.replace(Regex("^\\d+\\.\\s*"), "").replace("(✓)", "").trim()
                CardAnswer(text, isCorrect)
            }
        }
    }
    
    fun setAnswersFromJson(answers: List<CardAnswer>): LearningCard {
        return this.copy(answer = Json.encodeToString(answers))
    }
}

// Datenklasse für Lernmaterial
@Serializable
data class LearningMaterial(
    val id: Int? = null,
    val title: String,
    val description: String?,
    val content: String? = null,
    val fileUrl: String? = null,
    val materialType: String, // "document", "video", "audio", etc.
    val createdBy: Int, // User ID
    val groupId: Int = 0, // Will be properly assigned based on user's groups
    val createdAt: String? = null,
    val updatedAt: String? = null
)

// Datenklasse für Themen/Kategorien
@Serializable
data class LearningTopic(
    val id: Int? = null,
    val name: String,
    val description: String?,
    val createdBy: Int, // User ID
    val groupId: Int = 0, // Will be properly assigned based on user's groups
    val createdAt: String? = null
)

// Datenklasse für Prüfungen
@Serializable
data class Exam(
    val id: Long = 0,
    val name: String,
    val durationInSeconds: Int,
    val createdBy: Int = 0,
    val groupId: Int = 0,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val cardCount: Int = 0
)

// Datenklasse für Prüfungs-Karten-Zuordnung
@Serializable
data class ExamCard(
    val examId: Long,
    val cardId: Int,
    val orderIndex: Int = 0,
    val addedAt: String? = null
)


object UserCredentialsTab : Table("credentials") {
    val id = integer("id").autoIncrement()
    val username = varchar("username", 20).uniqueIndex()
    val password = varchar("password", 40)
    val email = varchar("email", 40).nullable()
    override val primaryKey = PrimaryKey(id)
}

object GroupsTab : Table("groups") {
    val id = integer("id").autoIncrement()
    val name = varchar("name", 50).uniqueIndex()
    val description = varchar("description", 200).nullable()
    val createdAt = varchar("created_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

object UserGroupsTab : Table("user_groups") {
    val userId = integer("user_id").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE)
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE)
    val joinedAt = varchar("joined_at", 50).nullable()
    override val primaryKey = PrimaryKey(userId, groupId)
}

object RolesTab : Table("roles") {
    val id = integer("id").autoIncrement()
    val name = varchar("name", 50).uniqueIndex()
    val description = varchar("description", 200).nullable()
    val permissions = text("permissions").nullable() // JSON array of permissions
    val createdAt = varchar("created_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

object GroupRolesTab : Table("group_roles") {
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE)
    val roleId = integer("role_id").references(RolesTab.id, onDelete = ReferenceOption.CASCADE)
    val assignedAt = varchar("assigned_at", 50).nullable()
    override val primaryKey = PrimaryKey(groupId, roleId)
}

object ProductsTab : Table("products") {
    val id = integer("id").autoIncrement()
    val name = varchar("name", 100).uniqueIndex()
    val description = varchar("description", 500).nullable()
    val createdAt = varchar("created_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

object GroupProductsTab : Table("group_products") {
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE)
    val productId = integer("product_id").references(ProductsTab.id, onDelete = ReferenceOption.CASCADE)
    val assignedAt = varchar("assigned_at", 50).nullable()
    override val primaryKey = PrimaryKey(groupId, productId)
}

object LearningCardsTab : Table("learning_cards") {
    val id = integer("id").autoIncrement()
    val title = varchar("title", 200)
    val question = text("question")
    val answer = text("answer")
    val category = varchar("category", 100).nullable()
    val difficulty = integer("difficulty").default(1)
    val imageId = long("image_id").references(ImageTab.id, onDelete = ReferenceOption.SET_NULL).nullable()
    val createdBy = integer("created_by").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE)
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = varchar("created_at", 50).nullable()
    val updatedAt = varchar("updated_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

object LearningMaterialsTab : Table("learning_materials") {
    val id = integer("id").autoIncrement()
    val title = varchar("title", 200)
    val description = text("description").nullable()
    val content = text("content").nullable()
    val fileUrl = varchar("file_url", 500).nullable()
    val materialType = varchar("material_type", 50)
    val createdBy = integer("created_by").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE)
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = varchar("created_at", 50).nullable()
    val updatedAt = varchar("updated_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

object LearningTopicsTab : Table("learning_topics") {
    val id = integer("id").autoIncrement()
    val name = varchar("name", 100)
    val description = text("description").nullable()
    val createdBy = integer("created_by").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE)
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = varchar("created_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

object ExamsTab : Table("exams") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 200)
    val durationInSeconds = integer("duration_in_seconds")
    val createdBy = integer("created_by").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE)
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = varchar("created_at", 50).nullable()
    val updatedAt = varchar("updated_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

object ExamCardsTab : Table("exam_cards") {
    val examId = long("exam_id").references(ExamsTab.id, onDelete = ReferenceOption.CASCADE)
    val cardId = integer("card_id").references(LearningCardsTab.id, onDelete = ReferenceOption.CASCADE)
    val orderIndex = integer("order_index").default(0)
    val addedAt = varchar("added_at", 50).nullable()
    override val primaryKey = PrimaryKey(examId, cardId)
}



class UserCredentialsService {
    fun initialize() { //separate function for initialization
        transaction {
            if (!SchemaUtils.listTables().contains("credentials")) {
                SchemaUtils.create(UserCredentialsTab)
            }
            
            // Create default admin user if not exists
            val adminExists = UserCredentialsTab.selectAll()
                .where { UserCredentialsTab.username eq "admin" }
                .count() > 0
            
            if (!adminExists) {
                val adminId = UserCredentialsTab.insert {
                    it[username] = "admin"
                    it[password] = "password"
                    it[email] = "admin@learningcards.system"
                } get UserCredentialsTab.id
                
                println("✅ Default admin user created: username=admin, password=password, id=$adminId")
            }
        }
    }
    
    fun setupAdminUserGroupsAndRoles() {
        transaction {
            val adminUser = UserCredentialsTab.selectAll()
                .where { UserCredentialsTab.username eq "admin" }
                .firstOrNull()
            
            if (adminUser != null) {
                val adminId = adminUser[UserCredentialsTab.id]
                
                // Add admin user to Admin group
                val adminGroup = GroupsTab.selectAll()
                    .where { GroupsTab.name eq "Admin" }
                    .firstOrNull()
                
                if (adminGroup != null) {
                    val adminGroupId = adminGroup[GroupsTab.id]
                    val userGroupExists = UserGroupsTab.selectAll()
                        .where { (UserGroupsTab.userId eq adminId) and (UserGroupsTab.groupId eq adminGroupId) }
                        .count() > 0
                    
                    if (!userGroupExists) {
                        UserGroupsTab.insert {
                            it[userId] = adminId
                            it[groupId] = adminGroupId
                            it[joinedAt] = ZonedDateTime.now().toString()
                        }
                        println("✅ Admin user added to Admin group")
                    }
                    
                    // Assign admin role to Admin group
                    val adminRole = RolesTab.selectAll()
                        .where { RolesTab.name eq "Admin" }
                        .firstOrNull()
                    
                    if (adminRole != null) {
                        val adminRoleId = adminRole[RolesTab.id]
                        val groupRoleExists = GroupRolesTab.selectAll()
                            .where { (GroupRolesTab.groupId eq adminGroupId) and (GroupRolesTab.roleId eq adminRoleId) }
                            .count() > 0
                        
                        if (!groupRoleExists) {
                            GroupRolesTab.insert {
                                it[groupId] = adminGroupId
                                it[roleId] = adminRoleId
                                it[assignedAt] = ZonedDateTime.now().toString()
                            }
                            println("✅ Admin role assigned to Admin group")
                        }
                    }
                }
            }
        }
    }

    fun getUserCredentialsById(id: Int): UserCredentials? {
        return transaction {
            UserCredentialsTab
                .selectAll()
                .where{ UserCredentialsTab.id eq id }
                .map {
                    UserCredentials(
                        id = it[UserCredentialsTab.id],
                        username = it[UserCredentialsTab.username],
                        password = it[UserCredentialsTab.password],
                        email = it[UserCredentialsTab.email]
                    )
                }
                .firstOrNull()
        }
    }

    fun getUserCredentialsByUsername(username: String): UserCredentials? {
        return transaction {
            UserCredentialsTab
                .selectAll()
                .where { UserCredentialsTab.username eq username }
                .map {
                    UserCredentials(
                        id = it[UserCredentialsTab.id],
                        username = it[UserCredentialsTab.username],
                        password = it[UserCredentialsTab.password],
                        email = it[UserCredentialsTab.email]
                    )
                }
                .firstOrNull()
        }
    }
    
    fun getAllUsersForAssignment(): List<User> {
        return transaction {
            UserCredentialsTab
                .selectAll()
                .map {
                    User(
                        id = it[UserCredentialsTab.id],
                        username = it[UserCredentialsTab.username],
                        email = it[UserCredentialsTab.email]
                    )
                }
        }
    }

    fun getUserCredentialsByEmail(email: String): UserCredentials? {
        return transaction {
            UserCredentialsTab.selectAll()
                .where{ UserCredentialsTab.email eq email }
                .map {
                    UserCredentials(
                        id = it[UserCredentialsTab.id],
                        username = it[UserCredentialsTab.username],
                        password = it[UserCredentialsTab.password],
                        email = it[UserCredentialsTab.email]
                    )
                }
                .firstOrNull()
        }
    }

    fun addUserCredentials(userCredentials: UserCredentials): Int {
        return transaction {
            UserCredentialsTab.insert {
                it[UserCredentialsTab.username] = userCredentials.username
                it[UserCredentialsTab.password] = userCredentials.password
                it[UserCredentialsTab.email] = userCredentials.email
            } get UserCredentialsTab.id
        }
    }

    fun updateUserCredentials(userCredentials: UserCredentials) {
        transaction {
            UserCredentialsTab.update({ UserCredentialsTab.email eq userCredentials.email }) {
                it[UserCredentialsTab.username] = userCredentials.username
                it[UserCredentialsTab.password] = userCredentials.password
                it[UserCredentialsTab.email] = userCredentials.email
            }
        }

    }

    fun deleteUserCredentials(userCredentials: UserCredentials) {
        transaction {
            UserCredentialsTab.deleteWhere { UserCredentialsTab.email eq userCredentials.email }
        }
    }

    fun changeUserPassword(userId: Int, newPassword: String): Boolean {
        return transaction {
            val rowsUpdated = UserCredentialsTab.update({ UserCredentialsTab.id eq userId }) {
                it[password] = newPassword
            }
            rowsUpdated > 0
        }
    }

    fun getAllUsers(): List<UserCredentials> {
        return transaction {
            UserCredentialsTab.selectAll().map {
                UserCredentials(
                    id = it[UserCredentialsTab.id],
                    username = it[UserCredentialsTab.username],
                    password = it[UserCredentialsTab.password],
                    email = it[UserCredentialsTab.email]
                )
            }
        }
    }

    fun getUserWithGroups(userId: Int): UserWithGroups? {
        return transaction {
            val user = getUserCredentialsById(userId) ?: return@transaction null
            val groups = GroupsTab
                .join(UserGroupsTab, JoinType.INNER, onColumn = GroupsTab.id, otherColumn = UserGroupsTab.groupId)
                .selectAll()
                .where { UserGroupsTab.userId eq userId }
                .map { 
                    Group(
                        id = it[GroupsTab.id],
                        name = it[GroupsTab.name],
                        description = it[GroupsTab.description],
                        createdAt = it[GroupsTab.createdAt]
                    )
                }
            
            UserWithGroups(
                id = user.id!!,
                username = user.username,
                email = user.email,
                groups = groups
            )
        }
    }
}

class GroupService {
    fun initialize() {
        transaction {
            if (!SchemaUtils.listTables().contains("groups")) {
                SchemaUtils.create(GroupsTab)
            }
            
            // Check if "Single" group exists, create if not
            val singleGroupExists = GroupsTab.selectAll()
                .where { GroupsTab.name eq "Single" }
                .count() > 0
            
            if (!singleGroupExists) {
                GroupsTab.insert {
                    it[name] = "Single"
                    it[description] = "Default group for individual users"
                    it[createdAt] = ZonedDateTime.now().toString()
                }
            }
            
            // Check if "Admin" group exists, create if not
            val adminGroupExists = GroupsTab.selectAll()
                .where { GroupsTab.name eq "Admin" }
                .count() > 0
            
            if (!adminGroupExists) {
                val adminGroupId = GroupsTab.insert {
                    it[name] = "Admin"
                    it[description] = "System administrators with full access"
                    it[createdAt] = ZonedDateTime.now().toString()
                } get GroupsTab.id
                
                println("✅ Admin group created: id=$adminGroupId")
            }
        }
    }

    fun getAllGroups(): List<Group> {
        return transaction {
            GroupsTab.selectAll().map {
                Group(
                    id = it[GroupsTab.id],
                    name = it[GroupsTab.name],
                    description = it[GroupsTab.description],
                    createdAt = it[GroupsTab.createdAt].toString()
                )
            }
        }
    }

    fun getGroupById(id: Int): Group? {
        return transaction {
            GroupsTab.selectAll()
                .where { GroupsTab.id eq id }
                .map {
                    Group(
                        id = it[GroupsTab.id],
                        name = it[GroupsTab.name],
                        description = it[GroupsTab.description],
                        createdAt = it[GroupsTab.createdAt]
                    )
                }
                .firstOrNull()
        }
    }

    fun getGroupByName(name: String): Group? {
        return transaction {
            GroupsTab.selectAll()
                .where { GroupsTab.name eq name }
                .map {
                    Group(
                        id = it[GroupsTab.id],
                        name = it[GroupsTab.name],
                        description = it[GroupsTab.description],
                        createdAt = it[GroupsTab.createdAt]
                    )
                }
                .firstOrNull()
        }
    }

    fun createGroup(group: Group): Int {
        return transaction {
            GroupsTab.insert {
                it[name] = group.name
                it[description] = group.description
                it[createdAt] = ZonedDateTime.now().toString()
            } get GroupsTab.id
        }
    }

    fun updateGroup(id: Int, group: Group) {
        transaction {
            GroupsTab.update({ GroupsTab.id eq id }) {
                it[name] = group.name
                it[description] = group.description
            }
        }
    }

    fun deleteGroup(id: Int) {
        transaction {
            GroupsTab.deleteWhere { GroupsTab.id eq id }
        }
    }

    fun getGroupMembers(groupId: Int): List<UserCredentials> {
        return transaction {
            UserCredentialsTab
                .join(UserGroupsTab, JoinType.INNER, onColumn = UserCredentialsTab.id, otherColumn = UserGroupsTab.userId)
                .selectAll()
                .where { UserGroupsTab.groupId eq groupId }
                .map {
                    UserCredentials(
                        id = it[UserCredentialsTab.id],
                        username = it[UserCredentialsTab.username],
                        password = it[UserCredentialsTab.password],
                        email = it[UserCredentialsTab.email]
                    )
                }
        }
    }
}

class UserGroupService {
    fun initialize() {
        transaction {
            if (!SchemaUtils.listTables().contains("user_groups")) {
                SchemaUtils.create(UserGroupsTab)
            }
        }
    }

    fun addUserToGroup(userId: Int, groupId: Int) {
        transaction {
            UserGroupsTab.insert {
                it[UserGroupsTab.userId] = userId
                it[UserGroupsTab.groupId] = groupId
                it[joinedAt] = ZonedDateTime.now().toString()
            }
        }
    }

    fun removeUserFromGroup(userId: Int, groupId: Int) {
        transaction {
            UserGroupsTab.deleteWhere { 
                (UserGroupsTab.userId eq userId) and (UserGroupsTab.groupId eq groupId)
            }
        }
    }

    fun getUserGroups(userId: Int): List<Group> {
        return transaction {
            GroupsTab
                .join(UserGroupsTab, JoinType.INNER, onColumn = GroupsTab.id, otherColumn = UserGroupsTab.groupId)
                .selectAll()
                .where { UserGroupsTab.userId eq userId }
                .map {
                    Group(
                        id = it[GroupsTab.id],
                        name = it[GroupsTab.name],
                        description = it[GroupsTab.description],
                        createdAt = it[GroupsTab.createdAt]
                    )
                }
        }
    }

    fun isUserInGroup(userId: Int, groupId: Int): Boolean {
        return transaction {
            UserGroupsTab.selectAll()
                .where { (UserGroupsTab.userId eq userId) and (UserGroupsTab.groupId eq groupId) }
                .count() > 0
        }
    }

    fun addUserToDefaultGroup(userId: Int) {
        transaction {
            val singleGroup = GroupsTab.selectAll()
                .where { GroupsTab.name eq "Single" }
                .firstOrNull()
            
            if (singleGroup != null) {
                val groupId = singleGroup[GroupsTab.id]
                if (!isUserInGroup(userId, groupId)) {
                    addUserToGroup(userId, groupId)
                }
            }
        }
    }
}

class RoleService {
    fun initialize() {
        transaction {
            if (!SchemaUtils.listTables().contains("roles")) {
                SchemaUtils.create(RolesTab)
                
                // Create default roles
                createDefaultRoles()
            }
        }
    }
    
    private fun createDefaultRoles() {
        val defaultRoles = listOf(
            Role(
                name = "Admin",
                description = "Vollzugriff auf alle Funktionen",
                permissions = listOf("user.manage", "group.manage", "role.manage", "product.manage", "content.manage", "system.admin")
            ),
            Role(
                name = "User",
                description = "Standard-Benutzerrechte",
                permissions = listOf("content.read", "content.create", "content.edit.own")
            ),
            Role(
                name = "Guest",
                description = "Nur Lesezugriff",
                permissions = listOf("content.read")
            )
        )
        
        defaultRoles.forEach { role ->
            val roleExists = RolesTab.selectAll()
                .where { RolesTab.name eq role.name }
                .count() > 0
            
            if (!roleExists) {
                RolesTab.insert {
                    it[name] = role.name
                    it[description] = role.description
                    it[permissions] = Json.encodeToString(role.permissions)
                    it[createdAt] = ZonedDateTime.now().toString()
                }
            }
        }
    }

    fun getAllRoles(): List<Role> {
        return transaction {
            RolesTab.selectAll().map {
                Role(
                    id = it[RolesTab.id],
                    name = it[RolesTab.name],
                    description = it[RolesTab.description],
                    permissions = it[RolesTab.permissions]?.let { perms ->
                        Json.decodeFromString<List<String>>(perms)
                    } ?: emptyList(),
                    createdAt = it[RolesTab.createdAt]
                )
            }
        }
    }

    fun getRoleById(id: Int): Role? {
        return transaction {
            RolesTab.selectAll()
                .where { RolesTab.id eq id }
                .map {
                    Role(
                        id = it[RolesTab.id],
                        name = it[RolesTab.name],
                        description = it[RolesTab.description],
                        permissions = it[RolesTab.permissions]?.let { perms ->
                            Json.decodeFromString<List<String>>(perms)
                        } ?: emptyList(),
                        createdAt = it[RolesTab.createdAt]
                    )
                }
                .firstOrNull()
        }
    }

    fun getRoleByName(name: String): Role? {
        return transaction {
            RolesTab.selectAll()
                .where { RolesTab.name eq name }
                .map {
                    Role(
                        id = it[RolesTab.id],
                        name = it[RolesTab.name],
                        description = it[RolesTab.description],
                        permissions = it[RolesTab.permissions]?.let { perms ->
                            Json.decodeFromString<List<String>>(perms)
                        } ?: emptyList(),
                        createdAt = it[RolesTab.createdAt]
                    )
                }
                .firstOrNull()
        }
    }

    fun createRole(role: Role): Int {
        return transaction {
            RolesTab.insert {
                it[name] = role.name
                it[description] = role.description
                it[permissions] = Json.encodeToString(role.permissions)
                it[createdAt] = ZonedDateTime.now().toString()
            } get RolesTab.id
        }
    }

    fun updateRole(id: Int, role: Role) {
        transaction {
            RolesTab.update({ RolesTab.id eq id }) {
                it[name] = role.name
                it[description] = role.description
                it[permissions] = Json.encodeToString(role.permissions)
            }
        }
    }

    fun deleteRole(id: Int) {
        transaction {
            RolesTab.deleteWhere { RolesTab.id eq id }
        }
    }
}

class GroupRoleService {
    fun initialize() {
        transaction {
            if (!SchemaUtils.listTables().contains("group_roles")) {
                SchemaUtils.create(GroupRolesTab)
                
                // Assign default "User" role to "Single" group
                assignDefaultRoleToSingleGroup()
            }
        }
    }
    
    private fun assignDefaultRoleToSingleGroup() {
        val singleGroup = GroupsTab.selectAll()
            .where { GroupsTab.name eq "Single" }
            .firstOrNull()
        
        val userRole = RolesTab.selectAll()
            .where { RolesTab.name eq "User" }
            .firstOrNull()
        
        if (singleGroup != null && userRole != null) {
            val groupId = singleGroup[GroupsTab.id]
            val roleId = userRole[RolesTab.id]
            
            val assignmentExists = GroupRolesTab.selectAll()
                .where { (GroupRolesTab.groupId eq groupId) and (GroupRolesTab.roleId eq roleId) }
                .count() > 0
            
            if (!assignmentExists) {
                GroupRolesTab.insert {
                    it[GroupRolesTab.groupId] = groupId
                    it[GroupRolesTab.roleId] = roleId
                    it[assignedAt] = ZonedDateTime.now().toString()
                }
            }
        }
    }

    fun assignRoleToGroup(groupId: Int, roleId: Int) {
        transaction {
            GroupRolesTab.insert {
                it[GroupRolesTab.groupId] = groupId
                it[GroupRolesTab.roleId] = roleId
                it[assignedAt] = ZonedDateTime.now().toString()
            }
        }
    }

    fun removeRoleFromGroup(groupId: Int, roleId: Int) {
        transaction {
            GroupRolesTab.deleteWhere {
                (GroupRolesTab.groupId eq groupId) and (GroupRolesTab.roleId eq roleId)
            }
        }
    }

    fun getGroupRoles(groupId: Int): List<Role> {
        return transaction {
            RolesTab
                .join(GroupRolesTab, JoinType.INNER, onColumn = RolesTab.id, otherColumn = GroupRolesTab.roleId)
                .selectAll()
                .where { GroupRolesTab.groupId eq groupId }
                .map {
                    Role(
                        id = it[RolesTab.id],
                        name = it[RolesTab.name],
                        description = it[RolesTab.description],
                        permissions = it[RolesTab.permissions]?.let { perms ->
                            Json.decodeFromString<List<String>>(perms)
                        } ?: emptyList(),
                        createdAt = it[RolesTab.createdAt]
                    )
                }
        }
    }

    fun getRoleGroups(roleId: Int): List<Group> {
        return transaction {
            GroupsTab
                .join(GroupRolesTab, JoinType.INNER, onColumn = GroupsTab.id, otherColumn = GroupRolesTab.groupId)
                .selectAll()
                .where { GroupRolesTab.roleId eq roleId }
                .map {
                    Group(
                        id = it[GroupsTab.id],
                        name = it[GroupsTab.name],
                        description = it[GroupsTab.description],
                        createdAt = it[GroupsTab.createdAt]
                    )
                }
        }
    }

    fun isRoleAssignedToGroup(groupId: Int, roleId: Int): Boolean {
        return transaction {
            GroupRolesTab.selectAll()
                .where { (GroupRolesTab.groupId eq groupId) and (GroupRolesTab.roleId eq roleId) }
                .count() > 0
        }
    }

    fun getGroupWithRoles(groupId: Int): GroupWithRoles? {
        return transaction {
            val group = GroupsTab.selectAll()
                .where { GroupsTab.id eq groupId }
                .firstOrNull() ?: return@transaction null
            
            val roles = getGroupRoles(groupId)
            
            GroupWithRoles(
                id = group[GroupsTab.id],
                name = group[GroupsTab.name],
                description = group[GroupsTab.description],
                createdAt = group[GroupsTab.createdAt],
                roles = roles
            )
        }
    }
}

class ProductService {
    fun initialize() {
        transaction {
            if (!SchemaUtils.listTables().contains("products")) {
                SchemaUtils.create(ProductsTab)
                
                // Create default products
                createDefaultProducts()
            }
        }
    }
    
    private fun createDefaultProducts() {
        val defaultProducts = listOf(
            Product(
                name = "Lernkarten",
                description = "Zugriff auf das Lernkarten-System"
            ),
            Product(
                name = "Bilderverwaltung",
                description = "Zugriff auf die Bilderverwaltung"
            ),
            Product(
                name = "Buchungskarten",
                description = "Zugriff auf Buchungskarten-Funktionen"
            ),
            Product(
                name = "Lernmaterial",
                description = "Zugriff auf Lernmaterial und Unterlagen"
            ),
            Product(
                name = "Card DMS",
                description = "Zugriff auf das Dokumentenmanagement-System"
            )
        )
        
        defaultProducts.forEach { product ->
            val productExists = ProductsTab.selectAll()
                .where { ProductsTab.name eq product.name }
                .count() > 0
            
            if (!productExists) {
                ProductsTab.insert {
                    it[name] = product.name
                    it[description] = product.description
                    it[createdAt] = ZonedDateTime.now().toString()
                }
            }
        }
    }

    fun getAllProducts(): List<Product> {
        return transaction {
            ProductsTab.selectAll().map {
                Product(
                    id = it[ProductsTab.id],
                    name = it[ProductsTab.name],
                    description = it[ProductsTab.description],
                    createdAt = it[ProductsTab.createdAt]
                )
            }
        }
    }

    fun getProductById(id: Int): Product? {
        return transaction {
            ProductsTab.selectAll()
                .where { ProductsTab.id eq id }
                .map {
                    Product(
                        id = it[ProductsTab.id],
                        name = it[ProductsTab.name],
                        description = it[ProductsTab.description],
                        createdAt = it[ProductsTab.createdAt]
                    )
                }
                .firstOrNull()
        }
    }

    fun getProductByName(name: String): Product? {
        return transaction {
            ProductsTab.selectAll()
                .where { ProductsTab.name eq name }
                .map {
                    Product(
                        id = it[ProductsTab.id],
                        name = it[ProductsTab.name],
                        description = it[ProductsTab.description],
                        createdAt = it[ProductsTab.createdAt]
                    )
                }
                .firstOrNull()
        }
    }

    fun createProduct(product: Product): Int {
        return transaction {
            ProductsTab.insert {
                it[name] = product.name
                it[description] = product.description
                it[createdAt] = ZonedDateTime.now().toString()
            } get ProductsTab.id
        }
    }

    fun updateProduct(id: Int, product: Product) {
        transaction {
            ProductsTab.update({ ProductsTab.id eq id }) {
                it[name] = product.name
                it[description] = product.description
            }
        }
    }

    fun deleteProduct(id: Int) {
        transaction {
            ProductsTab.deleteWhere { ProductsTab.id eq id }
        }
    }

    fun getProductGroups(productId: Int): List<Group> {
        return transaction {
            GroupsTab
                .join(GroupProductsTab, JoinType.INNER, onColumn = GroupsTab.id, otherColumn = GroupProductsTab.groupId)
                .selectAll()
                .where { GroupProductsTab.productId eq productId }
                .map {
                    Group(
                        id = it[GroupsTab.id],
                        name = it[GroupsTab.name],
                        description = it[GroupsTab.description],
                        createdAt = it[GroupsTab.createdAt]
                    )
                }
        }
    }
}

class GroupProductService {
    fun initialize() {
        transaction {
            if (!SchemaUtils.listTables().contains("group_products")) {
                SchemaUtils.create(GroupProductsTab)
                
                // Assign default products to "Single" group
                assignDefaultProductsToSingleGroup()
            }
        }
    }
    
    private fun assignDefaultProductsToSingleGroup() {
        val singleGroup = GroupsTab.selectAll()
            .where { GroupsTab.name eq "Single" }
            .firstOrNull()
        
        if (singleGroup != null) {
            val groupId = singleGroup[GroupsTab.id]
            
            // Assign all default products to Single group
            val defaultProductNames = listOf("Lernkarten", "Bilderverwaltung", "Buchungskarten", "Lernmaterial")
            
            defaultProductNames.forEach { productName ->
                val product = ProductsTab.selectAll()
                    .where { ProductsTab.name eq productName }
                    .firstOrNull()
                
                if (product != null) {
                    val productId = product[ProductsTab.id]
                    val assignmentExists = GroupProductsTab.selectAll()
                        .where { (GroupProductsTab.groupId eq groupId) and (GroupProductsTab.productId eq productId) }
                        .count() > 0
                    
                    if (!assignmentExists) {
                        GroupProductsTab.insert {
                            it[GroupProductsTab.groupId] = groupId
                            it[GroupProductsTab.productId] = productId
                            it[assignedAt] = ZonedDateTime.now().toString()
                        }
                    }
                }
            }
        }
    }

    fun assignProductToGroup(groupId: Int, productId: Int) {
        transaction {
            GroupProductsTab.insert {
                it[GroupProductsTab.groupId] = groupId
                it[GroupProductsTab.productId] = productId
                it[assignedAt] = ZonedDateTime.now().toString()
            }
        }
    }

    fun removeProductFromGroup(groupId: Int, productId: Int) {
        transaction {
            GroupProductsTab.deleteWhere {
                (GroupProductsTab.groupId eq groupId) and (GroupProductsTab.productId eq productId)
            }
        }
    }

    fun getGroupProducts(groupId: Int): List<Product> {
        return transaction {
            ProductsTab
                .join(GroupProductsTab, JoinType.INNER, onColumn = ProductsTab.id, otherColumn = GroupProductsTab.productId)
                .selectAll()
                .where { GroupProductsTab.groupId eq groupId }
                .map {
                    Product(
                        id = it[ProductsTab.id],
                        name = it[ProductsTab.name],
                        description = it[ProductsTab.description],
                        createdAt = it[ProductsTab.createdAt]
                    )
                }
        }
    }

    fun getProductGroups(productId: Int): List<Group> {
        return transaction {
            GroupsTab
                .join(GroupProductsTab, JoinType.INNER, onColumn = GroupsTab.id, otherColumn = GroupProductsTab.groupId)
                .selectAll()
                .where { GroupProductsTab.productId eq productId }
                .map {
                    Group(
                        id = it[GroupsTab.id],
                        name = it[GroupsTab.name],
                        description = it[GroupsTab.description],
                        createdAt = it[GroupsTab.createdAt]
                    )
                }
        }
    }

    fun isProductAssignedToGroup(groupId: Int, productId: Int): Boolean {
        return transaction {
            GroupProductsTab.selectAll()
                .where { (GroupProductsTab.groupId eq groupId) and (GroupProductsTab.productId eq productId) }
                .count() > 0
        }
    }

    fun getProductWithGroups(productId: Int): ProductWithGroups? {
        return transaction {
            val product = ProductsTab.selectAll()
                .where { ProductsTab.id eq productId }
                .firstOrNull() ?: return@transaction null
            
            val groups = getProductGroups(productId)
            
            ProductWithGroups(
                id = product[ProductsTab.id],
                name = product[ProductsTab.name],
                description = product[ProductsTab.description],
                createdAt = product[ProductsTab.createdAt],
                groups = groups
            )
        }
    }

    fun getUserProducts(userId: Int): List<Product> {
        return transaction {
            val userGroups = GroupsTab
                .join(UserGroupsTab, JoinType.INNER, onColumn = GroupsTab.id, otherColumn = UserGroupsTab.groupId)
                .selectAll()
                .where { UserGroupsTab.userId eq userId }
                .map { it[GroupsTab.id] }
            
            if (userGroups.isNotEmpty()) {
                ProductsTab
                    .join(GroupProductsTab, JoinType.INNER, onColumn = ProductsTab.id, otherColumn = GroupProductsTab.productId)
                    .selectAll()
                    .where { GroupProductsTab.groupId inList userGroups }
                    .distinctBy { it[ProductsTab.id] }
                    .map {
                        Product(
                            id = it[ProductsTab.id],
                            name = it[ProductsTab.name],
                            description = it[ProductsTab.description],
                            createdAt = it[ProductsTab.createdAt]
                        )
                    }
            } else {
                emptyList()
            }
        }
    }
}

// Service für gruppenbasierte Lernkarten
class LearningCardService {
    fun initialize() {
        transaction {
            if (!SchemaUtils.listTables().contains("learning_cards")) {
                SchemaUtils.create(LearningCardsTab)
            } else {
                // Add imageId column if it doesn't exist (migration)
                try {
                    SchemaUtils.addMissingColumnsStatements(LearningCardsTab).forEach { statement ->
                        exec(statement)
                    }
                } catch (e: Exception) {
                    // Column might already exist, that's okay
                }
            }
            
            // Initialize exam tables
            if (!SchemaUtils.listTables().contains("exams")) {
                SchemaUtils.create(ExamsTab)
            }
            
            if (!SchemaUtils.listTables().contains("exam_cards")) {
                SchemaUtils.create(ExamCardsTab)
            }
            
            // Initialize assessment tables
            if (!SchemaUtils.listTables().contains("assessments")) {
                SchemaUtils.create(AssessmentsTab)
            }
            
            if (!SchemaUtils.listTables().contains("assessment_users")) {
                SchemaUtils.create(AssessmentUsersTab)
            }
        }
    }
    
    fun getCardsForUser(userId: Int): List<LearningCard> {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - only see own cards
                getCardsCreatedByUser(userId)
            } else {
                // User is in other groups - see all cards of those groups
                getCardsForGroups(userGroups)
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
    
    private fun getCardsCreatedByUser(userId: Int): List<LearningCard> {
        return LearningCardsTab.selectAll()
            .where { LearningCardsTab.createdBy eq userId }
            .map { mapToLearningCard(it) }
    }
    
    private fun getCardsForGroups(groupIds: List<Int>): List<LearningCard> {
        return if (groupIds.isNotEmpty()) {
            LearningCardsTab.selectAll()
                .where { LearningCardsTab.groupId inList groupIds }
                .map { mapToLearningCard(it) }
        } else {
            emptyList()
        }
    }
    
    fun createCard(card: LearningCard, userId: Int): Int {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            val targetGroupId = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - assign to Single group
                singleGroupId!!
            } else {
                // Use the provided group ID if valid and user has access, otherwise default to first group
                if (card.groupId > 0 && userGroups.contains(card.groupId)) {
                    card.groupId
                } else {
                    // Default to first group if provided groupId is 0 or invalid
                    userGroups.firstOrNull() ?: singleGroupId!!
                }
            }
            
            LearningCardsTab.insert {
                it[title] = card.title
                it[question] = card.question
                it[answer] = card.answer
                it[category] = card.category
                it[difficulty] = card.difficulty
                it[imageId] = card.imageId
                it[createdBy] = userId
                it[groupId] = targetGroupId
                it[createdAt] = java.time.ZonedDateTime.now().toString()
                it[updatedAt] = java.time.ZonedDateTime.now().toString()
            } get LearningCardsTab.id
        }
    }
    
    fun updateCard(cardId: Int, updatedCard: LearningCard, userId: Int): Boolean {
        return transaction {
            val existingCard = LearningCardsTab.selectAll()
                .where { LearningCardsTab.id eq cardId }
                .firstOrNull()
            
            if (existingCard != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val cardGroupId = existingCard[LearningCardsTab.groupId]
                val cardCreatedBy = existingCard[LearningCardsTab.createdBy]
                
                val canEdit = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only edit own cards
                    cardCreatedBy == userId
                } else {
                    // User is in other groups - can edit cards in same groups
                    userGroups.contains(cardGroupId)
                }
                
                if (canEdit) {
                    LearningCardsTab.update({ LearningCardsTab.id eq cardId }) {
                        it[title] = updatedCard.title
                        it[question] = updatedCard.question
                        it[answer] = updatedCard.answer
                        it[category] = updatedCard.category
                        it[difficulty] = updatedCard.difficulty
                        it[imageId] = updatedCard.imageId
                        it[updatedAt] = java.time.ZonedDateTime.now().toString()
                    }
                    true
                } else {
                    false
                }
            } else {
                false
            }
        }
    }
    
    fun deleteCard(cardId: Int, userId: Int): Boolean {
        return transaction {
            val existingCard = LearningCardsTab.selectAll()
                .where { LearningCardsTab.id eq cardId }
                .firstOrNull()
            
            if (existingCard != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val cardGroupId = existingCard[LearningCardsTab.groupId]
                val cardCreatedBy = existingCard[LearningCardsTab.createdBy]
                
                val canDelete = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only delete own cards
                    cardCreatedBy == userId
                } else {
                    // User is in other groups - can delete cards in same groups
                    userGroups.contains(cardGroupId)
                }
                
                if (canDelete) {
                    LearningCardsTab.deleteWhere { LearningCardsTab.id eq cardId }
                    true
                } else {
                    false
                }
            } else {
                false
            }
        }
    }
    
    private fun mapToLearningCard(row: ResultRow): LearningCard {
        return LearningCard(
            id = row[LearningCardsTab.id],
            title = row[LearningCardsTab.title],
            question = row[LearningCardsTab.question],
            answer = row[LearningCardsTab.answer],
            category = row[LearningCardsTab.category],
            difficulty = row[LearningCardsTab.difficulty],
            imageId = row[LearningCardsTab.imageId],
            createdBy = row[LearningCardsTab.createdBy],
            groupId = row[LearningCardsTab.groupId],
            createdAt = row[LearningCardsTab.createdAt],
            updatedAt = row[LearningCardsTab.updatedAt]
        )
    }
    
    // Exam Management Methods
    fun getExamsForUser(userId: Int): List<Exam> {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - only see own exams
                getExamsCreatedByUser(userId)
            } else {
                // User is in other groups - see all exams of those groups
                getExamsForGroups(userGroups)
            }
        }
    }
    
    private fun getExamsCreatedByUser(userId: Int): List<Exam> {
        return ExamsTab.selectAll()
            .where { ExamsTab.createdBy eq userId }
            .map { mapToExam(it) }
    }
    
    private fun getExamsForGroups(groupIds: List<Int>): List<Exam> {
        return if (groupIds.isNotEmpty()) {
            ExamsTab.selectAll()
                .where { ExamsTab.groupId inList groupIds }
                .map { mapToExam(it) }
        } else {
            emptyList()
        }
    }
    
    fun createExam(exam: Exam, userId: Int): Long {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            val targetGroupId = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - assign to Single group
                singleGroupId!!
            } else {
                // Use the provided group ID if valid and user has access, otherwise default to first group
                if (exam.groupId > 0 && userGroups.contains(exam.groupId)) {
                    exam.groupId
                } else {
                    // Default to first group if provided groupId is 0 or invalid
                    userGroups.firstOrNull() ?: singleGroupId!!
                }
            }
            
            ExamsTab.insert {
                it[name] = exam.name
                it[durationInSeconds] = exam.durationInSeconds
                it[createdBy] = userId
                it[groupId] = targetGroupId
                it[createdAt] = java.time.ZonedDateTime.now().toString()
                it[updatedAt] = java.time.ZonedDateTime.now().toString()
            } get ExamsTab.id
        }
    }
    
    fun updateExam(exam: Exam, userId: Int): Int {
        return transaction {
            val existingExam = ExamsTab.selectAll()
                .where { ExamsTab.id eq exam.id }
                .firstOrNull()
            
            if (existingExam != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val examGroupId = existingExam[ExamsTab.groupId]
                val examCreatedBy = existingExam[ExamsTab.createdBy]
                
                val canEdit = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only edit own exams
                    examCreatedBy == userId
                } else {
                    // User is in other groups - can edit exams in same groups
                    userGroups.contains(examGroupId)
                }
                
                if (canEdit) {
                    ExamsTab.update({ ExamsTab.id eq exam.id }) {
                        it[name] = exam.name
                        it[durationInSeconds] = exam.durationInSeconds
                        it[updatedAt] = java.time.ZonedDateTime.now().toString()
                    }
                    1
                } else {
                    0
                }
            } else {
                0
            }
        }
    }
    
    fun deleteExam(examId: Long, userId: Int): Int {
        return transaction {
            val existingExam = ExamsTab.selectAll()
                .where { ExamsTab.id eq examId }
                .firstOrNull()
            
            if (existingExam != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val examGroupId = existingExam[ExamsTab.groupId]
                val examCreatedBy = existingExam[ExamsTab.createdBy]
                
                val canDelete = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only delete own exams
                    examCreatedBy == userId
                } else {
                    // User is in other groups - can delete exams in same groups
                    userGroups.contains(examGroupId)
                }
                
                if (canDelete) {
                    // First delete all exam cards
                    ExamCardsTab.deleteWhere { ExamCardsTab.examId eq examId }
                    // Then delete the exam
                    ExamsTab.deleteWhere { ExamsTab.id eq examId }
                    1
                } else {
                    0
                }
            } else {
                0
            }
        }
    }
    
    fun addCardToExam(examId: Long, cardId: Int, userId: Int): Boolean {
        return transaction {
            // Check if user has access to the exam
            val exam = ExamsTab.selectAll()
                .where { ExamsTab.id eq examId }
                .firstOrNull()
            
            if (exam != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val examGroupId = exam[ExamsTab.groupId]
                val examCreatedBy = exam[ExamsTab.createdBy]
                
                val hasAccess = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only modify own exams
                    examCreatedBy == userId
                } else {
                    // User is in other groups - can modify exams in same groups
                    userGroups.contains(examGroupId)
                }
                
                if (hasAccess) {
                    // Check if card already in exam
                    val cardExists = ExamCardsTab.selectAll()
                        .where { (ExamCardsTab.examId eq examId) and (ExamCardsTab.cardId eq cardId) }
                        .count() > 0
                    
                    if (!cardExists) {
                        // Get next order index
                        val maxOrder = ExamCardsTab.selectAll()
                            .where { ExamCardsTab.examId eq examId }
                            .maxByOrNull { it[ExamCardsTab.orderIndex] }
                            ?.get(ExamCardsTab.orderIndex) ?: -1
                        
                        ExamCardsTab.insert {
                            it[ExamCardsTab.examId] = examId
                            it[ExamCardsTab.cardId] = cardId
                            it[orderIndex] = maxOrder + 1
                            it[addedAt] = java.time.ZonedDateTime.now().toString()
                        }
                        true
                    } else {
                        false // Card already in exam
                    }
                } else {
                    false // No access
                }
            } else {
                false // Exam not found
            }
        }
    }
    
    fun removeCardFromExam(examId: Long, cardId: Int, userId: Int): Boolean {
        return transaction {
            // Check if user has access to the exam
            val exam = ExamsTab.selectAll()
                .where { ExamsTab.id eq examId }
                .firstOrNull()
            
            if (exam != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val examGroupId = exam[ExamsTab.groupId]
                val examCreatedBy = exam[ExamsTab.createdBy]
                
                val hasAccess = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only modify own exams
                    examCreatedBy == userId
                } else {
                    // User is in other groups - can modify exams in same groups
                    userGroups.contains(examGroupId)
                }
                
                if (hasAccess) {
                    val rowsAffected = ExamCardsTab.deleteWhere { 
                        (ExamCardsTab.examId eq examId) and (ExamCardsTab.cardId eq cardId) 
                    }
                    rowsAffected > 0
                } else {
                    false // No access
                }
            } else {
                false // Exam not found
            }
        }
    }
    
    fun getExamCards(examId: Long, userId: Int): List<LearningCard> {
        return transaction {
            // Check if user has access to the exam
            val exam = ExamsTab.selectAll()
                .where { ExamsTab.id eq examId }
                .firstOrNull()
            
            if (exam != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val examGroupId = exam[ExamsTab.groupId]
                val examCreatedBy = exam[ExamsTab.createdBy]
                
                val hasAccess = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only view own exams
                    examCreatedBy == userId
                } else {
                    // User is in other groups - can view exams in same groups
                    userGroups.contains(examGroupId)
                }
                
                if (hasAccess) {
                    LearningCardsTab
                        .join(ExamCardsTab, JoinType.INNER, onColumn = LearningCardsTab.id, otherColumn = ExamCardsTab.cardId)
                        .selectAll()
                        .where { ExamCardsTab.examId eq examId }
                        .orderBy(ExamCardsTab.orderIndex)
                        .map { mapToLearningCard(it) }
                } else {
                    emptyList()
                }
            } else {
                emptyList()
            }
        }
    }
    
    private fun mapToExam(row: ResultRow): Exam {
        val examId = row[ExamsTab.id]
        val cardCount = ExamCardsTab.selectAll()
            .where { ExamCardsTab.examId eq examId }
            .count()
        
        return Exam(
            id = examId,
            name = row[ExamsTab.name],
            durationInSeconds = row[ExamsTab.durationInSeconds],
            createdBy = row[ExamsTab.createdBy],
            groupId = row[ExamsTab.groupId],
            createdAt = row[ExamsTab.createdAt],
            updatedAt = row[ExamsTab.updatedAt],
            cardCount = cardCount.toInt()
        )
    }
}

// Service für gruppenbasierte Lernmaterialien
class LearningMaterialService {
    fun initialize() {
        transaction {
            if (!SchemaUtils.listTables().contains("learning_materials")) {
                SchemaUtils.create(LearningMaterialsTab)
            }
        }
    }
    
    fun getMaterialsForUser(userId: Int): List<LearningMaterial> {
        return transaction {
            // Check if user has access to "Lernmaterial" product
            val hasLernmaterialAccess = hasProductAccess(userId, "Lernmaterial")
            
            if (!hasLernmaterialAccess) {
                return@transaction emptyList()
            }
            
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - only see own materials
                getMaterialsCreatedByUser(userId)
            } else {
                // User is in other groups - see all materials of those groups
                getMaterialsForGroups(userGroups)
            }
        }
    }
    
    private fun hasProductAccess(userId: Int, productName: String): Boolean {
        val userGroups = getUserGroups(userId)
        
        return ProductsTab
            .join(GroupProductsTab, JoinType.INNER, onColumn = ProductsTab.id, otherColumn = GroupProductsTab.productId)
            .selectAll()
            .where { 
                (ProductsTab.name eq productName) and 
                (GroupProductsTab.groupId inList userGroups) 
            }
            .count() > 0
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
    
    private fun getMaterialsCreatedByUser(userId: Int): List<LearningMaterial> {
        return LearningMaterialsTab.selectAll()
            .where { LearningMaterialsTab.createdBy eq userId }
            .map { mapToLearningMaterial(it) }
    }
    
    private fun getMaterialsForGroups(groupIds: List<Int>): List<LearningMaterial> {
        return if (groupIds.isNotEmpty()) {
            LearningMaterialsTab.selectAll()
                .where { LearningMaterialsTab.groupId inList groupIds }
                .map { mapToLearningMaterial(it) }
        } else {
            emptyList()
        }
    }
    
    fun createMaterial(material: LearningMaterial, userId: Int): Int? {
        return transaction {
            // Check if user has access to "Lernmaterial" product
            val hasLernmaterialAccess = hasProductAccess(userId, "Lernmaterial")
            
            if (!hasLernmaterialAccess) {
                return@transaction null
            }
            
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            val targetGroupId = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - assign to Single group
                singleGroupId!!
            } else {
                // Use the provided group ID if valid and user has access, otherwise default to first group
                if (material.groupId > 0 && userGroups.contains(material.groupId)) {
                    material.groupId
                } else {
                    // Default to first group if provided groupId is 0 or invalid
                    userGroups.firstOrNull() ?: singleGroupId!!
                }
            }
            
            LearningMaterialsTab.insert {
                it[title] = material.title
                it[description] = material.description
                it[content] = material.content
                it[fileUrl] = material.fileUrl
                it[materialType] = material.materialType
                it[createdBy] = userId
                it[groupId] = targetGroupId
                it[createdAt] = java.time.ZonedDateTime.now().toString()
                it[updatedAt] = java.time.ZonedDateTime.now().toString()
            } get LearningMaterialsTab.id
        }
    }
    
    private fun mapToLearningMaterial(row: ResultRow): LearningMaterial {
        return LearningMaterial(
            id = row[LearningMaterialsTab.id],
            title = row[LearningMaterialsTab.title],
            description = row[LearningMaterialsTab.description],
            content = row[LearningMaterialsTab.content],
            fileUrl = row[LearningMaterialsTab.fileUrl],
            materialType = row[LearningMaterialsTab.materialType],
            createdBy = row[LearningMaterialsTab.createdBy],
            groupId = row[LearningMaterialsTab.groupId],
            createdAt = row[LearningMaterialsTab.createdAt],
            updatedAt = row[LearningMaterialsTab.updatedAt]
        )
    }
}

// Service für gruppenbasierte Learning Topics
class LearningTopicService {
    fun initialize() {
        transaction {
            if (!SchemaUtils.listTables().contains("learning_topics")) {
                SchemaUtils.create(LearningTopicsTab)
            }
        }
    }
    
    fun getTopicsForUser(userId: Int): List<LearningTopic> {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - only see own topics
                getTopicsCreatedByUser(userId)
            } else {
                // User is in other groups - see all topics of those groups
                getTopicsForGroups(userGroups)
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
    
    private fun getTopicsCreatedByUser(userId: Int): List<LearningTopic> {
        return LearningTopicsTab.selectAll()
            .where { LearningTopicsTab.createdBy eq userId }
            .map { mapToLearningTopic(it) }
    }
    
    private fun getTopicsForGroups(groupIds: List<Int>): List<LearningTopic> {
        return if (groupIds.isNotEmpty()) {
            LearningTopicsTab.selectAll()
                .where { LearningTopicsTab.groupId inList groupIds }
                .map { mapToLearningTopic(it) }
        } else {
            emptyList()
        }
    }
    
    fun createTopic(topic: LearningTopic, userId: Int): Int {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            val targetGroupId = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - assign to Single group
                singleGroupId!!
            } else {
                // Use the provided group ID if valid and user has access, otherwise default to first group
                if (topic.groupId > 0 && userGroups.contains(topic.groupId)) {
                    topic.groupId
                } else {
                    // Default to first group if provided groupId is 0 or invalid
                    userGroups.firstOrNull() ?: singleGroupId!!
                }
            }
            
            LearningTopicsTab.insert {
                it[name] = topic.name
                it[description] = topic.description
                it[createdBy] = userId
                it[groupId] = targetGroupId
                it[createdAt] = java.time.ZonedDateTime.now().toString()
            } get LearningTopicsTab.id
        }
    }
    
    private fun mapToLearningTopic(row: ResultRow): LearningTopic {
        return LearningTopic(
            id = row[LearningTopicsTab.id],
            name = row[LearningTopicsTab.name],
            description = row[LearningTopicsTab.description],
            createdBy = row[LearningTopicsTab.createdBy],
            groupId = row[LearningTopicsTab.groupId],
            createdAt = row[LearningTopicsTab.createdAt]
        )
    }
}
