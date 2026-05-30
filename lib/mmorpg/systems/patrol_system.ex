defmodule Mmorpg.Systems.Patrol do
  alias Mmorpg.MobState

  def update(state) do
    state |> patrol()
  end

  def patrol(%MobState{patrol_points: [], transform: _transform} = state), do: state

  def patrol(
        %{
          transform: transform,
          patrol_points: patrol_points,
          current_patrol_index: current_patrol_index
        } = state
      ) do
    target = Enum.at(patrol_points, current_patrol_index)

    dx = target.x - transform.position.x
    dy = target.y - transform.position.y
    dz = target.z - transform.position.z

    # find distance to target
    dist = :math.sqrt(dx * dx + dy * dy + dz * dz)

    # find rotation to look at target
    rotation = :math.atan2(dz, dx)

    if dist < 0.1 do
      # Move to the next patrol point
      new_index = rem(current_patrol_index + 1, length(patrol_points))
      %{state | current_patrol_index: new_index, rotation: rotation}
    else
      # Move towards the target
      step = 0.05

      new_position = %{
        x: transform.position.x + step * dx / dist,
        y: transform.position.y + step * dy / dist,
        z: transform.position.z + step * dz / dist
      }

      %{state | transform: %{transform | position: new_position, rotation: rotation}}
    end
  end

  # defp generate_patrols_points(count, max_radius) do
  #   Enum.map(1..count, fn _ ->
  #     Utils.generate_position(max_radius)
  #   end)
  # end
end
