defmodule Mmorpg.Systems.ChaseSystem do
  alias Mmorpg.Components.Ai
  alias Mmorpg.PlayerState
  alias Mmorpg.MobState

  def update(%MobState{} = state, players) when is_list(players) do
    state |> update_chase(players)
  end

  defp update_chase(
         %MobState{ai: %Ai{target_id: target_id, state: :chase}, transform: transform} = state,
         players
       ) do
    case Enum.find(players, fn player -> player.uuid == target_id end) do
      %PlayerState{} = player ->
        dx = player.transform.position.x - transform.position.x
        dy = player.transform.position.y - transform.position.y
        dist = :math.sqrt(dx * dx + dy * dy)

        rotation = :math.atan2(dy, dx)
        step = 0.05

        position = %{
          x: transform.position.x + step * dx / dist,
          y: transform.position.y + step * dy / dist
        }

        %MobState{state | transform: %{transform | position: position, rotation: rotation}}

      nil ->
        state
    end
  end

  # No Chase State
  defp update_chase(state, _players), do: state
end
