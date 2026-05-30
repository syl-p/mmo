defmodule Mmorpg.PlayerState do
  alias Mmorpg.Components

  @derive Jason.Encoder
  defstruct [
    :uuid,
    :fsm_state,
    hp: 100,
		transform: %Components.Transform{position: %{x: 0, y: 0, z: 0}},
  ]
end
