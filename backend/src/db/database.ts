import { neon } from '@neondatabase/serverless';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _neon = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL || '') as any;

type Row = Record<string, unknown>;

// @vercel/postgres와 동일한 { rows } 인터페이스 유지
export const sql = Object.assign(
  async (strings: TemplateStringsArray, ...values: unknown[]): Promise<{ rows: Row[] }> => ({
    rows: (await _neon(strings, ...values)) as Row[],
  }),
  {
    query: async (text: string, values?: unknown[]): Promise<{ rows: Row[] }> => ({
      rows: (await _neon(text, values ?? [])) as Row[],
    }),
  }
);
