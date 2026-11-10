import { ValueTransformer } from 'typeorm';

/** PostgreSQL devuelve los NUMERIC como texto; los convertimos a number. */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : Number(value)),
};
