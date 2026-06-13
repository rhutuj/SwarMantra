#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod db;

use db::{
    AppDb, BandishInput, BandishRow, RaagInput, RaagRow, SargamInput, SargamRow, TaanInput, TaanRow,
};
use serde::Serialize;
use tauri::{Manager, State};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SwarExport {
    format: String,
    raags: Vec<SwarRaag>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SwarRaag {
    name: String,
    thaat: Option<String>,
    aaroh: Option<String>,
    avroh: Option<String>,
    pakad: Option<String>,
    notes: Option<String>,
    sargams: Vec<SwarSargam>,
    bandishes: Vec<SwarBandish>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SwarSargam {
    title: String,
    taal: Option<String>,
    notation: Option<String>,
    notes: Option<String>,
    starting_beat: i64,
    taans: Vec<SwarTaan>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SwarBandish {
    title: String,
    taal: Option<String>,
    laya: Option<String>,
    composer: Option<String>,
    lyrics: Option<String>,
    notation: Option<String>,
    notes: Option<String>,
    starting_beat: i64,
    taans: Vec<SwarTaan>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SwarTaan {
    title: String,
    notation: Option<String>,
    notes: Option<String>,
    order: i64,
    starting_beat: i64,
}

#[tauri::command]
fn export_raag_swar(raag_id: String, db: State<'_, AppDb>) -> Result<String, String> {
    let raag = db.get_raag(&raag_id)?.ok_or("Raag not found")?;
    let sargams = db.list_sargams_by_raag(&raag_id)?;
    let bandishes = db.list_bandishes_by_raag(&raag_id)?;

    let swar_sargams: Vec<SwarSargam> = sargams
        .iter()
        .map(|s| {
            let taans = db.list_taans_by_sargam(&s.id).unwrap_or_default();
            SwarSargam {
                title: s.title.clone(),
                taal: s.taal.clone(),
                notation: s.notation.clone(),
                notes: s.notes.clone(),
                starting_beat: s.starting_beat,
                taans: taans
                    .iter()
                    .map(|t| SwarTaan {
                        title: t.title.clone(),
                        notation: t.notation.clone(),
                        notes: t.notes.clone(),
                        order: t.order,
                        starting_beat: t.starting_beat,
                    })
                    .collect(),
            }
        })
        .collect();

    let swar_bandishes: Vec<SwarBandish> = bandishes
        .iter()
        .map(|b| {
            let taans = db.list_taans_by_bandish(&b.id).unwrap_or_default();
            SwarBandish {
                title: b.title.clone(),
                taal: b.taal.clone(),
                laya: b.laya.clone(),
                composer: b.composer.clone(),
                lyrics: b.lyrics.clone(),
                notation: b.notation.clone(),
                notes: b.notes.clone(),
                starting_beat: b.starting_beat,
                taans: taans
                    .iter()
                    .map(|t| SwarTaan {
                        title: t.title.clone(),
                        notation: t.notation.clone(),
                        notes: t.notes.clone(),
                        order: t.order,
                        starting_beat: t.starting_beat,
                    })
                    .collect(),
            }
        })
        .collect();

    let export = SwarExport {
        format: "swar-1.0".to_string(),
        raags: vec![SwarRaag {
            name: raag.name,
            thaat: raag.thaat,
            aaroh: raag.aaroh,
            avroh: raag.avroh,
            pakad: raag.pakad,
            notes: raag.notes,
            sargams: swar_sargams,
            bandishes: swar_bandishes,
        }],
    };

    serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SwarFile {
    #[serde(default)]
    #[allow(dead_code)]
    format: String,
    raags: Vec<SwarRaagInput>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SwarRaagInput {
    name: String,
    thaat: Option<String>,
    aaroh: Option<String>,
    avroh: Option<String>,
    pakad: Option<String>,
    notes: Option<String>,
    #[serde(default)]
    sargams: Vec<SwarSargamInput>,
    #[serde(default)]
    bandishes: Vec<SwarBandishInput>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SwarSargamInput {
    title: String,
    taal: Option<String>,
    notation: Option<String>,
    notes: Option<String>,
    #[serde(default = "default_starting_beat")]
    starting_beat: i64,
    #[serde(default)]
    taans: Vec<SwarTaanInput>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SwarBandishInput {
    title: String,
    taal: Option<String>,
    laya: Option<String>,
    composer: Option<String>,
    lyrics: Option<String>,
    notation: Option<String>,
    notes: Option<String>,
    #[serde(default = "default_starting_beat")]
    starting_beat: i64,
    #[serde(default)]
    taans: Vec<SwarTaanInput>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SwarTaanInput {
    title: String,
    notation: Option<String>,
    notes: Option<String>,
    #[serde(default)]
    order: i64,
    #[serde(default = "default_starting_beat")]
    starting_beat: i64,
}

fn default_starting_beat() -> i64 {
    1
}

#[tauri::command]
fn save_file(path: String, content: Vec<u8>) -> Result<(), String> {
    std::fs::write(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn import_swar(json: String, db: State<'_, AppDb>) -> Result<Vec<RaagRow>, String> {
    let file: SwarFile = serde_json::from_str(&json).map_err(|e| format!("Invalid SWAR file: {e}"))?;
    let mut created_raags = Vec::new();

    for raag_input in file.raags {
        let raag = db.create_raag(RaagInput {
            name: raag_input.name,
            thaat: raag_input.thaat,
            aaroh: raag_input.aaroh,
            avroh: raag_input.avroh,
            pakad: raag_input.pakad,
            notes: raag_input.notes,
        })?;

        for s in raag_input.sargams {
            let sargam = db.create_sargam(
                &raag.id,
                SargamInput {
                    title: s.title,
                    taal: s.taal,
                    notation: s.notation,
                    notes: s.notes,
                    starting_beat: Some(s.starting_beat),
                },
            )?;

            for t in s.taans {
                db.create_taan(
                    Some(&sargam.id),
                    None,
                    TaanInput {
                        title: t.title,
                        notation: t.notation,
                        notes: t.notes,
                        order: Some(t.order),
                        starting_beat: Some(t.starting_beat),
                    },
                )?;
            }
        }

        for b in raag_input.bandishes {
            let bandish = db.create_bandish(
                &raag.id,
                BandishInput {
                    title: b.title,
                    taal: b.taal,
                    laya: b.laya,
                    composer: b.composer,
                    lyrics: b.lyrics,
                    notation: b.notation,
                    notes: b.notes,
                    starting_beat: Some(b.starting_beat),
                },
            )?;

            for t in b.taans {
                db.create_taan(
                    None,
                    Some(&bandish.id),
                    TaanInput {
                        title: t.title,
                        notation: t.notation,
                        notes: t.notes,
                        order: Some(t.order),
                        starting_beat: Some(t.starting_beat),
                    },
                )?;
            }
        }

        created_raags.push(raag);
    }

    Ok(created_raags)
}

#[tauri::command]
fn list_raags(db: State<'_, AppDb>) -> Result<Vec<RaagRow>, String> {
    db.list_raags()
}

#[tauri::command]
fn get_raag(id: String, db: State<'_, AppDb>) -> Result<Option<RaagRow>, String> {
    db.get_raag(&id)
}

#[tauri::command]
fn create_raag(input: RaagInput, db: State<'_, AppDb>) -> Result<RaagRow, String> {
    db.create_raag(input)
}

#[tauri::command]
fn update_raag(id: String, input: RaagInput, db: State<'_, AppDb>) -> Result<RaagRow, String> {
    db.update_raag(&id, input)
}

#[tauri::command]
fn delete_raag(id: String, db: State<'_, AppDb>) -> Result<(), String> {
    db.delete_raag(&id)
}

#[tauri::command]
fn list_sargams_by_raag(raag_id: String, db: State<'_, AppDb>) -> Result<Vec<SargamRow>, String> {
    db.list_sargams_by_raag(&raag_id)
}

#[tauri::command]
fn get_sargam(id: String, db: State<'_, AppDb>) -> Result<Option<SargamRow>, String> {
    db.get_sargam(&id)
}

#[tauri::command]
fn create_sargam(
    raag_id: String,
    input: SargamInput,
    db: State<'_, AppDb>,
) -> Result<SargamRow, String> {
    db.create_sargam(&raag_id, input)
}

#[tauri::command]
fn update_sargam(
    id: String,
    input: SargamInput,
    db: State<'_, AppDb>,
) -> Result<SargamRow, String> {
    db.update_sargam(&id, input)
}

#[tauri::command]
fn delete_sargam(id: String, db: State<'_, AppDb>) -> Result<(), String> {
    db.delete_sargam(&id)
}

#[tauri::command]
fn list_bandishes_by_raag(
    raag_id: String,
    db: State<'_, AppDb>,
) -> Result<Vec<BandishRow>, String> {
    db.list_bandishes_by_raag(&raag_id)
}

#[tauri::command]
fn get_bandish(id: String, db: State<'_, AppDb>) -> Result<Option<BandishRow>, String> {
    db.get_bandish(&id)
}

#[tauri::command]
fn create_bandish(
    raag_id: String,
    input: BandishInput,
    db: State<'_, AppDb>,
) -> Result<BandishRow, String> {
    db.create_bandish(&raag_id, input)
}

#[tauri::command]
fn update_bandish(
    id: String,
    input: BandishInput,
    db: State<'_, AppDb>,
) -> Result<BandishRow, String> {
    db.update_bandish(&id, input)
}

#[tauri::command]
fn delete_bandish(id: String, db: State<'_, AppDb>) -> Result<(), String> {
    db.delete_bandish(&id)
}

#[tauri::command]
fn list_taans_by_sargam(sargam_id: String, db: State<'_, AppDb>) -> Result<Vec<TaanRow>, String> {
    db.list_taans_by_sargam(&sargam_id)
}

#[tauri::command]
fn list_taans_by_bandish(bandish_id: String, db: State<'_, AppDb>) -> Result<Vec<TaanRow>, String> {
    db.list_taans_by_bandish(&bandish_id)
}

#[tauri::command]
fn get_taan(id: String, db: State<'_, AppDb>) -> Result<Option<TaanRow>, String> {
    db.get_taan(&id)
}

#[tauri::command]
fn create_taan(
    sargam_id: Option<String>,
    bandish_id: Option<String>,
    input: TaanInput,
    db: State<'_, AppDb>,
) -> Result<TaanRow, String> {
    db.create_taan(sargam_id.as_deref(), bandish_id.as_deref(), input)
}

#[tauri::command]
fn update_taan(id: String, input: TaanInput, db: State<'_, AppDb>) -> Result<TaanRow, String> {
    db.update_taan(&id, input)
}

#[tauri::command]
fn delete_taan(id: String, db: State<'_, AppDb>) -> Result<(), String> {
    db.delete_taan(&id)
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|error| error.to_string())?;
            std::fs::create_dir_all(&app_data_dir).map_err(|error| error.to_string())?;
            let db_path = app_data_dir.join("swar-notebook.sqlite");
            let db = AppDb::new(&db_path)?;
            app.manage(db);
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_raags,
            get_raag,
            create_raag,
            update_raag,
            delete_raag,
            list_sargams_by_raag,
            get_sargam,
            create_sargam,
            update_sargam,
            delete_sargam,
            list_bandishes_by_raag,
            get_bandish,
            create_bandish,
            update_bandish,
            delete_bandish,
            list_taans_by_sargam,
            list_taans_by_bandish,
            get_taan,
            create_taan,
            update_taan,
            delete_taan,
            export_raag_swar,
            import_swar,
            save_file,
            read_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
