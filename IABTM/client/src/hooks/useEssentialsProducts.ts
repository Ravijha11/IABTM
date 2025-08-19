import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useEssentialsProducts = (first = 10) => {
  return useQuery({
    queryKey: ['essentials-products', first],
    queryFn: async () => {
      const res = await axios.get(`/api/essentials?first=${first}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
};

export const useEssentialsCollectionProducts = (handle: string) => {
  return useQuery({
    queryKey: ['essentials-collection-products', handle],
    queryFn: async () => {
      const res = await axios.get(`/api/essentials?handle=${handle}`);
      return res.data;
    },
  });
}; 