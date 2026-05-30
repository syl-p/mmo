defmodule Mmorpg.PlayerServer do
  alias Mmorpg.Components
  alias Mmorpg.PlayerState
  use GenServer

  def start_link(player_id) do
    GenServer.start_link(__MODULE__, player_id, name: via_tuple(player_id))
  end

  @impl true
  def init(player_id) do
    spawn_position = %{x: :rand.uniform(30), y: 0, z: :rand.uniform(30)}

    player_state = %PlayerState{
      uuid: player_id,
      fsm_state: :idle,
      transform: %Components.Transform{
        position: spawn_position
      }
    }

    {:ok, player_state}
  end

  def via_tuple(player_id) do
    {:via, Registry, {Mmorpg.PlayerRegistry, player_id}}
  end

  @impl true
  def handle_cast(
        {:update_player, %{fsm_state: fsm_state, position: position}},
        %PlayerState{} = player_state
      ) do
    new_state = %PlayerState{
      player_state
      | fsm_state: String.to_atom(fsm_state),
        transform: %Components.Transform{
					position: position
				}
    }

    {:noreply, new_state}
  end

  @impl true
  def handle_cast({:take_damage, amount}, %PlayerState{} = state) do
    IO.puts("aie ! Ouch !")

    {:noreply, %PlayerState{state | hp: state.hp - amount}}
  end
end
