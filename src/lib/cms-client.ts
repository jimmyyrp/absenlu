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
  updates?: Record<string, unknown>;
  delete?: boolean;
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

  select(
    columns?: string,
    options?: { head?: boolean; count?: 'exact' | 'planned' },
  ): this {
    if (columns !== undefined) {
      this.spec.columns = columns;
    }
    if (options) {
      this.spec.head = Boolean(options.head);
      this.spec.count = options.count || this.spec.count;
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

  /**
   * Update yang masih bisa di-chain (.update(...).eq('id', x)) seperti supabase-js.
   * Eksekusi terjadi saat hasilnya di-await (thenable).
   */
  update(payload: Record<string, unknown>): CmsQueryBuilder {
    return new CmsQueryBuilder({ ...this.spec, updates: payload });
  }

  /**
   * Delete yang masih bisa di-chain (.delete().eq('id', x)) seperti supabase-js.
   * Eksekusi terjadi saat hasilnya di-await (thenable).
   */
  delete(): CmsQueryBuilder {
    return new CmsQueryBuilder({ ...this.spec, delete: true });
  }

  async then<
    T1 = CmsResult,
    T2 = never,
  >(onfulfilled?: ((value: CmsResult) => T1 | PromiseLike<T1>) | null, onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null): Promise<T1 | T2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<T2 = never>(onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null): Promise<CmsResult | T2> {
    return this.execute().catch(onrejected);
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

/** Builder hasil update/delete: mendukung filter chain lalu dieksekusi saat di-await. */
class CmsQueryBuilder {
  private spec: Spec;

  constructor(spec: Spec) {
    this.spec = spec;
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

  async then<
    T1 = CmsResult,
    T2 = never,
  >(onfulfilled?: ((value: CmsResult) => T1 | PromiseLike<T1>) | null, onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null): Promise<T1 | T2> {
    return call({
      table: this.spec.table,
      updates: this.spec.updates,
      delete: this.spec.delete,
      filters: this.spec.filters,
    }).then(onfulfilled, onrejected);
  }

  catch<T2 = never>(onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null): Promise<CmsResult | T2> {
    return this.execute().catch(onrejected);
  }

  async execute(): Promise<CmsResult> {
    return call({
      table: this.spec.table,
      updates: this.spec.updates,
      delete: this.spec.delete,
      filters: this.spec.filters,
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