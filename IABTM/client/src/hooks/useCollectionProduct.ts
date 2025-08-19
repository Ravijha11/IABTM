// hooks/useCollectionProducts.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useCollectionProducts = (handle: string) => {
  return useQuery({
    queryKey: ['collection-products', handle],
    queryFn: async () => {
      const res = await axios.get(`/api/shopify?handle=${handle}`);
      return res.data;
    },
  });
};
