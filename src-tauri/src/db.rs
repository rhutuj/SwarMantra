use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;
use time::OffsetDateTime;
use uuid::Uuid;

pub struct AppDb {
    connection: Mutex<Connection>,
}

#[derive(Debug, Serialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RaagRow {
    pub id: String,
    pub name: String,
    pub thaat: Option<String>,
    pub aaroh: Option<String>,
    pub avroh: Option<String>,
    pub pakad: Option<String>,
    pub vadi: Option<String>,
    pub samvadi: Option<String>,
    pub komal_sur: Option<String>,
    pub tivra_sur: Option<String>,
    pub jati: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RaagInput {
    pub name: String,
    pub thaat: Option<String>,
    pub aaroh: Option<String>,
    pub avroh: Option<String>,
    pub pakad: Option<String>,
    pub vadi: Option<String>,
    pub samvadi: Option<String>,
    pub komal_sur: Option<String>,
    pub tivra_sur: Option<String>,
    pub jati: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SargamRow {
    pub id: String,
    pub raag_id: String,
    pub title: String,
    pub taal: Option<String>,
    pub bpm: Option<i64>,
    pub laya: Option<String>,
    pub asthayi: Option<String>,
    pub antara: Option<String>,
    pub notes: Option<String>,
    pub starting_beat: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SargamInput {
    pub title: String,
    pub taal: Option<String>,
    pub bpm: Option<i64>,
    pub laya: Option<String>,
    pub asthayi: Option<String>,
    pub antara: Option<String>,
    pub notes: Option<String>,
    pub starting_beat: Option<i64>,
}

#[derive(Debug, Serialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BandishRow {
    pub id: String,
    pub raag_id: String,
    pub title: String,
    pub taal: Option<String>,
    pub bpm: Option<i64>,
    pub laya: Option<String>,
    pub composer: Option<String>,
    pub lyrics: Option<String>,
    pub asthayi: Option<String>,
    pub antara: Option<String>,
    pub notes: Option<String>,
    pub starting_beat: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BandishInput {
    pub title: String,
    pub taal: Option<String>,
    pub bpm: Option<i64>,
    pub laya: Option<String>,
    pub composer: Option<String>,
    pub lyrics: Option<String>,
    pub asthayi: Option<String>,
    pub antara: Option<String>,
    pub notes: Option<String>,
    pub starting_beat: Option<i64>,
}

#[derive(Debug, Serialize, Clone, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TaanRow {
    pub id: String,
    pub notation: Option<String>,
    pub text_note: Option<String>,
    pub starting_matra: i64,
    pub sargam_id: Option<String>,
    pub bandish_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaanInput {
    pub notation: Option<String>,
    pub text_note: Option<String>,
    pub starting_matra: Option<i64>,
}

pub type DbResult<T> = Result<T, String>;

fn now_timestamp() -> String {
    OffsetDateTime::now_utc()
        .format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}

fn new_id() -> String {
    Uuid::new_v4().to_string()
}

fn clean_optional(value: Option<String>) -> Option<String> {
    value.and_then(|text| {
        let trimmed = text.trim().to_string();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
        }
    })
}

fn require_text(value: &str, field_name: &str) -> DbResult<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        Err(format!("{field_name} is required"))
    } else {
        Ok(trimmed.to_string())
    }
}

fn ensure_exists(connection: &Connection, table: &str, id: &str, label: &str) -> DbResult<()> {
    let sql = format!("SELECT 1 FROM {table} WHERE id = ?1");
    let exists = connection
        .query_row(&sql, params![id], |_| Ok(()))
        .optional()
        .map_err(|error| error.to_string())?;
    exists.ok_or_else(|| format!("{label} not found"))
}

impl AppDb {
    pub fn new(path: &Path) -> DbResult<Self> {
        let connection = Connection::open(path).map_err(|error| error.to_string())?;
        Self::from_connection(connection)
    }

    #[cfg(test)]
    pub fn new_in_memory() -> DbResult<Self> {
        let connection = Connection::open_in_memory().map_err(|error| error.to_string())?;
        Self::from_connection(connection)
    }

    fn from_connection(connection: Connection) -> DbResult<Self> {
        connection
            .execute_batch("PRAGMA foreign_keys = ON;")
            .map_err(|error| error.to_string())?;
        let db = Self {
            connection: Mutex::new(connection),
        };
        db.migrate()?;
        Ok(db)
    }

