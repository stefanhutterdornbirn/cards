package dms.service

import dms.model.*
import dms.schema.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

/**
 * Optimized DMS Service with lazy loading for better performance
 */
class OptimizedDMSService {
    
    /**
     * Build ultra-lightweight tree - just the plan with minimal data
     */
    fun buildLightweightTree(registraturPlanId: Int): DMSTreeNode {
        println("[OptimizedDMSService] buildLightweightTree: Starting for registraturPlanId: $registraturPlanId")
        
        return transaction {
            println("[OptimizedDMSService] buildLightweightTree: Inside transaction, querying RegistraturPlan")
            val queryStartTime = System.currentTimeMillis()
            
            val plan = RegistraturPlan.selectAll().where { RegistraturPlan.id eq registraturPlanId }
                .map { mapToRegistraturPlan(it) }
                .singleOrNull()
            
            val queryDuration = System.currentTimeMillis() - queryStartTime
            println("[OptimizedDMSService] buildLightweightTree: Query completed in ${queryDuration}ms")
            
            if (plan == null) {
                println("[OptimizedDMSService] buildLightweightTree: ERROR - Registraturplan not found for ID: $registraturPlanId")
                throw Exception("Registraturplan not found")
            }
            
            println("[OptimizedDMSService] buildLightweightTree: Found plan: ${plan.name} (id=${plan.id})")
            
            val treeNode = DMSTreeNode(
                id = plan.id,
                name = plan.name,
                type = "registraturplan",
                children = emptyList(), // Load positions on demand
                metadata = mapOf(
                    "beschreibung" to (plan.beschreibung ?: ""),
                    "hasChildren" to "true",
                    "lazy" to "true"
                )
            )
            
            println("[OptimizedDMSService] buildLightweightTree: Successfully created tree node for plan ${plan.id}")
            treeNode
        }
    }
    
    /**
     * Load children for a specific node on-demand
     */
    fun loadNodeChildren(nodeId: Int, nodeType: String): List<DMSTreeNode> {
        return transaction {
            when (nodeType) {
                "registraturplan" -> {
                    // Load positions for the plan
                    val positions = getRegistraturPositionsByPlanId(nodeId)
                    positions.map { position ->
                        DMSTreeNode(
                            id = position.id,
                            name = position.name,
                            type = "registraturposition",
                            parentId = nodeId,
                            children = emptyList(),
                            metadata = mapOf(
                                "positionNummer" to position.positionNummer.toString(),
                                "beschreibung" to (position.beschreibung ?: ""),
                                "hasChildren" to "true", // Assume has dossiers
                                "lazy" to "true"
                            )
                        )
                    }
                }
                
                "registraturposition" -> {
                    val dossiers = getDossiersByRegistraturPositionId(nodeId)
                        .filter { it.parentDossierId == null } // Only root dossiers
                    
                    dossiers.map { dossier ->
                        val childDossierCount = Dossier.selectAll()
                            .where { (Dossier.parentDossierId eq dossier.id) and (Dossier.status neq "Gelöscht") }
                            .count()
                        
                        val documentCount = Document.selectAll()
                            .where { (Document.dossierId eq dossier.id) and (Document.status neq "Gelöscht") }
                            .count()
                        
                        val totalChildren = childDossierCount + documentCount
                        
                        DMSTreeNode(
                            id = dossier.id,
                            name = "${dossier.name} (${documentCount}D, ${childDossierCount}S)",
                            type = "dossier",
                            parentId = nodeId,
                            children = emptyList(),
                            metadata = mapOf(
                                "laufnummer" to dossier.laufnummer,
                                "status" to dossier.status,
                                "beschreibung" to (dossier.beschreibung ?: ""),
                                "hasChildren" to (totalChildren > 0).toString(),
                                "documentCount" to documentCount.toString(),
                                "childDossierCount" to childDossierCount.toString(),
                                "lazy" to "true"
                            )
                        )
                    }
                }
                
                "dossier" -> {
                    val childDossiers = getDossiersByParentId(nodeId)
                    val documents = getDocumentsByDossierId(nodeId)
                    
                    val dossierNodes = childDossiers.map { dossier ->
                        val subDossierCount = Dossier.selectAll()
                            .where { (Dossier.parentDossierId eq dossier.id) and (Dossier.status neq "Gelöscht") }
                            .count()
                        
                        val subDocumentCount = Document.selectAll()
                            .where { (Document.dossierId eq dossier.id) and (Document.status neq "Gelöscht") }
                            .count()
                        
                        DMSTreeNode(
                            id = dossier.id,
                            name = "${dossier.name} (${subDocumentCount}D, ${subDossierCount}S)",
                            type = "dossier",
                            parentId = nodeId,
                            children = emptyList(),
                            metadata = mapOf(
                                "laufnummer" to dossier.laufnummer,
                                "status" to dossier.status,
                                "beschreibung" to (dossier.beschreibung ?: ""),
                                "hasChildren" to ((subDossierCount + subDocumentCount) > 0).toString(),
                                "lazy" to "true"
                            )
                        )
                    }
                    
                    val documentNodes = documents.map { document ->
                        val versionCount = DocumentVersion.selectAll()
                            .where { (DocumentVersion.documentId eq document.id) and (DocumentVersion.status neq "Gelöscht") }
                            .count()
                        
                        DMSTreeNode(
                            id = document.id,
                            name = "${document.titel} (${versionCount}V)",
                            type = "document",
                            parentId = nodeId,
                            children = emptyList(),
                            metadata = mapOf(
                                "status" to document.status,
                                "aktuelleVersionId" to (document.aktuelleVersionId ?: 0).toString(),
                                "beschreibung" to (document.beschreibung ?: ""),
                                "versionCount" to versionCount.toString(),
                                "hasChildren" to (versionCount > 0).toString(),
                                "lazy" to "false"
                            )
                        )
                    }
                    
                    dossierNodes + documentNodes
                }
                
                else -> emptyList()
            }
        }
    }
    
