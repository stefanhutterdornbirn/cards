package dms.service

import com.shut.ContentAddressableStorage
import dms.model.*
import dms.schema.*
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import java.io.InputStream
import java.time.LocalDateTime
import billing.integration.BillingInterceptor

class DMSService {
    private val billingInterceptor = BillingInterceptor()
    
    fun initialize() {
        transaction {
            SchemaUtils.create(
                RegistraturPlan,
                RegistraturPosition,
                Dossier,
                Document,
                DocumentVersion
            )
        }
    }
    
    /**
     * Extract text from PDF for search indexing
     */
    private fun extractTextFromPdf(inputStream: InputStream): String? {
        var document: PDDocument? = null
        return try {
            println("DEBUG: Loading PDF document...")
            document = PDDocument.load(inputStream)
            
            if (document.isEncrypted) {
                println("DEBUG: PDF is encrypted - cannot extract text from encrypted PDFs")
                return null
            }
            
            val pageCount = document.numberOfPages
            println("DEBUG: PDF has $pageCount pages")
            
            val stripper = PDFTextStripper()
            // Extract text from all pages for complete search coverage
            
            val text = stripper.getText(document)
            println("DEBUG: Raw extracted text length: ${text?.length ?: 0}")
            
            val cleanText = text?.trim()?.takeIf { it.isNotEmpty() }
            println("DEBUG: Clean text length: ${cleanText?.length ?: 0}")
            
            cleanText
        } catch (e: Exception) {
            println("DEBUG: PDF text extraction failed: ${e.message}")
            e.printStackTrace()
            null
        } finally {
            try {
                document?.close()
                println("DEBUG: PDF document closed")
            } catch (e: Exception) {
                println("DEBUG: Error closing PDF document: ${e.message}")
            }
        }
    }
    
    /**
     * Create document version with PDF text extraction
     */
    fun createDocumentVersionWithTextExtraction(version: DMSDocumentVersion, cas: ContentAddressableStorage): Int {
        println("DEBUG: Starting text extraction for file: ${version.dateiname}, mimeType: ${version.mimeType}, hash: ${version.hashWert}")
        
        val isPdf = version.mimeType == "application/pdf" || 
                   version.dateiname.lowercase().endsWith(".pdf")
        
        val extractedText = if (isPdf) {
            try {
                println("DEBUG: File detected as PDF, attempting to retrieve from CAS...")
                val fileData = cas.retrieve(version.hashWert)
                if (fileData != null) {
                    println("DEBUG: File retrieved from CAS successfully")
                    val text = extractTextFromPdf(fileData.inputStream())
                    println("DEBUG: Text extracted, length: ${text?.length ?: 0} characters")
                    if (text != null && text.length > 50) {
                        println("DEBUG: Text preview: ${text.take(100)}...")
                    }
                    text
                } else {
                    println("DEBUG: Failed to retrieve file from CAS")
                    null
                }
            } catch (e: Exception) {
                println("DEBUG: Exception during text extraction: ${e.message}")
                e.printStackTrace()
                null
            }
        } else {
            println("DEBUG: File is not a PDF, skipping text extraction")
            null
        }
        
        println("DEBUG: Final extracted text length: ${extractedText?.length ?: 0}")
        val versionWithText = version.copy(textInhalt = extractedText)
        return createDocumentVersion(versionWithText)
    }
    
    // RegistraturPlan Operations
    fun createRegistraturPlan(plan: DMSRegistraturPlan): Int {
        return transaction {
            RegistraturPlan.insertAndGetId {
                it[name] = plan.name
                it[beschreibung] = plan.beschreibung
                it[groupId] = plan.groupId
                it[userId] = plan.userId
                it[RegistraturPlan.erstellungsdatum] = plan.erstellungsdatum
                it[status] = plan.status
            }.value
        }
    }
    
    fun getRegistraturPlanByGroupId(groupId: Int): DMSRegistraturPlan? {
        return transaction {
            RegistraturPlan.selectAll().where { RegistraturPlan.groupId eq groupId }
                .map { mapToRegistraturPlan(it) }
                .singleOrNull()
        }
    }
    
    fun getRegistraturPlanByUserId(userId: Int): DMSRegistraturPlan? {
        return transaction {
            println("DEBUG - getRegistraturPlanByUserId($userId)")
            // Find Single group ID
            val singleGroupId = com.shut.GroupService().getAllGroups()
                .find { it.name == "Single" }?.id
            
            if (singleGroupId == null) {
                println("DEBUG - Single group not found")
                return@transaction null
            }
            
            val matchingPlans = RegistraturPlan.selectAll()
                .where { (RegistraturPlan.userId eq userId) and (RegistraturPlan.groupId eq singleGroupId) }
                .map { mapToRegistraturPlan(it) }
            
            println("DEBUG - Found ${matchingPlans.size} personal plans for userId $userId in Single group")
            if (matchingPlans.size > 1) {
                println("WARNING - Multiple personal plans found for user $userId, using first one")
                matchingPlans.forEach { plan ->
                    println("DEBUG - Duplicate personal plan: id=${plan.id}, name=${plan.name}")
                }
            }
            
            val result = matchingPlans.firstOrNull()
            println("DEBUG - Selected personal plan for userId $userId: ${result?.name} (id=${result?.id})")
            result
        }
    }
    
