defmodule Mmorpg.MobState do
  alias Mmorpg.Components

  @derive Jason.Encoder
  defstruct [
    :uuid,
    transform: %Components.Transform{},
    ai: %Components.Ai{},
		combat: %Components.Combat{},
    velocity: 1,
		patrol: %Components.Patrol{},
    rotation: 0.0
  ]
end
