package dms.schema

import com.shut.UserCredentialsTab
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.*
import java.time.LocalDateTime

object RegistraturPlan : IntIdTable("dms_registratur_plan") {
    val name = varchar("name", 255)
    val beschreibung = text("beschreibung").nullable()
    val groupId = integer("group_id")
    val userId = integer("user_id")
    val erstellungsdatum = varchar("erstellungsdatum", 50).default(LocalDateTime.now().toString())
    val status = varchar("status", 50).default("Aktiv")
}

object RegistraturPosition : IntIdTable("dms_registratur_position") {
    val registraturPlanId = reference("registratur_plan_id", RegistraturPlan)
    val positionNummer = integer("position_nummer")
    val name = varchar("name", 255)
    val beschreibung = text("beschreibung").nullable()
    val userId = integer("user_id")
    val groupId = integer("group_id")
    val erstellungsdatum = varchar("erstellungsdatum", 50).default(LocalDateTime.now().toString())
    val status = varchar("status", 50).default("Aktiv")
    
    init {
        uniqueIndex(registraturPlanId, positionNummer)
    }
}

object Dossier : IntIdTable("dms_dossier") {
    val registraturPositionId = reference("registratur_position_id", RegistraturPosition)
    val parentDossierId = reference("parent_dossier_id", Dossier).nullable()
    val name = varchar("name", 255)
    val laufnummer = varchar("laufnummer", 50)
    val positionNummer = integer("position_nummer")
    val eindeutigeLaufnummer = integer("eindeutige_laufnummer")
    val status = varchar("status", 50).default("Aktiv")
    val userId = integer("user_id")
    val groupId = integer("group_id")
    val isPublicAnonymousShared = bool("is_public_anonymous_shared").default(false)
    val erstellungsdatum = varchar("erstellungsdatum", 50).default(LocalDateTime.now().toString())
    val beschreibung = text("beschreibung").nullable()
    
    init {
        uniqueIndex(registraturPositionId, eindeutigeLaufnummer)
    }
}

object Document : IntIdTable("dms_document") {
    val dossierId = reference("dossier_id", Dossier)
    val titel = varchar("titel", 255)
    val aktuelleVersionId = integer("aktuelle_version_id").nullable()
    val status = varchar("status", 50).default("Entwurf")
    val userId = integer("user_id")
    val groupId = integer("group_id")
    val erstellungsdatum = varchar("erstellungsdatum", 50).default(LocalDateTime.now().toString())
    val beschreibung = text("beschreibung").nullable()
}

object DocumentVersion : IntIdTable("dms_document_version") {
    val documentId = reference("document_id", Document)
    val versionsnummer = integer("versionsnummer")
    val dateiname = varchar("dateiname", 255)
    val dateigroesse = long("dateigroesse")
    val mimeType = varchar("mime_type", 100)
    val hashWert = varchar("hash_wert", 64)
    val textInhalt = text("text_inhalt").nullable() // Extracted PDF text for search
    val kommentar = text("kommentar").nullable()
    val status = varchar("status", 50).default("Aktiv") // Added for soft delete support
    val userId = integer("user_id")
    val groupId = integer("group_id")
    val erstellungsdatum = varchar("erstellungsdatum", 50).default(LocalDateTime.now().toString())
    
    init {
        uniqueIndex(documentId, versionsnummer)
        // Removed uniqueIndex(hashWert) to allow duplicate file uploads with deduplication message
    }
}

enum class DocumentStatus {
    ENTWURF, FREIGEGEBEN, ARCHIVIERT, UNGUELTIG
}

enum class DMSObjectStatus {
    AKTIV, ARCHIVIERT, GELOESCHT
}