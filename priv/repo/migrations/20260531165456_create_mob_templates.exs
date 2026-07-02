defmodule Mmorpg.Repo.Migrations.CreateMobTemplates do
  use Ecto.Migration

  def change do
    create table(:mob_templates) do
      add :name, :string
      add :health, :integer
      add :damage, :integer
      add :speed, :integer
      add :loot, :map
      add :spawn_points, {:array, :map}
      add :patrol_waypoints, {:array, :map}

      timestamps(type: :utc_datetime)
    end
  end
end
