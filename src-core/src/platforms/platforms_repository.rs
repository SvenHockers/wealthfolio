use std::sync::Arc;
use diesel::prelude::*;
use diesel::r2d2::{self, Pool};
use diesel::sqlite::SqliteConnection;

use crate::db::{get_connection, WriteHandle};
use crate::errors::Result;
use crate::schema::platforms::dsl as platforms_dsl;

use super::platforms_model::PlatformSetting;

pub struct PlatformsRepository {
    pool: Arc<Pool<r2d2::ConnectionManager<SqliteConnection>>>,
    writer: WriteHandle,
}

impl PlatformsRepository {
    pub fn new(
        pool: Arc<Pool<r2d2::ConnectionManager<SqliteConnection>>>,
        writer: WriteHandle,
    ) -> Self {
        Self { pool, writer }
    }

    pub fn list(&self) -> Result<Vec<PlatformSetting>> {
        let mut conn = get_connection(&self.pool)?;
        let rows = platforms_dsl::platforms
            .order(platforms_dsl::id.asc())
            .load::<PlatformSetting>(&mut conn)?;
        Ok(rows)
    }

    pub async fn update_enabled(&self, platform_id: &str, enabled: bool) -> Result<PlatformSetting> {
        let id_owned = platform_id.to_string();
        self.writer
            .exec(move |conn| {
                diesel::update(platforms_dsl::platforms.find(&id_owned))
                    .set(platforms_dsl::enabled.eq(enabled))
                    .execute(conn)?;

                let updated = platforms_dsl::platforms
                    .find(&id_owned)
                    .first::<PlatformSetting>(conn)?;
                Ok(updated)
            })
            .await
    }
}


