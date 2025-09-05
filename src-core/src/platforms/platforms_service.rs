use std::sync::Arc;

use crate::errors::Result;
use crate::secrets::SecretManager;

use super::platforms_model::PlatformSetting;
use super::platforms_repository::PlatformsRepository;
use super::platforms_traits::PlatformsServiceTrait;

pub struct PlatformsService {
    repo: Arc<PlatformsRepository>,
}

impl PlatformsService {
    pub fn new(repo: Arc<PlatformsRepository>) -> Self {
        Self { repo }
    }
}

#[async_trait::async_trait]
impl PlatformsServiceTrait for PlatformsService {
    fn list(&self) -> Result<Vec<PlatformSetting>> {
        self.repo.list()
    }

    async fn set_enabled(&self, platform_id: &str, enabled: bool) -> Result<PlatformSetting> {
        self.repo.update_enabled(platform_id, enabled).await
    }

    fn has_secrets(&self, platform_id: &str) -> Result<bool> {
        let key = format!("platform_{}", platform_id);
        Ok(SecretManager::get_secret(&key)?.map(|s| !s.is_empty()).unwrap_or(false))
    }

    fn set_secrets_json(&self, platform_id: &str, secrets_json: &str) -> Result<()> {
        let key = format!("platform_{}", platform_id);
        SecretManager::set_secret(&key, secrets_json)
    }
}


