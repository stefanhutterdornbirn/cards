package dms.model

import kotlinx.serialization.Serializable
import java.time.LocalDateTime

@Serializable
data class DMSRegistraturPlan(
    val id: Int = 0,
    val name: String,
    val beschreibung: String? = null,
    val groupId: Int,
    val userId: Int,
    val erstellungsdatum: String = LocalDateTime.now().toString(),
    val status: String = "Aktiv"
)

@Serializable
data class DMSRegistraturPosition(
    val id: Int = 0,
    val registraturPlanId: Int,
    val positionNummer: Int,
    val name: String,
    val beschreibung: String? = null,
    val userId: Int,
    val groupId: Int,
    val erstellungsdatum: String = LocalDateTime.now().toString(),
    val status: String = "Aktiv"
)

@Serializable
data class DMSDossier(
    val id: Int = 0,
    val registraturPositionId: Int,
    val parentDossierId: Int? = null,
    val name: String,
    val laufnummer: String,
    val positionNummer: Int,
    val eindeutigeLaufnummer: Int,
    val status: String = "Aktiv",
    val isPublicAnonymousShared: Boolean = false,
    val userId: Int,
    val groupId: Int,
    val erstellungsdatum: String = LocalDateTime.now().toString(),
    val beschreibung: String? = null
)

@Serializable
data class DMSDocument(
    val id: Int = 0,
    val dossierId: Int,
    val titel: String,
    val aktuelleVersionId: Int? = null,
    val status: String = "Entwurf",
    val userId: Int,
    val groupId: Int,
    val erstellungsdatum: String = LocalDateTime.now().toString(),
    val beschreibung: String? = null
)

@Serializable
data class DMSDocumentVersion(
    val id: Int = 0,
    val documentId: Int,
    val versionsnummer: Int,
    val dateiname: String,
    val dateigroesse: Long,
    val mimeType: String,
    val hashWert: String,
    val textInhalt: String? = null, // Extracted PDF text for search
    val kommentar: String? = null,
    val status: String = "Aktiv",
    val userId: Int,
    val groupId: Int,
    val erstellungsdatum: String = LocalDateTime.now().toString()
)

@Serializable
data class DMSTreeNode(
    val id: Int,
    val name: String,
    val type: String, // "registraturplan", "registraturposition", "dossier", "document"
    val parentId: Int? = null,
    val children: List<DMSTreeNode> = emptyList(),
    val metadata: Map<String, String> = emptyMap()
)

@Serializable
data class DMSNavigationResponse(
    val currentPath: List<DMSTreeNode>,
    val children: List<DMSTreeNode>,
    val permissions: DMSPermissions
)

@Serializable
data class DMSPermissions(
    val canRead: Boolean,
    val canWrite: Boolean,
    val canDelete: Boolean,
    val canCreateDossier: Boolean,
    val canCreateDocument: Boolean,
    val canManageVersions: Boolean
)

@Serializable
data class CreateDossierRequest(
    val registraturPositionId: Int,
    val parentDossierId: Int? = null,
    val name: String,
    val beschreibung: String? = null
)

@Serializable
data class CreateDocumentRequest(
    val dossierId: Int,
    val titel: String,
    val beschreibung: String? = null
)

@Serializable
data class CreateDocumentVersionRequest(
    val documentId: Int,
    val dateiname: String,
    val mimeType: String,
    val hashWert: String,
    val dateigroesse: Long,
    val kommentar: String? = null
)

@Serializable
data class UpdateDocumentRequest(
    val titel: String? = null,
    val status: String? = null,
    val beschreibung: String? = null
)

@Serializable
data class DMSSearchRequest(
    val query: String,
    val type: String? = null, // "document", "dossier", "all"
    val dateFrom: String? = null,
    val dateTo: String? = null,
    val mimeType: String? = null
)

@Serializable
data class DMSSearchResultItem(
    val document: DMSDocument,
    val matchedVersion: DMSDocumentVersion? = null, // Version where search term was found
    val matchType: String = "document", // "document" | "version_content" | "version_filename" | "version_comment"
    val matchPreview: String? = null // Text snippet showing the match context
)

@Serializable
data class DMSSearchResult(
    val documents: List<DMSSearchResultItem>,
    val dossiers: List<DMSDossier>,
    val totalCount: Int
)

@Serializable
data class DMSStatistics(
    val totalDocuments: Int,
    val totalDossiers: Int,
    val totalVersions: Int,
    val totalStorageBytes: Long,
    val documentsByStatus: Map<String, Int>,
    val documentsByMimeType: Map<String, Int>,
    val averageVersionsPerDocument: Double,
    val recentUploads: Int, // Last 7 days
    val topFileTypes: List<FileTypeStatistic>,
    val storageByGroup: Map<String, Long>
)

@Serializable
data class FileTypeStatistic(
    val mimeType: String,
    val extension: String,
    val count: Int,
    val totalSize: Long
)