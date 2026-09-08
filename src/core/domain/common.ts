import { AccentColor } from './enums';

/** Shared field schemas reused by many domain models. */
import { z } from 'zod';

/** A stable UUID-like identifier. */
export const idSchema = z.string().uuid().or(z.string().min(1)).brand('EntityId');

/** A nullable relational id referencing another entity. */
export const nullableIdSchema = idSchema.nullable();

/** Sort ordering number. */
export const sortOrderSchema = z.number().int().nonnegative();

/** Accent tint restricted to known values. */
export const accentSchema = z.nativeEnum(AccentColor);

/** Named labels are human-facing, non-empty strings. */
export const labelSchema = z.string().min(1);