package com.shut

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.deleteWhere
import org.jetbrains.exposed.sql.innerJoin
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import java.sql.Timestamp


@Serializable
data class Stroke(
    var id: Long,
    var tstamp: String,
    var comment: String,
    var memorycard_id: Long = -1L,
)

object StrokeTab : Table("stroke") {
    val id = long("id").autoIncrement()
    val tstamp = varchar("tstamp", 30)
    val comment = varchar("comment", 50)
    val memorycard_id = long("memorycard_id") // Remove reference to deleted MemoryCardsTab
    override val primaryKey = PrimaryKey(StrokeTab.id)
}


class CounterService {
    fun initialize() { //separate function for initialization
        transaction {
            if (!SchemaUtils.listTables().contains("stroke")) {
                SchemaUtils.create(StrokeTab)
            }
        }
    }


    fun addStroke(stroke: Stroke): Long {
        return transaction {
            StrokeTab.insert {
                it[StrokeTab.tstamp] = stroke.tstamp
                it[StrokeTab.comment] = stroke.comment
                it[StrokeTab.memorycard_id] = stroke.memorycard_id
            } get StrokeTab.id
        }
    }

    fun getStrokeAll(): List<Stroke> {
        return transaction {
            StrokeTab
                .selectAll()
                .map {
                    Stroke(it[StrokeTab.id], it[StrokeTab.tstamp], it[StrokeTab.comment], it[StrokeTab.memorycard_id])
                }
        }
    }

    fun getStrokebyId(memorycard_id: Long): List<Stroke> {
        return transaction {
            StrokeTab
                .selectAll()
                .where { StrokeTab.memorycard_id eq memorycard_id }
                .map {
                    Stroke(it[StrokeTab.id], it[StrokeTab.tstamp], it[StrokeTab.comment], it[StrokeTab.memorycard_id])
                }
        }
    }

    fun deleteStroke(strokeId: Long): Int {
        return transaction {
            StrokeTab.deleteWhere { StrokeTab.id eq strokeId }
        }
    }


}