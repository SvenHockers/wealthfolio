import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/query-keys'
import {
  getBrokerPlatformSettings,
  updateBrokerPlatformSettings,
  BrokerPlatformSetting,
  syncBrokers,
} from '@/commands/brokers'
import { setSecret, deleteSecret, getSecret } from '@/commands/secrets'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/ui/icons'
import { Separator } from '@/components/ui/separator'
import { SettingsHeader } from './header'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function useBrokerPlatformSettings() {
  return useQuery({
    queryKey: [QueryKeys.BROKER_PLATFORM_SETTINGS],
    queryFn: getBrokerPlatformSettings,
  })
}

export function useUpdateBrokerPlatformSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variables: { platformId: string; enabled: boolean }) =>
      updateBrokerPlatformSettings(variables),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: [QueryKeys.BROKER_PLATFORM_SETTINGS] })
      const previous = queryClient.getQueryData<BrokerPlatformSetting[]>([
        QueryKeys.BROKER_PLATFORM_SETTINGS,
      ])
      queryClient.setQueryData<BrokerPlatformSetting[]>(
        [QueryKeys.BROKER_PLATFORM_SETTINGS],
        (old) =>
          old?.map((p) => (p.id === variables.platformId ? { ...p, enabled: variables.enabled } : p)) || old
      )
      return { previous }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.BROKER_PLATFORM_SETTINGS] })
      toast({ title: `${data.name} updated successfully.`, variant: 'success' })
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QueryKeys.BROKER_PLATFORM_SETTINGS], context.previous)
      }
      toast({
        title: `Failed to update platform ${variables.platformId}`,
        description: (error as Error).message,
        variant: 'destructive',
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.BROKER_PLATFORM_SETTINGS] })
    },
  })
}

export function useSetPlatformApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variables: { platformId: string; apiKey: string }) =>
      setSecret(variables.platformId, variables.apiKey),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.BROKER_PLATFORM_SETTINGS] })
      queryClient.invalidateQueries({ queryKey: QueryKeys.secrets.apiKey(vars.platformId) })
      toast({ title: 'API Key saved successfully.', variant: 'success' })
    },
    onError: (error) => {
      toast({ title: 'Failed to save API key', description: (error as Error).message, variant: 'destructive' })
    },
  })
}

export function useDeletePlatformApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variables: { platformId: string }) => deleteSecret(variables.platformId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.BROKER_PLATFORM_SETTINGS] })
      queryClient.invalidateQueries({ queryKey: QueryKeys.secrets.apiKey(vars.platformId) })
      toast({ title: 'API Key deleted successfully.', variant: 'success' })
    },
    onError: (error) => {
      toast({ title: 'Failed to delete API key', description: (error as Error).message, variant: 'destructive' })
    },
  })
}

export function useValidateBrokerCredentials() {
  return useMutation({
    mutationFn: async (variables: { platformId: string }) => {
      const res = await fetch(`/api/platforms/${variables.platformId}/validate`, { method: 'POST' })
      if (!res.ok) throw new Error('Validation failed')
      return res.json().catch(() => undefined)
    },
    onSuccess: () => toast({ title: 'Credentials are valid.', variant: 'success' }),
    onError: (error) =>
      toast({ title: 'Validation failed', description: (error as Error).message, variant: 'destructive' }),
  })
}

// Mirror market-data useApiKeyStatus, but for platforms
const useApiKeyStatus = (platformId: string) => {
  const queryClient = useQueryClient()
  const needsApiKey = true // All broker platforms require credentials for now

  const { data: apiKey, isLoading } = useQuery({
    queryKey: QueryKeys.secrets.apiKey(platformId),
    queryFn: () => getSecret(platformId),
    enabled: needsApiKey,
    staleTime: Infinity,
  })

  const isSecretSet = !!apiKey
  const invalidateApiKeyStatus = () => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.secrets.apiKey(platformId) })
  }

  return { apiKey, isSecretSet, isLoading, needsApiKey, invalidateApiKeyStatus }
}

interface PlatformSettingsProps {
  platform: BrokerPlatformSetting
  onUpdate: (settings: { enabled?: boolean }) => void
}

