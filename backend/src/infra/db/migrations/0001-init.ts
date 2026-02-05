import { MigrationInterface, QueryRunner } from "typeorm";

export class InitPolymarket20260204090000 implements MigrationInterface {
  name = "InitPolymarket20260204090000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "polymarket_event_id" integer NOT NULL,
        "slug" text,
        "title" text,
        "description" text,
        "start_date" timestamptz,
        "end_date" timestamptz,
        "active" boolean,
        "closed" boolean,
        "archived" boolean,
        "featured" boolean,
        "restricted" boolean,
        "liquidity" numeric,
        "volume" numeric,
        "raw" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_events_polymarket_event_id" UNIQUE ("polymarket_event_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" integer PRIMARY KEY,
        "label" text,
        "slug" text,
        "force_show" boolean,
        "force_hide" boolean,
        "is_carousel" boolean,
        "published_at" timestamptz,
        "created_at" timestamptz,
        "updated_at" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "markets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "polymarket_market_id" integer NOT NULL,
        "slug" text,
        "question" text,
        "title" text,
        "category" text,
        "condition_id" text,
        "market_type" text,
        "format_type" text,
        "active" boolean,
        "closed" boolean,
        "status" text,
        "end_date" timestamptz,
        "resolve_time" timestamptz,
        "liquidity" numeric,
        "volume" numeric,
        "volume_24hr" numeric,
        "outcome_prices" jsonb,
        "outcomes" jsonb,
        "clob_token_ids" text[],
        "last_detail_synced_at" timestamptz,
        "event_id" uuid,
        "raw" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_markets_polymarket_market_id" UNIQUE ("polymarket_market_id"),
        CONSTRAINT "fk_markets_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_markets_event_id" ON "markets" ("event_id")'
    );

    await queryRunner.query(`
      CREATE TABLE "event_tags" (
        "event_id" uuid NOT NULL,
        "tag_id" integer NOT NULL,
        CONSTRAINT "pk_event_tags" PRIMARY KEY ("event_id", "tag_id"),
        CONSTRAINT "fk_event_tags_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_event_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "market_snapshots" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "market_id" uuid NOT NULL,
        "ts" timestamptz NOT NULL,
        "price_yes" numeric,
        "price_no" numeric,
        "volume" numeric,
        "liquidity" numeric,
        CONSTRAINT "fk_market_snapshots_market" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_market_snapshots_market_id" ON "market_snapshots" ("market_id")'
    );

    await queryRunner.query(`
      CREATE TABLE "ingestion_state" (
        "key" text PRIMARY KEY,
        "value" jsonb,
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "ingestion_state"');
    await queryRunner.query('DROP TABLE IF EXISTS "market_snapshots"');
    await queryRunner.query('DROP TABLE IF EXISTS "event_tags"');
    await queryRunner.query('DROP TABLE IF EXISTS "markets"');
    await queryRunner.query('DROP TABLE IF EXISTS "tags"');
    await queryRunner.query('DROP TABLE IF EXISTS "events"');
  }
}
