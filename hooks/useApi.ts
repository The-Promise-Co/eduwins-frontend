import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AxiosRequestConfig } from 'axios';
import api from '@/services/api';

type ApiMethod = 'post' | 'put' | 'patch' | 'delete';

type MutationConfig<TVariables> = {
  method: ApiMethod;
  url: string | ((variables: TVariables) => string);
  data?: (variables: TVariables) => unknown;
  config?: AxiosRequestConfig | ((variables: TVariables) => AxiosRequestConfig | undefined);
  invalidate?: QueryKey[];
};

export function useApiQuery<TData = unknown>(
  queryKey: QueryKey,
  url: string | null,
  options?: Omit<UseQueryOptions<TData, Error, TData, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, Error, TData, QueryKey>({
    queryKey,
    queryFn: async () => {
      if (!url) {
        throw new Error('Missing API URL');
      }

      const response = await api.get<TData>(url);
      return response.data;
    },
    enabled: !!url && (options?.enabled ?? true),
    ...options,
  });
}

export function useApiMutation<TData = unknown, TVariables = void>(
  mutationConfig: MutationConfig<TVariables>,
  options?: UseMutationOptions<TData, unknown, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, unknown, TVariables>({
    mutationFn: async (variables) => {
      const url =
        typeof mutationConfig.url === 'function'
          ? mutationConfig.url(variables)
          : mutationConfig.url;
      const config =
        typeof mutationConfig.config === 'function'
          ? mutationConfig.config(variables)
          : mutationConfig.config;
      const payload = mutationConfig.data?.(variables);
      const response =
        mutationConfig.method === 'delete'
          ? await api.delete<TData>(url, config)
          : await api[mutationConfig.method]<TData>(url, payload, config);
      return response.data;
    },
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await options?.onSuccess?.(data, variables, context, mutation);

      if (mutationConfig.invalidate) {
        await Promise.all(
          mutationConfig.invalidate.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey })
          )
        );
      }
    },
  });
}
