package com.shut

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.addLogger
import org.jetbrains.exposed.sql.StdOutSqlLogger


@Serializable
data class Packet(
    var id: Long,
    var name: String,
    var beschreibung: String,
    var image: Image,
)

@Serializable
data class Unterlage(
    var id: Long,
    var paket: Packet,
    var name: String,
    var material: List<Material>
)

@Serializable
data class UnterlageInfo(
    var id: Long,
    var paketName: String,
    var name: String,
    var material: List<MaterialInfo>
)

@Serializable
data class MaterialInfo(
    var id: Long,
    var name: String,
    var type: String,
    var sizeByte: Long,
    var location: String,
)


@Serializable
data class Material(
    var id: Long,
    var name: String,
    var type: String,
    var sizeByte: Long,
    var location: String,
    var content: String
)


object PacketTab : Table("packet") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 100)
    val beschreibung = text("beschreibung")
    val imageId = long("image_id").references(ImageTab.id)
    override val primaryKey = PrimaryKey(id)
}

object MaterialTab : Table("material") {
    val id = long("id").autoIncrement()
    val name = varchar("name", 255)
    val type = varchar("type", 10)
    val sizeByte = long("size_byte")
    val location = varchar("location", 260)
    val content = text("content")
    override val primaryKey = PrimaryKey(id)
}

object UnterlagenTab : Table("unterlagen") {
    val id = long("id").autoIncrement()
    val paketId = long("paket_id").references(PacketTab.id)
    val name = varchar("name", 255)
    override val primaryKey = PrimaryKey(id)
}

object UnterlageMaterialTab : Table("unterlage_material") {
    val unterlageId = long("unterlage_id").references(UnterlagenTab.id)
    val materialId = long("material_id").references(MaterialTab.id)
    override val primaryKey = PrimaryKey(unterlageId, materialId)
}


// Service-Klasse für Datenbankzugriffe
class LernmaterialService {
    fun initialize() {
        transaction {
            // Tabellen erstellen, falls sie nicht existieren

            if (!SchemaUtils.listTables().contains("packet")) {
                SchemaUtils.create(PacketTab)
            }
            if (!SchemaUtils.listTables().contains("material")) {
                SchemaUtils.create(MaterialTab)
            }
            if (!SchemaUtils.listTables().contains("unterlagen")) {
                SchemaUtils.create(UnterlagenTab)
            }

            if (!SchemaUtils.listTables().contains("unterlage_material")) {
                SchemaUtils.create(UnterlageMaterialTab)
            }

        }
    }


    // PACKET FUNKTIONEN
    fun addPacket(packet: Packet): Long {
        return transaction {
            // Erst das Packet einfügen
            val packetId = PacketTab.insert {
                it[name] = packet.name
                it[beschreibung] = packet.beschreibung
                it[imageId] = packet.image.id
            } get PacketTab.id

            packetId
        }
    }

    fun getPacketAll(): List<Packet> {
        return transaction {
            PacketTab
                .selectAll()
                .map { row ->
                    val packetId = row[PacketTab.id]
                    val imageId = row[PacketTab.imageId]

                    // Image abrufen
                    val image = ImageTab
                        .selectAll()
                        .where { ImageTab.id eq imageId }
                        .map { imgRow ->
                            Image(
                                imgRow[ImageTab.id],
                                imgRow[ImageTab.name],
                                imgRow[ImageTab.extension],
                                imgRow[ImageTab.location]
                            )
                        }
                        .singleOrNull() ?: Image(-1, "", "", "")


                    Packet(
                        id = packetId,
                        name = row[PacketTab.name],
                        beschreibung = row[PacketTab.beschreibung],
                        image = image
                    )
                }
        }
    }

    fun getPacketById(id: Long): Packet {
        return transaction {
            PacketTab
                .selectAll()
                .where { PacketTab.id eq id }
                .singleOrNull()
                ?.let { row ->
                    val packetId = row[PacketTab.id]
                    val imageId = row[PacketTab.imageId]

                    // Image abrufen
                    val image = ImageTab
                        .selectAll()
                        .where { ImageTab.id eq imageId }
                        .map { imgRow ->
                            Image(
                                imgRow[ImageTab.id],
                                imgRow[ImageTab.name],
                                imgRow[ImageTab.extension],
                                imgRow[ImageTab.location]
                            )
                        }
                        .singleOrNull() ?: Image(-1, "", "", "")

                    Packet(
                        id = packetId,
                        name = row[PacketTab.name],
                        beschreibung = row[PacketTab.beschreibung],
                        image = image
                    )
                }
                ?: Packet(-1L, "", "", Image(-1, "", "", ""))
        }
    }

