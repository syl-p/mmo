defmodule Mmorpg.PlayerServer do
  alias Mmorpg.Components
  alias Mmorpg.PlayerState
  alias Mmorpg.Systems
  use GenServer

  def start_link([player_id, _spawn_position] = args) do
    GenServer.start_link(__MODULE__, args, name: via_tuple(player_id))
  end

  @impl true
  def init([player_id, spawn_position]) do
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

  # CALLS

  @impl true
  def handle_call(
        {:move_player, to},
        _from,
        %PlayerState{transform: %Components.Transform{position: from}} = player_state
      ) do
    case GenServer.call(Mmorpg.WorldServer, {:query_path, from, to}) do
      {:ok, path} ->
        path = path |> Enum.map(fn {x, y} -> %{x: x, y: y} end)

        new_state = %PlayerState{
          player_state
          | nav_agent: %Components.NavAgent{
              path: path,
              is_moving: true
            }
        }

        {:reply, {:ok, path}, new_state}

      {:error, reason} ->
        {:reply, {:error, reason}, player_state}
    end
  end

  # CASTS

  def handle_cast({:update}, state) do
    new_state =
      state |> Systems.Nav.update()

    {:noreply, new_state}
  end

  @impl true
  def handle_cast({:take_damage, amount}, %PlayerState{} = state) do
    IO.puts("aie ! Ouch !")

    {:noreply, %PlayerState{state | hp: state.hp - amount}}
  end
end