    // RegistraturPosition Operations
    fun createRegistraturPosition(position: DMSRegistraturPosition): Int {
        return transaction {
            RegistraturPosition.insertAndGetId {
                it[registraturPlanId] = position.registraturPlanId
                it[positionNummer] = position.positionNummer
                it[name] = position.name
                it[beschreibung] = position.beschreibung
                it[userId] = position.userId
                it[groupId] = position.groupId
                it[erstellungsdatum] = position.erstellungsdatum
                it[status] = position.status
            }.value
        }
    }
    
    fun getRegistraturPositionsByPlanId(planId: Int): List<DMSRegistraturPosition> {
        return transaction {
            RegistraturPosition.selectAll().where { RegistraturPosition.registraturPlanId eq planId }
                .orderBy(RegistraturPosition.positionNummer)
                .map { mapToRegistraturPosition(it) }
        }
    }
    
    fun getRegistraturPositionById(id: Int): DMSRegistraturPosition? {
        return transaction {
            RegistraturPosition.selectAll().where { RegistraturPosition.id eq id }
                .map { mapToRegistraturPosition(it) }
                .singleOrNull()
        }
    }
    
    // Dossier Operations
    fun createDossier(dossier: DMSDossier): Int {
        // Check billing before creating dossier
        billingInterceptor.checkAndDebitDossierCreation(dossier.userId)
        
        return transaction {
            Dossier.insertAndGetId {
                it[registraturPositionId] = dossier.registraturPositionId
                it[parentDossierId] = dossier.parentDossierId
                it[name] = dossier.name
                it[laufnummer] = dossier.laufnummer
                it[positionNummer] = dossier.positionNummer
                it[eindeutigeLaufnummer] = dossier.eindeutigeLaufnummer
                it[isPublicAnonymousShared] = dossier.isPublicAnonymousShared
                it[status] = dossier.status
                it[userId] = dossier.userId
                it[groupId] = dossier.groupId
                it[erstellungsdatum] = dossier.erstellungsdatum
                it[beschreibung] = dossier.beschreibung
            }.value
        }
    }
    
    fun getDossiersByRegistraturPositionId(positionId: Int): List<DMSDossier> {
        return transaction {
            Dossier.selectAll().where { 
                (Dossier.registraturPositionId eq positionId) and 
                (Dossier.parentDossierId.isNull()) and
                (Dossier.status neq "Gelöscht")
            }
                .orderBy(Dossier.eindeutigeLaufnummer)
                .map { mapToDossier(it) }
        }
    }
    
    fun getDossiersByParentId(parentId: Int): List<DMSDossier> {
        return transaction {
            Dossier.selectAll().where { (Dossier.parentDossierId eq parentId) and (Dossier.status neq "Gelöscht") }
                .orderBy(Dossier.eindeutigeLaufnummer)
                .map { mapToDossier(it) }
        }
    }

    fun getAllDossiers(): List<DMSDossier> {
        return transaction {
            Dossier.selectAll().where { Dossier.status neq "Gelöscht" }
                .orderBy(Dossier.eindeutigeLaufnummer)
                .map { mapToDossier(it) }
        }
    }

    fun getDossierById(id: Int): DMSDossier? {
        return transaction {
            Dossier.selectAll().where { Dossier.id eq id }
                .map { mapToDossier(it) }
                .singleOrNull()
        }
    }
    
    fun generateNextDossierLaufnummer(registraturPositionId: Int): Int {
        return transaction {
            val maxLaufnummer = Dossier.selectAll().where { 
                Dossier.registraturPositionId eq registraturPositionId 
            }
                .map { it[Dossier.eindeutigeLaufnummer] }
                .maxOrNull() ?: 0
            maxLaufnummer + 1
        }
    }
    
    // Document Operations
    fun createDocument(document: DMSDocument): Int {
        // Check billing before creating document
        billingInterceptor.checkAndDebitDocumentCreation(document.userId)
        
        return transaction {
            Document.insertAndGetId {
                it[dossierId] = document.dossierId
                it[titel] = document.titel
                it[aktuelleVersionId] = document.aktuelleVersionId
                it[status] = document.status
                it[userId] = document.userId
                it[groupId] = document.groupId
                it[erstellungsdatum] = document.erstellungsdatum
                it[beschreibung] = document.beschreibung
            }.value
        }
    }
    
    fun getDocumentsByDossierId(dossierId: Int): List<DMSDocument> {
        return transaction {
            Document.selectAll().where { (Document.dossierId eq dossierId) and (Document.status neq "Gelöscht") }
                .orderBy(Document.erstellungsdatum)
                .map { mapToDocument(it) }
        }
    }
    
    fun getDocumentById(id: Int): DMSDocument? {
        return transaction {
            Document.selectAll().where { Document.id eq id }
                .map { mapToDocument(it) }
                .singleOrNull()
        }
    }
    
    fun updateDocument(id: Int, updates: UpdateDocumentRequest): Boolean {
        return transaction {
            val updateCount = Document.update({ Document.id eq id }) {
                updates.titel?.let { titel -> it[Document.titel] = titel }
                updates.status?.let { status -> it[Document.status] = status }
                updates.beschreibung?.let { beschreibung -> it[Document.beschreibung] = beschreibung }
            }
            updateCount > 0
        }
    }
    
