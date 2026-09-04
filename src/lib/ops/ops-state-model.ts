import mongoose, { Schema, models } from 'mongoose';
import type { OpsState } from './types';

/**
 * Ops state document — the MongoDB persistence layer for the OPS (Absensi)
 * module. Each team workspace stores its full OpsState as a single embedded
 * document in MongoDB (aggregate/embedded-document pattern), keyed by `key`.
 *
 * A single document keeps every mutation (clock-in, task toggle, correction,
 * expense) atomic across the whole state without multi-collection transactions,
 * which fits a small internal team tool well.
 */

const OpsStateSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: () => new Date() },
  updatedBy: { type: String, default: 'ops' },
});

export interface OpsStateDoc {
  key: string;
  data: OpsState;
  updatedAt: Date;
  updatedBy?: string;
}

export const OpsStateModel =
  (models.OpsState as mongoose.Model<OpsStateDoc>) ??
  mongoose.model<OpsStateDoc>('OpsState', OpsStateSchema);

export const OPS_STATE_KEY = 'main';