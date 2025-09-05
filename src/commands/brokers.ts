import { getRunEnv, RUN_ENV, invokeTauri } from '@/adapters';
import { logger } from '@/adapters';

export const syncBrokers = async (): Promise<void> => {
    try {
        switch (getRunEnv()) {
            case RUN_ENV.DESKTOP:
                await invokeTauri('sync_all_accounts');
                return;
            default: 
                throw new Error('Unsupported');
        }
    } catch (error) {
        logger.error('Error syncing brokers.');
        throw error;
    }
};

export interface BrokerPlatformSetting {
  id: string;
  name?: string;
  url: string;
  enabled: boolean;
  hasSecrets: boolean;
}

export const getBrokerPlatformSettings = async (): Promise<BrokerPlatformSetting[]> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri('get_broker_platform_settings');
      default:
        return [];
    }
  } catch (error) {
    logger.error('Error loading broker platform settings.');
    throw error;
  }
};

export const updateBrokerPlatformSettings = async (variables: { platformId: string; enabled: boolean }): Promise<BrokerPlatformSetting> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri('update_broker_platform_settings', variables);
      default:
        throw new Error('Unsupported');
    }
  } catch (error) {
    logger.error('Error updating broker platform settings.');
    throw error;
  }
};

export const platformSetSecrets = async (platformId: string, secrets: Record<string, string>): Promise<void> => {
  try {
    switch (getRunEnv()) {
      case RUN_ENV.DESKTOP:
        return invokeTauri('platform_set_secrets', { platformId, secretsJson: JSON.stringify(secrets) });
      default:
        throw new Error('Unsupported');
    }
  } catch (error) {
    logger.error('Error saving platform secrets.');
    throw error;
  }
};

