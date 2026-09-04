'use client';

/**
 * CMS Client — pengganti @supabase/supabase-js di sisi klien.
 * Meniru bentuk respon `{ data, error }` + builder chain `.from().select()...`
 * sehingga perubahan pada halaman admin minimal.
 */

type CmsResult = {
  data: any;
  count?: number;
  error: { message: string; code?: string } | null;
};

type Filter = { col: string; op: string; val: unknown };
type Order = { col: string; ascending: boolean };

type Spec = {
  table: string;
  columns?: string;
  filters: Filter[];
  orders: Order[];
  limit?: number;
  offset?: number;
  head?: boolean;
  count?: 'exact' | 'planned';
  single?: 'single' | 'maybeSingle';
};

async function call(body: unknown): Promise<CmsResult> {
  try {
    const res = await fetch('/api/cms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return (await res.json()) as CmsResult;
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Koneksi ke server gagal.' } };
  }
}

class CmsQuery {
  private spec: Spec;

  constructor(table: string) {
    this.spec = { table, filters: [], orders: [] };
  }

  select(columns?: string | { head?: boolean; count?: 'exact' }): this {
    if (columns && typeof columns === 'object') {
      this.spec.head = Boolean(columns.head);
      this.spec.count = columns.count || this.spec.count;
    } else {
      this.spec.columns = columns;
    }
    return this;
  }

  filter(col: string, op: string, val: unknown): this {
    this.spec.filters.push({ col, op, val });
    return this;
  }

  is(col: string, val: unknown): this {
    return this.filter(col, 'is', val);
  }

  eq(col: string, val: unknown): this {
    return this.filter(col, 'eq', val);
  }

  in(col: string, vals: unknown[]): this {
    return this.filter(col, 'in', vals);
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.spec.orders.push({ col, ascending: opts?.ascending ?? true });
    return this;
  }

  limit(n: number): this {
    this.spec.limit = n;
    return this;
  }

  range(from: number, to: number): this {
    this.spec.offset = from;
    this.spec.limit = to - from + 1;
    return this;
  }

  single(): this {
    this.spec.single = 'single';
    return this;
  }

  maybeSingle(): this {
    this.spec.single = 'maybeSingle';
    return this;
  }

  async insert(rows: Record<string, unknown> | Record<string, unknown>[]): Promise<CmsResult> {
    return call({ table: this.spec.table, insert: Array.isArray(rows) ? rows : [rows] });
  }

  async upsert(rows: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string }): Promise<CmsResult> {
    return call({ table: this.spec.table, upsert: { rows: Array.isArray(rows) ? rows : [rows], onConflict: opts?.onConflict } });
  }

  async update(payload: Record<string, unknown>): Promise<CmsResult> {
    return call({ table: this.spec.table, updates: payload, filters: this.spec.filters });
  }

  async delete(): Promise<CmsResult> {
    return call({ table: this.spec.table, delete: true, filters: this.spec.filters });
  }

  async then(): Promise<CmsResult> {
    return this.execute();
  }

  async execute(): Promise<CmsResult> {
    return call({
      table: this.spec.table,
      columns: this.spec.columns,
      filters: this.spec.filters,
      orders: this.spec.orders,
      limit: this.spec.limit,
      offset: this.spec.offset,
      head: this.spec.head,
      count: this.spec.count,
      single: this.spec.single,
    });
  }
}

export const cms = {
  from: (table: string) => new CmsQuery(table),
  async rpc(name: string, args?: Record<string, unknown>): Promise<CmsResult> {
    return call({ op: 'rpc', name, args: args || {} });
  },
};

export type { CmsResult };