    fun updateDocumentCurrentVersion(documentId: Int, versionId: Int): Boolean {
        return transaction {
            val updateCount = Document.update({ Document.id eq documentId }) {
                it[aktuelleVersionId] = versionId
            }
            updateCount > 0
        }
    }
    
    // DocumentVersion Operations
    fun createDocumentVersion(version: DMSDocumentVersion): Int {
        return transaction {
            println("DEBUG: Creating document version with status: '${version.status}', hash: ${version.hashWert}")
            val versionId = DocumentVersion.insertAndGetId {
                it[documentId] = version.documentId
                it[versionsnummer] = version.versionsnummer
                it[dateiname] = version.dateiname
                it[dateigroesse] = version.dateigroesse
                it[mimeType] = version.mimeType
                it[hashWert] = version.hashWert
                it[textInhalt] = version.textInhalt
                it[kommentar] = version.kommentar
                it[status] = version.status
                it[userId] = version.userId
                it[groupId] = version.groupId
                it[erstellungsdatum] = version.erstellungsdatum
            }.value
            
            println("DEBUG: Document version created with ID: $versionId")
            
            // Update document's current version
            updateDocumentCurrentVersion(version.documentId, versionId)
            
            versionId
        }
    }
    
    fun getDocumentVersions(documentId: Int): List<DMSDocumentVersion> {
        return transaction {
            DocumentVersion.selectAll().where { (DocumentVersion.documentId eq documentId) and (DocumentVersion.status neq "Gelöscht") }
                .orderBy(DocumentVersion.versionsnummer, SortOrder.DESC)
                .map { mapToDocumentVersion(it) }
        }
    }
    
    fun getDocumentVersionById(id: Int): DMSDocumentVersion? {
        return transaction {
            DocumentVersion.selectAll().where { (DocumentVersion.id eq id) and (DocumentVersion.status neq "Gelöscht") }
                .map { mapToDocumentVersion(it) }
                .singleOrNull()
        }
    }
    
    fun getNextVersionNumber(documentId: Int): Int {
        return transaction {
            val maxVersion = DocumentVersion.selectAll().where { (DocumentVersion.documentId eq documentId) and (DocumentVersion.status neq "Gelöscht") }
                .map { it[DocumentVersion.versionsnummer] }
                .maxOrNull() ?: 0
            maxVersion + 1
        }
    }
    
    fun getDocumentVersionByHash(hash: String): DMSDocumentVersion? {
        return transaction {
            println("DEBUG: Looking for document version with hash: $hash")
            val allVersionsWithHash = DocumentVersion.selectAll().where { DocumentVersion.hashWert eq hash }
                .map { row ->
                    val version = mapToDocumentVersion(row)
                    println("DEBUG: Found version ID ${version.id} with status '${version.status}' for hash $hash")
                    version
                }
            
            val activeVersion = allVersionsWithHash.firstOrNull { it.status != "Gelöscht" }
            if (activeVersion != null) {
                println("DEBUG: Returning active version ID ${activeVersion.id}")
            } else {
                println("DEBUG: No active version found for hash $hash (found ${allVersionsWithHash.size} total versions)")
            }
            
            activeVersion
        }
    }
    
    // Navigation and Tree Operations
    fun buildDMSTree(registraturPlanId: Int): DMSTreeNode {
        return transaction {
            val plan = RegistraturPlan.selectAll().where { RegistraturPlan.id eq registraturPlanId }
                .map { mapToRegistraturPlan(it) }
                .single()
            
            val positions = getRegistraturPositionsByPlanId(registraturPlanId)
            val positionNodes = positions.map { position ->
                val dossiers = getDossiersByRegistraturPositionId(position.id)
                val dossierNodes = dossiers.map { buildDossierTree(it) }
                
                DMSTreeNode(
                    id = position.id,
                    name = position.name,
                    type = "registraturposition",
                    parentId = registraturPlanId,
                    children = dossierNodes,
                    metadata = mapOf(
                        "positionNummer" to position.positionNummer.toString(),
                        "beschreibung" to (position.beschreibung ?: "")
                    )
                )
            }
            
            DMSTreeNode(
                id = plan.id,
                name = plan.name,
                type = "registraturplan",
                children = positionNodes,
                metadata = mapOf(
                    "beschreibung" to (plan.beschreibung ?: "")
                )
            )
        }
    }
    
    private fun buildDossierTree(dossier: DMSDossier): DMSTreeNode {
        return transaction {
            val childDossiers = getDossiersByParentId(dossier.id)
            val documents = getDocumentsByDossierId(dossier.id)
            
            val dossierNodes = childDossiers.map { buildDossierTree(it) }
            val documentNodes = documents.map { document ->
                DMSTreeNode(
                    id = document.id,
                    name = document.titel,
                    type = "document",
                    parentId = dossier.id,
                    metadata = mapOf(
                        "status" to document.status,
                        "aktuelleVersionId" to (document.aktuelleVersionId ?: 0).toString(),
                        "beschreibung" to (document.beschreibung ?: "")
                    )
                )
            }
            
            DMSTreeNode(
                id = dossier.id,
                name = dossier.name,
                type = "dossier",
                parentId = dossier.parentDossierId,
                children = dossierNodes + documentNodes,
                metadata = mapOf(
                    "laufnummer" to dossier.laufnummer,
                    "status" to dossier.status,
                    "beschreibung" to (dossier.beschreibung ?: "")
                )
            )
        }
    }
    
