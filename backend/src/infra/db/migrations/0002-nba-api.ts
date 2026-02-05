import { MigrationInterface, QueryRunner } from "typeorm";

export class InitNbaApi20260204090100 implements MigrationInterface {
  name = "InitNbaApi20260204090100";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE "team" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "provider" text NOT NULL,
        "provider_team_id" text NOT NULL,
        "abbrev" text NOT NULL,
        "name" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_team_provider_id" UNIQUE ("provider", "provider_team_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "player" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "provider" text NOT NULL,
        "provider_player_id" text NOT NULL,
        "first_name" text NOT NULL,
        "last_name" text NOT NULL,
        "display_name" text NOT NULL,
        "position" text,
        "height_cm" integer,
        "weight_kg" integer,
        "birthdate" date,
        "country" text,
        "is_active" boolean NOT NULL,
        "shoots" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_player_provider_id" UNIQUE ("provider", "provider_player_id")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_player_display_name" ON "player" ("display_name")'
    );

    await queryRunner.query(`
      CREATE TABLE "game" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "provider" text NOT NULL,
        "provider_game_id" text NOT NULL,
        "season" integer NOT NULL,
        "date_time_utc" timestamptz NOT NULL,
        "status" text NOT NULL,
        "home_score" integer,
        "away_score" integer,
        "home_team_id" uuid NOT NULL,
        "away_team_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_game_provider_id" UNIQUE ("provider", "provider_game_id"),
        CONSTRAINT "fk_game_home_team" FOREIGN KEY ("home_team_id") REFERENCES "team"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_game_away_team" FOREIGN KEY ("away_team_id") REFERENCES "team"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_game_date_time" ON "game" ("date_time_utc")'
    );

    await queryRunner.query(`
      CREATE TABLE "team_game_stat" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "game_id" uuid NOT NULL,
        "team_id" uuid NOT NULL,
        "is_home" boolean NOT NULL,
        "pts" integer NOT NULL,
        "reb" integer,
        "ast" integer,
        "tov" integer,
        "fgm" integer,
        "fga" integer,
        "fg3m" integer,
        "fg3a" integer,
        "ftm" integer,
        "fta" integer,
        "off_rtg" numeric,
        "def_rtg" numeric,
        "pace" numeric,
        "ts_pct" numeric,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_team_game_stat" UNIQUE ("game_id", "team_id"),
        CONSTRAINT "fk_team_game_stat_game" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_team_game_stat_team" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_team_game_stat_team_game" ON "team_game_stat" ("team_id", "game_id")'
    );

    await queryRunner.query(`
      CREATE TABLE "player_season_team" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "provider" text NOT NULL,
        "player_id" uuid NOT NULL,
        "season" integer NOT NULL,
        "team_id" uuid NOT NULL,
        "from_utc" timestamptz NOT NULL,
        "to_utc" timestamptz,
        "role" text,
        "contract_type" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_player_season_team_player" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_player_season_team_team" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_player_season_team_player_season" ON "player_season_team" ("player_id", "season")'
    );

    await queryRunner.query(
      'CREATE INDEX "idx_player_season_team_team_season" ON "player_season_team" ("team_id", "season")'
    );

    await queryRunner.query(`
      CREATE TABLE "player_game_stat" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "provider" text NOT NULL,
        "game_id" uuid NOT NULL,
        "player_id" uuid NOT NULL,
        "team_id" uuid NOT NULL,
        "is_starter" boolean,
        "minutes" numeric(6,3),
        "pts" integer NOT NULL,
        "reb" integer NOT NULL,
        "ast" integer NOT NULL,
        "tov" integer NOT NULL,
        "stl" integer,
        "blk" integer,
        "fgm" integer,
        "fga" integer,
        "fg3m" integer,
        "fg3a" integer,
        "ftm" integer,
        "fta" integer,
        "plus_minus" integer,
        "did_not_play_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_player_game_stat" UNIQUE ("game_id", "player_id"),
        CONSTRAINT "fk_player_game_stat_game" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_player_game_stat_player" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_player_game_stat_team" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_player_game_stat_player_game" ON "player_game_stat" ("player_id", "game_id")'
    );

    await queryRunner.query(
      'CREATE INDEX "idx_player_game_stat_game_team" ON "player_game_stat" ("game_id", "team_id")'
    );

    await queryRunner.query(`
      CREATE TABLE "data_conflict" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "conflict_type" text NOT NULL,
        "player_id" uuid,
        "season" integer,
        "job_id" text,
        "details_json" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "fk_data_conflict_player" FOREIGN KEY ("player_id") REFERENCES "player"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "idx_data_conflict_type" ON "data_conflict" ("conflict_type")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "data_conflict"');
    await queryRunner.query('DROP TABLE IF EXISTS "player_game_stat"');
    await queryRunner.query('DROP TABLE IF EXISTS "player_season_team"');
    await queryRunner.query('DROP TABLE IF EXISTS "team_game_stat"');
    await queryRunner.query('DROP TABLE IF EXISTS "game"');
    await queryRunner.query('DROP TABLE IF EXISTS "player"');
    await queryRunner.query('DROP TABLE IF EXISTS "team"');
  }
}
