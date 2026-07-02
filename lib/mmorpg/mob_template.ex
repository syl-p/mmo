defmodule Mmorpg.MobTemplate do
  use Ecto.Schema
  import Ecto.Changeset

  schema "mob_templates" do
    field :name, :string
    field :health, :integer, default: 100
    field :damage, :integer, default: 5
    field :speed, :integer, default: 3
    field :loot, :map
    field :spawn_points, {:array, :map}
    field :patrol_waypoints, {:array, :map}

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(mob_template, attrs) do
    mob_template
    |> cast(attrs, [:name, :health, :damage, :speed, :loot, :spawn_points, :patrol_waypoints])
    |> validate_required([:name, :spawn_points, :patrol_waypoints])
  end
end