    // Mapping functions
    private fun mapToRegistraturPlan(row: ResultRow): DMSRegistraturPlan {
        return DMSRegistraturPlan(
            id = row[RegistraturPlan.id].value,
            name = row[RegistraturPlan.name],
            beschreibung = row[RegistraturPlan.beschreibung],
            groupId = row[RegistraturPlan.groupId],
            userId = row[RegistraturPlan.userId],
            erstellungsdatum = row[RegistraturPlan.erstellungsdatum].toString(),
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
            erstellungsdatum = row[RegistraturPosition.erstellungsdatum].toString(),
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
            erstellungsdatum = row[Dossier.erstellungsdatum].toString(),
            beschreibung = row[Dossier.beschreibung],
            isPublicAnonymousShared = row[Dossier.isPublicAnonymousShared]
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
            erstellungsdatum = row[Document.erstellungsdatum].toString(),
            beschreibung = row[Document.beschreibung]
        )
    }
    
    private fun mapToDocumentVersion(row: ResultRow): DMSDocumentVersion {
        return DMSDocumentVersion(
            id = row[DocumentVersion.id].value,
            documentId = row[DocumentVersion.documentId].value,
            versionsnummer = row[DocumentVersion.versionsnummer],
            dateiname = row[DocumentVersion.dateiname],
            dateigroesse = row[DocumentVersion.dateigroesse],
            mimeType = row[DocumentVersion.mimeType],
            hashWert = row[DocumentVersion.hashWert],
            kommentar = row[DocumentVersion.kommentar],
            status = row[DocumentVersion.status],
            userId = row[DocumentVersion.userId],
            groupId = row[DocumentVersion.groupId],
            erstellungsdatum = row[DocumentVersion.erstellungsdatum].toString(),
            textInhalt = row[DocumentVersion.textInhalt]
        )
    }
    
