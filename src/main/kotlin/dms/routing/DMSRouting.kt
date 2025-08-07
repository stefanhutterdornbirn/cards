package dms.routing

import billing.integration.BillingInterceptor
import billing.model.InsufficientFundsException
import com.shut.ContentAddressableStorage
import com.shut.GroupService
import com.shut.UserCredentialsService
import com.shut.UserGroupService
import com.shut.GroupRoleService
import dms.model.*
import dms.security.DMSSecurity
import dms.service.DMSService
import dms.service.OptimizedDMSService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.time.LocalDateTime

fun Application.configureDMSRouting() {
    val dmsService = DMSService()
    val optimizedDmsService = OptimizedDMSService()
    val billingInterceptor = BillingInterceptor()
    val groupService = GroupService()
    val userCredentialsService = UserCredentialsService()
    val userGroupService = UserGroupService()
    val dmsSecurity = DMSSecurity(groupService, userCredentialsService, dmsService, userGroupService)
    val cas = ContentAddressableStorage.create()
    
    routing {
        authenticate {
            route("/dms") {
                
                // Registraturplan Endpoints
                get("/registraturplan/all") {
                    try {
                        println("[DMS-API] /registraturplan/all: Request received")
                        val startTime = System.currentTimeMillis()
                        
                        println("[DMS-API] /registraturplan/all: Getting user info from JWT")
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            println("[DMS-API] /registraturplan/all: Authentication failed - no user info")
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        println("[DMS-API] /registraturplan/all: User authenticated: ${userInfo.userId} (${userInfo.username})")
                        
                        // Charge for API call
                        try {
                            billingInterceptor.checkAndDebitApiCall(userInfo.userId)
                            println("[DMS-API] /registraturplan/all: API call charged for user ${userInfo.userId}")
                        } catch (e: Exception) {
                            println("[DMS-API] /registraturplan/all: Billing error: ${e.message}")
                            call.respond(HttpStatusCode.PaymentRequired, mapOf("error" to "Insufficient CardCoin balance", "details" to e.message))
                            return@get
                        }
                        
                        println("[DMS-API] /registraturplan/all: Getting accessible registration plans")
                        val allPlans = dmsSecurity.getAllAccessibleRegistraturPlans(userInfo)
                        println("[DMS-API] /registraturplan/all: Found ${allPlans.size} plans for user ${userInfo.userId}: ${allPlans.map { "${it.name}(id=${it.id})" }}")
                        
                        println("[DMS-API] /registraturplan/all: Building trees for ${allPlans.size} plans")
                        val plansWithTrees = allPlans.mapIndexed { index, plan ->
                            println("[DMS-API] /registraturplan/all: Building tree ${index + 1}/${allPlans.size} for plan ${plan.id} (${plan.name})")
                            val treeStartTime = System.currentTimeMillis()
                            
                            val tree = optimizedDmsService.buildLightweightTree(plan.id ?: 0)
                            val treeDuration = System.currentTimeMillis() - treeStartTime
                            println("[DMS-API] /registraturplan/all: Tree built in ${treeDuration}ms for plan ${plan.id}")
                            
                            mapOf(
                                "plan" to plan,
                                "tree" to tree,
                                "isPersonal" to (plan.userId == userInfo.userId),
                                "permissions" to mapOf(
                                    "canRead" to true,
                                    "canWrite" to true,
                                    "canDelete" to true,
                                    "canCreateDossier" to true,
                                    "canCreateDocument" to true,
                                    "canManageVersions" to true
                                )
                            )
                        }
                        
                        val totalDuration = System.currentTimeMillis() - startTime
                        println("[DMS-API] /registraturplan/all: Responding with ${plansWithTrees.size} plans (total time: ${totalDuration}ms)")
                        call.respond(HttpStatusCode.OK, mapOf("plans" to plansWithTrees))
                    } catch (e: Exception) {
                        println("[DMS-API] /registraturplan/all: ERROR occurred: ${e.message}")
                        e.printStackTrace()
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading all Registraturplans: ${e.message}"))
                    }
                }
                
                get("/registraturplan") {
                    try {
                        println("[DMS-API] /registraturplan: Request received (fallback endpoint)")
                        val startTime = System.currentTimeMillis()
                        
                        println("[DMS-API] /registraturplan: Getting user info from JWT")
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            println("[DMS-API] /registraturplan: Authentication failed - no user info")
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        println("[DMS-API] /registraturplan: User authenticated: ${userInfo.userId} (${userInfo.username})")
                        
                        // Charge for API call
                        try {
                            billingInterceptor.checkAndDebitApiCall(userInfo.userId)
                            println("[DMS-API] /registraturplan: API call charged for user ${userInfo.userId}")
                        } catch (e: Exception) {
                            println("[DMS-API] /registraturplan: Billing error: ${e.message}")
                            call.respond(HttpStatusCode.PaymentRequired, mapOf("error" to "Insufficient CardCoin balance", "details" to e.message))
                            return@get
                        }
                        
                        println("[DMS-API] /registraturplan: Getting or creating registration plan")
                        val planId = dmsSecurity.getOrCreateRegistraturPlan(userInfo)
                        println("[DMS-API] /registraturplan: Plan ID: $planId")
                        
                        if (planId != null) {
                            println("[DMS-API] /registraturplan: Building lightweight tree for plan $planId")
                            val treeStartTime = System.currentTimeMillis()
                            val tree = optimizedDmsService.buildLightweightTree(planId)
                            val treeDuration = System.currentTimeMillis() - treeStartTime
                            println("[DMS-API] /registraturplan: Tree built in ${treeDuration}ms")
                            
                            val permissions = mapOf(
                                "canRead" to true,
                                "canWrite" to true,
                                "canDelete" to true,
                                "canCreateDossier" to true,
                                "canCreateDocument" to true,
                                "canManageVersions" to true
                            )
                            
                            val response = mapOf(
                                "tree" to tree,
                                "permissions" to permissions
                            )
                            
                            val totalDuration = System.currentTimeMillis() - startTime
                            println("[DMS-API] /registraturplan: Responding successfully (total time: ${totalDuration}ms)")
                            call.respond(HttpStatusCode.OK, response)
                        } else {
                            println("[DMS-API] /registraturplan: Failed to get or create plan - planId is null")
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Could not create or access Registraturplan"))
                        }
                    } catch (e: Exception) {
                        println("[DMS-API] /registraturplan: ERROR occurred: ${e.message}")
                        e.printStackTrace()
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading Registraturplan: ${e.message}"))
                    }
                }
                
                // Registraturposition Endpoints
                post("/registraturposition") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@post
                        }
                        
                        // Receive the request as a map to handle the frontend data structure
                        val requestData = call.receive<Map<String, Any>>()
                        val primaryGroup = userInfo.groups.firstOrNull()
                        if (primaryGroup == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "No group assigned"))
                            return@post
                        }
                        
                        // Extract values from request
                        val registraturPlanId = (requestData["registraturPlanId"] as? Number)?.toInt()
                        val name = requestData["name"] as? String
                        val positionNummer = (requestData["positionNummer"] as? Number)?.toInt()
                        val beschreibung = requestData["beschreibung"] as? String
                        
                        if (registraturPlanId == null || name == null || positionNummer == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing required fields"))
                            return@post
                        }
                        
                        // Create the DMSRegistraturPosition object
                        val position = DMSRegistraturPosition(
                            registraturPlanId = registraturPlanId,
                            positionNummer = positionNummer,
                            name = name,
                            beschreibung = beschreibung,
                            userId = userInfo.userId,
                            groupId = primaryGroup.id ?: 0,
                            erstellungsdatum = LocalDateTime.now().toString()
                        )
                        
                        val id = dmsService.createRegistraturPosition(position)
                        call.respond(HttpStatusCode.Created, mapOf("id" to id))
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error creating Registraturposition: ${e.message}"))
                    }
                }
                
                get("/registraturposition/{id}") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val id = call.parameters["id"]?.toIntOrNull()
                        if (id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid registraturposition ID"))
                            return@get
                        }
                        
                        val position = dmsService.getRegistraturPositionById(id)
                        if (position == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Registraturposition not found"))
                            return@get
                        }
                        
                        if (!dmsSecurity.hasAccessToRegistraturPosition(userInfo, position.userId, position.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@get
                        }
                        
                        val dossiers = dmsService.getDossiersByRegistraturPositionId(id)
                        val permissions = dmsSecurity.calculatePermissions(userInfo, position.userId, position.groupId)
                        
                        val response = mapOf(
                            "registraturposition" to position,
                            "dossiers" to dmsSecurity.filterAccessibleDossiers(userInfo, dossiers),
                            "permissions" to permissions
                        )
                        
                        call.respond(HttpStatusCode.OK, response)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading Registraturposition: ${e.message}"))
                    }
                }
                
                // Dossier Endpoints
                post("/dossier") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@post
                        }
                        
                        // Receive the request as a map to handle the frontend data structure
                        val requestData = call.receive<Map<String, Any>>()
                        val primaryGroup = userInfo.groups.firstOrNull()
                        if (primaryGroup == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "No group assigned"))
                            return@post
                        }
                        
                        // Extract values from request
                        var registraturPositionId = (requestData["registraturPositionId"] as? Number)?.toInt()
                        var name = requestData["name"] as? String
                        val beschreibung = requestData["beschreibung"] as? String
                        val parentDossierId = (requestData["parentDossierId"] as? Number)?.toInt()
                        val publicShare = (requestData["publicShare"] as? Boolean)

                        var registraturPosition: DMSRegistraturPosition? = null

                        if (!(registraturPositionId == null || name == null))  {
                            // Get the position number from the selected Registraturposition
                            registraturPosition = dmsService.getRegistraturPositionById(registraturPositionId)
                            if (registraturPosition == null) {
                                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Registraturposition nicht gefunden"))
                                return@post
                            }
                        } else {
                            val parentDossier = dmsService.getDossierById(parentDossierId ?: 0)
                            if (parentDossier != null) {
                                registraturPositionId = parentDossier.registraturPositionId
                            }
                        }
                        // Generate position number and unique number
                        val positionNummer = registraturPosition!!.positionNummer
                        val eindeutigeLaufnummer = dmsService.generateNextDossierLaufnummer(registraturPositionId!!)
                        val laufnummer = "$positionNummer-$eindeutigeLaufnummer"

                        if (name.isNullOrEmpty()){
                            name = ""
                        }

                        val dossier = DMSDossier(
                            registraturPositionId = registraturPositionId,
                            parentDossierId = parentDossierId,
                            name = name,
                            laufnummer = laufnummer,
                            positionNummer = positionNummer,
                            eindeutigeLaufnummer = eindeutigeLaufnummer,
                            userId = userInfo.userId,
                            groupId = primaryGroup.id ?: 0,
                            erstellungsdatum = LocalDateTime.now().toString(),
                            beschreibung = beschreibung,
                            isPublicAnonymousShared = publicShare == true
                        )
                        
                        val id = dmsService.createDossier(dossier)
                        call.respond(HttpStatusCode.Created, mapOf("id" to id, "laufnummer" to laufnummer))
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error creating Dossier: ${e.message}"))
                    }
                }
                
                get("/dossier/{id}") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val id = call.parameters["id"]?.toIntOrNull()
                        if (id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid dossier ID"))
                            return@get
                        }
                        
                        val dossier = dmsService.getDossierById(id)
                        if (dossier == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Dossier not found"))
                            return@get
                        }
                        
                        if (!dmsSecurity.hasAccessToDossier(userInfo, dossier.userId, dossier.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@get
                        }
                        
                        val childDossiers = dmsService.getDossiersByParentId(id)
                        val documents = dmsService.getDocumentsByDossierId(id)
                        val permissions = dmsSecurity.calculatePermissions(userInfo, dossier.userId, dossier.groupId)
                        
                        val response = mapOf(
                            "dossier" to dossier,
                            "childDossiers" to dmsSecurity.filterAccessibleDossiers(userInfo, childDossiers),
                            "documents" to dmsSecurity.filterAccessibleDocuments(userInfo, documents),
                            "permissions" to permissions
                        )
                        
                        call.respond(HttpStatusCode.OK, response)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading Dossier: ${e.message}"))
                    }
                }

                get("/dossier") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }


                        val allDossiers = dmsService.getAllDossiers()
                        if (allDossiers == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "No Dossiers found"))
                            return@get
                        }

                        // Filter dossiers based on user access rights
                        val accessibleDossiers = dmsSecurity.filterAccessibleDossiers(userInfo, allDossiers)

                        val response = mapOf(
                            "dossier" to accessibleDossiers,
                        )

                        call.respond(HttpStatusCode.OK, response)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading Dossier: ${e.message}"))
                    }
                }

                // Document Endpoints
                post("/document") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@post
                        }
                        
                        val request = call.receive<CreateDocumentRequest>()
                        val primaryGroup = userInfo.groups.firstOrNull()
                        if (primaryGroup == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "No group assigned"))
                            return@post
                        }
                        
                        val document = DMSDocument(
                            dossierId = request.dossierId,
                            titel = request.titel,
                            userId = userInfo.userId,
                            groupId = primaryGroup.id ?: 0,
                            erstellungsdatum = LocalDateTime.now().toString(),
                            beschreibung = request.beschreibung
                        )
                        
                        val id = dmsService.createDocument(document)
                        call.respond(HttpStatusCode.Created, mapOf("id" to id))
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error creating Document: ${e.message}"))
                    }
                }
                
                get("/document/{id}") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val id = call.parameters["id"]?.toIntOrNull()
                        if (id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid document ID"))
                            return@get
                        }
                        
                        val document = dmsService.getDocumentById(id)
                        if (document == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                            return@get
                        }
                        
                        if (!dmsSecurity.hasAccessToDocument(userInfo, document.userId, document.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@get
                        }
                        
                        val versions = dmsService.getDocumentVersions(id)
                        val permissions = dmsSecurity.calculatePermissions(userInfo, document.userId, document.groupId)
                        
                        val response = mapOf(
                            "document" to document,
                            "versions" to versions,
                            "permissions" to permissions
                        )
                        
                        call.respond(HttpStatusCode.OK, response)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading Document: ${e.message}"))
                    }
                }
                
                put("/document/{id}") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@put
                        }
                        
                        val id = call.parameters["id"]?.toIntOrNull()
                        if (id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid document ID"))
                            return@put
                        }
                        
                        val document = dmsService.getDocumentById(id)
                        if (document == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                            return@put
                        }
                        
                        if (!dmsSecurity.validateUpdatePermission(userInfo, document.userId, document.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@put
                        }
                        
                        val updates = call.receive<UpdateDocumentRequest>()
                        val success = dmsService.updateDocument(id, updates)
                        
                        if (success) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Document updated successfully"))
                        } else {
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update document"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error updating Document: ${e.message}"))
                    }
                }
                
                // Document Version Endpoints
                post("/document/{documentId}/version") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@post
                        }
                        
                        val documentId = call.parameters["documentId"]?.toIntOrNull()
                        if (documentId == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid document ID"))
                            return@post
                        }
                        
                        val document = dmsService.getDocumentById(documentId)
                        if (document == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                            return@post
                        }
                        
                        if (!dmsSecurity.validateUpdatePermission(userInfo, document.userId, document.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@post
                        }
                        
                        val request = call.receive<CreateDocumentVersionRequest>()
                        val primaryGroup = userInfo.groups.firstOrNull()
                        if (primaryGroup == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "No group assigned"))
                            return@post
                        }
                        
                        val versionsnummer = dmsService.getNextVersionNumber(documentId)
                        val version = DMSDocumentVersion(
                            documentId = documentId,
                            versionsnummer = versionsnummer,
                            dateiname = request.dateiname,
                            dateigroesse = request.dateigroesse,
                            mimeType = request.mimeType,
                            hashWert = request.hashWert,
                            kommentar = request.kommentar,
                            userId = userInfo.userId,
                            groupId = primaryGroup.id ?: 0,
                            erstellungsdatum = LocalDateTime.now().toString()
                        )
                        
                        val id = dmsService.createDocumentVersionWithTextExtraction(version, cas)
                        call.respond(HttpStatusCode.Created, mapOf("id" to id, "versionsnummer" to versionsnummer))
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error creating Document Version: ${e.message}"))
                    }
                }
                
                get("/document/{documentId}/versions") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val documentId = call.parameters["documentId"]?.toIntOrNull()
                        if (documentId == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid document ID"))
                            return@get
                        }
                        
                        val document = dmsService.getDocumentById(documentId)
                        if (document == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                            return@get
                        }
                        
                        if (!dmsSecurity.hasAccessToDocument(userInfo, document.userId, document.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@get
                        }
                        
                        val versions = dmsService.getDocumentVersions(documentId)
                        call.respond(HttpStatusCode.OK, versions)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading Document Versions: ${e.message}"))
                    }
                }

                // Delete Document Version Endpoint
                delete("/document/{documentId}/version/{versionId}") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@delete
                        }
                        
                        val documentId = call.parameters["documentId"]?.toIntOrNull()
                        val versionId = call.parameters["versionId"]?.toIntOrNull()
                        
                        if (documentId == null || versionId == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid document or version ID"))
                            return@delete
                        }
                        
                        val document = dmsService.getDocumentById(documentId)
                        if (document == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                            return@delete
                        }
                        
                        val version = dmsService.getDocumentVersionById(versionId)
                        if (version == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document version not found"))
                            return@delete
                        }
                        
                        // Verify the version belongs to the document
                        if (version.documentId != documentId) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Version does not belong to the specified document"))
                            return@delete
                        }
                        
                        // Check permissions - user must have delete permissions
                        if (!dmsSecurity.canSoftDeleteDocument(userInfo, document.userId, document.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied - insufficient permissions"))
                            return@delete
                        }
                        
                        // Check if this is the only active version - cannot delete the last version
                        val activeVersions = dmsService.getDocumentVersions(documentId)
                        if (activeVersions.size <= 1) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Cannot delete the last active version of a document"))
                            return@delete
                        }
                        
                        // Check if trying to delete the current version
                        val currentVersion = activeVersions.maxByOrNull { it.versionsnummer }
                        if (currentVersion?.id == versionId) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Cannot delete the current version. Please create a new version first."))
                            return@delete
                        }
                        
                        val success = dmsService.deleteDocumentVersion(versionId)
                        if (success) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Document version successfully deleted"))
                        } else {
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete document version"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error deleting document version: ${e.message}"))
                    }
                }

                // Restore Document Version Endpoint
                put("/document/{documentId}/version/{versionId}/restore") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@put
                        }
                        
                        val documentId = call.parameters["documentId"]?.toIntOrNull()
                        val versionId = call.parameters["versionId"]?.toIntOrNull()
                        
                        if (documentId == null || versionId == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid document or version ID"))
                            return@put
                        }
                        
                        val document = dmsService.getDocumentById(documentId)
                        if (document == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                            return@put
                        }
                        
                        // Check permissions - user must have restore permissions (same as delete permissions)
                        if (!dmsSecurity.canRestoreItem(userInfo, document.userId, document.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied - insufficient permissions"))
                            return@put
                        }
                        
                        val success = dmsService.restoreDocumentVersion(versionId)
                        if (success) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Document version successfully restored"))
                        } else {
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to restore document version"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error restoring document version: ${e.message}"))
                    }
                }
                
                // File Download Endpoint
                get("/file/{hash}") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val hash = call.parameters["hash"]
                        if (hash == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Hash parameter required"))
                            return@get
                        }
                        
                        println("DMS: Looking for file with hash: $hash") // Debug log
                        
                        // Find the document version by hash to check permissions
                        val version = dmsService.getDocumentVersionByHash(hash)

                        if (version == null) {
                            println("DMS: No document version found for hash: $hash") // Debug log
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document version not found for hash: $hash"))
                            return@get
                        }
                        
                        println("DMS: Found document version: ${version.id} for document: ${version.documentId}") // Debug log
                        
                        if (!dmsSecurity.hasAccessToDocument(userInfo, version.userId, version.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@get
                        }
                        
                        val fileStream = cas.retrieveAsStream(hash)
                        if (fileStream == null ) {
                            println("DMS: Physical file not found in CAS for hash: $hash") // Debug log
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Physical file not found in storage for hash: $hash"))
                            return@get
                        }


                        var fileByte = fileStream.readAllBytes()
                        var anzBytes = fileByte.size

                        println("DMS: Physical file found: ${anzBytes} Bytes")

                        // Record download metrics (downloads are free, but tracked)
                        try {
                            billingInterceptor.recordFileDownload(userInfo.userId, anzBytes.toLong())
                            println("[DMS-API] /download: Download metrics recorded for user ${userInfo.userId}, size: ${anzBytes.toLong()} bytes")
                        } catch (e: Exception) {
                            println("[DMS-API] /download: Error recording download metrics: ${e.message}")
                            // Don't fail the download if metrics recording fails
                        }
                        
                        call.response.header(HttpHeaders.ContentType, version.mimeType)
                        call.response.header(
                            HttpHeaders.ContentDisposition,
                            ContentDisposition.Attachment.withParameter(
                                ContentDisposition.Parameters.FileName, version.dateiname
                            ).toString()
                        )
                        
                        call.respondBytes(fileByte,ContentType.Application.OctetStream);
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error downloading file: ${e.message}"))
                    }
                }
                
                // File Upload Endpoint
                post("/upload") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@post
                        }
                        
                        val inputStream = call.receiveStream()
                        val fileName = call.request.headers["X-File-Name"] ?: "document_${System.currentTimeMillis()}"
                        val fileType = call.request.headers["X-File-Type"] ?: "application/octet-stream"
                        
                        val result = try {
                            cas.store(inputStream)
                        } catch (e: Exception) {
                            println("ERROR: CAS storage failed for DMS upload: ${e.message}")
                            e.printStackTrace()
                            call.respond(
                                HttpStatusCode.InternalServerError,
                                mapOf("error" to "Fehler beim Speichern der Datei: ${e.message}")
                            )
                            return@post
                        }
                        
                        // Charge for upload and record metrics
                        try {
                            billingInterceptor.checkAndDebitFileUpload(userInfo.userId, result.size)
                            println("[DMS-API] /upload: Upload charged and metrics recorded for user ${userInfo.userId}, size: ${result.size} bytes")
                        } catch (e: InsufficientFundsException) {
                            println("[DMS-API] /upload: Insufficient CardCoin balance for user ${userInfo.userId}")
                            call.respond(HttpStatusCode.PaymentRequired, mapOf("error" to "Insufficient CardCoin balance", "details" to e.message))
                            return@post
                        }
                        
                        val responseMap = mutableMapOf<String, Any>(
                            "hash" to result.hash,
                            "size" to result.size,
                            "filename" to fileName,
                            "mimeType" to fileType
                        )
                        
                        // Add deduplication information if file was already stored
                        if (result.wasAlreadyStored) {
                            responseMap["isDuplicate"] = true
                            responseMap["message"] = "Diese Datei ist bereits im System gespeichert (Inhalt identisch). Speicherplatz wird durch Deduplizierung optimiert."
                        } else {
                            responseMap["isDuplicate"] = false
                        }
                        
                        call.respond(HttpStatusCode.Created, responseMap)
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error uploading file: ${e.message}"))
                    }
                }
                
                // Search Endpoint
                get("/search") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        // Charge for search operation (different from regular API call)
                        println("[DMS-API] /search: Attempting to charge search operation for user ${userInfo.userId}")
                        try {
                            billingInterceptor.checkAndDebitSearch(userInfo.userId)
                            println("[DMS-API] /search: Search operation charged successfully for user ${userInfo.userId}")
                        } catch (e: Exception) {
                            println("[DMS-API] /search: Billing error: ${e.message}")
                            call.respond(HttpStatusCode.PaymentRequired, mapOf("error" to "Insufficient CardCoin balance", "details" to e.message))
                            return@get
                        }
                        
                        val query = call.request.queryParameters["q"]
                        if (query.isNullOrBlank()) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Search query parameter 'q' is required"))
                            return@get
                        }
                        
                        val type = call.request.queryParameters["type"] // "document", "dossier", "all"
                        val dateFrom = call.request.queryParameters["dateFrom"]
                        val dateTo = call.request.queryParameters["dateTo"]
                        val mimeType = call.request.queryParameters["mimeType"]
                        
                        val searchRequest = DMSSearchRequest(
                            query = query,
                            type = type,
                            dateFrom = dateFrom,
                            dateTo = dateTo,
                            mimeType = mimeType
                        )
                        
                        val groupId = userInfo.groups.firstOrNull()?.id
                        if (groupId == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "No group assigned"))
                            return@get
                        }
                        
                        val searchResults = dmsService.searchDocuments(searchRequest, userInfo.userId, groupId)
                        call.respond(HttpStatusCode.OK, searchResults)
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Search error: ${e.message}"))
                    }
                }
                
                // Statistics Endpoint
                get("/statistics") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val groupId = userInfo.groups.firstOrNull()?.id
                        if (groupId == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "No group assigned"))
                            return@get
                        }
                        
                        // Check if user has system.admin permissions for multi-group view
                        val groupRoleService = GroupRoleService()
                        val isSystemAdmin = userInfo.groups.any { group ->
                            val groupRoles = groupRoleService.getGroupRoles(group.id ?: 0)
                            groupRoles.any { role ->
                                role.permissions.contains("system.admin")
                            }
                        }
                        val statistics = dmsService.getStatistics(userInfo.userId, groupId, isSystemAdmin)
                        call.respond(HttpStatusCode.OK, statistics)
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading statistics: ${e.message}"))
                    }
                }
                
                // Navigation Endpoint (for building breadcrumbs)
                get("/navigation/{type}/{id}") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val type = call.parameters["type"]
                        val id = call.parameters["id"]?.toIntOrNull()
                        
                        if (type == null || id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid parameters"))
                            return@get
                        }
                        
                        // This would build the navigation path based on the type and id
                        // Implementation would depend on the specific navigation requirements
                        
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Navigation endpoint - implementation needed"))
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading navigation: ${e.message}"))
                    }
                }
                
                // ======================== LAZY LOADING ENDPOINT ========================
                
                // Load children for a tree node on-demand
                get("/tree/{nodeType}/{nodeId}/children") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        // Charge for API call
                        try {
                            billingInterceptor.checkAndDebitApiCall(userInfo.userId)
                        } catch (e: Exception) {
                            call.respond(HttpStatusCode.PaymentRequired, mapOf("error" to "Insufficient CardCoin balance", "details" to e.message))
                            return@get
                        }
                        
                        val nodeType = call.parameters["nodeType"]
                        val nodeId = call.parameters["nodeId"]?.toIntOrNull()
                        
                        if (nodeType == null || nodeId == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid node type or ID"))
                            return@get
                        }
                        
                        // Security check based on node type
                        when (nodeType) {
                            "registraturplan" -> {
                                // Check if user has access to any plans and if the requested nodeId is among them
                                val accessiblePlans = dmsSecurity.getAllAccessibleRegistraturPlans(userInfo)
                                val hasAccess = accessiblePlans.any { it.id == nodeId }
                                if (!hasAccess) {
                                    call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                                    return@get
                                }
                            }
                            "registraturposition" -> {
                                val position = dmsService.getRegistraturPositionById(nodeId)
                                if (position == null || !dmsSecurity.hasAccessToRegistraturPosition(userInfo, position.userId, position.groupId)) {
                                    call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                                    return@get
                                }
                            }
                            "dossier" -> {
                                val dossier = dmsService.getDossierById(nodeId)
                                if (dossier == null || !dmsSecurity.hasAccessToDossier(userInfo, dossier.userId, dossier.groupId)) {
                                    call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                                    return@get
                                }
                            }
                            else -> {
                                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid node type: $nodeType"))
                                return@get
                            }
                        }
                        
                        val children = optimizedDmsService.loadNodeChildren(nodeId, nodeType)
                        call.respond(HttpStatusCode.OK, mapOf("children" to children))
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading node children: ${e.message}"))
                    }
                }
                
                // ======================== SOFT DELETE ENDPOINTS ========================
                
                // Soft delete document
                delete("/document/{id}") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@delete
                        }
                        
                        val id = call.parameters["id"]?.toIntOrNull()
                        if (id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid document ID"))
                            return@delete
                        }
                        
                        val document = dmsService.getDocumentById(id)
                        if (document == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                            return@delete
                        }
                        
                        if (!dmsSecurity.canSoftDeleteDocument(userInfo, document.userId, document.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@delete
                        }
                        
                        val success = dmsService.softDeleteDocument(id)
                        if (success) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Document successfully deleted"))
                        } else {
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete document"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error deleting document: ${e.message}"))
                    }
                }
                
                // Soft delete dossier
                delete("/dossier/{id}") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@delete
                        }
                        
                        val id = call.parameters["id"]?.toIntOrNull()
                        if (id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid dossier ID"))
                            return@delete
                        }
                        
                        val dossier = dmsService.getDossierById(id)
                        if (dossier == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Dossier not found"))
                            return@delete
                        }
                        
                        if (!dmsSecurity.canSoftDeleteDossier(userInfo, dossier.userId, dossier.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@delete
                        }
                        
                        val success = dmsService.softDeleteDossier(id)
                        if (success) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Dossier and all contained documents successfully deleted"))
                        } else {
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete dossier"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error deleting dossier: ${e.message}"))
                    }
                }
                
                // Restore document
                put("/document/{id}/restore") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@put
                        }
                        
                        val id = call.parameters["id"]?.toIntOrNull()
                        if (id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid document ID"))
                            return@put
                        }
                        
                        val document = dmsService.getDocumentById(id)
                        if (document == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                            return@put
                        }
                        
                        if (!dmsSecurity.canRestoreItem(userInfo, document.userId, document.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@put
                        }
                        
                        val success = dmsService.restoreDocument(id)
                        if (success) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Document successfully restored"))
                        } else {
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to restore document"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error restoring document: ${e.message}"))
                    }
                }
                
                // Restore dossier
                put("/dossier/{id}/restore") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@put
                        }
                        
                        val id = call.parameters["id"]?.toIntOrNull()
                        if (id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid dossier ID"))
                            return@put
                        }
                        
                        val dossier = dmsService.getDossierById(id)
                        if (dossier == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Dossier not found"))
                            return@put
                        }
                        
                        if (!dmsSecurity.canRestoreItem(userInfo, dossier.userId, dossier.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@put
                        }
                        
                        val success = dmsService.restoreDossier(id)
                        if (success) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Dossier successfully restored"))
                        } else {
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to restore dossier"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error restoring dossier: ${e.message}"))
                    }
                }
                
                // Get deleted items (for restoration UI)
                get("/deleted-items") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val groupId = userInfo.groups.firstOrNull()?.id
                        if (groupId == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "No group assigned"))
                            return@get
                        }
                        
                        if (!dmsSecurity.canViewDeletedItems(userInfo, groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@get
                        }
                        
                        val deletedItems = dmsService.getDeletedItems(userInfo.userId, groupId)
                        call.respond(HttpStatusCode.OK, deletedItems)
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading deleted items: ${e.message}"))
                    }
                }
                
                // Get anonymous share link for a dossier
                get("/dossier/{id}/share-link") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val id = call.parameters["id"]?.toIntOrNull()
                        if (id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid dossier ID"))
                            return@get
                        }
                        
                        val dossier = dmsService.getDossierById(id)
                        if (dossier == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Dossier not found"))
                            return@get
                        }
                        
                        if (!dmsSecurity.hasAccessToDossier(userInfo, dossier.userId, dossier.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@get
                        }
                        
                        val shareLink = dmsService.getAnonymousShareLink(id)
                        println("/dossier/{id}/share-link shareLink " + shareLink.toString() + dossier.isPublicAnonymousShared.toString());
                        if (shareLink != null) {
                            call.respond(HttpStatusCode.OK, mapOf(
                                "shareLink" to shareLink,
                                "isPublic" to dossier.isPublicAnonymousShared,
                                "fullUrl" to "https://${call.request.host()}$shareLink"
                            ))
                        } else {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Dossier is not publicly shared"))
                        }
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error generating share link: ${e.message}"))
                    }
                }
                
                // Toggle public sharing for a dossier
                put("/dossier/{id}/public-sharing") {
                    try {
                        val userInfo = dmsSecurity.getCurrentUserInfo(call)
                        if (userInfo == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@put
                        }
                        
                        val id = call.parameters["id"]?.toIntOrNull()
                        if (id == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid dossier ID"))
                            return@put
                        }
                        
                        val requestData = call.receive<Map<String, Any>>()
                        val isPublic = requestData["isPublic"] as? Boolean ?: false
                        
                        val dossier = dmsService.getDossierById(id)
                        if (dossier == null) {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Dossier not found"))
                            return@put
                        }
                        
                        if (!dmsSecurity.validateUpdatePermission(userInfo, dossier.userId, dossier.groupId)) {
                            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Access denied"))
                            return@put
                        }
                        
                        val success = dmsService.setDossierPublicSharing(id, isPublic)
                        if (success) {
                            val shareLink = if (isPublic) dmsService.getAnonymousShareLink(id) else null
                            call.respond(HttpStatusCode.OK, mapOf(
                                "message" to if (isPublic) "Dossier is now publicly shared" else "Public sharing disabled",
                                "isPublic" to isPublic,
                                "shareLink" to shareLink,
                                "fullUrl" to if (shareLink != null) "https://${call.request.host()}$shareLink" else null
                            ))
                        } else {
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update sharing settings"))
                        }
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error updating sharing settings: ${e.message}"))
                    }
                }
            }
        }
        
        // Anonymous public access routes (no authentication required)
        route("/dms/publicapi") {
            
            // Get public dossier by unique anonymous link
            get("/dossier/{anonymousId}") {
                try {
                    val anonymousId = call.parameters["anonymousId"]
                    if (anonymousId.isNullOrBlank()) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid anonymous dossier ID"))
                        return@get
                    }
                    
                    // Find dossier by anonymous ID (we'll use the dossier ID for now, but could implement UUID)
                    val dossierId = anonymousId.toIntOrNull()
                    if (dossierId == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid anonymous dossier ID format"))
                        return@get
                    }
                    
                    val dossier = dmsService.getDossierById(dossierId)
                    if (dossier == null) {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Dossier not found"))
                        return@get
                    }
                    
                    // Check if dossier is publicly shared
                    if (!dossier.isPublicAnonymousShared) {
                        call.respond(HttpStatusCode.Forbidden, mapOf("error" to "This dossier is not publicly accessible"))
                        return@get
                    }
                    
                    val childDossiers = dmsService.getDossiersByParentId(dossierId)
                    val documents = dmsService.getDocumentsByDossierId(dossierId)
                    
                    // Filter only public child dossiers
                    val publicChildDossiers = childDossiers.filter { it.isPublicAnonymousShared }
                    
                    val response = mapOf(
                        "dossier" to dossier,
                        "childDossiers" to publicChildDossiers,
                        "documents" to documents,
                        "isAnonymousAccess" to true,
                        "permissions" to mapOf(
                            "canRead" to true,
                            "canWrite" to true,  // Allow anonymous upload
                            "canDelete" to false,
                            "canCreateDossier" to false,
                            "canCreateDocument" to true,  // Allow anonymous document creation
                            "canManageVersions" to true
                        )
                    )
                    
                    call.respond(HttpStatusCode.OK, response)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading public dossier: ${e.message}"))
                }
            }
            
            // Get public document versions
            get("/document/{documentId}/versions/{anonymousId}") {
                try {
                    val anonymousId = call.parameters["anonymousId"]
                    val documentId = call.parameters["documentId"]?.toIntOrNull()
                    
                    if (anonymousId.isNullOrBlank() || documentId == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid parameters"))
                        return@get
                    }
                    
                    val document = dmsService.getDocumentById(documentId)
                    if (document == null) {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                        return@get
                    }
                    
                    // Verify the document belongs to a public dossier
                    val dossier = dmsService.getDossierById(document.dossierId)
                    if (dossier == null || !dossier.isPublicAnonymousShared) {
                        call.respond(HttpStatusCode.Forbidden, mapOf("error" to "This document is not publicly accessible"))
                        return@get
                    }
                    
                    // Verify anonymous ID matches dossier
                    if (anonymousId != dossier.id.toString()) {
                        call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Invalid access"))
                        return@get
                    }
                    
                    val versions = dmsService.getDocumentVersions(documentId)
                    call.respond(HttpStatusCode.OK, versions)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading document versions: ${e.message}"))
                }
            }
            
            // Anonymous file download
            get("/file/{hash}/{anonymousId}") {
                try {
                    val hash = call.parameters["hash"]
                    val anonymousId = call.parameters["anonymousId"]
                    
                    if (hash.isNullOrBlank() || anonymousId.isNullOrBlank()) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Hash and anonymous ID parameters required"))
                        return@get
                    }
                    
                    // Find the document version by hash
                    val version = dmsService.getDocumentVersionByHash(hash)
                    if (version == null) {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document version not found"))
                        return@get
                    }
                    
                    // Get the document to find the dossier
                    val document = dmsService.getDocumentById(version.documentId)
                    if (document == null) {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                        return@get
                    }
                    
                    // Verify the document belongs to a public dossier
                    val dossier = dmsService.getDossierById(document.dossierId)
                    if (dossier == null || !dossier.isPublicAnonymousShared) {
                        call.respond(HttpStatusCode.Forbidden, mapOf("error" to "This file is not publicly accessible"))
                        return@get
                    }
                    
                    // Verify anonymous ID matches dossier
                    if (anonymousId != dossier.id.toString()) {
                        call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Invalid access"))
                        return@get
                    }
                    
                    val fileInputStream = cas.retrieveAsStream(hash)
                    if (fileInputStream == null) {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Physical file not found"))
                        return@get
                    }
                    
                    call.response.header(HttpHeaders.ContentType, version.mimeType)
                    call.response.header(
                        HttpHeaders.ContentDisposition,
                        ContentDisposition.Attachment.withParameter(
                            ContentDisposition.Parameters.FileName, version.dateiname
                        ).toString()
                    )


                    val contentType = ContentType.Image.Any
                    call.response.header(HttpHeaders.CacheControl, "public, max-age=3600")
                    val fileBytes = fileInputStream.use { it.readBytes() }
                    call.respondBytes(fileBytes, contentType)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error downloading file: ${e.message}"))
                }
            }
            
            // Anonymous file upload
            post("/upload/{anonymousId}") {
                try {
                    val anonymousId = call.parameters["anonymousId"]
                    if (anonymousId.isNullOrBlank()) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Anonymous ID required"))
                        return@post
                    }
                    
                    // Verify the dossier exists and is public
                    val dossierId = anonymousId.toIntOrNull()
                    if (dossierId == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid anonymous ID format"))
                        return@post
                    }
                    
                    val dossier = dmsService.getDossierById(dossierId)
                    if (dossier == null || !dossier.isPublicAnonymousShared) {
                        call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Upload not allowed to this dossier"))
                        return@post
                    }
                    
                    val inputStream = call.receiveStream()
                    val fileName = call.request.headers["X-File-Name"] ?: "anonymous_upload_${System.currentTimeMillis()}"
                    val fileType = call.request.headers["X-File-Type"] ?: "application/octet-stream"
                    
                    val result = try {
                        cas.store(inputStream)
                    } catch (e: Exception) {
                        println("ERROR: CAS storage failed for anonymous DMS upload: ${e.message}")
                        e.printStackTrace()
                        call.respond(
                            HttpStatusCode.InternalServerError,
                            mapOf("error" to "Fehler beim Speichern der Datei: ${e.message}")
                        )
                        return@post
                    }
                    
                    val responseMap = mutableMapOf<String, Any>(
                        "hash" to result.hash,
                        "size" to result.size,
                        "filename" to fileName,
                        "mimeType" to fileType,
                        "anonymousUpload" to true
                    )
                    
                    if (result.wasAlreadyStored) {
                        responseMap["isDuplicate"] = true
                        responseMap["message"] = "This file already exists in the system (identical content). Storage is optimized through deduplication."
                    } else {
                        responseMap["isDuplicate"] = false
                    }
                    
                    call.respond(HttpStatusCode.Created, responseMap)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error uploading file: ${e.message}"))
                }
            }
            
            // Anonymous document creation
            post("/document/{anonymousId}") {
                try {
                    val anonymousId = call.parameters["anonymousId"]
                    if (anonymousId.isNullOrBlank()) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Anonymous ID required"))
                        return@post
                    }
                    
                    // Verify the dossier exists and is public
                    val dossierId = anonymousId.toIntOrNull()
                    if (dossierId == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid anonymous ID format"))
                        return@post
                    }
                    
                    val dossier = dmsService.getDossierById(dossierId)
                    if (dossier == null || !dossier.isPublicAnonymousShared) {
                        call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Document creation not allowed in this dossier"))
                        return@post
                    }
                    
                    val request = call.receive<CreateDocumentRequest>()
                    
                    // Use the dossier's owner info for anonymous documents
                    val document = DMSDocument(
                        dossierId = dossierId,
                        titel = request.titel,
                        userId = dossier.userId,  // Use dossier owner's ID
                        groupId = dossier.groupId,  // Use dossier owner's group
                        erstellungsdatum = LocalDateTime.now().toString(),
                        beschreibung = "${request.beschreibung ?: ""} [Anonymous upload]"
                    )
                    
                    val id = dmsService.createDocument(document)
                    call.respond(HttpStatusCode.Created, mapOf("id" to id, "anonymousUpload" to true))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error creating document: ${e.message}"))
                }
            }
            
            // Anonymous document version creation
            post("/document/{documentId}/version/{anonymousId}") {
                try {
                    val anonymousId = call.parameters["anonymousId"]
                    val documentId = call.parameters["documentId"]?.toIntOrNull()
                    
                    if (anonymousId.isNullOrBlank() || documentId == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid parameters"))
                        return@post
                    }
                    
                    val document = dmsService.getDocumentById(documentId)
                    if (document == null) {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Document not found"))
                        return@post
                    }
                    
                    // Verify the document belongs to a public dossier
                    val dossier = dmsService.getDossierById(document.dossierId)
                    if (dossier == null || !dossier.isPublicAnonymousShared) {
                        call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Version creation not allowed for this document"))
                        return@post
                    }
                    
                    // Verify anonymous ID matches dossier
                    if (anonymousId != dossier.id.toString()) {
                        call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Invalid access"))
                        return@post
                    }
                    
                    val request = call.receive<CreateDocumentVersionRequest>()
                    
                    val versionsnummer = dmsService.getNextVersionNumber(documentId)
                    val version = DMSDocumentVersion(
                        documentId = documentId,
                        versionsnummer = versionsnummer,
                        dateiname = request.dateiname,
                        dateigroesse = request.dateigroesse,
                        mimeType = request.mimeType,
                        hashWert = request.hashWert,
                        kommentar = "${request.kommentar ?: ""} [Anonymous upload]",
                        userId = dossier.userId,  // Use dossier owner's ID
                        groupId = dossier.groupId,  // Use dossier owner's group
                        erstellungsdatum = LocalDateTime.now().toString()
                    )
                    
                    val id = dmsService.createDocumentVersionWithTextExtraction(version, cas)
                    call.respond(HttpStatusCode.Created, mapOf("id" to id, "versionsnummer" to versionsnummer, "anonymousUpload" to true))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error creating document version: ${e.message}"))
                }
            }
        }
    }
}