import { DataSource } from "typeorm";
import { join } from "path";

const migrationsPath = join(__dirname, "migrations/*{.ts,.js}");
const entitiesPath = join(__dirname, "../../**/*.entity{.ts,.js}");

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  migrations: [migrationsPath],
  entities: [entitiesPath],
  migrationsTableName: "typeorm_migrations",
  synchronize: false
});