    fn migrate(&self) -> DbResult<()> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        connection
            .execute_batch(
                "
                PRAGMA foreign_keys = ON;

                CREATE TABLE IF NOT EXISTS raags (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    thaat TEXT,
                    aaroh TEXT,
                    avroh TEXT,
                    pakad TEXT,
                    vadi TEXT,
                    samvadi TEXT,
                    komal_sur TEXT,
                    tivra_sur TEXT,
                    jati TEXT,
                    notes TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS sargams (
                    id TEXT PRIMARY KEY,
                    raag_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    taal TEXT,
                    bpm INTEGER,
                    laya TEXT,
                    asthayi TEXT,
                    antara TEXT,
                    notes TEXT,
                    starting_beat INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (raag_id) REFERENCES raags(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS bandishes (
                    id TEXT PRIMARY KEY,
                    raag_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    taal TEXT,
                    bpm INTEGER,
                    laya TEXT,
                    composer TEXT,
                    lyrics TEXT,
                    asthayi TEXT,
                    antara TEXT,
                    notes TEXT,
                    starting_beat INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (raag_id) REFERENCES raags(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS taans (
                    id TEXT PRIMARY KEY,
                    sargam_id TEXT,
                    bandish_id TEXT,
                    notation TEXT,
                    text_note TEXT,
                    starting_matra INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (sargam_id) REFERENCES sargams(id) ON DELETE CASCADE,
                    FOREIGN KEY (bandish_id) REFERENCES bandishes(id) ON DELETE CASCADE,
                    CHECK (
                        (sargam_id IS NOT NULL AND bandish_id IS NULL)
                        OR
                        (sargam_id IS NULL AND bandish_id IS NOT NULL)
                    )
                );

                CREATE INDEX IF NOT EXISTS idx_sargams_raag_id ON sargams(raag_id);
                CREATE INDEX IF NOT EXISTS idx_bandishes_raag_id ON bandishes(raag_id);
                CREATE INDEX IF NOT EXISTS idx_taans_sargam_id ON taans(sargam_id);
                CREATE INDEX IF NOT EXISTS idx_taans_bandish_id ON taans(bandish_id);
                ",
            )
            .map_err(|error| error.to_string())?;

        let _ = connection.execute_batch(
            "ALTER TABLE sargams ADD COLUMN starting_beat INTEGER NOT NULL DEFAULT 1;
             ALTER TABLE bandishes ADD COLUMN starting_beat INTEGER NOT NULL DEFAULT 1;",
        );

        let _ = connection.execute_batch(
            "ALTER TABLE raags ADD COLUMN vadi TEXT;
             ALTER TABLE raags ADD COLUMN samvadi TEXT;
             ALTER TABLE raags ADD COLUMN komal_sur TEXT;
             ALTER TABLE raags ADD COLUMN tivra_sur TEXT;
             ALTER TABLE raags ADD COLUMN jati TEXT;",
        );

        let _ = connection.execute_batch(
            "ALTER TABLE sargams ADD COLUMN asthayi TEXT;
             ALTER TABLE sargams ADD COLUMN antara TEXT;
             ALTER TABLE bandishes ADD COLUMN asthayi TEXT;
             ALTER TABLE bandishes ADD COLUMN antara TEXT;",
        );
        let _ = connection.execute_batch(
            "UPDATE sargams SET asthayi = notation WHERE notation IS NOT NULL;
             UPDATE bandishes SET asthayi = notation WHERE notation IS NOT NULL;",
        );

        let _ = connection.execute_batch(
            "ALTER TABLE taans RENAME COLUMN starting_beat TO starting_matra;",
        );
        let _ = connection.execute_batch(
            "ALTER TABLE taans RENAME COLUMN notes TO text_note;",
        );
        let _ = connection.execute_batch(
            "ALTER TABLE taans DROP COLUMN display_order;",
        );
        let _ = connection.execute_batch(
            "ALTER TABLE taans DROP COLUMN title;",
        );

        let _ = connection.execute_batch(
            "ALTER TABLE sargams ADD COLUMN bpm INTEGER;
             ALTER TABLE bandishes ADD COLUMN bpm INTEGER;",
        );

        let _ = connection.execute_batch(
            "ALTER TABLE sargams ADD COLUMN laya TEXT;",
        );

        Ok(())
    }

    pub fn list_raags(&self) -> DbResult<Vec<RaagRow>> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        let mut statement = connection
            .prepare(
                "SELECT id, name, thaat, aaroh, avroh, pakad, vadi, samvadi, komal_sur, tivra_sur, jati, notes, created_at, updated_at
                 FROM raags
                 ORDER BY updated_at DESC, name ASC",
            )
            .map_err(|error| error.to_string())?;
        let rows = statement
            .query_map([], row_to_raag)
            .map_err(|error| error.to_string())?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn get_raag(&self, id: &str) -> DbResult<Option<RaagRow>> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        connection
            .query_row(
                "SELECT id, name, thaat, aaroh, avroh, pakad, vadi, samvadi, komal_sur, tivra_sur, jati, notes, created_at, updated_at
                 FROM raags
                 WHERE id = ?1",
                params![id],
                row_to_raag,
            )
            .optional()
            .map_err(|error| error.to_string())
    }

    pub fn create_raag(&self, input: RaagInput) -> DbResult<RaagRow> {
        let id = new_id();
        let name = require_text(&input.name, "Raag name")?;
        let now = now_timestamp();
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        connection
            .execute(
                "INSERT INTO raags (id, name, thaat, aaroh, avroh, pakad, vadi, samvadi, komal_sur, tivra_sur, jati, notes, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
                params![
                    id,
                    name,
                    clean_optional(input.thaat),
                    clean_optional(input.aaroh),
                    clean_optional(input.avroh),
                    clean_optional(input.pakad),
                    clean_optional(input.vadi),
                    clean_optional(input.samvadi),
                    clean_optional(input.komal_sur),
                    clean_optional(input.tivra_sur),
                    clean_optional(input.jati),
                    clean_optional(input.notes),
                    now,
                    now
                ],
            )
            .map_err(|error| error.to_string())?;
        drop(connection);
        self.get_raag(&id)?
            .ok_or_else(|| "Created Raag was not found".to_string())
    }

    pub fn update_raag(&self, id: &str, input: RaagInput) -> DbResult<RaagRow> {
        let name = require_text(&input.name, "Raag name")?;
        let now = now_timestamp();
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        let changed = connection
            .execute(
                "UPDATE raags
                 SET name = ?2, thaat = ?3, aaroh = ?4, avroh = ?5, pakad = ?6, vadi = ?7, samvadi = ?8, komal_sur = ?9, tivra_sur = ?10, jati = ?11, notes = ?12, updated_at = ?13
                 WHERE id = ?1",
                params![
                    id,
                    name,
                    clean_optional(input.thaat),
                    clean_optional(input.aaroh),
                    clean_optional(input.avroh),
                    clean_optional(input.pakad),
                    clean_optional(input.vadi),
                    clean_optional(input.samvadi),
                    clean_optional(input.komal_sur),
                    clean_optional(input.tivra_sur),
                    clean_optional(input.jati),
                    clean_optional(input.notes),
                    now
                ],
            )
            .map_err(|error| error.to_string())?;
        if changed == 0 {
            return Err("Raag not found".to_string());
        }
        drop(connection);
        self.get_raag(id)?
            .ok_or_else(|| "Updated Raag was not found".to_string())
    }

    pub fn delete_raag(&self, id: &str) -> DbResult<()> {
        self.delete_by_id("raags", id, "Raag")
    }

    pub fn list_sargams_by_raag(&self, raag_id: &str) -> DbResult<Vec<SargamRow>> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        let mut statement = connection
            .prepare(
                "SELECT id, raag_id, title, taal, bpm, laya, asthayi, antara, notes, starting_beat, created_at, updated_at
                 FROM sargams
                 WHERE raag_id = ?1
                 ORDER BY updated_at DESC, title ASC",
            )
            .map_err(|error| error.to_string())?;
        let rows = statement
            .query_map(params![raag_id], row_to_sargam)
            .map_err(|error| error.to_string())?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn get_sargam(&self, id: &str) -> DbResult<Option<SargamRow>> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        connection
            .query_row(
                "SELECT id, raag_id, title, taal, bpm, laya, asthayi, antara, notes, starting_beat, created_at, updated_at
                 FROM sargams
                 WHERE id = ?1",
                params![id],
                row_to_sargam,
            )
            .optional()
            .map_err(|error| error.to_string())
    }

    pub fn create_sargam(&self, raag_id: &str, input: SargamInput) -> DbResult<SargamRow> {
        let id = new_id();
        let title = require_text(&input.title, "Sargam title")?;
        let now = now_timestamp();
        let starting_beat = input.starting_beat.unwrap_or(1);
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        ensure_exists(&connection, "raags", raag_id, "Raag")?;
        connection
            .execute(
                "INSERT INTO sargams (id, raag_id, title, taal, bpm, laya, asthayi, antara, notes, starting_beat, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
                params![
                    id,
                    raag_id,
                    title,
                    clean_optional(input.taal),
                    input.bpm,
                    clean_optional(input.laya),
                    clean_optional(input.asthayi),
                    clean_optional(input.antara),
                    clean_optional(input.notes),
                    starting_beat,
                    now,
                    now
                ],
            )
            .map_err(|error| error.to_string())?;
        drop(connection);
        self.get_sargam(&id)?
            .ok_or_else(|| "Created Sargam was not found".to_string())
    }

    pub fn update_sargam(&self, id: &str, input: SargamInput) -> DbResult<SargamRow> {
        let title = require_text(&input.title, "Sargam title")?;
        let now = now_timestamp();
        let starting_beat = input.starting_beat.unwrap_or(1);
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        let changed = connection
            .execute(
                "UPDATE sargams
                 SET title = ?2, taal = ?3, bpm = ?4, laya = ?5, asthayi = ?6, antara = ?7, notes = ?8, starting_beat = ?9, updated_at = ?10
                 WHERE id = ?1",
                params![
                    id,
                    title,
                    clean_optional(input.taal),
                    input.bpm,
                    clean_optional(input.laya),
                    clean_optional(input.asthayi),
                    clean_optional(input.antara),
                    clean_optional(input.notes),
                    starting_beat,
                    now
                ],
            )
            .map_err(|error| error.to_string())?;
        if changed == 0 {
            return Err("Sargam not found".to_string());
        }
        drop(connection);
        self.get_sargam(id)?
            .ok_or_else(|| "Updated Sargam was not found".to_string())
    }

    pub fn delete_sargam(&self, id: &str) -> DbResult<()> {
        self.delete_by_id("sargams", id, "Sargam")
    }

    pub fn list_bandishes_by_raag(&self, raag_id: &str) -> DbResult<Vec<BandishRow>> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        let mut statement = connection
            .prepare(
                "SELECT id, raag_id, title, taal, bpm, laya, composer, lyrics, asthayi, antara, notes, starting_beat, created_at, updated_at
                 FROM bandishes
                 WHERE raag_id = ?1
                 ORDER BY updated_at DESC, title ASC",
            )
            .map_err(|error| error.to_string())?;
        let rows = statement
            .query_map(params![raag_id], row_to_bandish)
            .map_err(|error| error.to_string())?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    pub fn get_bandish(&self, id: &str) -> DbResult<Option<BandishRow>> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        connection
            .query_row(
                "SELECT id, raag_id, title, taal, bpm, laya, composer, lyrics, asthayi, antara, notes, starting_beat, created_at, updated_at
                 FROM bandishes
                 WHERE id = ?1",
                params![id],
                row_to_bandish,
            )
            .optional()
            .map_err(|error| error.to_string())
    }

    pub fn create_bandish(&self, raag_id: &str, input: BandishInput) -> DbResult<BandishRow> {
        let id = new_id();
        let title = require_text(&input.title, "Bandish title")?;
        let now = now_timestamp();
        let starting_beat = input.starting_beat.unwrap_or(1);
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        ensure_exists(&connection, "raags", raag_id, "Raag")?;
        connection
            .execute(
                "INSERT INTO bandishes (id, raag_id, title, taal, bpm, laya, composer, lyrics, asthayi, antara, notes, starting_beat, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
                params![
                    id,
                    raag_id,
                    title,
                    clean_optional(input.taal),
                    input.bpm,
                    clean_optional(input.laya),
                    clean_optional(input.composer),
                    clean_optional(input.lyrics),
                    clean_optional(input.asthayi),
                    clean_optional(input.antara),
                    clean_optional(input.notes),
                    starting_beat,
                    now,
                    now
                ],
            )
            .map_err(|error| error.to_string())?;
        drop(connection);
        self.get_bandish(&id)?
            .ok_or_else(|| "Created Bandish was not found".to_string())
    }

    pub fn update_bandish(&self, id: &str, input: BandishInput) -> DbResult<BandishRow> {
        let title = require_text(&input.title, "Bandish title")?;
        let now = now_timestamp();
        let starting_beat = input.starting_beat.unwrap_or(1);
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        let changed = connection
            .execute(
                "UPDATE bandishes
                 SET title = ?2, taal = ?3, bpm = ?4, laya = ?5, composer = ?6, lyrics = ?7, asthayi = ?8, antara = ?9, notes = ?10, starting_beat = ?11, updated_at = ?12
                 WHERE id = ?1",
                params![
                    id,
                    title,
                    clean_optional(input.taal),
                    input.bpm,
                    clean_optional(input.laya),
                    clean_optional(input.composer),
                    clean_optional(input.lyrics),
                    clean_optional(input.asthayi),
                    clean_optional(input.antara),
                    clean_optional(input.notes),
                    starting_beat,
                    now
                ],
            )
            .map_err(|error| error.to_string())?;
        if changed == 0 {
            return Err("Bandish not found".to_string());
        }
        drop(connection);
        self.get_bandish(id)?
            .ok_or_else(|| "Updated Bandish was not found".to_string())
    }

    pub fn delete_bandish(&self, id: &str) -> DbResult<()> {
        self.delete_by_id("bandishes", id, "Bandish")
    }

    pub fn list_taans_by_sargam(&self, sargam_id: &str) -> DbResult<Vec<TaanRow>> {
        self.list_taans("sargam_id", sargam_id)
    }

    pub fn list_taans_by_bandish(&self, bandish_id: &str) -> DbResult<Vec<TaanRow>> {
        self.list_taans("bandish_id", bandish_id)
    }

    pub fn get_taan(&self, id: &str) -> DbResult<Option<TaanRow>> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        connection
            .query_row(
            "SELECT id, notation, text_note, starting_matra, sargam_id, bandish_id, created_at, updated_at
                  FROM taans
                  WHERE id = ?1",
                params![id],
                row_to_taan,
            )
            .optional()
            .map_err(|error| error.to_string())
    }

