package com.shut

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import java.time.LocalDate
import java.math.BigDecimal

// Tabelle für Buchungsarten
object BuchungsArtTable : Table("buchungsart") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 50).uniqueIndex()
    val beschreibung = text("beschreibung").nullable()
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE).default(1)
    val createdBy = integer("created_by").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE).nullable()
    val createdAt = varchar("created_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

// Tabelle für Buchungskategorien
object BuchungsKategorieTable : Table("buchungskategorie") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 50).uniqueIndex()
    val beschreibung = text("beschreibung").nullable()
    val buchungsartId = long("buchungsart_id").references(BuchungsArtTable.id)
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE).default(1)
    val createdBy = integer("created_by").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE).nullable()
    val createdAt = varchar("created_at", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

// Tabelle für Dokumente/Belege
object DokumentTable : Table("dokument") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 255)
    val originalName = varchar("original_name", 255)
    val dateityp = varchar("dateityp", 20)
    val groesse = long("groesse")
    val pfad = text("pfad")
    val hochgeladen = varchar("hochgeladen", 50) // Als String gespeichert
    override val primaryKey = PrimaryKey(id)
}

// Haupttabelle für Buchungskarten
object BuchungsKarteTable : Table("buchungskarte") {
    val id = long("id").autoIncrement()
    val datum = varchar("datum", 20) // LocalDate als String
    val buchungsartId = long("buchungsart_id").references(BuchungsArtTable.id)
    val kategorieId = long("kategorie_id").references(BuchungsKategorieTable.id)
    val beschreibung = text("beschreibung")
    val betrag = decimal("betrag", 10, 2)
    val belegnummer = varchar("belegnummer", 100).nullable()
    val ustBetrag = decimal("ust_betrag", 10, 2).nullable() // USt-Betrag
    val ustSatz = decimal("ust_satz", 5, 2).nullable() // USt-Satz in Prozent
    val dokumentId = long("dokument_id").references(DokumentTable.id)
    val imageId = long("image_id").references(ImageTab.id).nullable()
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE).default(1)
    val createdBy = integer("created_by").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE).nullable()
    val erstellt = varchar("erstellt", 50) // LocalDateTime als String
    val geaendert = varchar("geaendert", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

// Tabelle für Übersichtskarten
object UebersichtsKarteTable : Table("uebersichtskarte") {
    val id = long("id").autoIncrement()
    val titel = varchar("titel", 255)
    val datumVon = varchar("datum_von", 20) // LocalDate als String
    val datumBis = varchar("datum_bis", 20) // LocalDate als String
    val zeitraumTyp = varchar("zeitraum_typ", 20) // ZeitraumTyp als String
    val gesamtEinnahmen = decimal("gesamt_einnahmen", 15, 2)
    val gesamtAusgaben = decimal("gesamt_ausgaben", 15, 2)
    val saldo = decimal("saldo", 15, 2)
    val ausgangsUst = decimal("ausgangs_ust", 15, 2).nullable() // Ausgangs-USt (USt aus Einnahmen)
    val eingangsUst = decimal("eingangs_ust", 15, 2).nullable() // Eingangs-USt (USt aus Ausgaben)
    val ustSaldo = decimal("ust_saldo", 15, 2).nullable() // USt-Saldo (Ausgangs-USt - Eingangs-USt)
    val anzahlBuchungen = integer("anzahl_buchungen")
    val anzahlEinnahmen = integer("anzahl_einnahmen")
    val anzahlAusgaben = integer("anzahl_ausgaben")
    val groupId = integer("group_id").references(GroupsTab.id, onDelete = ReferenceOption.CASCADE).default(1)
    val createdBy = integer("created_by").references(UserCredentialsTab.id, onDelete = ReferenceOption.CASCADE).nullable()
    val erstellt = varchar("erstellt", 50) // LocalDateTime als String
    val geaendert = varchar("geaendert", 50).nullable()
    override val primaryKey = PrimaryKey(id)
}

// Data Classes (ähnlich wie in anderen Dateien)
@Serializable
data class BuchungsArt(
    val id: Long,
    val name: String,
    val beschreibung: String?,
    val groupId: Int = 1,
    val createdBy: Int? = null,
    val createdAt: String? = null
)

@Serializable
data class BuchungsKategorie(
    val id: Long,
    val name: String,
    val beschreibung: String?,
    val buchungsartId: Long,
    val groupId: Int = 1,
    val createdBy: Int? = null,
    val createdAt: String? = null
)

@Serializable
data class Dokument(
    val id: Long,
    val name: String,
    val originalName: String,
    val dateityp: String,
    val groesse: Long,
    val pfad: String,
    val hochgeladen: String // LocalDateTime als String
)

@Serializable
data class BuchungsKarte(
    val id: Long,
    val datum: String, // LocalDate als String
    val buchungsart: BuchungsArt,
    val kategorie: BuchungsKategorie,
    val beschreibung: String,
    val betrag: Double,
    val belegnummer: String?,
    val ustBetrag: Double?, // USt-Betrag
    val ustSatz: Double?, // USt-Satz in Prozent
    val dokument: Dokument,
    val image: Image?,
    val groupId: Int = 1,
    val createdBy: Int? = null,
    val erstellt: String, // LocalDateTime als String
    val geaendert: String?
)

@Serializable
data class UebersichtsKarte(
    val id: Long,
    val titel: String,
    val datumVon: String, // LocalDate als String
    val datumBis: String, // LocalDate als String
    val zeitraumTyp: ZeitraumTyp,
    val gesamtEinnahmen: Double,
    val gesamtAusgaben: Double,
    val saldo: Double, // Einnahmen - Ausgaben
    val ausgangsUst: Double?, // Ausgangs-USt (USt aus Einnahmen)
    val eingangsUst: Double?, // Eingangs-USt (USt aus Ausgaben)
    val ustSaldo: Double?, // USt-Saldo (Ausgangs-USt - Eingangs-USt)
    val anzahlBuchungen: Int,
    val anzahlEinnahmen: Int,
    val anzahlAusgaben: Int,
    val groupId: Int = 1,
    val createdBy: Int? = null,
    val erstellt: String, // LocalDateTime als String
    val geaendert: String?
)

@Serializable
enum class ZeitraumTyp {
    TAG,
    WOCHE,
    MONAT,
    QUARTAL,
    JAHR,
    BENUTZERDEFINIERT
}

@Serializable
data class UpdateBuchungsKarteRequest(
    val datum: String,
    val beschreibung: String,
    val betrag: Double,
    val belegnummer: String?,
    val ustSatz: Double?,
    val ustBetrag: Double?,
    val buchungsartId: Long,
    val kategorieId: Long,
    val dokumentId: Long?,
    val imageId: Long?
)

// Service-Klasse für Datenbankoperationen (ähnlich wie LernmaterialService)
class BuchungsKartenService {

    // Initialisierung der Tabellen
    fun initialize() {
        transaction {
            var buchungsartTableCreated = false
            var buchungskategorieTableCreated = false
            val existingTables = SchemaUtils.listTables()
            if (!existingTables.any { it.contains("buchungsart") }) {
                SchemaUtils.create(BuchungsArtTable)
                buchungsartTableCreated = true
            }
            
            if (!existingTables.any { it.contains("buchungskategorie") }) {
                SchemaUtils.create(BuchungsKategorieTable)
                buchungskategorieTableCreated = true
            }
            
            if (!existingTables.any { it.contains("dokument") }) {
                SchemaUtils.create(DokumentTable)
            }
            
            if (!existingTables.any { it.contains("buchungskarte") }) {
                SchemaUtils.create(BuchungsKarteTable)
            }
            
            if (!existingTables.any { it.contains("uebersichtskarte") }) {
                SchemaUtils.create(UebersichtsKarteTable)
            }
            
            // Standardwerte nur einfügen, wenn Tabellen neu erstellt wurden
            if (buchungsartTableCreated) {
                insertStandardBuchungsArten()
            } else {
                ensureStandardBuchungsArten()
            }
            
            if (buchungskategorieTableCreated) {
                insertStandardKategorien()
            } else {
                ensureStandardKategorien()
            }
        }
    }

    private fun insertStandardBuchungsArten() {
        BuchungsArtTable.insert {
            it[name] = "EINNAHME"
            it[beschreibung] = "Einnahmen"
            it[groupId] = 1 // Default group
            it[createdBy] = null // System created
            it[createdAt] = java.time.LocalDateTime.now().toString()
        }
        BuchungsArtTable.insert {
            it[name] = "AUSGABE"
            it[beschreibung] = "Ausgaben"
            it[groupId] = 1 // Default group
            it[createdBy] = null // System created
            it[createdAt] = java.time.LocalDateTime.now().toString()
        }
    }
    
    private fun ensureStandardBuchungsArten() {
        try {
            // Prüfe ob EINNAHME existiert
            val einnahmeExists = BuchungsArtTable.selectAll().where { BuchungsArtTable.name eq "EINNAHME" }.count() > 0
            if (!einnahmeExists) {
                try {
                    BuchungsArtTable.insert {
                        it[name] = "EINNAHME"
                        it[beschreibung] = "Einnahmen"
                        it[groupId] = 1 // Default group
                        it[createdBy] = null // System created
                        it[createdAt] = java.time.LocalDateTime.now().toString()
                    }
                } catch (e: Exception) {
                    // Ignoriere Duplikat-Fehler, da der Eintrag bereits existiert
                    if (e.message?.contains("duplicate key") != true) {
                        throw e
                    }
                }
            }
        } catch (e: Exception) {
            // Ignoriere alle Fehler bei der Überprüfung
            if (e.message?.contains("duplicate key") != true) {
                println("Warnung: Fehler bei der Überprüfung von EINNAHME: ${e.message}")
            }
        }
        
        try {
            // Prüfe ob AUSGABE existiert
            val ausgabeExists = BuchungsArtTable.selectAll().where { BuchungsArtTable.name eq "AUSGABE" }.count() > 0
            if (!ausgabeExists) {
                try {
                    BuchungsArtTable.insert {
                        it[name] = "AUSGABE"
                        it[beschreibung] = "Ausgaben"
                        it[groupId] = 1 // Default group
                        it[createdBy] = null // System created
                        it[createdAt] = java.time.LocalDateTime.now().toString()
                    }
                } catch (e: Exception) {
                    // Ignoriere Duplikat-Fehler, da der Eintrag bereits existiert
                    if (e.message?.contains("duplicate key") != true) {
                        throw e
                    }
                }
            }
        } catch (e: Exception) {
            // Ignoriere alle Fehler bei der Überprüfung
            if (e.message?.contains("duplicate key") != true) {
                println("Warnung: Fehler bei der Überprüfung von AUSGABE: ${e.message}")
            }
        }
    }

    private fun insertStandardKategorien() {
        val einnahmeId = BuchungsArtTable.selectAll().where { BuchungsArtTable.name eq "EINNAHME" }
            .single()[BuchungsArtTable.id]
        val ausgabeId = BuchungsArtTable.selectAll().where { BuchungsArtTable.name eq "AUSGABE" }
            .single()[BuchungsArtTable.id]
            
        // Einnahme-Kategorien
        val einnahmeKategorien = listOf(
            "VERKAUF" to "Verkauf",
            "DIENSTLEISTUNG" to "Dienstleistung",
            "ZINSEN" to "Zinsen",
            "SONSTIGE_EINNAHMEN" to "Sonstige Einnahmen"
        )
        
        // Ausgabe-Kategorien
        val ausgabeKategorien = listOf(
            "BUEROKOSTEN" to "Bürokosten",
            "REISEKOSTEN" to "Reisekosten",
            "MARKETING" to "Marketing",
            "MIETE" to "Miete",
            "STROM" to "Strom",
            "TELEFON" to "Telefon",
            "VERSICHERUNG" to "Versicherung",
            "SOFTWARE_LIZENZ_GEBUEHR" to "Software Lizenz/Gebühr",
            "SERVER_SOFTWARE_HOSTING" to "Server/Software Hosting",
            "SONSTIGE_AUSGABEN" to "Sonstige Ausgaben"
        )
        
        einnahmeKategorien.forEach { (name, beschreibung) ->
            BuchungsKategorieTable.insert {
                it[BuchungsKategorieTable.name] = name
                it[BuchungsKategorieTable.beschreibung] = beschreibung
                it[buchungsartId] = einnahmeId
                it[groupId] = 1 // Default group
                it[createdBy] = null // System created
                it[createdAt] = java.time.LocalDateTime.now().toString()
            }
        }
        
        ausgabeKategorien.forEach { (name, beschreibung) ->
            BuchungsKategorieTable.insert {
                it[BuchungsKategorieTable.name] = name
                it[BuchungsKategorieTable.beschreibung] = beschreibung
                it[buchungsartId] = ausgabeId
                it[groupId] = 1 // Default group
                it[createdBy] = null // System created
                it[createdAt] = java.time.LocalDateTime.now().toString()
            }
        }
    }
    
    private fun ensureStandardKategorien() {
        val einnahmeId = BuchungsArtTable.selectAll().where { BuchungsArtTable.name eq "EINNAHME" }
            .singleOrNull()?.get(BuchungsArtTable.id)
        val ausgabeId = BuchungsArtTable.selectAll().where { BuchungsArtTable.name eq "AUSGABE" }
            .singleOrNull()?.get(BuchungsArtTable.id)
            
        if (einnahmeId != null && ausgabeId != null) {
            // Einnahme-Kategorien
            val einnahmeKategorien = listOf(
                "VERKAUF" to "Verkauf",
                "DIENSTLEISTUNG" to "Dienstleistung",
                "ZINSEN" to "Zinsen",
                "SONSTIGE_EINNAHMEN" to "Sonstige Einnahmen"
            )
            
            // Ausgabe-Kategorien
            val ausgabeKategorien = listOf(
                "BUEROKOSTEN" to "Bürokosten",
                "REISEKOSTEN" to "Reisekosten",
                "MARKETING" to "Marketing",
                "MIETE" to "Miete",
                "STROM" to "Strom",
                "TELEFON" to "Telefon",
                "VERSICHERUNG" to "Versicherung",
                "SOFTWARE_LIZENZ_GEBUEHR" to "Software Lizenz/Gebühr",
                "SERVER_SOFTWARE_HOSTING" to "Server/Software Hosting",
                "SONSTIGE_AUSGABEN" to "Sonstige Ausgaben"
            )
            
            einnahmeKategorien.forEach { (name, beschreibung) ->
                try {
                    val exists = BuchungsKategorieTable.selectAll().where { 
                        (BuchungsKategorieTable.name eq name) and (BuchungsKategorieTable.buchungsartId eq einnahmeId) 
                    }.count() > 0
                    if (!exists) {
                        try {
                            BuchungsKategorieTable.insert {
                                it[BuchungsKategorieTable.name] = name
                                it[BuchungsKategorieTable.beschreibung] = beschreibung
                                it[buchungsartId] = einnahmeId
                                it[groupId] = 1 // Default group
                                it[createdBy] = null // System created
                                it[createdAt] = java.time.LocalDateTime.now().toString()
                            }
                        } catch (e: Exception) {
                            // Ignoriere Duplikat-Fehler
                            if (e.message?.contains("duplicate key") != true) {
                                throw e
                            }
                        }
                    }
                } catch (e: Exception) {
                    // Ignoriere alle Fehler bei der Überprüfung
                    if (e.message?.contains("duplicate key") != true) {
                        println("Warnung: Fehler bei der Überprüfung von Einnahme-Kategorie $name: ${e.message}")
                    }
                }
            }
            
            ausgabeKategorien.forEach { (name, beschreibung) ->
                try {
                    val exists = BuchungsKategorieTable.selectAll().where { 
                        (BuchungsKategorieTable.name eq name) and (BuchungsKategorieTable.buchungsartId eq ausgabeId) 
                    }.count() > 0
                    if (!exists) {
                        try {
                            BuchungsKategorieTable.insert {
                                it[BuchungsKategorieTable.name] = name
                                it[BuchungsKategorieTable.beschreibung] = beschreibung
                                it[buchungsartId] = ausgabeId
                                it[groupId] = 1 // Default group
                                it[createdBy] = null // System created
                                it[createdAt] = java.time.LocalDateTime.now().toString()
                            }
                        } catch (e: Exception) {
                            // Ignoriere Duplikat-Fehler
                            if (e.message?.contains("duplicate key") != true) {
                                throw e
                            }
                        }
                    }
                } catch (e: Exception) {
                    // Ignoriere alle Fehler bei der Überprüfung
                    if (e.message?.contains("duplicate key") != true) {
                        println("Warnung: Fehler bei der Überprüfung von Ausgabe-Kategorie $name: ${e.message}")
                    }
                }
            }
        }
    }
    
    // Helper methods for access control
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
    
    private fun canAccessBuchungsKarte(buchungsKarte: ResultRow, userId: Int): Boolean {
        val userGroups = getUserGroups(userId)
        val singleGroupId = getSingleGroupId()
        val karteGroupId = buchungsKarte[BuchungsKarteTable.groupId]
        val karteCreatedBy = buchungsKarte[BuchungsKarteTable.createdBy]
        
        return if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
            // User is only in "Single" group - can only access own entries
            karteCreatedBy == userId
        } else {
            // User is in other groups - can access entries in same groups
            userGroups.contains(karteGroupId)
        }
    }
    
    private fun canAccessUebersichtsKarte(uebersichtsKarte: ResultRow, userId: Int): Boolean {
        val userGroups = getUserGroups(userId)
        val singleGroupId = getSingleGroupId()
        val karteGroupId = uebersichtsKarte[UebersichtsKarteTable.groupId]
        val karteCreatedBy = uebersichtsKarte[UebersichtsKarteTable.createdBy]
        
        return if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
            // User is only in "Single" group - can only access own entries
            karteCreatedBy == userId
        } else {
            // User is in other groups - can access entries in same groups
            userGroups.contains(karteGroupId)
        }
    }
    
    // CRUD-Operationen für Buchungsarten
    fun getAllBuchungsArten(): List<BuchungsArt> {
        return transaction {
            BuchungsArtTable.selectAll().map { row ->
                BuchungsArt(
                    id = row[BuchungsArtTable.id],
                    name = row[BuchungsArtTable.name],
                    beschreibung = row[BuchungsArtTable.beschreibung],
                    groupId = row[BuchungsArtTable.groupId],
                    createdBy = row[BuchungsArtTable.createdBy],
                    createdAt = row[BuchungsArtTable.createdAt]
                )
            }
        }
    }
    
    fun getBuchungsArtenForUser(userId: Int): List<BuchungsArt> {
        return transaction {
            // Return all Buchungsarten as these are standard types that should be available to all users
            BuchungsArtTable.selectAll().map { row ->
                BuchungsArt(
                    id = row[BuchungsArtTable.id],
                    name = row[BuchungsArtTable.name],
                    beschreibung = row[BuchungsArtTable.beschreibung],
                    groupId = row[BuchungsArtTable.groupId],
                    createdBy = row[BuchungsArtTable.createdBy],
                    createdAt = row[BuchungsArtTable.createdAt]
                )
            }
        }
    }
    
    private fun getBuchungsArtenCreatedByUser(userId: Int): List<BuchungsArt> {
        return BuchungsArtTable.selectAll()
            .where { BuchungsArtTable.createdBy eq userId }
            .map { mapToBuchungsArt(it) }
    }
    
    private fun getBuchungsArtenForGroups(groupIds: List<Int>): List<BuchungsArt> {
        return if (groupIds.isNotEmpty()) {
            BuchungsArtTable.selectAll()
                .where { BuchungsArtTable.groupId inList groupIds }
                .map { mapToBuchungsArt(it) }
        } else {
            emptyList()
        }
    }
    
    private fun mapToBuchungsArt(row: ResultRow): BuchungsArt {
        return BuchungsArt(
            id = row[BuchungsArtTable.id],
            name = row[BuchungsArtTable.name],
            beschreibung = row[BuchungsArtTable.beschreibung],
            groupId = row[BuchungsArtTable.groupId],
            createdBy = row[BuchungsArtTable.createdBy],
            createdAt = row[BuchungsArtTable.createdAt]
        )
    }
    
    fun getKategorienByBuchungsArt(buchungsartId: Long): List<BuchungsKategorie> {
        return transaction {
            BuchungsKategorieTable.selectAll().where { BuchungsKategorieTable.buchungsartId eq buchungsartId }
                .map { row ->
                    BuchungsKategorie(
                        id = row[BuchungsKategorieTable.id],
                        name = row[BuchungsKategorieTable.name],
                        beschreibung = row[BuchungsKategorieTable.beschreibung],
                        buchungsartId = row[BuchungsKategorieTable.buchungsartId],
                        groupId = row[BuchungsKategorieTable.groupId],
                        createdBy = row[BuchungsKategorieTable.createdBy],
                        createdAt = row[BuchungsKategorieTable.createdAt]
                    )
                }
        }
    }
    
    fun getKategorienForUser(userId: Int, buchungsartId: Long): List<BuchungsKategorie> {
        return transaction {
            // Return all categories for the given buchungsart
            // These are standard categories that should be available to all users
            BuchungsKategorieTable.selectAll()
                .where { BuchungsKategorieTable.buchungsartId eq buchungsartId }
                .map { mapToBuchungsKategorie(it) }
        }
    }
    
    private fun getKategorienCreatedByUser(userId: Int, buchungsartId: Long): List<BuchungsKategorie> {
        return BuchungsKategorieTable.selectAll()
            .where { 
                (BuchungsKategorieTable.createdBy eq userId) and 
                (BuchungsKategorieTable.buchungsartId eq buchungsartId) 
            }
            .map { mapToBuchungsKategorie(it) }
    }
    
    private fun getKategorienForGroups(groupIds: List<Int>, buchungsartId: Long): List<BuchungsKategorie> {
        return if (groupIds.isNotEmpty()) {
            BuchungsKategorieTable.selectAll()
                .where { 
                    (BuchungsKategorieTable.groupId inList groupIds) and 
                    (BuchungsKategorieTable.buchungsartId eq buchungsartId) 
                }
                .map { mapToBuchungsKategorie(it) }
        } else {
            emptyList()
        }
    }
    
    private fun mapToBuchungsKategorie(row: ResultRow): BuchungsKategorie {
        return BuchungsKategorie(
            id = row[BuchungsKategorieTable.id],
            name = row[BuchungsKategorieTable.name],
            beschreibung = row[BuchungsKategorieTable.beschreibung],
            buchungsartId = row[BuchungsKategorieTable.buchungsartId],
            groupId = row[BuchungsKategorieTable.groupId],
            createdBy = row[BuchungsKategorieTable.createdBy],
            createdAt = row[BuchungsKategorieTable.createdAt]
        )
    }
    
    // CRUD-Operationen für Dokumente
    fun addDokument(dokument: Dokument): Long {
        return transaction {
            DokumentTable.insert {
                it[name] = dokument.name
                it[originalName] = dokument.originalName
                it[dateityp] = dokument.dateityp
                it[groesse] = dokument.groesse
                it[pfad] = dokument.pfad
                it[hochgeladen] = dokument.hochgeladen
            } get DokumentTable.id
        }
    }
    
    fun getDokumentById(id: Long): Dokument? {
        return transaction {
            DokumentTable.selectAll().where { DokumentTable.id eq id }
                .singleOrNull()
                ?.let { row ->
                    Dokument(
                        id = row[DokumentTable.id],
                        name = row[DokumentTable.name],
                        originalName = row[DokumentTable.originalName],
                        dateityp = row[DokumentTable.dateityp],
                        groesse = row[DokumentTable.groesse],
                        pfad = row[DokumentTable.pfad],
                        hochgeladen = row[DokumentTable.hochgeladen]
                    )
                }
        }
    }
    
    // CRUD-Operationen für Buchungskarten
    fun addBuchungsKarte(buchungsKarte: BuchungsKarte, userId: Int): Long {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            val targetGroupId = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - assign to Single group
                singleGroupId!!
            } else {
                // Use the provided group ID if valid and user has access, otherwise default to first group
                if (buchungsKarte.groupId > 0 && userGroups.contains(buchungsKarte.groupId)) {
                    buchungsKarte.groupId
                } else {
                    // Default to first group if provided groupId is 0 or invalid
                    userGroups.firstOrNull() ?: singleGroupId!!
                }
            }
            
            BuchungsKarteTable.insert {
                it[datum] = buchungsKarte.datum
                it[buchungsartId] = buchungsKarte.buchungsart.id
                it[kategorieId] = buchungsKarte.kategorie.id
                it[beschreibung] = buchungsKarte.beschreibung
                it[betrag] = BigDecimal.valueOf(buchungsKarte.betrag)
                it[belegnummer] = buchungsKarte.belegnummer
                it[ustBetrag] = buchungsKarte.ustBetrag?.let { BigDecimal.valueOf(it) }
                it[ustSatz] = buchungsKarte.ustSatz?.let { BigDecimal.valueOf(it) }
                it[dokumentId] = buchungsKarte.dokument.id
                it[imageId] = buchungsKarte.image?.id
                it[groupId] = targetGroupId
                it[createdBy] = userId
                it[erstellt] = buchungsKarte.erstellt
                it[geaendert] = buchungsKarte.geaendert
            } get BuchungsKarteTable.id
        }
    }
    
    fun getAllBuchungsKarten(): List<BuchungsKarte> {
        return transaction {
            BuchungsKarteTable.selectAll().map { row ->
                mapToBuchungsKarte(row)
            }
        }
    }
    
    fun getBuchungsKartenForUser(userId: Int): List<BuchungsKarte> {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - only see own entries
                getBuchungsKartenCreatedByUser(userId)
            } else {
                // User is in other groups - see all entries of those groups
                getBuchungsKartenForGroups(userGroups)
            }
        }
    }
    
    private fun getBuchungsKartenCreatedByUser(userId: Int): List<BuchungsKarte> {
        return BuchungsKarteTable.selectAll()
            .where { BuchungsKarteTable.createdBy eq userId }
            .map { mapToBuchungsKarte(it) }
    }
    
    private fun getBuchungsKartenForGroups(groupIds: List<Int>): List<BuchungsKarte> {
        return if (groupIds.isNotEmpty()) {
            BuchungsKarteTable.selectAll()
                .where { BuchungsKarteTable.groupId inList groupIds }
                .map { mapToBuchungsKarte(it) }
        } else {
            emptyList()
        }
    }
    
    private fun mapToBuchungsKarte(row: ResultRow): BuchungsKarte {
        val buchungsart = getBuchungsArtById(row[BuchungsKarteTable.buchungsartId])!!
        val kategorie = getKategorieById(row[BuchungsKarteTable.kategorieId])!!
        val dokument = getDokumentById(row[BuchungsKarteTable.dokumentId])!!
        val image = row[BuchungsKarteTable.imageId]?.let { getImageById(it) }
        
        return BuchungsKarte(
            id = row[BuchungsKarteTable.id],
            datum = row[BuchungsKarteTable.datum],
            buchungsart = buchungsart,
            kategorie = kategorie,
            beschreibung = row[BuchungsKarteTable.beschreibung],
            betrag = row[BuchungsKarteTable.betrag].toDouble(),
            belegnummer = row[BuchungsKarteTable.belegnummer],
            ustBetrag = row[BuchungsKarteTable.ustBetrag]?.toDouble(),
            ustSatz = row[BuchungsKarteTable.ustSatz]?.toDouble(),
            dokument = dokument,
            image = image,
            groupId = row[BuchungsKarteTable.groupId],
            createdBy = row[BuchungsKarteTable.createdBy],
            erstellt = row[BuchungsKarteTable.erstellt],
            geaendert = row[BuchungsKarteTable.geaendert]
        )
    }
    
    fun getBuchungsKartenByDateRange(datumVon: String, datumBis: String, userId: Int): List<BuchungsKarte> {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            BuchungsKarteTable.selectAll()
                .where { 
                    (BuchungsKarteTable.datum greaterEq datumVon) and 
                    (BuchungsKarteTable.datum lessEq datumBis) and
                    if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                        // User is only in "Single" group - only see own entries
                        BuchungsKarteTable.createdBy eq userId
                    } else {
                        // User is in other groups - see all entries of those groups
                        BuchungsKarteTable.groupId inList userGroups
                    }
                }
                .map { row ->
                    mapToBuchungsKarte(row)
                }
        }
    }
    
    private fun getBuchungsArtById(id: Long): BuchungsArt? {
        return transaction {
            BuchungsArtTable.selectAll().where { BuchungsArtTable.id eq id }
                .singleOrNull()
                ?.let { row ->
                    BuchungsArt(
                        id = row[BuchungsArtTable.id],
                        name = row[BuchungsArtTable.name],
                        beschreibung = row[BuchungsArtTable.beschreibung],
                        groupId = row[BuchungsArtTable.groupId],
                        createdBy = row[BuchungsArtTable.createdBy],
                        createdAt = row[BuchungsArtTable.createdAt]
                    )
                }
        }
    }
    
    private fun getKategorieById(id: Long): BuchungsKategorie? {
        return transaction {
            BuchungsKategorieTable.selectAll().where { BuchungsKategorieTable.id eq id }
                .singleOrNull()
                ?.let { row ->
                    BuchungsKategorie(
                        id = row[BuchungsKategorieTable.id],
                        name = row[BuchungsKategorieTable.name],
                        beschreibung = row[BuchungsKategorieTable.beschreibung],
                        buchungsartId = row[BuchungsKategorieTable.buchungsartId],
                        groupId = row[BuchungsKategorieTable.groupId],
                        createdBy = row[BuchungsKategorieTable.createdBy],
                        createdAt = row[BuchungsKategorieTable.createdAt]
                    )
                }
        }
    }
    
    private fun getImageById(id: Long): Image? {
        return transaction {
            ImageTab.selectAll().where { ImageTab.id eq id }
                .singleOrNull()
                ?.let { row ->
                    Image(
                        id = row[ImageTab.id],
                        name = row[ImageTab.name],
                        extension = row[ImageTab.extension],
                        location = row[ImageTab.location]
                    )
                }
        }
    }
    
    // CRUD-Operationen für Übersichtskarten
    fun createUebersichtsKarte(datumVon: String, datumBis: String, zeitraumTyp: ZeitraumTyp, userId: Int, titel: String? = null): UebersichtsKarte {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            val targetGroupId = if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - assign to Single group
                singleGroupId!!
            } else {
                // Default to first group
                userGroups.firstOrNull() ?: singleGroupId!!
            }
            
            // Berechne Statistiken basierend auf dem Zeitraum und Benutzer
            val statistiken = calculateStatistiken(datumVon, datumBis, userId)
            
            // Erstelle automatischen Titel falls nicht angegeben
            val finalTitel = titel ?: generateTitel(datumVon, datumBis, zeitraumTyp)
            
            // Füge Übersichtskarte in die Datenbank ein
            val id = UebersichtsKarteTable.insert {
                it[UebersichtsKarteTable.titel] = finalTitel
                it[UebersichtsKarteTable.datumVon] = datumVon
                it[UebersichtsKarteTable.datumBis] = datumBis
                it[UebersichtsKarteTable.zeitraumTyp] = zeitraumTyp.name
                it[gesamtEinnahmen] = BigDecimal.valueOf(statistiken.gesamtEinnahmen)
                it[gesamtAusgaben] = BigDecimal.valueOf(statistiken.gesamtAusgaben)
                it[saldo] = BigDecimal.valueOf(statistiken.saldo)
                it[ausgangsUst] = BigDecimal.valueOf(statistiken.ausgangsUst)
                it[eingangsUst] = BigDecimal.valueOf(statistiken.eingangsUst)
                it[ustSaldo] = BigDecimal.valueOf(statistiken.ustSaldo)
                it[anzahlBuchungen] = statistiken.anzahlBuchungen
                it[anzahlEinnahmen] = statistiken.anzahlEinnahmen
                it[anzahlAusgaben] = statistiken.anzahlAusgaben
                it[groupId] = targetGroupId
                it[createdBy] = userId
                it[erstellt] = java.time.LocalDateTime.now().toString()
                it[geaendert] = null
            } get UebersichtsKarteTable.id
            
            UebersichtsKarte(
                id = id,
                titel = finalTitel,
                datumVon = datumVon,
                datumBis = datumBis,
                zeitraumTyp = zeitraumTyp,
                gesamtEinnahmen = statistiken.gesamtEinnahmen,
                gesamtAusgaben = statistiken.gesamtAusgaben,
                saldo = statistiken.saldo,
                ausgangsUst = statistiken.ausgangsUst,
                eingangsUst = statistiken.eingangsUst,
                ustSaldo = statistiken.ustSaldo,
                anzahlBuchungen = statistiken.anzahlBuchungen,
                anzahlEinnahmen = statistiken.anzahlEinnahmen,
                anzahlAusgaben = statistiken.anzahlAusgaben,
                groupId = targetGroupId,
                createdBy = userId,
                erstellt = java.time.LocalDateTime.now().toString(),
                geaendert = null
            )
        }
    }
    
    fun getAllUebersichtsKarten(): List<UebersichtsKarte> {
        return transaction {
            UebersichtsKarteTable.selectAll().map { row ->
                mapToUebersichtsKarte(row)
            }
        }
    }
    
    fun getUebersichtsKartenForUser(userId: Int): List<UebersichtsKarte> {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                // User is only in "Single" group - only see own entries
                getUebersichtsKartenCreatedByUser(userId)
            } else {
                // User is in other groups - see all entries of those groups
                getUebersichtsKartenForGroups(userGroups)
            }
        }
    }
    
    private fun getUebersichtsKartenCreatedByUser(userId: Int): List<UebersichtsKarte> {
        return UebersichtsKarteTable.selectAll()
            .where { UebersichtsKarteTable.createdBy eq userId }
            .map { mapToUebersichtsKarte(it) }
    }
    
    private fun getUebersichtsKartenForGroups(groupIds: List<Int>): List<UebersichtsKarte> {
        return if (groupIds.isNotEmpty()) {
            UebersichtsKarteTable.selectAll()
                .where { UebersichtsKarteTable.groupId inList groupIds }
                .map { mapToUebersichtsKarte(it) }
        } else {
            emptyList()
        }
    }
    
    private fun mapToUebersichtsKarte(row: ResultRow): UebersichtsKarte {
        return UebersichtsKarte(
            id = row[UebersichtsKarteTable.id],
            titel = row[UebersichtsKarteTable.titel],
            datumVon = row[UebersichtsKarteTable.datumVon],
            datumBis = row[UebersichtsKarteTable.datumBis],
            zeitraumTyp = ZeitraumTyp.valueOf(row[UebersichtsKarteTable.zeitraumTyp]),
            gesamtEinnahmen = row[UebersichtsKarteTable.gesamtEinnahmen].toDouble(),
            gesamtAusgaben = row[UebersichtsKarteTable.gesamtAusgaben].toDouble(),
            saldo = row[UebersichtsKarteTable.saldo].toDouble(),
            ausgangsUst = row[UebersichtsKarteTable.ausgangsUst]?.toDouble(),
            eingangsUst = row[UebersichtsKarteTable.eingangsUst]?.toDouble(),
            ustSaldo = row[UebersichtsKarteTable.ustSaldo]?.toDouble(),
            anzahlBuchungen = row[UebersichtsKarteTable.anzahlBuchungen],
            anzahlEinnahmen = row[UebersichtsKarteTable.anzahlEinnahmen],
            anzahlAusgaben = row[UebersichtsKarteTable.anzahlAusgaben],
            groupId = row[UebersichtsKarteTable.groupId],
            createdBy = row[UebersichtsKarteTable.createdBy],
            erstellt = row[UebersichtsKarteTable.erstellt],
            geaendert = row[UebersichtsKarteTable.geaendert]
        )
    }
    
    fun getUebersichtsKarteById(id: Long, userId: Int): UebersichtsKarte? {
        return transaction {
            UebersichtsKarteTable.selectAll().where { UebersichtsKarteTable.id eq id }
                .singleOrNull()
                ?.let { row ->
                    if (canAccessUebersichtsKarte(row, userId)) {
                        mapToUebersichtsKarte(row)
                    } else {
                        null
                    }
                }
        }
    }
    
    fun deleteBuchungsKarte(id: Long, userId: Int): Boolean {
        return transaction {
            val existingKarte = BuchungsKarteTable.selectAll()
                .where { BuchungsKarteTable.id eq id }
                .firstOrNull()
            
            if (existingKarte != null && canAccessBuchungsKarte(existingKarte, userId)) {
                val deletedRows = BuchungsKarteTable.deleteWhere { BuchungsKarteTable.id eq id }
                deletedRows > 0
            } else {
                false
            }
        }
    }
    
    fun updateBuchungsKarte(id: Long, updateData: UpdateBuchungsKarteRequest, userId: Int): Boolean {
        return transaction {
            val existingKarte = BuchungsKarteTable.selectAll()
                .where { BuchungsKarteTable.id eq id }
                .firstOrNull()
            
            if (existingKarte != null && canAccessBuchungsKarte(existingKarte, userId)) {
                val updatedRows = BuchungsKarteTable.update({ BuchungsKarteTable.id eq id }) {
                    it[datum] = updateData.datum
                    it[beschreibung] = updateData.beschreibung
                    it[betrag] = BigDecimal.valueOf(updateData.betrag)
                    it[belegnummer] = updateData.belegnummer
                    it[ustSatz] = updateData.ustSatz?.let { BigDecimal.valueOf(it) }
                    it[ustBetrag] = updateData.ustBetrag?.let { BigDecimal.valueOf(it) }
                    it[buchungsartId] = updateData.buchungsartId
                    it[kategorieId] = updateData.kategorieId
                    updateData.dokumentId?.let { dokId -> it[dokumentId] = dokId }
                    updateData.imageId?.let { imgId -> it[imageId] = imgId }
                    it[geaendert] = java.time.LocalDateTime.now().toString()
                }
                updatedRows > 0
            } else {
                false
            }
        }
    }
    
    fun deleteUebersichtsKarte(id: Long, userId: Int): Boolean {
        return transaction {
            val existingKarte = UebersichtsKarteTable.selectAll()
                .where { UebersichtsKarteTable.id eq id }
                .firstOrNull()
            
            if (existingKarte != null && canAccessUebersichtsKarte(existingKarte, userId)) {
                val deletedRows = UebersichtsKarteTable.deleteWhere { UebersichtsKarteTable.id eq id }
                deletedRows > 0
            } else {
                false
            }
        }
    }
    
    // Hilfsmethoden für Berechnungen
    private fun calculateStatistiken(datumVon: String, datumBis: String, userId: Int): BuchungsStatistiken {
        return transaction {
            val userGroups = getUserGroups(userId)
            val singleGroupId = getSingleGroupId()
            
            val buchungen = BuchungsKarteTable
                .innerJoin(BuchungsArtTable)
                .selectAll()
                .where { 
                    (BuchungsKarteTable.datum greaterEq datumVon) and 
                    (BuchungsKarteTable.datum lessEq datumBis) and
                    if (userGroups.size == 1 && userGroups.contains(singleGroupId)) {
                        // User is only in "Single" group - only include own entries
                        BuchungsKarteTable.createdBy eq userId
                    } else {
                        // User is in other groups - include all entries of those groups
                        BuchungsKarteTable.groupId inList userGroups
                    }
                }
                .map { row ->
                    mapOf(
                        "betrag" to row[BuchungsKarteTable.betrag].toDouble(),
                        "buchungsart" to row[BuchungsArtTable.name],
                        "ustBetrag" to (row[BuchungsKarteTable.ustBetrag]?.toDouble() ?: 0.0),
                        "id" to row[BuchungsKarteTable.id]
                    )
                }
                
            val einnahmen = buchungen.filter { it["buchungsart"] == "EINNAHME" }
            val ausgaben = buchungen.filter { it["buchungsart"] == "AUSGABE" }
            
            val gesamtEinnahmen = einnahmen.sumOf { it["betrag"] as Double }
            val gesamtAusgaben = ausgaben.sumOf { it["betrag"] as Double }
            
            // Ausgangs-USt: USt aus Einnahmen (verkaufte Leistungen)
            val ausgangsUst = einnahmen.sumOf { it["ustBetrag"] as Double }
            
            // Eingangs-USt: USt aus Ausgaben (eingekaufte Leistungen)
            val eingangsUst = ausgaben.sumOf { it["ustBetrag"] as Double }
            
            // USt-Saldo: Ausgangs-USt - Eingangs-USt
            val ustSaldo = ausgangsUst - eingangsUst
            
            BuchungsStatistiken(
                gesamtEinnahmen = gesamtEinnahmen,
                gesamtAusgaben = gesamtAusgaben,
                saldo = gesamtEinnahmen - gesamtAusgaben,
                ausgangsUst = ausgangsUst,
                eingangsUst = eingangsUst,
                ustSaldo = ustSaldo,
                anzahlBuchungen = buchungen.size,
                anzahlEinnahmen = einnahmen.size,
                anzahlAusgaben = ausgaben.size
            )
        }
    }
    
    private fun generateTitel(datumVon: String, datumBis: String, zeitraumTyp: ZeitraumTyp): String {
        return when (zeitraumTyp) {
            ZeitraumTyp.TAG -> "Tagesübersicht vom $datumVon"
            ZeitraumTyp.WOCHE -> "Wochenübersicht $datumVon - $datumBis"
            ZeitraumTyp.MONAT -> "Monatsübersicht $datumVon - $datumBis"
            ZeitraumTyp.QUARTAL -> "Quartalsübersicht $datumVon - $datumBis"
            ZeitraumTyp.JAHR -> "Jahresübersicht $datumVon - $datumBis"
            ZeitraumTyp.BENUTZERDEFINIERT -> "Übersicht $datumVon - $datumBis"
        }
    }
    
    // Hilfsdatenklasse für Berechnungen
    private data class BuchungsStatistiken(
        val gesamtEinnahmen: Double,
        val gesamtAusgaben: Double,
        val saldo: Double,
        val ausgangsUst: Double,
        val eingangsUst: Double,
        val ustSaldo: Double,
        val anzahlBuchungen: Int,
        val anzahlEinnahmen: Int,
        val anzahlAusgaben: Int
    )
}