function PlatformSettings({ platform, onUpdate }: PlatformSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const { apiKey, isSecretSet, needsApiKey, invalidateApiKeyStatus } = useApiKeyStatus(platform.id)
  const { mutate: saveKey } = useSetPlatformApiKey()
  const { mutate: clearKey } = useDeletePlatformApiKey()

  const [apiKeyValue, setApiKeyValue] = useState('')

  useEffect(() => {
    if (apiKey) setApiKeyValue(apiKey)
  }, [apiKey])

  const handleSaveApiKey = () => {
    if (apiKeyValue && apiKeyValue.trim() !== '') {
      saveKey(
        { platformId: platform.id, apiKey: apiKeyValue },
        { onSuccess: () => invalidateApiKeyStatus() },
      )
    } else {
      clearKey(
        { platformId: platform.id },
        { onSuccess: () => invalidateApiKeyStatus() },
      )
    }
  }

  const isConfigured = !needsApiKey || isSecretSet

  // Map platform id to logo
  const logoFilename = (() => {
    switch (platform.id) {
      case 'TRADING212':
        return 'T212.png'
      case 'COINBASE':
        return 'coinbase.png'
      case 'BITVAVO':
        return 'bitvavo.png'
      default:
        return undefined
    }
  })()

  return (
    <Card
      key={platform.id}
      className={`group rounded-lg border transition-all duration-200 ${platform.enabled ? 'bg-card hover:bg-accent/30 hover:shadow-md' : 'bg-muted/30 border-dashed opacity-75 hover:opacity-90'}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {logoFilename && (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <img
                      src={`/broker-data/${logoFilename}`}
                      alt={`${platform.name ?? platform.id} logo`}
                      className="h-10 w-10 rounded-md object-contain"
                    />
                  </div>
                )}
                <CardTitle className={`truncate text-lg font-semibold ${platform.enabled ? '' : 'text-muted-foreground'}`}>
                  {platform.name ?? platform.id}
                </CardTitle>
              </div>
              {!platform.enabled && (
                <Badge variant="secondary" className="shrink-0 text-xs bg-warning/10 text-warning border-warning/20">
                  <Icons.AlertCircle className="mr-1 h-3 w-3" />
                  Disabled
                </Badge>
              )}
              {!isConfigured && platform.enabled && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-amber-500 hover:bg-amber-50 hover:text-amber-600"
                    >
                      <Icons.AlertTriangle className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Icons.AlertTriangle className="h-4 w-4 text-amber-500" />
                          Configuration Required
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          This platform requires an API key to sync activities. Configure the API key below.
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {platform.url && (
              <CardDescription className={`text-sm leading-relaxed ${platform.enabled ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                <a href={platform.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {platform.url}
                </a>
              </CardDescription>
            )}
          </div>

          <div className="ml-6 flex items-center gap-2">
            <div className="mr-2 flex items-center gap-3">
              <Switch
                id={`${platform.id}-enabled`}
                checked={platform.enabled}
                onCheckedChange={(checked) => onUpdate({ enabled: checked })}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`h-auto w-full justify-between rounded-none border-t p-4 ${!platform.enabled && 'opacity-50'}`}
            disabled={!platform.enabled}
          >
            <span className="text-sm font-medium">
              {platform.enabled ? 'Configure Settings' : 'Enable platform to configure'}
            </span>
            {platform.enabled && (isOpen ? <Icons.ChevronUp className="h-4 w-4" /> : <Icons.ChevronDown className="h-4 w-4" />)}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 bg-muted/20 pb-6 pt-6">
            {needsApiKey && (
              <div className="space-y-2">
                <Label htmlFor={`apikey-${platform.id}`}>API Key</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id={`apikey-${platform.id}`}
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyValue ?? ''}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    placeholder={isSecretSet && !apiKeyValue ? 'API Key is Set' : 'Enter API Key'}
                    className="flex-grow"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                    aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? <Icons.EyeOff className="h-4 w-4" /> : <Icons.Eye className="h-4 w-4" />}
                  </Button>
                  <Button onClick={handleSaveApiKey} size="sm">
                    <Icons.Save className="mr-2 h-4 w-4" /> Save Key
                  </Button>
                </div>
                {isSecretSet && !apiKeyValue && (
                  <p className="text-xs text-muted-foreground">
                    An API key is set. Enter a new key to update, or leave blank and save to clear the key.
                  </p>
                )}
                {!isSecretSet && !apiKeyValue && (
                  <p className="text-xs text-muted-foreground">No API key set. Enter a key and save.</p>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default function BrokerDataSettingsPage() {
  const { data: platforms, isLoading, error } = useBrokerPlatformSettings()
  const { mutate: updatePlatform } = useUpdateBrokerPlatformSettings()
  const sortedPlatforms = useMemo(() => {
    return (platforms ?? []).slice().sort((a, b) => {
      if (a.enabled === b.enabled) return a.id.localeCompare(b.id)
      return a.enabled ? -1 : 1
    })
  }, [platforms])

  if (isLoading) return <p>Loading broker platforms...</p>
  if (error) return <p className="text-destructive">{(error as Error).message}</p>

  return (
    <div className="space-y-6 text-foreground">
      <SettingsHeader heading="Broker Integrations" text="Enable platforms and securely set API keys for syncing activities.">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => syncBrokers()}>
            <Icons.Refresh className="mr-2 h-4 w-4" /> Sync All
          </Button>
        </div>
      </SettingsHeader>
      <Separator />

      <div className="space-y-6">
        {sortedPlatforms.map((p) => (
          <PlatformSettings
            key={p.id}
            platform={p}
            onUpdate={(settings) => updatePlatform({ platformId: p.id, enabled: settings.enabled ?? p.enabled })}
          />
        ))}
      </div>
    </div>
  )
}

