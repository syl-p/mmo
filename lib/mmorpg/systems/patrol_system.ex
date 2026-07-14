defmodule Mmorpg.Systems.Patrol do
  alias Mmorpg.Components.Position
  alias Mmorpg.Components.Transform
  alias Mmorpg.Components.Ai
  alias Mmorpg.Components.Patrol
  alias Mmorpg.MobState

  def update(state) do
    state |> patrol()
  end

  def patrol(
        %MobState{
          ai: %Ai{state: :patrol},
          transform:
            %Transform{
              position: %Position{} = position
            } = transform,
          patrol: %Patrol{
            patrol_points: patrol_points,
            current_patrol_index: current_patrol_index
          }
        } = state
      )
      when patrol_points != [] do
    target = Enum.at(patrol_points, current_patrol_index)

    dx = target.x - position.x
    dy = target.y - position.y

    dist = :math.sqrt(dx * dx + dy * dy)

    rotation = :math.atan2(dy, dx)

    if dist < 0.1 do
      # Move to the next patrol point
      new_index = rem(current_patrol_index + 1, length(patrol_points))

      %MobState{
        state
        | patrol: %Patrol{state.patrol |
				current_patrol_index: new_index},
          rotation: rotation
      }
    else
      # Move towards the target
      step = 0.05

      new_position = %Position{
        x: position.x + step * dx / dist,
        y: position.y + step * dy / dist
      }

      %MobState{
        state
        | transform: %Transform{transform | position: new_position, rotation: rotation}
      }
    end
  end

  def patrol(state), do: state
end