    fun updatePacket(packet: Packet): Int {
        return transaction {
            var updatedCount = 0

            // Aktualisiere Packet-Daten
            updatedCount += PacketTab.update({ PacketTab.id eq packet.id }) {
                it[name] = packet.name
                it[beschreibung] = packet.beschreibung
                it[imageId] = packet.image.id
            }

            updatedCount
        }
    }

    fun deletePacket(id: Long): Int {
        return transaction {
            var deletedCount = 0

            // Lösche zuerst alle verknüpften Unterlagen
            val unterlagen = getUnterlagenByPacketId(id)
            unterlagen.forEach { unterlage ->
                deletedCount += deleteUnterlage(unterlage.id)
            }

            // Lösche das Packet selbst
            deletedCount += PacketTab.deleteWhere { PacketTab.id eq id }

            deletedCount
        }
    }

    // MATERIAL FUNKTIONEN
    fun addMaterial(material: Material): Long {
        var materialID = transaction {
            addLogger(StdOutSqlLogger)
            var matID = MaterialTab.insert {
                it[name] = material.name
                it[type] = material.type
                it[sizeByte] = material.sizeByte
                it[location] = material.location
                it[content] = material.content
            } get MaterialTab.id
            matID
        }
        return materialID
    }

    fun getMaterialAll(): List<Material> {
        return transaction {
            MaterialTab
                .selectAll()
                .map { row ->
                    val materialId = row[MaterialTab.id]
                    Material(
                        id = materialId,
                        name = row[MaterialTab.name],
                        type = row[MaterialTab.type],
                        sizeByte = row[MaterialTab.sizeByte],
                        location = row[MaterialTab.location],
                        content = row[MaterialTab.content]
                    )
                }
        }
    }

    fun getMaterialById(id: Long): Material {
        return transaction {
            MaterialTab
                .selectAll()
                .where { MaterialTab.id eq id }
                .singleOrNull()
                ?.let { row ->
                    val materialId = row[MaterialTab.id]


                    Material(
                        id = materialId,
                        name = row[MaterialTab.name],
                        type = row[MaterialTab.type],
                        sizeByte = row[MaterialTab.sizeByte],
                        location = row[MaterialTab.location],
                        content = row[MaterialTab.content]
                    )
                }
                ?: Material(-1L, "", "", 0L, "", "")
        }
    }

    fun updateMaterial(material: Material): Int {
        return transaction {
            var updatedCount = 0

            // Aktualisiere Material-Daten
            updatedCount += MaterialTab.update({ MaterialTab.id eq material.id }) {
                it[name] = material.name
                it[type] = material.type
                it[sizeByte] = material.sizeByte
                it[location] = material.location
            }

            updatedCount
        }
    }

    fun deleteMaterial(id: Long): Int {
        return transaction {
            var deletedCount = 0
            // Lösche die Verbindungen zu Unterlagen
            deletedCount += UnterlageMaterialTab.deleteWhere { materialId eq id }
            // Lösche das Material selbst
            deletedCount += MaterialTab.deleteWhere { MaterialTab.id eq id }
            deletedCount
        }
    }

    // UNTERLAGE FUNKTIONEN
    fun addUnterlage(unterlage: Unterlage): Long {
        return transaction {
            addLogger(StdOutSqlLogger)
            println("Speichere die Unterlage ${unterlage.toString()}")
            // Erst die Unterlage einfügen
            val unterlageId = UnterlagenTab.insert {
                it[name] = unterlage.name
                it[paketId] = unterlage.paket.id
            } get UnterlagenTab.id

            println("Speichere die Materialien ${unterlage.material.toString()}")
            // Dann die Materialien speichern
            unterlage.material.forEach { material ->
                try {
                    if (material.id <= 0) {
                        material.id = MaterialTab.insert {
                            it[name] = material.name
                            it[type] = material.type
                            it[sizeByte] = material.sizeByte
                            it[location] = material.location
                            it[content] = material.content
                        } get MaterialTab.id
                    }
                    println("Ein Unterlage_Material Relation wird gespeichert  ${unterlageId} ${material.id}")
                    UnterlageMaterialTab.insert {
                        it[UnterlageMaterialTab.unterlageId] = unterlageId
                        it[UnterlageMaterialTab.materialId] = material.id
                    }
                } catch (e: Exception) {
                    println("Fehler beim Spcihern einer Unterlage $e")
                }
            }

            unterlageId
        }
    }

