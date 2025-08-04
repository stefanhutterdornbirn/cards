package com.shut

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import java.time.ZonedDateTime
import java.time.LocalDateTime

// Datenklasse für Assessments (Prüfungsdurchführungen)
@Serializable
data class Assessment(
    val id: Long = 0,
    val name: String,
    val examId: Long, // Verweis auf die Prüfung
    val startTime: String, // Startzeit des Zeitfensters
    val endTime: String, // Endzeit des Zeitfensters
    val createdBy: Int = 0,
    val groupId: Int = 0,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

// Datenklasse für verfügbare User-Assessments (für Test-Taking)
@Serializable
data class UserAssessment(
    val id: Long,
    val name: String,
    val examId: Long,
    val examName: String,
    val startTime: String,
    val endTime: String,
    val status: String, // assigned, started, completed, cancelled, paused
    val duration: Int, // in seconds
    val cardCount: Int,
    val actualStartTime: String? = null, // When the user actually started the assessment
    val timeSpentSeconds: Int = 0 // Total time spent on assessment so far
)

// Datenklasse für Assessment-Benutzer-Zuordnung
@Serializable
data class AssessmentUser(
    val assessmentId: Long,
    val userId: Int,
    val addedAt: String? = null,
    val status: String = "assigned" // assigned, started, completed, cancelled
)

// Datenklasse für Assessment-Ergebnisse
@Serializable
data class AssessmentResult(
    val id: Long = 0,
    val assessmentId: Long,
    val userId: Int,
    val startedAt: String,
    val completedAt: String? = null,
    val totalQuestions: Int,
    val correctAnswers: Int,
    val incorrectAnswers: Int,
    val scorePercentage: Double,
    val timeSpentSeconds: Int
)

object AssessmentsTab : Table("assessments") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 200)
    val examId = long("exam_id").references(ExamsTab.id, onDelete = ReferenceOption.CASCADE)
    val startTime = varchar("start_time", 50) // ISO DateTime
    val endTime = varchar("end_time", 50) // ISO DateTime
    val createdBy = integer("created_by").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE)
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE)
    val createdAt = varchar("created_at", 50).nullable()
    val updatedAt = varchar("updated_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

object AssessmentUsersTab : Table("assessment_users") {
    val assessmentId = long("assessment_id").references(AssessmentsTab.id, onDelete = ReferenceOption.CASCADE)
    val userId = integer("user_id").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE)
    val addedAt = varchar("added_at", 50).nullable()
    val status = varchar("status", 20).default("assigned") // assigned, started, completed, cancelled, paused
    val actualStartTime = varchar("actual_start_time", 50).nullable() // When user actually started the assessment
    val timeSpentSeconds = integer("time_spent_seconds").default(0) // Total time spent on assessment
    override val primaryKey = PrimaryKey(assessmentId, userId)
}

object AssessmentResultsTab : Table("assessment_results") {
    val id = long("id").autoIncrement()
    val assessmentId = long("assessment_id").references(AssessmentsTab.id, onDelete = ReferenceOption.CASCADE)
    val userId = integer("user_id").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE)
    val startedAt = varchar("started_at", 50)
    val completedAt = varchar("completed_at", 50).nullable()
    val totalQuestions = integer("total_questions")
    val correctAnswers = integer("correct_answers")
    val incorrectAnswers = integer("incorrect_answers")
    val scorePercentage = double("score_percentage")
    val timeSpentSeconds = integer("time_spent_seconds")
    override val primaryKey = PrimaryKey(id)
}

// Service für Assessment-Verwaltung
class AssessmentService {
    fun initialize() {
        transaction {
            // Initialize assessment tables
            if (!SchemaUtils.listTables().contains("assessments")) {
                SchemaUtils.create(AssessmentsTab)
            }
            
            if (!SchemaUtils.listTables().contains("assessment_users")) {
                SchemaUtils.create(AssessmentUsersTab)
            }
            
            if (!SchemaUtils.listTables().contains("assessment_results")) {
                SchemaUtils.create(AssessmentResultsTab)
            }
        }
    }
    
