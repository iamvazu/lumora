import { z } from 'zod';
import { CreatorProfileDtoSchema } from './creators.js';

export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const CategoryDtoSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  creatorCount: z.number().int().default(0),
  icon: z.string().optional(),
});
export type CategoryDto = z.infer<typeof CategoryDtoSchema>;

export const DiscoverySearchResponseSchema = z.object({
  creators: z.array(CreatorProfileDtoSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type DiscoverySearchResponse = z.infer<typeof DiscoverySearchResponseSchema>;

export const FeaturedCreatorsResponseSchema = z.object({
  featured: z.array(CreatorProfileDtoSchema),
  trending: z.array(CreatorProfileDtoSchema),
  categories: z.array(CategoryDtoSchema),
});
export type FeaturedCreatorsResponse = z.infer<typeof FeaturedCreatorsResponseSchema>;
