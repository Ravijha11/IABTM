import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useAllProducts = (first = 10) => {
  return useQuery({
    queryKey: ['all-products', first],
    queryFn: async () => {
      const res = await axios.get(`/api/shopify?first=${first}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
};