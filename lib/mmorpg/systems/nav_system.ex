defmodule Mmorpg.Systems.Nav do
  alias Mmorpg.Components.Transform
  alias Mmorpg.Components.Position
  alias Mmorpg.Components.NavAgent
  alias Mmorpg.PlayerState

  def update(state) do
    state |> handle_navigation()
  end

  defp handle_navigation(
         %PlayerState{
           transform: %Transform{position: position},
           nav_agent: %NavAgent{path: path, speed: speed, is_moving: true}
         } = state
       ) do
    # IO.puts("navigating to target: #{inspect(path |> List.first())}")
    target = path |> List.first()

    dx = target.x - position.x
    dy = target.y - position.y

    dist = :math.sqrt(dx * dx + dy * dy)

    if dist < 0.1 do
      new_path = path |> List.delete(target)
      is_moving = new_path != []

      state |> Map.put(:nav_agent, %NavAgent{path: new_path, is_moving: is_moving})
    else
      new_position = %Position{
        x: position.x + speed * dx / dist,
        y: position.y + speed * dy / dist
      }

      state
      |> Map.put(:transform, %Transform{position: new_position})
      |> Map.put(:nav_agent, %NavAgent{path: path, is_moving: true})
    end
  end

  defp handle_navigation(%PlayerState{} = state), do: state
end
