defmodule Mmorpg.PlayerState do
  @derive Jason.Encoder
  defstruct [
    :uuid,
    :fsm_state,
    position: %{
      x: 0,
      y: 0,
      z: 0
    },
    hp: 100
  ]
end