    pub fn create_taan(
        &self,
        sargam_id: Option<&str>,
        bandish_id: Option<&str>,
        input: TaanInput,
    ) -> DbResult<TaanRow> {
        let id = new_id();
        let now = now_timestamp();
        let starting_matra = input.starting_matra.unwrap_or(1);
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        match (sargam_id, bandish_id) {
            (Some(parent_id), None) => ensure_exists(&connection, "sargams", parent_id, "Sargam")?,
            (None, Some(parent_id)) => {
                ensure_exists(&connection, "bandishes", parent_id, "Bandish")?
            }
            _ => return Err("Taan must belong to exactly one parent".to_string()),
        }
        connection
            .execute(
                "INSERT INTO taans (id, sargam_id, bandish_id, notation, text_note, starting_matra, created_at, updated_at)
                  VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    id,
                    sargam_id,
                    bandish_id,
                    clean_optional(input.notation),
                    clean_optional(input.text_note),
                    starting_matra,
                    now,
                    now
                ],
            )
            .map_err(|error| error.to_string())?;
        drop(connection);
        self.get_taan(&id)?
            .ok_or_else(|| "Created Taan was not found".to_string())
    }

    pub fn update_taan(&self, id: &str, input: TaanInput) -> DbResult<TaanRow> {
        let now = now_timestamp();
        let starting_matra = input.starting_matra.unwrap_or(1);
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        let changed = connection
            .execute(
                "UPDATE taans
                  SET notation = ?2, text_note = ?3, starting_matra = ?4, updated_at = ?5
                  WHERE id = ?1",
                params![
                    id,
                    clean_optional(input.notation),
                    clean_optional(input.text_note),
                    starting_matra,
                    now
                ],
            )
            .map_err(|error| error.to_string())?;
        if changed == 0 {
            return Err("Taan not found".to_string());
        }
        drop(connection);
        self.get_taan(id)?
            .ok_or_else(|| "Updated Taan was not found".to_string())
    }

    pub fn delete_taan(&self, id: &str) -> DbResult<()> {
        self.delete_by_id("taans", id, "Taan")
    }

    fn list_taans(&self, parent_column: &str, parent_id: &str) -> DbResult<Vec<TaanRow>> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        let sql = format!(
            "SELECT id, notation, text_note, starting_matra, sargam_id, bandish_id, created_at, updated_at
             FROM taans
             WHERE {parent_column} = ?1
             ORDER BY updated_at DESC"
        );
        let mut statement = connection
            .prepare(&sql)
            .map_err(|error| error.to_string())?;
        let rows = statement
            .query_map(params![parent_id], row_to_taan)
            .map_err(|error| error.to_string())?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|error| error.to_string())
    }

    fn delete_by_id(&self, table: &str, id: &str, label: &str) -> DbResult<()> {
        let connection = self
            .connection
            .lock()
            .map_err(|_| "Database lock failed".to_string())?;
        let sql = format!("DELETE FROM {table} WHERE id = ?1");
        let changed = connection
            .execute(&sql, params![id])
            .map_err(|error| error.to_string())?;
        if changed == 0 {
            Err(format!("{label} not found"))
        } else {
            Ok(())
        }
    }
}

