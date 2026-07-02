defmodule Mmorpg.Components.NavAgent do
  @derive Jason.Encoder
  defstruct [
    :path,
    is_moving: false,
    speed: 1.0
  ]
end