    fun getUnterlagenAll(): List<Unterlage> {
        return transaction {
            UnterlagenTab
                .selectAll()
                .map { row ->
                    val unterlageId = row[UnterlagenTab.id]
                    val packetId = row[UnterlagenTab.paketId]

                    // Packet abrufen
                    val packet = getPacketById(packetId)

                    // Materialien abrufen
                    val materialien = UnterlageMaterialTab
                        .innerJoin(MaterialTab)
                        .selectAll()
                        .where { UnterlageMaterialTab.unterlageId eq unterlageId }
                        .map { matRow ->
                            val materialId = matRow[MaterialTab.id]


                            Material(
                                materialId,
                                matRow[MaterialTab.name],
                                matRow[MaterialTab.type],
                                matRow[MaterialTab.sizeByte],
                                matRow[MaterialTab.location],
                                matRow[MaterialTab.content]
                            )
                        }

                    Unterlage(
                        id = unterlageId,
                        paket = packet,
                        name = row[UnterlagenTab.name],
                        material = materialien
                    )
                }
        }
    }

    fun getUnterlagenAllInfo(page: Int, pageSize: Int): List<UnterlageInfo> {

        val offset: Long = (page - 1) * pageSize.toLong()
        return transaction {
            UnterlagenTab
                .selectAll()
                .limit(pageSize)
                .offset(offset)
                .map { row ->
                    val unterlageId = row[UnterlagenTab.id]
                    val packetId = row[UnterlagenTab.paketId]

                    // Packet abrufen
                    val packet = getPacketById(packetId)

                    // Materialien abrufen
                    val materialien = UnterlageMaterialTab
                        .innerJoin(MaterialTab)
                        .selectAll()
                        .where { UnterlageMaterialTab.unterlageId eq unterlageId }
                        .map { matRow ->
                            val materialId = matRow[MaterialTab.id]

                            MaterialInfo(
                                materialId,
                                matRow[MaterialTab.name],
                                matRow[MaterialTab.type],
                                matRow[MaterialTab.sizeByte],
                                matRow[MaterialTab.location]
                            )
                        }

                    UnterlageInfo(
                        id = unterlageId,
                        paketName = packet.name,
                        name = row[UnterlagenTab.name],
                        material = materialien
                    )
                }
        }
    }

    fun getUnterlagenAllInfoAnz(): Long {
        return transaction {
            UnterlagenTab
                .selectAll()
                .count()
        }
    }

    fun searchUnterlagen(searchTerm: String, page: Int, pageSize: Int): List<UnterlageInfo> {
        val offset: Long = (page - 1) * pageSize.toLong()
        return transaction {
            // Search in Unterlagen names, Packet names, Material names, and Material content
            val searchPattern = "%${searchTerm.lowercase()}%"
            
            // Get distinct unterlage IDs that match the search criteria
            val matchingUnterlagenIds = UnterlagenTab
                .leftJoin(PacketTab, { UnterlagenTab.paketId }, { PacketTab.id })
                .leftJoin(UnterlageMaterialTab, { UnterlagenTab.id }, { UnterlageMaterialTab.unterlageId })
                .leftJoin(MaterialTab, { UnterlageMaterialTab.materialId }, { MaterialTab.id })
                .select(UnterlagenTab.id)
                .where { 
                    UnterlagenTab.name.lowerCase().like(searchPattern) or
                    PacketTab.name.lowerCase().like(searchPattern) or
                    PacketTab.beschreibung.lowerCase().like(searchPattern) or
                    MaterialTab.name.lowerCase().like(searchPattern) or
                    MaterialTab.content.lowerCase().like(searchPattern)
                }
                .groupBy(UnterlagenTab.id)
                .limit(pageSize)
                .offset(offset)
                .map { it[UnterlagenTab.id] }
            
            // Now fetch complete data for these IDs
            matchingUnterlagenIds.map { unterlageId ->
                val unterlage = UnterlagenTab.selectAll().where { UnterlagenTab.id eq unterlageId }.single()
                val packetId = unterlage[UnterlagenTab.paketId]
                
                // Packet abrufen
                val packet = getPacketById(packetId)

                // Materialien abrufen
                val materialien = UnterlageMaterialTab
                    .innerJoin(MaterialTab)
                    .selectAll()
                    .where { UnterlageMaterialTab.unterlageId eq unterlageId }
                    .map { matRow ->
                        val materialId = matRow[MaterialTab.id]

                        MaterialInfo(
                            materialId,
                            matRow[MaterialTab.name],
                            matRow[MaterialTab.type],
                            matRow[MaterialTab.sizeByte],
                            matRow[MaterialTab.location]
                        )
                    }

                UnterlageInfo(
                    id = unterlageId,
                    paketName = packet.name,
                    name = unterlage[UnterlagenTab.name],
                    material = materialien
                )
            }
        }
    }

