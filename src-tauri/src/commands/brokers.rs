use std::sync::Arc;
use tauri::State;
use wealthfolio_core::platforms::platforms_traits::PlatformsServiceTrait;

use crate::context::ServiceContext;

use super::error::CommandResult;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BrokerPlatformSetting {
    pub id: String,
    pub name: Option<String>,
    pub url: String,
    pub enabled: bool,
    pub has_secrets: bool,
}

#[tauri::command]
pub async fn get_broker_platform_settings(
    context: State<'_, Arc<ServiceContext>>,
) -> CommandResult<Vec<BrokerPlatformSetting>> {
    let platforms = context.platforms_service.list()?;
    let result = platforms
        .into_iter()
        .map(|p| BrokerPlatformSetting {
            has_secrets: context.platforms_service.has_secrets(&p.id)?,
            id: p.id,
            name: p.name,
            url: p.url,
            enabled: p.enabled,
        })
        .collect();
    Ok(result)
}

#[tauri::command]
pub async fn update_broker_platform_settings(
    context: State<'_, Arc<ServiceContext>>,
    platform_id: String,
    enabled: bool,
) -> CommandResult<BrokerPlatformSetting> {
    let updated = context.platforms_service.set_enabled(&platform_id, enabled).await?;
    let dto = BrokerPlatformSetting {
        has_secrets: context.platforms_service.has_secrets(&platform_id)?,
        id: updated.id,
        name: updated.name,
        url: updated.url,
        enabled: updated.enabled,
    };
    Ok(dto)
}

#[tauri::command]
pub async fn platform_set_secrets(
    context: State<'_, Arc<ServiceContext>>,
    platform_id: String,
    secrets_json: String,
) -> CommandResult<()> {
    // Do not return or log api secrets
    context.platforms_service.set_secrets_json(&platform_id, &secrets_json)?;
    Ok(())
}

#[tauri::command]
pub async fn platform_has_secrets(
    context: State<'_, Arc<ServiceContext>>,
    platform_id: String,
) -> CommandResult<bool> {
    Ok(context.platforms_service.has_secrets(&platform_id)?)
}