fn row_to_raag(row: &rusqlite::Row<'_>) -> rusqlite::Result<RaagRow> {
    Ok(RaagRow {
        id: row.get(0)?,
        name: row.get(1)?,
        thaat: row.get(2)?,
        aaroh: row.get(3)?,
        avroh: row.get(4)?,
        pakad: row.get(5)?,
        vadi: row.get(6)?,
        samvadi: row.get(7)?,
        komal_sur: row.get(8)?,
        tivra_sur: row.get(9)?,
        jati: row.get(10)?,
        notes: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

fn row_to_sargam(row: &rusqlite::Row<'_>) -> rusqlite::Result<SargamRow> {
    Ok(SargamRow {
        id: row.get(0)?,
        raag_id: row.get(1)?,
        title: row.get(2)?,
        taal: row.get(3)?,
        bpm: row.get(4)?,
        laya: row.get(5)?,
        asthayi: row.get(6)?,
        antara: row.get(7)?,
        notes: row.get(8)?,
        starting_beat: row.get(9)?,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
    })
}

fn row_to_bandish(row: &rusqlite::Row<'_>) -> rusqlite::Result<BandishRow> {
    Ok(BandishRow {
        id: row.get(0)?,
        raag_id: row.get(1)?,
        title: row.get(2)?,
        taal: row.get(3)?,
        bpm: row.get(4)?,
        laya: row.get(5)?,
        composer: row.get(6)?,
        lyrics: row.get(7)?,
        asthayi: row.get(8)?,
        antara: row.get(9)?,
        notes: row.get(10)?,
        starting_beat: row.get(11)?,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
    })
}

fn row_to_taan(row: &rusqlite::Row<'_>) -> rusqlite::Result<TaanRow> {
    Ok(TaanRow {
        id: row.get(0)?,
        notation: row.get(1)?,
        text_note: row.get(2)?,
        starting_matra: row.get(3)?,
        sargam_id: row.get(4)?,
        bandish_id: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_db() -> AppDb {
        AppDb::new_in_memory().expect("test database should initialize")
    }

    #[test]
    fn persists_full_hierarchy_and_cascades_children() {
        let db = test_db();

        let raag = db
            .create_raag(RaagInput {
                name: " Yaman ".to_string(),
                thaat: Some("Kalyan".to_string()),
                aaroh: None,
                avroh: None,
                pakad: None,
                vadi: None,
                samvadi: None,
                komal_sur: None,
                tivra_sur: None,
                jati: None,
                notes: Some("".to_string()),
            })
            .expect("raag should be created");

        assert_eq!(raag.name, "Yaman");
        assert_eq!(raag.notes, None);

        let sargam = db
            .create_sargam(
                &raag.id,
                SargamInput {
                    title: "Sargam 1".to_string(),
                    taal: Some("Teentaal".to_string()),
                    bpm: None,
                    laya: None,
                    asthayi: Some("S R G".to_string()),
                    antara: None,
                    notes: None,
                    starting_beat: Some(1),
                },
            )
            .expect("sargam should be created");

        let bandish = db
            .create_bandish(
                &raag.id,
                BandishInput {
                    title: "Bandish 1".to_string(),
                    taal: Some("Ektaal".to_string()),
                    bpm: None,
                    laya: Some("Madhya".to_string()),
                    composer: None,
                    lyrics: None,
                    asthayi: None,
                    antara: None,
                    notes: None,
                    starting_beat: Some(9),
                },
            )
            .expect("bandish should be created");

        let sargam_taan = db
            .create_taan(
                Some(&sargam.id),
                None,
                TaanInput {
                    notation: None,
                    text_note: None,
                    starting_matra: Some(1),
                },
            )
            .expect("sargam taan should be created");
        let bandish_taan = db
            .create_taan(
                None,
                Some(&bandish.id),
                TaanInput {
                    notation: None,
                    text_note: None,
                    starting_matra: Some(1),
                },
            )
            .expect("bandish taan should be created");

        assert_eq!(sargam_taan.sargam_id.as_deref(), Some(sargam.id.as_str()));
        assert_eq!(sargam_taan.bandish_id, None);
        assert_eq!(bandish_taan.sargam_id, None);
        assert_eq!(
            bandish_taan.bandish_id.as_deref(),
            Some(bandish.id.as_str())
        );
        assert_eq!(db.list_taans_by_sargam(&sargam.id).unwrap().len(), 1);
        assert_eq!(db.list_taans_by_bandish(&bandish.id).unwrap().len(), 1);

        db.delete_raag(&raag.id).expect("raag should delete");

        assert_eq!(db.get_sargam(&sargam.id).unwrap(), None);
        assert_eq!(db.get_bandish(&bandish.id).unwrap(), None);
        assert_eq!(db.get_taan(&sargam_taan.id).unwrap(), None);
        assert_eq!(db.get_taan(&bandish_taan.id).unwrap(), None);
    }

    #[test]
    fn taan_must_have_exactly_one_parent() {
        let db = test_db();
        let result = db.create_taan(
            None,
            None,
            TaanInput {
                notation: None,
                text_note: None,
                starting_matra: None,
            },
        );

        assert_eq!(
            result.unwrap_err(),
            "Taan must belong to exactly one parent"
        );
    }

    #[test]
    fn swar_export_import_roundtrip() {
        let db = test_db();

        // Create raag with full hierarchy
        let raag = db
            .create_raag(RaagInput {
                name: "Yaman".to_string(),
                thaat: Some("Kalyan".to_string()),
                aaroh: Some("S R G m P D N S'".to_string()),
                avroh: Some("S' N D P m G R S".to_string()),
                pakad: Some("N R G R S".to_string()),
                vadi: Some("Ga".to_string()),
                samvadi: Some("Ni".to_string()),
                komal_sur: None,
                tivra_sur: Some("Ma".to_string()),
                jati: Some("Sampurna-Sampurna".to_string()),
                notes: Some("Evening raag".to_string()),
            })
            .expect("raag should be created");

        let sargam = db
            .create_sargam(
                &raag.id,
                SargamInput {
                    title: "Sargam 1".to_string(),
                    taal: Some("Teentaal".to_string()),
                    bpm: None,
                    laya: None,
                    asthayi: Some("S R G m|P D N S'".to_string()),
                    antara: None,
                    notes: Some("Sargam notes".to_string()),
                    starting_beat: Some(1),
                },
            )
            .expect("sargam should be created");

        db.create_taan(
            Some(&sargam.id),
            None,
            TaanInput {
                notation: Some("S R G|m P D".to_string()),
                text_note: None,
                starting_matra: Some(1),
            },
        )
        .expect("sargam taan should be created");

        let bandish = db
            .create_bandish(
                &raag.id,
                BandishInput {
                    title: "Bandish 1".to_string(),
                    taal: Some("Jhaptaal".to_string()),
                    bpm: None,
                    laya: Some("Madhya".to_string()),
                    composer: Some("Traditional".to_string()),
                    lyrics: Some("Kali teri...".to_string()),
                    asthayi: Some("S R G|m P D".to_string()),
                    antara: None,
                    notes: Some("Bandish notes".to_string()),
                    starting_beat: Some(9),
                },
            )
            .expect("bandish should be created");

        db.create_taan(
            None,
            Some(&bandish.id),
            TaanInput {
                notation: Some("S' N D|P m G".to_string()),
                text_note: None,
                starting_matra: Some(1),
            },
        )
        .expect("bandish taan should be created");

        // Export: manually build JSON (mimicking export_raag_swar command)
        let export_json = serde_json::json!({
            "format": "swar-1.0",
            "raags": [{
                "name": raag.name,
                "thaat": raag.thaat,
                "aaroh": raag.aaroh,
                "avroh": raag.avroh,
                "pakad": raag.pakad,
                "vadi": raag.vadi,
                "samvadi": raag.samvadi,
                "komalSur": raag.komal_sur,
                "tivraSur": raag.tivra_sur,
                "jati": raag.jati,
                "notes": raag.notes,
                        "sargams": [{
                            "title": sargam.title,
                            "taal": sargam.taal,
                            "asthayi": sargam.asthayi,
                            "antara": sargam.antara,
                            "notes": sargam.notes,
                            "startingBeat": sargam.starting_beat,
                    "taans": [{
                        "notation": "S R G|m P D",
                        "startingMatra": 1
                    }]
                }],
                        "bandishes": [{
                            "title": bandish.title,
                            "taal": bandish.taal,
                            "laya": bandish.laya,
                            "composer": bandish.composer,
                            "lyrics": bandish.lyrics,
                            "asthayi": bandish.asthayi,
                            "antara": bandish.antara,
                            "notes": bandish.notes,
                            "startingBeat": bandish.starting_beat,
                    "taans": [{
                        "notation": "S' N D|P m G",
                        "startingMatra": 1
                    }]
                }]
            }]
        });

        let json_str = serde_json::to_string(&export_json).unwrap();

        // Import: into a fresh database
        let db2 = test_db();

        let parsed: serde_json::Value = serde_json::from_str(&json_str).unwrap();
        let raags = parsed["raags"].as_array().unwrap();

        for r in raags {
                let imported_raag = db2
                    .create_raag(RaagInput {
                        name: r["name"].as_str().unwrap().to_string(),
                        thaat: r["thaat"].as_str().map(|s| s.to_string()),
                        aaroh: r["aaroh"].as_str().map(|s| s.to_string()),
                        avroh: r["avroh"].as_str().map(|s| s.to_string()),
                        pakad: r["pakad"].as_str().map(|s| s.to_string()),
                        vadi: r["vadi"].as_str().map(|s| s.to_string()),
                        samvadi: r["samvadi"].as_str().map(|s| s.to_string()),
                        komal_sur: r["komalSur"].as_str().map(|s| s.to_string()),
                        tivra_sur: r["tivraSur"].as_str().map(|s| s.to_string()),
                        jati: r["jati"].as_str().map(|s| s.to_string()),
                        notes: r["notes"].as_str().map(|s| s.to_string()),
                    })
                    .unwrap();

            // Verify raag
            assert_eq!(imported_raag.name, "Yaman");
            assert_eq!(imported_raag.thaat.as_deref(), Some("Kalyan"));
            assert_eq!(imported_raag.aaroh.as_deref(), Some("S R G m P D N S'"));
            assert_eq!(imported_raag.avroh.as_deref(), Some("S' N D P m G R S"));
            assert_eq!(imported_raag.pakad.as_deref(), Some("N R G R S"));
            assert_eq!(imported_raag.notes.as_deref(), Some("Evening raag"));
            assert_eq!(imported_raag.vadi.as_deref(), Some("Ga"));
            assert_eq!(imported_raag.samvadi.as_deref(), Some("Ni"));
            assert_eq!(imported_raag.komal_sur, None);
            assert_eq!(imported_raag.tivra_sur.as_deref(), Some("Ma"));
            assert_eq!(imported_raag.jati.as_deref(), Some("Sampurna-Sampurna"));

            // Import sargams
            for s in r["sargams"].as_array().unwrap() {
                let imported_sargam = db2
                    .create_sargam(
                        &imported_raag.id,
                        SargamInput {
                            title: s["title"].as_str().unwrap().to_string(),
                            taal: s["taal"].as_str().map(|v| v.to_string()),
                            bpm: s["bpm"].as_i64(),
                            laya: s["laya"].as_str().map(|v| v.to_string()),
                            asthayi: s["asthayi"].as_str().map(|v| v.to_string()),
                            antara: s["antara"].as_str().map(|v| v.to_string()),
                            notes: s["notes"].as_str().map(|v| v.to_string()),
                            starting_beat: Some(s["startingBeat"].as_i64().unwrap_or(1)),
                        },
                    )
                    .unwrap();

                assert_eq!(imported_sargam.title, "Sargam 1");
                assert_eq!(imported_sargam.taal.as_deref(), Some("Teentaal"));
                assert_eq!(
                    imported_sargam.asthayi.as_deref(),
                    Some("S R G m|P D N S'")
                );
                assert_eq!(imported_sargam.antara, None);
                assert_eq!(imported_sargam.notes.as_deref(), Some("Sargam notes"));
                assert_eq!(imported_sargam.starting_beat, 1);

                // Import sargam taans
                for t in s["taans"].as_array().unwrap() {
                    let imported_taan = db2
                        .create_taan(
                            Some(&imported_sargam.id),
                            None,
                            TaanInput {
                                notation: t["notation"].as_str().map(|v| v.to_string()),
                                text_note: t["startingMatra"].as_str().and_then(|_| None),
                                starting_matra: Some(t["startingMatra"].as_i64().unwrap_or(1)),
                            },
                        )
                        .unwrap();

                    assert_eq!(imported_taan.notation.as_deref(), Some("S R G|m P D"));
                    assert_eq!(
                        imported_taan.sargam_id.as_deref(),
                        Some(imported_sargam.id.as_str())
                    );
                }
            }

            // Import bandishes
            for b in r["bandishes"].as_array().unwrap() {
                let imported_bandish = db2
                    .create_bandish(
                        &imported_raag.id,
                        BandishInput {
                            title: b["title"].as_str().unwrap().to_string(),
                            taal: b["taal"].as_str().map(|v| v.to_string()),
                            bpm: b["bpm"].as_i64(),
                            laya: b["laya"].as_str().map(|v| v.to_string()),
                            composer: b["composer"].as_str().map(|v| v.to_string()),
                            lyrics: b["lyrics"].as_str().map(|v| v.to_string()),
                            asthayi: b["asthayi"].as_str().map(|v| v.to_string()),
                            antara: b["antara"].as_str().map(|v| v.to_string()),
                            notes: b["notes"].as_str().map(|v| v.to_string()),
                            starting_beat: Some(b["startingBeat"].as_i64().unwrap_or(1)),
                        },
                    )
                    .unwrap();

                assert_eq!(imported_bandish.title, "Bandish 1");
                assert_eq!(imported_bandish.taal.as_deref(), Some("Jhaptaal"));
                assert_eq!(imported_bandish.laya.as_deref(), Some("Madhya"));
                assert_eq!(imported_bandish.composer.as_deref(), Some("Traditional"));
                assert_eq!(imported_bandish.lyrics.as_deref(), Some("Kali teri..."));
                assert_eq!(imported_bandish.asthayi.as_deref(), Some("S R G|m P D"));
                assert_eq!(imported_bandish.antara, None);
                assert_eq!(imported_bandish.notes.as_deref(), Some("Bandish notes"));
                assert_eq!(imported_bandish.starting_beat, 9);

                // Import bandish taans
                for t in b["taans"].as_array().unwrap() {
                    let imported_taan = db2
                        .create_taan(
                            None,
                            Some(&imported_bandish.id),
                            TaanInput {
                                notation: t["notation"].as_str().map(|v| v.to_string()),
                                text_note: t["startingMatra"].as_str().and_then(|_| None),
                                starting_matra: Some(t["startingMatra"].as_i64().unwrap_or(1)),
                            },
                        )
                        .unwrap();

                    assert_eq!(imported_taan.notation.as_deref(), Some("S' N D|P m G"));
                    assert_eq!(
                        imported_taan.bandish_id.as_deref(),
                        Some(imported_bandish.id.as_str())
                    );
                }
            }
        }
    }
}