    // Helper methods (reuse from existing DMSService)
    private fun getRegistraturPositionsByPlanId(planId: Int): List<DMSRegistraturPosition> {
        return transaction {
            RegistraturPosition.selectAll()
                .where { (RegistraturPosition.registraturPlanId eq planId) and (RegistraturPosition.status neq "Gelöscht") }
                .orderBy(RegistraturPosition.positionNummer)
                .map { mapToRegistraturPosition(it) }
        }
    }
    
    private fun getDossiersByRegistraturPositionId(positionId: Int): List<DMSDossier> {
        return transaction {
            Dossier.selectAll()
                .where { (Dossier.registraturPositionId eq positionId) and (Dossier.status neq "Gelöscht") }
                .orderBy(Dossier.laufnummer)
                .map { mapToDossier(it) }
        }
    }
    
    private fun getDossiersByParentId(parentId: Int): List<DMSDossier> {
        return transaction {
            Dossier.selectAll()
                .where { (Dossier.parentDossierId eq parentId) and (Dossier.status neq "Gelöscht") }
                .orderBy(Dossier.laufnummer)
                .map { mapToDossier(it) }
        }
    }
    
    private fun getDocumentsByDossierId(dossierId: Int): List<DMSDocument> {
        return transaction {
            Document.selectAll()
                .where { (Document.dossierId eq dossierId) and (Document.status neq "Gelöscht") }
                .orderBy(Document.erstellungsdatum)
                .map { mapToDocument(it) }
        }
    }
    
    // Mapping functions (copy from DMSService)
    private fun mapToRegistraturPlan(row: ResultRow): DMSRegistraturPlan {
        return DMSRegistraturPlan(
            id = row[RegistraturPlan.id].value,
            name = row[RegistraturPlan.name],
            beschreibung = row[RegistraturPlan.beschreibung],
            groupId = row[RegistraturPlan.groupId],
            userId = row[RegistraturPlan.userId],
            erstellungsdatum = row[RegistraturPlan.erstellungsdatum],
            status = row[RegistraturPlan.status]
        )
    }
    
    private fun mapToRegistraturPosition(row: ResultRow): DMSRegistraturPosition {
        return DMSRegistraturPosition(
            id = row[RegistraturPosition.id].value,
            registraturPlanId = row[RegistraturPosition.registraturPlanId].value,
            positionNummer = row[RegistraturPosition.positionNummer],
            name = row[RegistraturPosition.name],
            beschreibung = row[RegistraturPosition.beschreibung],
            userId = row[RegistraturPosition.userId],
            groupId = row[RegistraturPosition.groupId],
            erstellungsdatum = row[RegistraturPosition.erstellungsdatum],
            status = row[RegistraturPosition.status]
        )
    }
    
    private fun mapToDossier(row: ResultRow): DMSDossier {
        return DMSDossier(
            id = row[Dossier.id].value,
            registraturPositionId = row[Dossier.registraturPositionId].value,
            parentDossierId = row[Dossier.parentDossierId]?.value,
            name = row[Dossier.name],
            laufnummer = row[Dossier.laufnummer],
            positionNummer = row[Dossier.positionNummer],
            eindeutigeLaufnummer = row[Dossier.eindeutigeLaufnummer],
            status = row[Dossier.status],
            userId = row[Dossier.userId],
            groupId = row[Dossier.groupId],
            erstellungsdatum = row[Dossier.erstellungsdatum],
            beschreibung = row[Dossier.beschreibung]
        )
    }
    
    private fun mapToDocument(row: ResultRow): DMSDocument {
        return DMSDocument(
            id = row[Document.id].value,
            dossierId = row[Document.dossierId].value,
            titel = row[Document.titel],
            aktuelleVersionId = row[Document.aktuelleVersionId],
            status = row[Document.status],
            userId = row[Document.userId],
            groupId = row[Document.groupId],
            erstellungsdatum = row[Document.erstellungsdatum],
            beschreibung = row[Document.beschreibung]
        )
    }
}