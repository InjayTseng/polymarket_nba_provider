import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNbaIndexes20260204090200 implements MigrationInterface {
  name = "AddNbaIndexes20260204090200";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "uq_player_season_team" ON "player_season_team" ("player_id", "season", "team_id")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_player_season_team_player_season_to" ON "player_season_team" ("player_id", "season", "to_utc")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_player_season_team_team_season_to" ON "player_season_team" ("team_id", "season", "to_utc")'
    );

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_player_game_stat_player" ON "player_game_stat" ("player_id")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_player_game_stat_team" ON "player_game_stat" ("team_id")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_player_game_stat_game" ON "player_game_stat" ("game_id")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_player_game_stat_game"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_player_game_stat_team"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_player_game_stat_player"');

    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_player_season_team_team_season_to"'
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_player_season_team_player_season_to"'
    );
    await queryRunner.query('DROP INDEX IF EXISTS "uq_player_season_team"');
  }
}
