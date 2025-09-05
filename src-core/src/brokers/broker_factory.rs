use std::sync::Arc;

use crate::accounts::accounts_model::Account;
use crate::errors::Error;
use crate::secrets::SecretManager;

use super::broker_provider::BrokerProvider;

pub struct BrokerProviderFactory;

impl BrokerProviderFactory {
    pub async fn from_platform(account: &Account) -> Result<Arc<dyn BrokerProvider + Send + Sync>, Error> {
        let platform_id = account.platform_id.clone().ok_or_else(|| Error::Validation(crate::errors::ValidationError::InvalidInput("Account has no linked platform".into())))?;
        let secret_key = format!("platform_{}", platform_id);
        let secrets_json = SecretManager::get_secret(&secret_key)
            .map_err(|e| Error::Validation(crate::errors::ValidationError::InvalidInput(format!("Failed to read secrets: {}", e))))?;

        if secrets_json.is_none() {
            return Err(Error::Validation(crate::errors::ValidationError::InvalidInput("Missing platform secrets".into())));
        }

        // Placeholder until concrete providers added; return NotFound-like error for unknown
        Err(Error::Validation(crate::errors::ValidationError::InvalidInput(format!(
            "No broker provider registered for platform {}",
            platform_id
        ))))
    }
}


