use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(
    Queryable,
    Identifiable,
    Selectable,
    Insertable,
    AsChangeset,
    PartialEq,
    Serialize,
    Deserialize,
    Debug,
    Clone,
)]
#[diesel(table_name = crate::schema::platforms)]
#[diesel(check_for_backend(diesel::sqlite::Sqlite))]
#[serde(rename_all = "camelCase")]
pub struct PlatformSetting {
    pub id: String,
    pub name: Option<String>,
    pub url: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePlatformSetting {
    pub enabled: Option<bool>,
}


