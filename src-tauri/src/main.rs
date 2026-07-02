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
    vadi: Option<String>,
    samvadi: Option<String>,
    komal_sur: Option<String>,
    tivra_sur: Option<String>,
    jati: Option<String>,
    notes: Option<String>,
    sargams: Vec<SwarSargam>,
    bandishes: Vec<SwarBandish>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SwarSargam {
    title: String,
    taal: Option<String>,
    asthayi: Option<String>,
    antara: Option<String>,
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
    asthayi: Option<String>,
    antara: Option<String>,
    notes: Option<String>,
    starting_beat: i64,
    taans: Vec<SwarTaan>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SwarTaan {
    notation: Option<String>,
    starting_matra: i64,
    text_note: Option<String>,
}

fn taan_to_swar_taan(taan: &TaanRow) -> SwarTaan {
    SwarTaan {
        notation: taan.notation.clone(),
        starting_matra: taan.starting_matra,
        text_note: taan.text_note.clone(),
    }
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
                asthayi: s.asthayi.clone(),
                antara: s.antara.clone(),
                notes: s.notes.clone(),
                starting_beat: s.starting_beat,
                taans: taans
                    .iter()
                    .map(taan_to_swar_taan)
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
                asthayi: b.asthayi.clone(),
                antara: b.antara.clone(),
                notes: b.notes.clone(),
                starting_beat: b.starting_beat,
                taans: taans
                    .iter()
                    .map(taan_to_swar_taan)
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
            vadi: raag.vadi,
            samvadi: raag.samvadi,
            komal_sur: raag.komal_sur,
            tivra_sur: raag.tivra_sur,
            jati: raag.jati,
            notes: raag.notes,
            sargams: swar_sargams,
            bandishes: swar_bandishes,
        }],
    };

    serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_sargam_swar(sargam_id: String, db: State<'_, AppDb>) -> Result<String, String> {
    let sargam = db.get_sargam(&sargam_id)?.ok_or("Sargam not found")?;
    let raag = db.get_raag(&sargam.raag_id)?.ok_or("Raag not found")?;
    let taans = db.list_taans_by_sargam(&sargam_id)?;

    let swar_sargam = SwarSargam {
        title: sargam.title,
        taal: sargam.taal,
        asthayi: sargam.asthayi,
        antara: sargam.antara,
        notes: sargam.notes,
        starting_beat: sargam.starting_beat,
        taans: taans.iter().map(taan_to_swar_taan).collect(),
    };

    let export = SwarExport {
        format: "swar-1.0".to_string(),
        raags: vec![SwarRaag {
            name: raag.name,
            thaat: raag.thaat,
            aaroh: raag.aaroh,
            avroh: raag.avroh,
            pakad: raag.pakad,
            vadi: raag.vadi,
            samvadi: raag.samvadi,
            komal_sur: raag.komal_sur,
            tivra_sur: raag.tivra_sur,
            jati: raag.jati,
            notes: raag.notes,
            sargams: vec![swar_sargam],
            bandishes: vec![],
        }],
    };

    serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_bandish_swar(bandish_id: String, db: State<'_, AppDb>) -> Result<String, String> {
    let bandish = db.get_bandish(&bandish_id)?.ok_or("Bandish not found")?;
    let raag = db.get_raag(&bandish.raag_id)?.ok_or("Raag not found")?;
    let taans = db.list_taans_by_bandish(&bandish_id)?;

    let swar_bandish = SwarBandish {
        title: bandish.title,
        taal: bandish.taal,
        laya: bandish.laya,
        composer: bandish.composer,
        lyrics: bandish.lyrics,
        asthayi: bandish.asthayi,
        antara: bandish.antara,
        notes: bandish.notes,
        starting_beat: bandish.starting_beat,
        taans: taans.iter().map(taan_to_swar_taan).collect(),
    };

    let export = SwarExport {
        format: "swar-1.0".to_string(),
        raags: vec![SwarRaag {
            name: raag.name,
            thaat: raag.thaat,
            aaroh: raag.aaroh,
            avroh: raag.avroh,
            pakad: raag.pakad,
            vadi: raag.vadi,
            samvadi: raag.samvadi,
            komal_sur: raag.komal_sur,
            tivra_sur: raag.tivra_sur,
            jati: raag.jati,
            notes: raag.notes,
            sargams: vec![],
            bandishes: vec![swar_bandish],
        }],
    };

    serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_taan_swar(taan_id: String, db: State<'_, AppDb>) -> Result<String, String> {
    let taan = db.get_taan(&taan_id)?.ok_or("Taan not found")?;

    let (raag_id, swar_sargams, swar_bandishes) = if let Some(sargam_id) = taan.sargam_id.as_ref() {
        let sargam = db.get_sargam(sargam_id)?.ok_or("Sargam not found")?;
        let taans = db.list_taans_by_sargam(sargam_id)?;
        let swar_sargam = SwarSargam {
            title: sargam.title,
            taal: sargam.taal,
            asthayi: sargam.asthayi,
            antara: sargam.antara,
            notes: sargam.notes,
            starting_beat: sargam.starting_beat,
            taans: taans.iter().map(taan_to_swar_taan).collect(),
        };
        (sargam.raag_id, vec![swar_sargam], vec![])
    } else if let Some(bandish_id) = taan.bandish_id.as_ref() {
        let bandish = db.get_bandish(bandish_id)?.ok_or("Bandish not found")?;
        let taans = db.list_taans_by_bandish(bandish_id)?;
        let swar_bandish = SwarBandish {
            title: bandish.title,
            taal: bandish.taal,
            laya: bandish.laya,
            composer: bandish.composer,
            lyrics: bandish.lyrics,
            asthayi: bandish.asthayi,
            antara: bandish.antara,
            notes: bandish.notes,
            starting_beat: bandish.starting_beat,
            taans: taans.iter().map(taan_to_swar_taan).collect(),
        };
        (bandish.raag_id, vec![], vec![swar_bandish])
    } else {
        return Err("Taan must have a parent".to_string());
    };

    let raag = db.get_raag(&raag_id)?.ok_or("Raag not found")?;
    let export = SwarExport {
        format: "swar-1.0".to_string(),
        raags: vec![SwarRaag {
            name: raag.name,
            thaat: raag.thaat,
            aaroh: raag.aaroh,
            avroh: raag.avroh,
            pakad: raag.pakad,
            vadi: raag.vadi,
            samvadi: raag.samvadi,
            komal_sur: raag.komal_sur,
            tivra_sur: raag.tivra_sur,
            jati: raag.jati,
            notes: raag.notes,
            sargams: swar_sargams,
            bandishes: swar_bandishes,
        }],
    };

    serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
}

#[tauri::command]
fn export_library_swar(db: State<'_, AppDb>) -> Result<String, String> {
    let raags = db.list_raags()?;

    let swar_raags: Vec<SwarRaag> = raags
        .iter()
        .map(|raag| {
            let sargams = db.list_sargams_by_raag(&raag.id).unwrap_or_default();
            let bandishes = db.list_bandishes_by_raag(&raag.id).unwrap_or_default();

            let swar_sargams: Vec<SwarSargam> = sargams
                .iter()
                .map(|s| {
                    let taans = db.list_taans_by_sargam(&s.id).unwrap_or_default();
                    SwarSargam {
                        title: s.title.clone(),
                        taal: s.taal.clone(),
                        asthayi: s.asthayi.clone(),
                        antara: s.antara.clone(),
                        notes: s.notes.clone(),
                        starting_beat: s.starting_beat,
                        taans: taans.iter().map(taan_to_swar_taan).collect(),
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
                        asthayi: b.asthayi.clone(),
                        antara: b.antara.clone(),
                        notes: b.notes.clone(),
                        starting_beat: b.starting_beat,
                        taans: taans.iter().map(taan_to_swar_taan).collect(),
                    }
                })
                .collect();

            SwarRaag {
                name: raag.name.clone(),
                thaat: raag.thaat.clone(),
                aaroh: raag.aaroh.clone(),
                avroh: raag.avroh.clone(),
                pakad: raag.pakad.clone(),
                vadi: raag.vadi.clone(),
                samvadi: raag.samvadi.clone(),
                komal_sur: raag.komal_sur.clone(),
                tivra_sur: raag.tivra_sur.clone(),
                jati: raag.jati.clone(),
                notes: raag.notes.clone(),
                sargams: swar_sargams,
                bandishes: swar_bandishes,
            }
        })
        .collect();

    let export = SwarExport {
        format: "swar-1.0".to_string(),
        raags: swar_raags,
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
    vadi: Option<String>,
    samvadi: Option<String>,
    komal_sur: Option<String>,
    tivra_sur: Option<String>,
    jati: Option<String>,
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
    bpm: Option<i64>,
    laya: Option<String>,
    asthayi: Option<String>,
    antara: Option<String>,
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
    bpm: Option<i64>,
    laya: Option<String>,
    composer: Option<String>,
    lyrics: Option<String>,
    asthayi: Option<String>,
    antara: Option<String>,
    notes: Option<String>,
    #[serde(default = "default_starting_beat")]
    starting_beat: i64,
    #[serde(default)]
    taans: Vec<SwarTaanInput>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SwarTaanInput {
    notation: Option<String>,
    #[serde(default)]
    starting_matra: i64,
    #[serde(default)]
    text_note: Option<String>,
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
    let file: SwarFile =
        serde_json::from_str(&json).map_err(|e| format!("Invalid SWAR file: {e}"))?;
    let mut created_raags = Vec::new();

    for raag_input in file.raags {
        let raag = db.create_raag(RaagInput {
            name: raag_input.name,
            thaat: raag_input.thaat,
            aaroh: raag_input.aaroh,
            avroh: raag_input.avroh,
            pakad: raag_input.pakad,
            vadi: raag_input.vadi,
            samvadi: raag_input.samvadi,
            komal_sur: raag_input.komal_sur,
            tivra_sur: raag_input.tivra_sur,
            jati: raag_input.jati,
            notes: raag_input.notes,
        })?;

        for s in raag_input.sargams {
            let sargam = db.create_sargam(
                &raag.id,
                SargamInput {
                    title: s.title,
                    taal: s.taal,
                    bpm: s.bpm,
                    laya: s.laya,
                    asthayi: s.asthayi,
                    antara: s.antara,
                    notes: s.notes,
                    starting_beat: Some(s.starting_beat),
                },
            )?;

            for t in s.taans {
                db.create_taan(
                    Some(&sargam.id),
                    None,
                    TaanInput {
                        notation: t.notation,
                        text_note: t.text_note,
                        starting_matra: Some(t.starting_matra),
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
                    bpm: b.bpm,
                    laya: b.laya,
                    composer: b.composer,
                    lyrics: b.lyrics,
                    asthayi: b.asthayi,
                    antara: b.antara,
                    notes: b.notes,
                    starting_beat: Some(b.starting_beat),
                },
            )?;

            for t in b.taans {
                db.create_taan(
                    None,
                    Some(&bandish.id),
                    TaanInput {
                        notation: t.notation,
                        text_note: t.text_note,
                        starting_matra: Some(t.starting_matra),
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
            export_sargam_swar,
            export_bandish_swar,
            export_taan_swar,
            export_library_swar,
            import_swar,
            save_file,
            read_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
