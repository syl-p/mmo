defmodule Mmorpg.MobServer do
  alias Mmorpg.PathFinder
  alias Mmorpg.Components
  alias Mmorpg.Systems
  alias Mmorpg.MobState
  use GenServer

  def start_link(mob_id) do
    GenServer.start_link(__MODULE__, mob_id, name: via_tuple(mob_id))
  end

  def init(mob_id) do
    patrol_points = PathFinder.random()
    [spawn_position | _tail] = patrol_points

    mob_state = %MobState{
      uuid: mob_id,
      transform: %Components.Transform{position: spawn_position},
      patrol: %Components.Patrol{patrol_points: patrol_points},
      ai: %Components.Ai{
        state: :idle
      }
    }

    {:ok, mob_state}
  end

  def handle_cast({:update, players}, state) do
    new_state =
      state
      |> Systems.AiSystem.update(players)
      |> Systems.Patrol.update()
      |> Systems.ChaseSystem.update(players)

    {:noreply, new_state}
  end

  defp via_tuple(mob_id) do
    {:via, Registry, {Mmorpg.MobRegistry, mob_id}}
  end
end
