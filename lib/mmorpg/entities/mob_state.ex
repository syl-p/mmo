defmodule Mmorpg.MobState do
  alias Mmorpg.Components

  @derive Jason.Encoder
  defstruct [
    :uuid,
    transform: %Components.Transform{},
    ai: %Components.Ai{},
		combat: %Components.Combat{},
    velocity: 1,
    patrol_points: [],
    current_patrol_index: 0,
    rotation: 0.0
  ]
end
