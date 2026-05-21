defmodule Mmorpg.Components.Transform do
  @derive Jason.Encoder
  defstruct position: %{x: 0, y: 0, z: 0},
            rotation: %{x: 0, y: 0, z: 0},
            velocitiy: 1
end
