defmodule Mmorpg.MobServer do
  alias Mmorpg.Components
  alias Mmorpg.Systems
  alias Mmorpg.MobState
  use GenServer

  def start_link(mob_id) do
    GenServer.start_link(__MODULE__, mob_id, name: via_tuple(mob_id))
  end

  def init(mob_id) do
    spawn_position = Systems.Utils.generate_position(50)

    mob_state = %MobState{
      uuid: mob_id,
			transform: %Components.Transform{position: spawn_position},
      ai: %Components.Ai{
				state: :idle,
			},
			patrol_points: []
    }

    {:ok, mob_state}
  end

  def handle_cast({:update, players}, state) do
    new_state =
      state
      |> Systems.AiSystem.update(players)
      |> Systems.Patrol.update()

    {:noreply, new_state}
  end

  defp via_tuple(mob_id) do
    {:via, Registry, {Mmorpg.MobRegistry, mob_id}}
  end
end
