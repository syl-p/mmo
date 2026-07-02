defmodule Mmorpg.Components.Transform do
  alias Mmorpg.Components.Position

  @derive Jason.Encoder
  defstruct position: %Position{x: 0, y: 0},
            rotation: %{x: 0, y: 0, z: 0},
            velocitiy: 1
end