    fun searchUnterlagenAnz(searchTerm: String): Long {
        return transaction {
            val searchPattern = "%${searchTerm.lowercase()}%"
            
            UnterlagenTab
                .leftJoin(PacketTab, { UnterlagenTab.paketId }, { PacketTab.id })
                .leftJoin(UnterlageMaterialTab, { UnterlagenTab.id }, { UnterlageMaterialTab.unterlageId })
                .leftJoin(MaterialTab, { UnterlageMaterialTab.materialId }, { MaterialTab.id })
                .select(UnterlagenTab.id)
                .where { 
                    UnterlagenTab.name.lowerCase().like(searchPattern) or
                    PacketTab.name.lowerCase().like(searchPattern) or
                    PacketTab.beschreibung.lowerCase().like(searchPattern) or
                    MaterialTab.name.lowerCase().like(searchPattern) or
                    MaterialTab.content.lowerCase().like(searchPattern)
                }
                .groupBy(UnterlagenTab.id)
                .count()
        }
    }


    fun getUnterlagenByPacketId(packetId: Long): List<Unterlage> {
        return transaction {
            UnterlagenTab
                .selectAll()
                .where { UnterlagenTab.paketId eq packetId }
                .map { row ->
                    val unterlageId = row[UnterlagenTab.id]

                    // Packet abrufen
                    val packet = getPacketById(packetId)

                    // Materialien abrufen
                    val materialien = UnterlageMaterialTab
                        .innerJoin(MaterialTab)
                        .selectAll()
                        .where { UnterlageMaterialTab.unterlageId eq unterlageId }
                        .map { matRow ->
                            val materialId = matRow[MaterialTab.id]


                            Material(
                                materialId,
                                matRow[MaterialTab.name],
                                matRow[MaterialTab.type],
                                matRow[MaterialTab.sizeByte],
                                matRow[MaterialTab.location],
                                matRow[MaterialTab.content],
                            )
                        }

                    Unterlage(
                        id = unterlageId,
                        paket = packet,
                        name = row[UnterlagenTab.name],
                        material = materialien
                    )
                }
        }
    }

    fun getUnterlagenById(id: Long): Unterlage {
        return transaction {
            UnterlagenTab
                .selectAll()
                .where { UnterlagenTab.id eq id }
                .singleOrNull()
                ?.let { row ->
                    val unterlageId = row[UnterlagenTab.id]
                    val packetId = row[UnterlagenTab.paketId]

                    // Packet abrufen
                    val packet = getPacketById(packetId)

                    // Materialien abrufen
                    val materialien = UnterlageMaterialTab
                        .innerJoin(MaterialTab)
                        .selectAll()
                        .where { UnterlageMaterialTab.unterlageId eq unterlageId }
                        .map { matRow ->
                            val materialId = matRow[MaterialTab.id]

                            Material(
                                materialId,
                                matRow[MaterialTab.name],
                                matRow[MaterialTab.type],
                                matRow[MaterialTab.sizeByte],
                                matRow[MaterialTab.location],
                                matRow[MaterialTab.content],
                            )
                        }

                    Unterlage(
                        id = unterlageId,
                        paket = packet,
                        name = row[UnterlagenTab.name],
                        material = materialien
                    )
                }
                ?: Unterlage(
                    -1L,
                    Packet(-1L, "", "", Image(-1L, "", "", "")),
                    "",
                    emptyList()
                )
        }
    }

    fun updateUnterlage(unterlage: Unterlage): Int {
        return transaction {
            var updatedCount = 0

            // Aktualisiere Unterlage-Daten
            updatedCount += UnterlagenTab.update({ UnterlagenTab.id eq unterlage.id }) {
                it[name] = unterlage.name
                it[paketId] = unterlage.paket.id
            }

            // Lösche vorhandene Materialverknüpfungen
            updatedCount += UnterlageMaterialTab.deleteWhere { unterlageId eq unterlage.id }

            // Füge neue Materialverknüpfungen hinzu
            unterlage.material.forEach { material ->
                UnterlageMaterialTab.insert {
                    it[UnterlageMaterialTab.unterlageId] = unterlage.id
                    it[UnterlageMaterialTab.materialId] = material.id
                }
                updatedCount++
            }

            updatedCount
        }
    }

    fun deleteUnterlage(id: Long): Int {
        return transaction {
            var deletedCount = 0

            // Lösche die Verbindungen zu Materialien
            deletedCount += UnterlageMaterialTab.deleteWhere { unterlageId eq id }

            // Lösche die Unterlage selbst
            deletedCount += UnterlagenTab.deleteWhere { UnterlagenTab.id eq id }

            deletedCount
        }
    }

    fun deleteAllLernmaterialData(): Int {
        var totalDeleted = 0

        return transaction {
            // Lösche zuerst die Verbindungstabellen
            totalDeleted += UnterlageMaterialTab.deleteAll()

            // Lösche dann die Haupttabellen
            totalDeleted += UnterlagenTab.deleteAll()
            totalDeleted += MaterialTab.deleteAll()
            totalDeleted += PacketTab.deleteAll()

            totalDeleted
        }
    }


}