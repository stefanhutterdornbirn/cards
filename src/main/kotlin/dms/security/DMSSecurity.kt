package dms.security

import com.shut.GroupService
import com.shut.UserCredentialsService
import com.shut.UserGroupService
import dms.model.DMSPermissions
import dms.service.DMSService
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*

class DMSSecurity(
    private val groupService: GroupService,
    private val userCredentialsService: UserCredentialsService,
    private val dmsService: DMSService,
    private val userGroupService: UserGroupService
) {
    
    companion object {
        const val SINGLE_GROUP_NAME = "Single"
    }
    
    suspend fun getCurrentUserInfo(call: ApplicationCall): UserInfo? {
        return try {
            val principal = call.principal<JWTPrincipal>()
            val username = principal?.payload?.getClaim("username")?.asString()
            
            if (username != null) {
                val user = userCredentialsService.getUserCredentialsByUsername(username)
                if (user != null && user.id != null) {
                    val userGroups = userGroupService.getUserGroups(user.id)
                    UserInfo(
                        userId = user.id,
                        username = username,
                        groups = userGroups
                    )
                } else null
            } else null
        } catch (e: Exception) {
            null
        }
    }
    
    fun hasAccessToDocument(userInfo: UserInfo, documentUserId: Int, documentGroupId: Int): Boolean {
        // Wenn der User der Ersteller des Dokuments ist, hat er immer Zugriff
        if (userInfo.userId == documentUserId) {
            return true
        }
        
        // Prüfe ob der User in der Single-Gruppe ist
        val isSingleGroupUser = userInfo.groups.any { it.name == SINGLE_GROUP_NAME }
        
        if (isSingleGroupUser) {
            // Single-Gruppe: Nur Zugriff auf eigene Dokumente
            return userInfo.userId == documentUserId
        } else {
            // Normale Gruppe: Zugriff auf alle Dokumente der Gruppenmitglieder
            return userInfo.groups.any { it.id == documentGroupId }
        }
    }
    
    fun hasAccessToDossier(userInfo: UserInfo, dossierUserId: Int, dossierGroupId: Int): Boolean {
        // Gleiche Logik wie für Dokumente
        return hasAccessToDocument(userInfo, dossierUserId, dossierGroupId)
    }
    
    fun hasAccessToRegistraturPosition(userInfo: UserInfo, positionUserId: Int, positionGroupId: Int): Boolean {
        // Gleiche Logik wie für Dokumente und Dossiers
        return hasAccessToDocument(userInfo, positionUserId, positionGroupId)
    }
    
    fun hasAccessToRegistraturPlan(userInfo: UserInfo, planUserId: Int, planGroupId: Int): Boolean {
        val isSingleGroupUser = userInfo.groups.any { it.name == SINGLE_GROUP_NAME }
        
        if (isSingleGroupUser) {
            // Single-Gruppe: Jeder User hat seinen eigenen Registraturplan
            return userInfo.userId == planUserId
        } else {
            // Normale Gruppe: Alle Gruppenmitglieder teilen sich einen Registraturplan
            return userInfo.groups.any { it.id == planGroupId }
        }
    }
    
    fun getOrCreateRegistraturPlan(userInfo: UserInfo): Int? {
        val isSingleGroupUser = userInfo.groups.any { it.name == SINGLE_GROUP_NAME }
        
        return if (isSingleGroupUser) {
            // Single-Gruppe: Persönlicher Registraturplan
            var plan = dmsService.getRegistraturPlanByUserId(userInfo.userId)
            if (plan == null) {
                // Erstelle persönlichen Registraturplan
                val singleGroup = userInfo.groups.find { it.name == SINGLE_GROUP_NAME }
                if (singleGroup != null && singleGroup.id != null) {
                    val planData = dms.model.DMSRegistraturPlan(
                        name = "${userInfo.username} - Persönlicher Registraturplan",
                        beschreibung = "Persönlicher Registraturplan für ${userInfo.username}",
                        groupId = singleGroup.id,
                        userId = userInfo.userId
                    )
                    dmsService.createRegistraturPlan(planData)
                } else null
            } else {
                plan.id
            }
        } else {
            // Normale Gruppe: Gemeinsamer Registraturplan
            val primaryGroup = userInfo.groups.firstOrNull()
            if (primaryGroup != null && primaryGroup.id != null) {
                var plan = dmsService.getRegistraturPlanByGroupId(primaryGroup.id)
                if (plan == null) {
                    // Erstelle Gruppen-Registraturplan
                    val planData = dms.model.DMSRegistraturPlan(
                        name = "${primaryGroup.name} - Registraturplan",
                        beschreibung = "Registraturplan für Gruppe ${primaryGroup.name}",
                        groupId = primaryGroup.id,
                        userId = userInfo.userId
                    )
                    dmsService.createRegistraturPlan(planData)
                } else {
                    plan.id
                }
            } else null
        }
    }
    
    /**
     * Get all Registraturplans the user has access to:
     * - Their personal plan (if exists)
     * - Their current group's plan
     */
    fun getAllAccessibleRegistraturPlans(userInfo: UserInfo): List<dms.model.DMSRegistraturPlan> {
        println("[DMSSecurity] getAllAccessibleRegistraturPlans: Starting for user ${userInfo.userId} (${userInfo.username})")
        val startTime = System.currentTimeMillis()
        val accessiblePlans = mutableListOf<dms.model.DMSRegistraturPlan>()
        
        println("[DMSSecurity] getAllAccessibleRegistraturPlans: User groups: ${userInfo.groups.map { "${it.name}(${it.id})" }}")
        
        // 1. Add personal Registraturplan ONLY if user is currently in Single group
        val isSingleGroupUser = userInfo.groups.any { it.name == SINGLE_GROUP_NAME }
        println("[DMSSecurity] getAllAccessibleRegistraturPlans: Is single group user: $isSingleGroupUser")
        
        if (isSingleGroupUser) {
            println("[DMSSecurity] getAllAccessibleRegistraturPlans: Querying personal plan for user ${userInfo.userId}")
            val personalPlanStartTime = System.currentTimeMillis()
            val personalPlan = dmsService.getRegistraturPlanByUserId(userInfo.userId)
            val personalPlanDuration = System.currentTimeMillis() - personalPlanStartTime
            
            println("[DMSSecurity] getAllAccessibleRegistraturPlans: Personal plan query took ${personalPlanDuration}ms")
            println("[DMSSecurity] getAllAccessibleRegistraturPlans: Personal plan found: ${personalPlan?.name} (id=${personalPlan?.id})")
            
            if (personalPlan != null) {
                accessiblePlans.add(personalPlan)
                println("[DMSSecurity] getAllAccessibleRegistraturPlans: Added personal plan (user is in Single group)")
            } else {
                println("[DMSSecurity] getAllAccessibleRegistraturPlans: No personal plan found for user")
            }
        } else {
            println("[DMSSecurity] getAllAccessibleRegistraturPlans: No personal plan (user not in Single group)")
        }
        
        // 2. Add group Registraturplans from ALL non-Single groups
        val nonSingleGroups = userInfo.groups.filter { it.name != SINGLE_GROUP_NAME }
        println("[DMSSecurity] getAllAccessibleRegistraturPlans: Non-Single groups: ${nonSingleGroups.map { "${it.name}(${it.id})" }}")
        
        for ((index, group) in nonSingleGroups.withIndex()) {
            println("[DMSSecurity] getAllAccessibleRegistraturPlans: Processing group ${index + 1}/${nonSingleGroups.size}: ${group.name}")
            
            if (group.id != null) {
                println("[DMSSecurity] getAllAccessibleRegistraturPlans: Querying group plan for group ${group.id} (${group.name})")
                val groupPlanStartTime = System.currentTimeMillis()
                val groupPlan = dmsService.getRegistraturPlanByGroupId(group.id)
                val groupPlanDuration = System.currentTimeMillis() - groupPlanStartTime
                
                println("[DMSSecurity] getAllAccessibleRegistraturPlans: Group plan query took ${groupPlanDuration}ms")
                println("[DMSSecurity] getAllAccessibleRegistraturPlans: Group plan for ${group.name}: ${groupPlan?.name} (id=${groupPlan?.id})")
                
                if (groupPlan != null) {
                    // Only add if not already added
                    if (!accessiblePlans.any { it.id == groupPlan.id }) {
                        accessiblePlans.add(groupPlan)
                        println("[DMSSecurity] getAllAccessibleRegistraturPlans: Added group plan: ${groupPlan.name}")
                    } else {
                        println("[DMSSecurity] getAllAccessibleRegistraturPlans: Group plan already added: ${groupPlan.name}")
                    }
                } else {
                    println("[DMSSecurity] getAllAccessibleRegistraturPlans: No group plan found for ${group.name}")
                }
            } else {
                println("[DMSSecurity] getAllAccessibleRegistraturPlans: Group ${group.name} has null ID, skipping")
            }
        }
        
        val totalDuration = System.currentTimeMillis() - startTime
        println("[DMSSecurity] getAllAccessibleRegistraturPlans: Total accessible plans: ${accessiblePlans.size} (total time: ${totalDuration}ms)")
        println("[DMSSecurity] getAllAccessibleRegistraturPlans: Plans: ${accessiblePlans.map { "${it.name}(id=${it.id})" }}")
        
        return accessiblePlans
    }
    
    fun calculatePermissions(userInfo: UserInfo, objectUserId: Int, objectGroupId: Int): DMSPermissions {
        val hasAccess = hasAccessToDocument(userInfo, objectUserId, objectGroupId)
        val isOwner = userInfo.userId == objectUserId
        val isSingleGroupUser = userInfo.groups.any { it.name == SINGLE_GROUP_NAME }
        
        return DMSPermissions(
            canRead = hasAccess,
            canWrite = hasAccess,
            canDelete = isOwner, // Nur der Ersteller kann löschen
            canCreateDossier = hasAccess,
            canCreateDocument = hasAccess,
            canManageVersions = hasAccess
        )
    }
    
    fun filterAccessibleRegistraturPlans(userInfo: UserInfo, plans: List<dms.model.DMSRegistraturPlan>): List<dms.model.DMSRegistraturPlan> {
        return plans.filter { plan ->
            hasAccessToRegistraturPlan(userInfo, plan.userId, plan.groupId)
        }
    }
    
    fun filterAccessibleDossiers(userInfo: UserInfo, dossiers: List<dms.model.DMSDossier>): List<dms.model.DMSDossier> {
        return dossiers.filter { dossier ->
            hasAccessToDossier(userInfo, dossier.userId, dossier.groupId)
        }
    }
    
    fun filterAccessibleDocuments(userInfo: UserInfo, documents: List<dms.model.DMSDocument>): List<dms.model.DMSDocument> {
        return documents.filter { document ->
            hasAccessToDocument(userInfo, document.userId, document.groupId)
        }
    }
    
    fun validateCreatePermission(userInfo: UserInfo, parentObjectUserId: Int, parentObjectGroupId: Int): Boolean {
        return hasAccessToDocument(userInfo, parentObjectUserId, parentObjectGroupId)
    }
    
    fun validateUpdatePermission(userInfo: UserInfo, objectUserId: Int, objectGroupId: Int): Boolean {
        return hasAccessToDocument(userInfo, objectUserId, objectGroupId)
    }
    
    fun validateDeletePermission(userInfo: UserInfo, objectUserId: Int): Boolean {
        // Nur der Ersteller kann löschen
        return userInfo.userId == objectUserId
    }
    
    // ======================== SOFT DELETE PERMISSIONS ========================
    
    /**
     * Check if user can soft delete a document
     * Rules: Only document owner or system admin
     */
    fun canSoftDeleteDocument(userInfo: UserInfo, documentUserId: Int, documentGroupId: Int): Boolean {
        // Document owner can always delete
        if (userInfo.userId == documentUserId) return true
        
        // System admin can delete any document
        return isSystemAdmin(userInfo)
    }
    
    /**
     * Check if user can soft delete a dossier
     * Rules: Only dossier owner or system admin
     */
    fun canSoftDeleteDossier(userInfo: UserInfo, dossierUserId: Int, dossierGroupId: Int): Boolean {
        // Dossier owner can always delete
        if (userInfo.userId == dossierUserId) return true
        
        // System admin can delete any dossier
        return isSystemAdmin(userInfo)
    }
    
    /**
     * Check if user can soft delete a registratur position
     * Rules: Only system admin (more restrictive since it affects multiple dossiers/documents)
     */
    fun canSoftDeleteRegistraturPosition(userInfo: UserInfo, positionUserId: Int, positionGroupId: Int): Boolean {
        // Only system admin can delete registratur positions
        return isSystemAdmin(userInfo)
    }
    
    /**
     * Check if user can restore deleted items
     * Rules: Only document/dossier owner or system admin
     */
    fun canRestoreItem(userInfo: UserInfo, itemUserId: Int, itemGroupId: Int): Boolean {
        // Item owner can restore their own items
        if (userInfo.userId == itemUserId) return true
        
        // System admin can restore any item
        return isSystemAdmin(userInfo)
    }
    
    /**
     * Check if user can view deleted items (for restore functionality)
     * Rules: Only system admin or group members can see deleted items from their group
     */
    fun canViewDeletedItems(userInfo: UserInfo, targetGroupId: Int): Boolean {
        // System admin can view all deleted items
        if (isSystemAdmin(userInfo)) return true
        
        // Users can only view deleted items from their own groups
        return userInfo.groups.any { it.id == targetGroupId }
    }
    
    /**
     * Helper method to check if user is system admin
     */
    private fun isSystemAdmin(userInfo: UserInfo): Boolean {
        return userInfo.groups.any { group ->
            // Check if user has system.admin permission in any of their groups
            // Note: You might need to implement GroupRoleService check here
            // For now, we'll check if group name contains "admin" as a simple check
            group.name.lowercase().contains("admin")
        }
    }
}

data class UserInfo(
    val userId: Int,
    val username: String,
    val groups: List<com.shut.Group>
)