use async_trait::async_trait;
use diesel::prelude::*;
use rust_decimal::Decimal;

use crate::activities::activities_model::NewActivity;

#[derive(Debug, Clone)]
pub struct ExternalActivity {
    pub symbol: String,
    pub activity_type: String,
    pub date: String, // ISO 8601
    pub quantity: Option<Decimal>,
    pub unit_price: Option<Decimal>,
    pub currency: String,
    pub fee: Option<Decimal>,
    pub amount: Option<Decimal>,
    pub comment: Option<String>,
}

impl ExternalActivity {
    pub fn to_new_activity(&self, account_id: &str, asset_id: &str) -> NewActivity {
        NewActivity {
            id: None,
            account_id: account_id.to_string(),
            asset_id: asset_id.to_string(),
            activity_type: self.activity_type.clone(),
            activity_date: self.date.clone(),
            quantity: self.quantity,
            unit_price: self.unit_price,
            currency: self.currency.clone(),
            fee: self.fee,
            amount: self.amount,
            is_draft: false,
            comment: self.comment.clone(),
        }
    }
}

#[async_trait]
pub trait BrokerProvider: Send + Sync {
    async fn fetch_activities(&self, last_synced_iso: Option<String>) -> Result<Vec<ExternalActivity>, Box<dyn std::error::Error + Send + Sync>>;
}

/// Returns the last synced timestamp (max activity_date) for an account as ISO 8601 string.
pub fn get_last_synced_timestamp(conn: &mut SqliteConnection, account_id: &str) -> Result<Option<String>, diesel::result::Error> {
    #[derive(QueryableByName)]
    struct Row { #[diesel(sql_type = diesel::sql_types::Nullable<diesel::sql_types::Text>)] max_date: Option<String> }

    let query = diesel::sql_query("SELECT MAX(activity_date) as max_date FROM activities WHERE account_id = ?")
        .bind::<diesel::sql_types::Text, _>(account_id.to_string());
    let result: Row = query.get_result(conn)?;
    Ok(result.max_date)
}


