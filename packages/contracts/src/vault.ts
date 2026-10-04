import { z } from 'zod';
import { MediaDtoSchema } from './media.js';

export const VaultFolderDtoSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().nullable().optional(),
  itemCount: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type VaultFolderDto = z.infer<typeof VaultFolderDtoSchema>;

export const CreateVaultFolderRequestSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional().nullable(),
});
export type CreateVaultFolderRequest = z.infer<typeof CreateVaultFolderRequestSchema>;

export const VaultItemDtoSchema = z.object({
  id: z.string().uuid(),
  folderId: z.string().uuid().nullable().optional(),
  mediaId: z.string().uuid(),
  tags: z.array(z.string()).default([]),
  media: MediaDtoSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type VaultItemDto = z.infer<typeof VaultItemDtoSchema>;

export const AddVaultItemRequestSchema = z.object({
  mediaId: z.string().uuid(),
  folderId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
});
export type AddVaultItemRequest = z.infer<typeof AddVaultItemRequestSchema>;

export const UpdateVaultItemRequestSchema = z.object({
  folderId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
});
export type UpdateVaultItemRequest = z.infer<typeof UpdateVaultItemRequestSchema>;
