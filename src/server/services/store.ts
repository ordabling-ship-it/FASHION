import fs from 'fs';
import path from 'path';
import type { Item, Job } from '../types';

interface DbShape {
  items: Record<string, Item>;
  jobs: Record<string, Job>;
}

/** Tiny persistent JSON store (atomic writes). Good enough for a single-process local tool. */
export class JsonStore {
  private db: DbShape = { items: {}, jobs: {} };
  private file: string;

  constructor(dataDir: string) {
    fs.mkdirSync(dataDir, { recursive: true });
    this.file = path.join(dataDir, 'db.json');
    if (fs.existsSync(this.file)) {
      this.db = JSON.parse(fs.readFileSync(this.file, 'utf8')) as DbShape;
    }
  }

  private save() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2));
    fs.renameSync(tmp, this.file);
  }

  listItems() {
    return Object.values(this.db.items).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  getItem(id: string) {
    return this.db.items[id];
  }
  upsertItem(item: Item) {
    item.updatedAt = new Date().toISOString();
    this.db.items[item.id] = item;
    this.save();
    return item;
  }
  patchItem(id: string, patch: Partial<Item>) {
    const cur = this.db.items[id];
    if (!cur) throw new Error(`Unknown item ${id}`);
    return this.upsertItem({ ...cur, ...patch });
  }

  listJobs() {
    return Object.values(this.db.jobs).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  getJob(id: string) {
    return this.db.jobs[id];
  }
  upsertJob(job: Job) {
    job.updatedAt = new Date().toISOString();
    this.db.jobs[job.id] = job;
    this.save();
    return job;
  }
}