    fun getAssessmentsForUser(userId: Int): List<Assessment> {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - only see own assessments
                getAssessmentsCreatedByUser(userId)
            } else {
                // User is in other groups - see all assessments of those groups
                getAssessmentsForGroups(userGroups)
            }
        }
    }
    
    fun getAssessmentById(assessmentId: Long, userId: Int): Assessment? {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            val assessment = AssessmentsTab.selectAll()
                .where { AssessmentsTab.id eq assessmentId }
                .map { mapToAssessment(it) }
                .firstOrNull()
            
            if (assessment == null) return@transaction null
            
            // Check if user has access to this assessment
            val hasAccess = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - can only access own assessments
                assessment.createdBy == userId
            } else {
                // User is in other groups - can access assessments in those groups
                userGroups.contains(assessment.groupId)
            }
            
            if (hasAccess) assessment else null
        }
    }
    
    private fun getAssessmentsCreatedByUser(userId: Int): List<Assessment> {
        return AssessmentsTab.selectAll()
            .where { AssessmentsTab.createdBy eq userId }
            .map { mapToAssessment(it) }
    }
    
    private fun getAssessmentsForGroups(groupIds: List<Int>): List<Assessment> {
        return if (groupIds.isNotEmpty()) {
            AssessmentsTab.selectAll()
                .where { AssessmentsTab.groupId inList groupIds }
                .map { mapToAssessment(it) }
        } else {
            emptyList()
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
    
    fun createAssessment(assessment: Assessment, userId: Int): Long {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            val targetGroupId = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - assign to Single group
                singleGroupId!!
            } else {
                // Use the provided group ID if valid and user has access, otherwise default to first group
                if (assessment.groupId > 0 && userGroups.contains(assessment.groupId)) {
                    assessment.groupId
                } else {
                    // Default to first group if provided groupId is 0 or invalid
                    userGroups.firstOrNull() ?: singleGroupId!!
                }
            }
            
            AssessmentsTab.insert {
                it[name] = assessment.name
                it[examId] = assessment.examId
                it[startTime] = assessment.startTime
                it[endTime] = assessment.endTime
                it[createdBy] = userId
                it[groupId] = targetGroupId
                it[createdAt] = ZonedDateTime.now().toString()
                it[updatedAt] = ZonedDateTime.now().toString()
            } get AssessmentsTab.id
        }
    }
    
    fun updateAssessment(assessment: Assessment, userId: Int): Int {
        return transaction {
            val existingAssessment = AssessmentsTab.selectAll()
                .where { AssessmentsTab.id eq assessment.id }
                .firstOrNull()
            
            if (existingAssessment != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val assessmentGroupId = existingAssessment[AssessmentsTab.groupId]
                val assessmentCreatedBy = existingAssessment[AssessmentsTab.createdBy]
                
                val canEdit = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only edit own assessments
                    assessmentCreatedBy == userId
                } else {
                    // User is in other groups - can edit assessments in same groups
                    userGroups.contains(assessmentGroupId)
                }
                
                if (canEdit) {
                    AssessmentsTab.update({ AssessmentsTab.id eq assessment.id }) {
                        it[name] = assessment.name
                        it[examId] = assessment.examId
                        it[startTime] = assessment.startTime
                        it[endTime] = assessment.endTime
                        it[updatedAt] = ZonedDateTime.now().toString()
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
    
    fun deleteAssessment(assessmentId: Long, userId: Int): Int {
        return transaction {
            val existingAssessment = AssessmentsTab.selectAll()
                .where { AssessmentsTab.id eq assessmentId }
                .firstOrNull()
            
            if (existingAssessment != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val assessmentGroupId = existingAssessment[AssessmentsTab.groupId]
                val assessmentCreatedBy = existingAssessment[AssessmentsTab.createdBy]
                
                val canDelete = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only delete own assessments
                    assessmentCreatedBy == userId
                } else {
                    // User is in other groups - can delete assessments in same groups
                    userGroups.contains(assessmentGroupId)
                }
                
                if (canDelete) {
                    // First delete all assessment users
                    AssessmentUsersTab.deleteWhere { AssessmentUsersTab.assessmentId eq assessmentId }
                    // Then delete the assessment
                    AssessmentsTab.deleteWhere { AssessmentsTab.id eq assessmentId }
                    1
                } else {
                    0
                }
            } else {
                0
            }
        }
    }
    
    fun addUserToAssessment(assessmentId: Long, targetUserId: Int, currentUserId: Int): Boolean {
        return transaction {
            // Check if current user has access to the assessment
            val assessment = AssessmentsTab.selectAll()
                .where { AssessmentsTab.id eq assessmentId }
                .firstOrNull()
            
            if (assessment != null) {
                val userGroups = getUserGroups(currentUserId)
                val singleGroupId = getSingleGroupId()
                val assessmentGroupId = assessment[AssessmentsTab.groupId]
                val assessmentCreatedBy = assessment[AssessmentsTab.createdBy]
                
                val hasAccess = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only modify own assessments
                    assessmentCreatedBy == currentUserId
                } else {
                    // User is in other groups - can modify assessments in same groups
                    userGroups.contains(assessmentGroupId)
                }
                
                if (hasAccess) {
                    // Check if user already in assessment
                    val userExists = AssessmentUsersTab.selectAll()
                        .where { (AssessmentUsersTab.assessmentId eq assessmentId) and (AssessmentUsersTab.userId eq targetUserId) }
                        .count() > 0
                    
                    if (!userExists) {
                        AssessmentUsersTab.insert {
                            it[AssessmentUsersTab.assessmentId] = assessmentId
                            it[userId] = targetUserId
                            it[addedAt] = ZonedDateTime.now().toString()
                            it[status] = "assigned"
                        }
                        true
                    } else {
                        false // User already in assessment
                    }
                } else {
                    false // No access
                }
            } else {
                false // Assessment not found
            }
        }
    }
    
    fun removeUserFromAssessment(assessmentId: Long, targetUserId: Int, currentUserId: Int): Boolean {
        return transaction {
            // Check if current user has access to the assessment
            val assessment = AssessmentsTab.selectAll()
                .where { AssessmentsTab.id eq assessmentId }
                .firstOrNull()
            
            if (assessment != null) {
                val userGroups = getUserGroups(currentUserId)
                val singleGroupId = getSingleGroupId()
                val assessmentGroupId = assessment[AssessmentsTab.groupId]
                val assessmentCreatedBy = assessment[AssessmentsTab.createdBy]
                
                val hasAccess = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only modify own assessments
                    assessmentCreatedBy == currentUserId
                } else {
                    // User is in other groups - can modify assessments in same groups
                    userGroups.contains(assessmentGroupId)
                }
                
                if (hasAccess) {
                    val rowsAffected = AssessmentUsersTab.deleteWhere { 
                        (AssessmentUsersTab.assessmentId eq assessmentId) and (AssessmentUsersTab.userId eq targetUserId) 
                    }
                    rowsAffected > 0
                } else {
                    false // No access
                }
            } else {
                false // Assessment not found
            }
        }
    }
    
    fun getAssessmentUsers(assessmentId: Long, userId: Int): List<UserCredentials> {
        return transaction {
            // Check if user has access to the assessment
            val assessment = AssessmentsTab.selectAll()
                .where { AssessmentsTab.id eq assessmentId }
                .firstOrNull()
            
            if (assessment != null) {
                val userGroups = getUserGroups(userId)
                val singleGroupId = getSingleGroupId()
                val assessmentGroupId = assessment[AssessmentsTab.groupId]
                val assessmentCreatedBy = assessment[AssessmentsTab.createdBy]
                
                val hasAccess = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                    // User is only in "Single" group - can only view own assessments
                    assessmentCreatedBy == userId
                } else {
                    // User is in other groups - can view assessments in same groups
                    userGroups.contains(assessmentGroupId)
                }
                
                if (hasAccess) {
                    UserCredentialsTab
                        .join(AssessmentUsersTab, JoinType.INNER, onColumn = UserCredentialsTab.id, otherColumn = AssessmentUsersTab.userId)
                        .selectAll()
                        .where { AssessmentUsersTab.assessmentId eq assessmentId }
                        .map { 
                            UserCredentials(
                                id = it[UserCredentialsTab.id],
                                username = it[UserCredentialsTab.username],
                                password = it[UserCredentialsTab.password],
                                email = it[UserCredentialsTab.email]
                            )
                        }
                } else {
                    emptyList()
                }
            } else {
                emptyList()
            }
        }
    }
    
    fun getAvailableAssessmentsForUser(userId: Int): List<UserAssessment> {
        return transaction {
            // Get assessments where the user is assigned
            val assessmentUsersWithDetails = AssessmentUsersTab
                .join(AssessmentsTab, JoinType.INNER, AssessmentUsersTab.assessmentId, AssessmentsTab.id)
                .join(ExamsTab, JoinType.INNER, AssessmentsTab.examId, ExamsTab.id)
                .selectAll()
                .where { AssessmentUsersTab.userId eq userId }
                .map { row ->
                    UserAssessment(
                        id = row[AssessmentsTab.id],
                        name = row[AssessmentsTab.name],
                        examId = row[AssessmentsTab.examId],
                        examName = row[ExamsTab.name],
                        startTime = row[AssessmentsTab.startTime],
                        endTime = row[AssessmentsTab.endTime],
                        status = row[AssessmentUsersTab.status],
                        duration = row[ExamsTab.durationInSeconds],
                        cardCount = getExamCardCount(row[AssessmentsTab.examId]),
                        actualStartTime = row[AssessmentUsersTab.actualStartTime],
                        timeSpentSeconds = try {
                            row[AssessmentUsersTab.timeSpentSeconds]
                        } catch (e: Exception) {
                            // Column might not exist yet
                            0
                        }
                    )
                }
            
            assessmentUsersWithDetails
        }
    }
    
    fun pauseAssessment(assessmentId: Long, userId: Int, timeSpentSeconds: Int): Boolean {
        return transaction {
            // Check if user has access to this assessment and it's started or already paused
            val assessmentUser = AssessmentUsersTab.selectAll()
                .where { 
                    (AssessmentUsersTab.assessmentId eq assessmentId) and 
                    (AssessmentUsersTab.userId eq userId) and
                    (AssessmentUsersTab.status inList listOf("started", "paused"))
                }
                .firstOrNull()
            
            if (assessmentUser != null) {
                try {
                    // Get current time spent and add new time
                    val currentTimeSpent = try {
                        assessmentUser[AssessmentUsersTab.timeSpentSeconds]
                    } catch (e: Exception) {
                        // Column might not exist yet, use 0
                        0
                    }
                    val newTotalTimeSpent = currentTimeSpent + timeSpentSeconds
                    
                    // Update status to paused and save accumulated time spent
                    try {
                        AssessmentUsersTab.update({ 
                            (AssessmentUsersTab.assessmentId eq assessmentId) and 
                            (AssessmentUsersTab.userId eq userId) 
                        }) {
                            it[status] = "paused"
                            it[AssessmentUsersTab.timeSpentSeconds] = newTotalTimeSpent
                        }
                        println("DEBUG: Paused assessment. Previous time: ${currentTimeSpent}s, Session time: ${timeSpentSeconds}s, Total: ${newTotalTimeSpent}s")
                        true
                    } catch (e: Exception) {
                        println("DEBUG: Error updating timeSpentSeconds (column might not exist): ${e.message}")
                        // Update only status if timeSpentSeconds column doesn't exist
                        AssessmentUsersTab.update({ 
                            (AssessmentUsersTab.assessmentId eq assessmentId) and 
                            (AssessmentUsersTab.userId eq userId) 
                        }) {
                            it[status] = "paused"
                        }
                        println("DEBUG: Paused assessment without time tracking")
                        true
                    }
                } catch (e: Exception) {
                    println("DEBUG: Error in pauseAssessment: ${e.message}")
                    false
                }
            } else {
                false
            }
        }
    }
    
    private fun getExamCardCount(examId: Long): Int {
        return ExamCardsTab.selectAll()
            .where { ExamCardsTab.examId eq examId }
            .count()
            .toInt()
    }
    
    fun startAssessment(assessmentId: Long, userId: Int): Boolean {
        return transaction {
            // Check if user has access to this assessment
            val assessmentUser = AssessmentUsersTab.selectAll()
                .where { 
                    (AssessmentUsersTab.assessmentId eq assessmentId) and 
                    (AssessmentUsersTab.userId eq userId)
                }
                .firstOrNull()
            
            if (assessmentUser == null) {
                println("DEBUG: User $userId not found in assessment $assessmentId")
                return@transaction false
            }
            
            val currentStatus = assessmentUser[AssessmentUsersTab.status]
            println("DEBUG: Current status for user $userId in assessment $assessmentId: $currentStatus")
            
            // Check if assessment is not already completed or cancelled
            if (currentStatus == "completed" || currentStatus == "cancelled") {
                println("DEBUG: Assessment already completed or cancelled")
                return@transaction false
            }
            
            // Allow starting if status is "assigned", "started", or "paused" (to allow resume)
            if (currentStatus == "assigned" || currentStatus == "started" || currentStatus == "paused") {
                // Check if assessment is within time window
                val assessment = AssessmentsTab.selectAll()
                    .where { AssessmentsTab.id eq assessmentId }
                    .firstOrNull()
                
                if (assessment == null) {
                    println("DEBUG: Assessment $assessmentId not found")
                    return@transaction false
                }
                
                try {
                    val now = ZonedDateTime.now()
                    // Parse the datetime strings - they might be in simple format or ZonedDateTime format
                    val startTimeString = assessment[AssessmentsTab.startTime]
                    val endTimeString = assessment[AssessmentsTab.endTime]
                    
                    val startTime = try {
                        ZonedDateTime.parse(startTimeString)
                    } catch (e: Exception) {
                        // If parsing as ZonedDateTime fails, try LocalDateTime and convert
                        LocalDateTime.parse(startTimeString).atZone(ZonedDateTime.now().zone)
                    }
                    
                    val endTime = try {
                        ZonedDateTime.parse(endTimeString)
                    } catch (e: Exception) {
                        LocalDateTime.parse(endTimeString).atZone(ZonedDateTime.now().zone)
                    }
                    
                    println("DEBUG: Now: $now, Start: $startTime, End: $endTime")
                    
                    if (now.isAfter(startTime) && now.isBefore(endTime)) {
                        // Update status to started (if not already started)
                        if (currentStatus == "assigned") {
                            AssessmentUsersTab.update({ 
                                (AssessmentUsersTab.assessmentId eq assessmentId) and 
                                (AssessmentUsersTab.userId eq userId) 
                            }) {
                                it[status] = "started"
                                it[actualStartTime] = ZonedDateTime.now().toString()
                            }
                        } else if (currentStatus == "paused") {
                            // Resume from paused state - update the actualStartTime to now for current session tracking
                            AssessmentUsersTab.update({ 
                                (AssessmentUsersTab.assessmentId eq assessmentId) and 
                                (AssessmentUsersTab.userId eq userId) 
                            }) {
                                it[status] = "started"
                                it[actualStartTime] = ZonedDateTime.now().toString()
                            }
                        }
                        println("DEBUG: Assessment started successfully")
                        true
                    } else {
                        println("DEBUG: Assessment not within time window")
                        false // Not within time window
                    }
                } catch (e: Exception) {
                    println("DEBUG: Error parsing datetime: ${e.message}")
                    // If datetime parsing fails, allow the assessment for now
                    if (currentStatus == "assigned") {
                        AssessmentUsersTab.update({ 
                            (AssessmentUsersTab.assessmentId eq assessmentId) and 
                            (AssessmentUsersTab.userId eq userId) 
                        }) {
                            it[status] = "started"
                            it[actualStartTime] = ZonedDateTime.now().toString()
                        }
                    } else if (currentStatus == "paused") {
                        AssessmentUsersTab.update({ 
                            (AssessmentUsersTab.assessmentId eq assessmentId) and 
                            (AssessmentUsersTab.userId eq userId) 
                        }) {
                            it[status] = "started"
                            it[actualStartTime] = ZonedDateTime.now().toString()
                        }
                    }
                    true
                }
            } else {
                println("DEBUG: Invalid status: $currentStatus")
                false // Invalid status
            }
        }
    }
    
    fun getAssessmentQuestions(assessmentId: Long, userId: Int): List<LearningCard>? {
        return transaction {
            // Check if user has access to this assessment
            val assessmentUser = AssessmentUsersTab.selectAll()
                .where { 
                    (AssessmentUsersTab.assessmentId eq assessmentId) and 
                    (AssessmentUsersTab.userId eq userId)
                }
                .firstOrNull()
            
            if (assessmentUser != null) {
                // Get the exam ID for this assessment
                val assessment = AssessmentsTab.selectAll()
                    .where { AssessmentsTab.id eq assessmentId }
                    .firstOrNull()
                
                if (assessment != null) {
                    val examId = assessment[AssessmentsTab.examId]
                    
                    // Get all cards for this exam
                    LearningCardsTab
                        .join(ExamCardsTab, JoinType.INNER, LearningCardsTab.id, ExamCardsTab.cardId)
                        .selectAll()
                        .where { ExamCardsTab.examId eq examId }
                        .map { row ->
                            LearningCard(
                                id = row[LearningCardsTab.id],
                                title = row[LearningCardsTab.title],
                                question = row[LearningCardsTab.question],
                                answer = row[LearningCardsTab.answer],
                                category = row[LearningCardsTab.category],
                                difficulty = row[LearningCardsTab.difficulty],
                                createdBy = row[LearningCardsTab.createdBy]
                            )
                        }
                } else {
                    null
                }
            } else {
                null
            }
        }
    }
    
    fun submitAssessment(assessmentId: Long, userId: Int, answers: Map<Long, List<String>>): AssessmentResult? {
        return transaction {
            // Check if user has access to this assessment and it's started or paused
            val assessmentUser = AssessmentUsersTab.selectAll()
                .where { 
                    (AssessmentUsersTab.assessmentId eq assessmentId) and 
                    (AssessmentUsersTab.userId eq userId) and
                    (AssessmentUsersTab.status inList listOf("started", "paused"))
                }
                .firstOrNull()
            
            if (assessmentUser != null) {
                // Get assessment details
                val assessment = AssessmentsTab.selectAll()
                    .where { AssessmentsTab.id eq assessmentId }
                    .firstOrNull()
                
                if (assessment != null) {
                    val examId = assessment[AssessmentsTab.examId]
                    
                    // Get all correct answers for this exam
                    val correctAnswers = LearningCardsTab
                        .join(ExamCardsTab, JoinType.INNER, LearningCardsTab.id, ExamCardsTab.cardId)
                        .selectAll()
                        .where { ExamCardsTab.examId eq examId }
                        .associate { row ->
                            val allAnswers = row[LearningCardsTab.answer].split("\n").map { it.trim() }.filter { it.isNotEmpty() }
                            // Find only the correct answers (marked with ✓ or (✓))
                            val correctAnswers = allAnswers.filter { 
                                it.contains("✓") || it.contains("(✓)") 
                            }.map { answer ->
                                // Remove the checkmark symbols and trim
                                answer.replace("(✓)", "").replace("✓", "").trim()
                            }
                            row[LearningCardsTab.id].toLong() to correctAnswers
                        }
                    
                    // Calculate score
                    var correct = 0
                    var incorrect = 0
                    val totalQuestions = correctAnswers.size
                    
                    correctAnswers.forEach { (cardId, correctAnswerList) ->
                        val userAnswers = answers[cardId] ?: emptyList()
                        
                        // Check if user answers match correct answers (order doesn't matter)
                        val isCorrect = userAnswers.size == correctAnswerList.size && 
                                      userAnswers.all { correctAnswerList.contains(it) }
                        
                        if (isCorrect) {
                            correct++
                        } else {
                            incorrect++
                        }
                    }
                    
                    val scorePercentage = if (totalQuestions > 0) (correct.toDouble() / totalQuestions * 100) else 0.0
                    val now = ZonedDateTime.now()
                    
                    // Calculate total time spent including previous sessions
                    val previousTimeSpent = try {
                        assessmentUser[AssessmentUsersTab.timeSpentSeconds]
                    } catch (e: Exception) {
                        0
                    }
                    
                    // Calculate current session time if there's an actualStartTime
                    val currentSessionTime = try {
                        val actualStartTime = ZonedDateTime.parse(assessmentUser[AssessmentUsersTab.actualStartTime])
                        java.time.Duration.between(actualStartTime, now).seconds.toInt()
                    } catch (e: Exception) {
                        0
                    }
                    
                    val timeSpentSeconds = previousTimeSpent + currentSessionTime
                    
                    // Use the actual start time from the assessment user for the result
                    val resultStartTime = try {
                        assessmentUser[AssessmentUsersTab.actualStartTime] ?: assessment[AssessmentsTab.startTime]
                    } catch (e: Exception) {
                        assessment[AssessmentsTab.startTime]
                    }
                    
                    // Save result
                    val resultId = AssessmentResultsTab.insert {
                        it[AssessmentResultsTab.assessmentId] = assessmentId
                        it[AssessmentResultsTab.userId] = userId
                        it[AssessmentResultsTab.startedAt] = resultStartTime
                        it[completedAt] = now.toString()
                        it[AssessmentResultsTab.totalQuestions] = totalQuestions
                        it[AssessmentResultsTab.correctAnswers] = correct
                        it[AssessmentResultsTab.incorrectAnswers] = incorrect
                        it[AssessmentResultsTab.scorePercentage] = scorePercentage
                        it[AssessmentResultsTab.timeSpentSeconds] = timeSpentSeconds
                    } get AssessmentResultsTab.id
                    
                    // Update assessment user status to completed
                    AssessmentUsersTab.update({ 
                        (AssessmentUsersTab.assessmentId eq assessmentId) and 
                        (AssessmentUsersTab.userId eq userId) 
                    }) {
                        it[status] = "completed"
                    }
                    
                    AssessmentResult(
                        id = resultId,
                        assessmentId = assessmentId,
                        userId = userId,
                        startedAt = resultStartTime,
                        completedAt = now.toString(),
                        totalQuestions = totalQuestions,
                        correctAnswers = correct,
                        incorrectAnswers = incorrect,
                        scorePercentage = scorePercentage,
                        timeSpentSeconds = timeSpentSeconds
                    )
                } else {
                    null
                }
            } else {
                null
            }
        }
    }
    
    fun getAssessmentResult(assessmentId: Long, userId: Int): AssessmentResult? {
        return transaction {
            // Check if user has access to this assessment
            val assessmentUser = AssessmentUsersTab.selectAll()
                .where { 
                    (AssessmentUsersTab.assessmentId eq assessmentId) and 
                    (AssessmentUsersTab.userId eq userId)
                }
                .firstOrNull()
            
            if (assessmentUser != null) {
                // Get the result for this assessment and user
                AssessmentResultsTab.selectAll()
                    .where { 
                        (AssessmentResultsTab.assessmentId eq assessmentId) and 
                        (AssessmentResultsTab.userId eq userId)
                    }
                    .orderBy(AssessmentResultsTab.completedAt, SortOrder.DESC)
                    .firstOrNull()
                    ?.let { row ->
                        AssessmentResult(
                            id = row[AssessmentResultsTab.id],
                            assessmentId = row[AssessmentResultsTab.assessmentId],
                            userId = row[AssessmentResultsTab.userId],
                            startedAt = row[AssessmentResultsTab.startedAt],
                            completedAt = row[AssessmentResultsTab.completedAt] ?: "",
                            totalQuestions = row[AssessmentResultsTab.totalQuestions],
                            correctAnswers = row[AssessmentResultsTab.correctAnswers],
                            incorrectAnswers = row[AssessmentResultsTab.incorrectAnswers],
                            scorePercentage = row[AssessmentResultsTab.scorePercentage],
                            timeSpentSeconds = row[AssessmentResultsTab.timeSpentSeconds]
                        )
                    }
            } else {
                null
            }
        }
    }
    
    private fun mapToAssessment(row: ResultRow): Assessment {
        return Assessment(
            id = row[AssessmentsTab.id],
            name = row[AssessmentsTab.name],
            examId = row[AssessmentsTab.examId],
            startTime = row[AssessmentsTab.startTime],
            endTime = row[AssessmentsTab.endTime],
            createdBy = row[AssessmentsTab.createdBy],
            groupId = row[AssessmentsTab.groupId],
            createdAt = row[AssessmentsTab.createdAt],
            updatedAt = row[AssessmentsTab.updatedAt]
        )
    }
}