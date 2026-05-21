defmodule Mmorpg.Systems.Utils do
  @spec generate_position(number()) :: %{x: float(), y: 0, z: float()}
  def generate_position(max_radius) do
    %{x: (:rand.uniform() - 0.5) * max_radius, y: 0, z: (:rand.uniform() - 0.5) * max_radius}
  end

  def distance(%{x: _x1, y: _y1, z: _z1} = a, %{x: _x2, y: _y2, z: _z2} = b) do
    dx = a.x - b.x
    dy = a.y - b.y
    dz = a.z - b.z

    :math.sqrt(dx * dx + dy * dy + dz * dz)
  end
end
