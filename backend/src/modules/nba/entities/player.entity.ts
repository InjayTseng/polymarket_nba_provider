import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "player" })
@Index(["provider", "providerPlayerId"], { unique: true })
@Index(["displayName"])
export class Player {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  provider!: string;

  @Column({ name: "provider_player_id", type: "text" })
  providerPlayerId!: string;

  @Column({ name: "first_name", type: "text" })
  firstName!: string;

  @Column({ name: "last_name", type: "text" })
  lastName!: string;

  @Column({ name: "display_name", type: "text" })
  displayName!: string;

  @Column({ type: "text", nullable: true })
  position!: string | null;

  @Column({ name: "height_cm", type: "int", nullable: true })
  heightCm!: number | null;

  @Column({ name: "weight_kg", type: "int", nullable: true })
  weightKg!: number | null;

  @Column({ type: "date", nullable: true })
  birthdate!: Date | null;

  @Column({ type: "text", nullable: true })
  country!: string | null;

  @Column({ name: "is_active", type: "bool" })
  isActive!: boolean;

  @Column({ type: "text", nullable: true })
  shoots!: string | null;

  @Column({ name: "created_at", type: "timestamptz", default: () => "now()" })
  createdAt!: Date;

  @Column({ name: "updated_at", type: "timestamptz", default: () => "now()" })
  updatedAt!: Date;
}
