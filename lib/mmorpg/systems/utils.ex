defmodule Mmorpg.Systems.Utils do
  @spec generate_position(number()) :: %{x: float(), y: float()}
  def generate_position(max_radius) when is_number(max_radius) do
    %{x: (:rand.uniform() - 0.5) * max_radius, y: (:rand.uniform() - 0.5) * max_radius}
  end

  def distance(%{x: _x1, y: _y1} = a, %{x: _x2, y: _y2} = b) do
    dx = a.x - b.x
    dy = a.y - b.y
    :math.sqrt(dx * dx + dy * dy)
  end
end