    /**
     * Search documents and dossiers based on search criteria
     */
    fun searchDocuments(searchRequest: DMSSearchRequest, userId: Int, groupId: Int): DMSSearchResult {
        return transaction {
            val documentResults = mutableListOf<DMSSearchResultItem>()
            val dossiers = mutableListOf<DMSDossier>()
            
            // Search in documents if type is "document" or "all" or null
            if (searchRequest.type == null || searchRequest.type == "all" || searchRequest.type == "document") {
                val searchTerm = "%${searchRequest.query.lowercase()}%"
                
                // Search in document metadata first
                val documentMetadataQuery = (Document innerJoin Dossier innerJoin RegistraturPosition innerJoin RegistraturPlan)
                    .selectAll().where {
                        (Document.groupId eq groupId) and
                        (
                            Document.titel.lowerCase().like(searchTerm) or
                            Document.beschreibung.lowerCase().like(searchTerm)
                        )
                    }
                
                // Apply date filters to document metadata query
                var filteredDocQuery = documentMetadataQuery
                if (!searchRequest.dateFrom.isNullOrBlank()) {
                    filteredDocQuery = filteredDocQuery.andWhere { Document.erstellungsdatum greaterEq searchRequest.dateFrom }
                }
                if (!searchRequest.dateTo.isNullOrBlank()) {
                    filteredDocQuery = filteredDocQuery.andWhere { Document.erstellungsdatum lessEq searchRequest.dateTo }
                }
                
                for (row in filteredDocQuery) {
                    val document = DMSDocument(
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
                    
                    val matchType = when {
                        row[Document.titel].lowercase().contains(searchRequest.query.lowercase()) -> "document_title"
                        row[Document.beschreibung]?.lowercase()?.contains(searchRequest.query.lowercase()) == true -> "document_description"
                        else -> "document"
                    }
                    
                    documentResults.add(DMSSearchResultItem(
                        document = document,
                        matchedVersion = null,
                        matchType = matchType,
                        matchPreview = null
                    ))
                }
                
                // Search in document versions
                val versionQuery = (Document innerJoin Dossier innerJoin RegistraturPosition innerJoin RegistraturPlan innerJoin DocumentVersion)
                    .selectAll().where {
                        (Document.groupId eq groupId) and
                        (
                            DocumentVersion.textInhalt.lowerCase().like(searchTerm) or
                            DocumentVersion.dateiname.lowerCase().like(searchTerm) or
                            DocumentVersion.kommentar.lowerCase().like(searchTerm)
                        )
                    }
                
                // Apply filters to version query
                var filteredVersionQuery = versionQuery
                if (!searchRequest.dateFrom.isNullOrBlank()) {
                    filteredVersionQuery = filteredVersionQuery.andWhere { Document.erstellungsdatum greaterEq searchRequest.dateFrom }
                }
                if (!searchRequest.dateTo.isNullOrBlank()) {
                    filteredVersionQuery = filteredVersionQuery.andWhere { Document.erstellungsdatum lessEq searchRequest.dateTo }
                }
                if (!searchRequest.mimeType.isNullOrBlank()) {
                    filteredVersionQuery = filteredVersionQuery.andWhere { DocumentVersion.mimeType eq searchRequest.mimeType }
                }
                
                for (row in filteredVersionQuery) {
                    val document = DMSDocument(
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
                    
                    val version = DMSDocumentVersion(
                        id = row[DocumentVersion.id].value,
                        documentId = row[DocumentVersion.documentId].value,
                        versionsnummer = row[DocumentVersion.versionsnummer],
                        dateiname = row[DocumentVersion.dateiname],
                        dateigroesse = row[DocumentVersion.dateigroesse],
                        mimeType = row[DocumentVersion.mimeType],
                        hashWert = row[DocumentVersion.hashWert],
                        textInhalt = row[DocumentVersion.textInhalt],
                        kommentar = row[DocumentVersion.kommentar],
                        userId = row[DocumentVersion.userId],
                        groupId = row[DocumentVersion.groupId],
                        erstellungsdatum = row[DocumentVersion.erstellungsdatum]
                    )
                    
                    // Determine match type and create preview
                    val (matchType, matchPreview) = when {
                        row[DocumentVersion.textInhalt]?.lowercase()?.contains(searchRequest.query.lowercase()) == true -> {
                            val textContent = row[DocumentVersion.textInhalt] ?: ""
                            val preview = generateTextPreview(textContent, searchRequest.query)
                            "version_content" to preview
                        }
                        row[DocumentVersion.dateiname].lowercase().contains(searchRequest.query.lowercase()) -> {
                            "version_filename" to row[DocumentVersion.dateiname]
                        }
                        row[DocumentVersion.kommentar]?.lowercase()?.contains(searchRequest.query.lowercase()) == true -> {
                            "version_comment" to row[DocumentVersion.kommentar]
                        }
                        else -> "version" to null
                    }
                    
                    // Check if this document is already in results (avoid duplicates)
                    val existingResult = documentResults.find { it.document.id == document.id }
                    if (existingResult == null) {
                        documentResults.add(DMSSearchResultItem(
                            document = document,
                            matchedVersion = version,
                            matchType = matchType,
                            matchPreview = matchPreview
                        ))
                    }
                }
            }
            
            // Search in dossiers if type is "dossier" or "all" or null  
            if (searchRequest.type == null || searchRequest.type == "all" || searchRequest.type == "dossier") {
                val dossierQuery = (Dossier innerJoin RegistraturPosition innerJoin RegistraturPlan)
                    .selectAll().where {
                        val searchTerm = "%${searchRequest.query.lowercase()}%"
                        (Dossier.groupId eq groupId) and
                        (
                            Dossier.name.lowerCase().like(searchTerm) or
                            Dossier.beschreibung.lowerCase().like(searchTerm) or
                            Dossier.laufnummer.lowerCase().like(searchTerm)
                        )
                    }
                
                // Apply date filters
                var filteredDossierQuery = dossierQuery
                
                if (!searchRequest.dateFrom.isNullOrBlank()) {
                    filteredDossierQuery = filteredDossierQuery.andWhere { Dossier.erstellungsdatum greaterEq searchRequest.dateFrom }
                }
                
                if (!searchRequest.dateTo.isNullOrBlank()) {
                    filteredDossierQuery = filteredDossierQuery.andWhere { Dossier.erstellungsdatum lessEq searchRequest.dateTo }
                }
                
                for (row in filteredDossierQuery) {
                    dossiers.add(DMSDossier(
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
                    ))
                }
            }
            
            DMSSearchResult(
                documents = documentResults,
                dossiers = dossiers,
                totalCount = documentResults.size + dossiers.size
            )
        }
    }
    
    /**
     * Generate a preview snippet showing the search term in context
     */
    private fun generateTextPreview(text: String, searchTerm: String, contextLength: Int = 100): String {
        val searchIndex = text.lowercase().indexOf(searchTerm.lowercase())
        if (searchIndex == -1) return text.take(contextLength)
        
        val start = maxOf(0, searchIndex - contextLength / 2)
        val end = minOf(text.length, searchIndex + searchTerm.length + contextLength / 2)
        
        var preview = text.substring(start, end)
        if (start > 0) preview = "..." + preview
        if (end < text.length) preview = preview + "..."
        
        return preview.trim()
    }
    
    /**
     * Get comprehensive DMS statistics
     */
    fun getStatistics(userId: Int, groupId: Int, isSystemAdmin: Boolean = false): DMSStatistics {
        return transaction {
            val groupService = com.shut.GroupService()
            
            if (isSystemAdmin) {
                // System admin sees statistics across ALL groups (excluding deleted)
                val totalDocuments = Document.selectAll().where { Document.status neq "Gelöscht" }.count().toInt()
                val totalDossiers = Dossier.selectAll().where { Dossier.status neq "Gelöscht" }.count().toInt()
                val totalVersions = (Document innerJoin DocumentVersion)
                    .selectAll().where { Document.status neq "Gelöscht" }.count().toInt()
                
                // Storage calculation across all groups (excluding deleted)
                val totalStorageBytes = (Document innerJoin DocumentVersion)
                    .selectAll().where { Document.status neq "Gelöscht" }
                    .sumOf { it[DocumentVersion.dateigroesse] }
                
                // Documents by status across all groups
                val documentsByStatus = Document.selectAll()
                    .groupBy { it[Document.status] }
                    .mapValues { it.value.size }
                
                // Documents by MIME type across all groups (excluding deleted)
                val documentsByMimeType = (Document innerJoin DocumentVersion)
                    .selectAll().where { Document.status neq "Gelöscht" }
                    .groupBy { it[DocumentVersion.mimeType] }
                    .mapValues { it.value.size }
                
                // Average versions per document
                val averageVersionsPerDocument = if (totalDocuments > 0) {
                    totalVersions.toDouble() / totalDocuments
                } else 0.0
                
                // Recent uploads (last 7 days) across all groups
                val sevenDaysAgo = java.time.LocalDateTime.now().minusDays(7).toString()
                val recentUploads = DocumentVersion.selectAll()
                    .where { (DocumentVersion.erstellungsdatum greater sevenDaysAgo) and (DocumentVersion.status neq "Gelöscht") }
                    .count().toInt()
                
                // Top file types with detailed statistics across all groups (excluding deleted)
                val fileTypeStats = (Document innerJoin DocumentVersion)
                    .selectAll().where { (Document.status neq "Gelöscht") and (DocumentVersion.status neq "Gelöscht") }
                    .groupBy { it[DocumentVersion.mimeType] }
                    .map { (mimeType, rows) ->
                        val extension = getFileExtensionFromMimeType(mimeType)
                        val count = rows.size
                        val totalSize = rows.sumOf { it[DocumentVersion.dateigroesse] }
                        
                        FileTypeStatistic(
                            mimeType = mimeType,
                            extension = extension,
                            count = count,
                            totalSize = totalSize
                        )
                    }
                    .sortedByDescending { it.count }
                    .take(10)
                
                // Storage by ALL groups (including groups with no documents)
                val allGroups = groupService.getAllGroups()
                val storageByGroup = allGroups.associate { group ->
                    val groupDocuments = (Document innerJoin DocumentVersion)
                        .selectAll().where { Document.groupId eq (group.id ?: 0) }
                        .toList()
                    
                    val groupStorage = if (groupDocuments.isNotEmpty()) {
                        groupDocuments.sumOf { it[DocumentVersion.dateigroesse] }
                    } else {
                        0L
                    }
                    
                    group.name to groupStorage
                }
                
                DMSStatistics(
                    totalDocuments = totalDocuments,
                    totalDossiers = totalDossiers,
                    totalVersions = totalVersions,
                    totalStorageBytes = totalStorageBytes,
                    documentsByStatus = documentsByStatus,
                    documentsByMimeType = documentsByMimeType,
                    averageVersionsPerDocument = averageVersionsPerDocument,
                    recentUploads = recentUploads,
                    topFileTypes = fileTypeStats,
                    storageByGroup = storageByGroup
                )
                
            } else {
                // Regular user sees only their group's statistics (excluding deleted)
                val totalDocuments = Document.selectAll().where { (Document.groupId eq groupId) and (Document.status neq "Gelöscht") }.count().toInt()
                val totalDossiers = Dossier.selectAll().where { (Dossier.groupId eq groupId) and (Dossier.status neq "Gelöscht") }.count().toInt()
                val totalVersions = (Document innerJoin DocumentVersion)
                    .selectAll().where { (Document.groupId eq groupId) and (Document.status neq "Gelöscht") }.count().toInt()
                
                // Storage calculation (excluding deleted)
                val totalStorageBytes = (Document innerJoin DocumentVersion)
                    .selectAll().where { (Document.groupId eq groupId) and (Document.status neq "Gelöscht") }
                    .sumOf { it[DocumentVersion.dateigroesse] }
                
                // Documents by status
                val documentsByStatus = Document.selectAll()
                    .where { Document.groupId eq groupId }
                    .groupBy { it[Document.status] }
                    .mapValues { it.value.size }
                
                // Documents by MIME type (excluding deleted)
                val documentsByMimeType = (Document innerJoin DocumentVersion)
                    .selectAll().where { (Document.groupId eq groupId) and (Document.status neq "Gelöscht") }
                    .groupBy { it[DocumentVersion.mimeType] }
                    .mapValues { it.value.size }
                
                // Average versions per document
                val averageVersionsPerDocument = if (totalDocuments > 0) {
                    totalVersions.toDouble() / totalDocuments
                } else 0.0
                
                // Recent uploads (last 7 days)
                val sevenDaysAgo = java.time.LocalDateTime.now().minusDays(7).toString()
                val recentUploads = DocumentVersion.selectAll()
                    .where { 
                        (DocumentVersion.erstellungsdatum greater sevenDaysAgo) and
                        (DocumentVersion.groupId eq groupId) and
                        (DocumentVersion.status neq "Gelöscht")
                    }
                    .count().toInt()
                
                // Top file types with detailed statistics
                val fileTypeStats = (Document innerJoin DocumentVersion)
                    .selectAll().where { (Document.groupId eq groupId) and (Document.status neq "Gelöscht") and (DocumentVersion.status neq "Gelöscht") }
                    .groupBy { it[DocumentVersion.mimeType] }
                    .map { (mimeType, rows) ->
                        val extension = getFileExtensionFromMimeType(mimeType)
                        val count = rows.size
                        val totalSize = rows.sumOf { it[DocumentVersion.dateigroesse] }
                        
                        FileTypeStatistic(
                            mimeType = mimeType,
                            extension = extension,
                            count = count,
                            totalSize = totalSize
                        )
                    }
                    .sortedByDescending { it.count }
                    .take(10)
                
                // Storage by current group only
                val group = groupService.getGroupById(groupId)
                val groupName = group?.name ?: "Unbekannte Gruppe"
                val storageByGroup = mapOf(
                    groupName to totalStorageBytes
                )
                
                DMSStatistics(
                    totalDocuments = totalDocuments,
                    totalDossiers = totalDossiers,
                    totalVersions = totalVersions,
                    totalStorageBytes = totalStorageBytes,
                    documentsByStatus = documentsByStatus,
                    documentsByMimeType = documentsByMimeType,
                    averageVersionsPerDocument = averageVersionsPerDocument,
                    recentUploads = recentUploads,
                    topFileTypes = fileTypeStats,
                    storageByGroup = storageByGroup
                )
            }
        }
    }
    
    /**
     * Get file extension from MIME type
     */
    private fun getFileExtensionFromMimeType(mimeType: String): String {
        return when (mimeType) {
            "application/pdf" -> ".pdf"
            "application/msword" -> ".doc"
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx"
            "application/vnd.ms-excel" -> ".xls"
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> ".xlsx"
            "application/vnd.ms-powerpoint" -> ".ppt"
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" -> ".pptx"
            "text/plain" -> ".txt"
            "image/jpeg" -> ".jpg"
            "image/png" -> ".png"
            "image/gif" -> ".gif"
            else -> ""
        }
    }
    
    // ======================== SOFT DELETE METHODS ========================
    
    /**
     * Soft delete a document by setting its status to "Gelöscht"
     */
    fun softDeleteDocument(documentId: Int): Boolean {
        return transaction {
            Document.update({ Document.id eq documentId }) {
                it[status] = "Gelöscht"
            } > 0
        }
    }
    
    /**
     * Soft delete a document version by setting its status to "Gelöscht"
     */
    fun softDeleteDocumentVersion(versionId: Int): Boolean {
        return transaction {
            val version = DocumentVersion.selectAll().where { DocumentVersion.id eq versionId }.singleOrNull()
            if (version != null) {
                val documentId = version[DocumentVersion.documentId].value
                val activeVersionCount = DocumentVersion.selectAll().where { 
                    (DocumentVersion.documentId eq documentId) and (DocumentVersion.status neq "Gelöscht") 
                }.count()
                
                if (activeVersionCount <= 1) {
                    // If this is the only active version, mark the whole document as deleted too
                    Document.update({ Document.id eq documentId }) {
                        it[status] = "Gelöscht"
                    }
                }
                
                // Mark the version as deleted
                DocumentVersion.update({ DocumentVersion.id eq versionId }) {
                    it[status] = "Gelöscht"
                } > 0
            } else {
                false
            }
        }
    }
    
    /**
     * Soft delete a dossier and all its documents by setting status to "Gelöscht"
     */
    fun softDeleteDossier(dossierId: Int): Boolean {
        return transaction {
            // First, soft delete all documents in the dossier
            val documents = Document.selectAll().where { Document.dossierId eq dossierId }
            documents.forEach { document ->
                Document.update({ Document.id eq document[Document.id] }) {
                    it[status] = "Gelöscht"
                }
            }
            
            // Then soft delete the dossier itself
            Dossier.update({ Dossier.id eq dossierId }) {
                it[status] = "Gelöscht"
            } > 0
        }
    }

    /**
     * Soft delete a document version by setting its status to "Gelöscht"
     * This allows the version to be recovered later if needed
     */
    fun     deleteDocumentVersion(versionId: Int): Boolean {
        return transaction {
            DocumentVersion.update({ DocumentVersion.id eq versionId }) {
                it[status] = "Gelöscht"
            } > 0
        }
    }

    /**
     * Restore a soft-deleted document version by setting its status back to "Aktiv"
     */
    fun restoreDocumentVersion(versionId: Int): Boolean {
        return transaction {
            DocumentVersion.update({ DocumentVersion.id eq versionId }) {
                it[status] = "Aktiv"
            } > 0
        }
    }

    /**
     * Get all document versions including deleted ones (for administrative purposes)
     */
    fun getAllDocumentVersions(documentId: Int): List<DMSDocumentVersion> {
        return transaction {
            DocumentVersion.selectAll().where { DocumentVersion.documentId eq documentId }
                .orderBy(DocumentVersion.versionsnummer, SortOrder.DESC)
                .map { mapToDocumentVersion(it) }
        }
    }

    /**
     * Get only deleted document versions
     */
    fun getDeletedDocumentVersions(documentId: Int): List<DMSDocumentVersion> {
        return transaction {
            DocumentVersion.selectAll().where { (DocumentVersion.documentId eq documentId) and (DocumentVersion.status eq "Gelöscht") }
                .orderBy(DocumentVersion.versionsnummer, SortOrder.DESC)
                .map { mapToDocumentVersion(it) }
        }
    }
    
    /**
     * Soft delete a registratur position and all its dossiers/documents
     */
    fun softDeleteRegistraturPosition(positionId: Int): Boolean {
        return transaction {
            // First, get all dossiers in this position
            val dossiers = Dossier.selectAll().where { Dossier.registraturPositionId eq positionId }
            
            // Soft delete all documents in all dossiers
            dossiers.forEach { dossier ->
                val dossierId = dossier[Dossier.id].value
                softDeleteDossier(dossierId)
            }
            
            // Then soft delete the position itself
            RegistraturPosition.update({ RegistraturPosition.id eq positionId }) {
                it[status] = "Gelöscht"
            } > 0
        }
    }
    
    /**
     * Restore (undelete) a document by setting its status back to "Entwurf"
     */
    fun restoreDocument(documentId: Int): Boolean {
        return transaction {
            Document.update({ Document.id eq documentId }) {
                it[status] = "Entwurf"
            } > 0
        }
    }
    
    /**
     * Restore (undelete) a dossier and its documents
     */
    fun restoreDossier(dossierId: Int): Boolean {
        return transaction {
            // Restore all documents in the dossier
            val documents = Document.selectAll().where { Document.dossierId eq dossierId }
            documents.forEach { document ->
                Document.update({ Document.id eq document[Document.id] }) {
                    it[status] = "Entwurf"
                }
            }
            
            // Restore the dossier itself
            Dossier.update({ Dossier.id eq dossierId }) {
                it[status] = "Aktiv"
            } > 0
        }
    }
    
    /**
     * Get deleted items for restoration (admin function)
     */
    fun getDeletedItems(userId: Int, groupId: Int): Map<String, List<Any>> {
        return transaction {
            val deletedDocuments = Document
                .selectAll().where { (Document.status eq "Gelöscht") and (Document.groupId eq groupId) }
                .map { row ->
                    DMSDocument(
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
            
            val deletedDossiers = Dossier
                .selectAll().where { (Dossier.status eq "Gelöscht") and (Dossier.groupId eq groupId) }
                .map { row ->
                    DMSDossier(
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
            
            // Get deleted document versions with their document information
            val deletedVersions = (DocumentVersion innerJoin Document)
                .selectAll().where { (DocumentVersion.status eq "Gelöscht") and (DocumentVersion.groupId eq groupId) }
                .map { row ->
                    mapOf(
                        "version" to DMSDocumentVersion(
                            id = row[DocumentVersion.id].value,
                            documentId = row[DocumentVersion.documentId].value,
                            versionsnummer = row[DocumentVersion.versionsnummer],
                            dateiname = row[DocumentVersion.dateiname],
                            dateigroesse = row[DocumentVersion.dateigroesse],
                            mimeType = row[DocumentVersion.mimeType],
                            hashWert = row[DocumentVersion.hashWert],
                            textInhalt = row[DocumentVersion.textInhalt],
                            kommentar = row[DocumentVersion.kommentar],
                            status = row[DocumentVersion.status],
                            userId = row[DocumentVersion.userId],
                            groupId = row[DocumentVersion.groupId],
                            erstellungsdatum = row[DocumentVersion.erstellungsdatum]
                        ),
                        "documentTitle" to row[Document.titel]
                    )
                }
            
            mapOf(
                "documents" to deletedDocuments,
                "dossiers" to deletedDossiers,
                "documentVersions" to deletedVersions
            )
        }
    }
    
    // Anonymous sharing functionality
    fun getAnonymousShareLink(dossierId: Int): String? {
        return transaction {
            val dossier = Dossier
                .selectAll().where { Dossier.id eq dossierId }
                .singleOrNull()
                ?.let { row ->
                    DMSDossier(
                        id = row[Dossier.id].value,
                        registraturPositionId = row[Dossier.registraturPositionId].value,
                        parentDossierId = row[Dossier.parentDossierId]?.value,
                        name = row[Dossier.name],
                        laufnummer = row[Dossier.laufnummer],
                        positionNummer = row[Dossier.positionNummer],
                        eindeutigeLaufnummer = row[Dossier.eindeutigeLaufnummer],
                        status = row[Dossier.status],
                        isPublicAnonymousShared = row[Dossier.isPublicAnonymousShared],
                        userId = row[Dossier.userId],
                        groupId = row[Dossier.groupId],
                        erstellungsdatum = row[Dossier.erstellungsdatum],
                        beschreibung = row[Dossier.beschreibung]
                    )
                }
            
            if (dossier != null && dossier.isPublicAnonymousShared) {
                // For now, use the dossier ID as the anonymous ID
                // In production, you might want to use a UUID or encrypted token
                "/dms/public/dossier/${dossier.id}"
            } else {
                null
            }
        }
    }
    
    fun setDossierPublicSharing(dossierId: Int, isPublic: Boolean): Boolean {
        return transaction {
            val updateCount = Dossier.update({ Dossier.id eq dossierId }) {
                it[isPublicAnonymousShared] = isPublic
            }
            updateCount > 0
        }
    }
    
    fun getPublicDossierInfo(dossierId: Int): DMSDossier? {
        return transaction {
            Dossier
                .selectAll().where { (Dossier.id eq dossierId) and (Dossier.isPublicAnonymousShared eq true) }
                .singleOrNull()
                ?.let { row ->
                    DMSDossier(
                        id = row[Dossier.id].value,
                        registraturPositionId = row[Dossier.registraturPositionId].value,
                        parentDossierId = row[Dossier.parentDossierId]?.value,
                        name = row[Dossier.name],
                        laufnummer = row[Dossier.laufnummer],
                        positionNummer = row[Dossier.positionNummer],
                        eindeutigeLaufnummer = row[Dossier.eindeutigeLaufnummer],
                        status = row[Dossier.status],
                        isPublicAnonymousShared = row[Dossier.isPublicAnonymousShared],
                        userId = row[Dossier.userId],
                        groupId = row[Dossier.groupId],
                        erstellungsdatum = row[Dossier.erstellungsdatum],
                        beschreibung = row[Dossier.beschreibung]
                    )
                }
        }
    }
}