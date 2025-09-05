use async_trait::async_trait;

use crate::errors::Result;

use super::platforms_model::PlatformSetting;

#[async_trait]
pub trait PlatformsServiceTrait: Send + Sync {
    fn list(&self) -> Result<Vec<PlatformSetting>>;
    async fn set_enabled(&self, platform_id: &str, enabled: bool) -> Result<PlatformSetting>;
    fn has_secrets(&self, platform_id: &str) -> Result<bool>;
    fn set_secrets_json(&self, platform_id: &str, secrets_json: &str) -> Result<()>;
}


