import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '@/lib/query-keys'
import {
  getBrokerPlatformSettings,
  updateBrokerPlatformSettings,
  BrokerPlatformSetting,
} from '@/commands/brokers'
import { setSecret, deleteSecret } from '@/commands/secrets'
import { toast } from '@/components/ui/use-toast'

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
      const previousPlatforms = queryClient.getQueryData<BrokerPlatformSetting[]>([
        QueryKeys.BROKER_PLATFORM_SETTINGS,
      ])
      queryClient.setQueryData<BrokerPlatformSetting[]>(
        [QueryKeys.BROKER_PLATFORM_SETTINGS],
        (old) =>
          old?.map((p) => (p.id === variables.platformId ? { ...p, enabled: variables.enabled } : p)) || old
      )
      return { previousPlatforms }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.BROKER_PLATFORM_SETTINGS] })
      toast({ title: `${data.name} settings updated successfully.`, variant: 'success' })
    },
    onError: (error, variables, context) => {
      if (context?.previousPlatforms) {
        queryClient.setQueryData([QueryKeys.BROKER_PLATFORM_SETTINGS], context.previousPlatforms)
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

