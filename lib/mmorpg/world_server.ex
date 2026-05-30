defmodule Mmorpg.WorldServer do
  use GenServer
  @world_channel "room:42"
  @tick_rate 50

  def start_link(_) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @impl true
  def init(_) do
    schedule_tick()
    mobs = generate_mobs(5)

    state = %{
      players: %{},
      mobs: mobs
    }

    {:ok, state}
  end

  @impl true
  def handle_call({:join_player, uuid}, _from, state) do
    case DynamicSupervisor.start_child(Mmorpg.PlayerSupervisor, {Mmorpg.PlayerServer, uuid}) do
      {:ok, pid} ->
        players = Map.put(state.players, uuid, pid)
        initial_state = :sys.get_state(pid)

        broadcast(:player_joined, initial_state)
        {:reply, {:ok, pid, initial_state}, %{state | players: players}}

      {:error, message} ->
        {:reply, {:error, message}, state}
    end
  end

  def handle_call({:get_world_snapshot}, _from, state) do
    world_snapshot = get_world_snapshot(state)

    {:reply, world_snapshot, state}
  end

  def handle_cast({:player_left, uuid}, state) do
    {pid, players} = Map.pop(state.players, uuid)

    if pid do
      Process.exit(pid, :normal)
      broadcast(:player_left, %{uuid: uuid})
    end

    {:noreply, %{state | players: players}}
  end

  @impl true
  def handle_cast({:player_update, player_state}, state) do
    pid = Map.get(state.players, player_state.uuid)
    if pid, do: GenServer.cast(pid, {:update_player, player_state})

    {:noreply, state}
  end

  @impl true
  def handle_info(:tick, state) do
    state_map = get_world_snapshot(state)

    Enum.each(state.mobs, fn {_id, pid} ->
      if Process.alive?(pid) do
        GenServer.cast(pid, {:update, state_map.players})
      end
    end)

    broadcast(:world_update, state_map)

    schedule_tick()
    {:noreply, state}
  end

  @impl true
	# Prevent global error if a mob genserver go down
  def handle_info({:DOWN, _ref, :process, pid, reason}, state) do
    mobs =
      case Enum.find(state.mobs, fn {_id, p} -> p == pid end) do
        {mob_id, _pid} ->
          IO.puts("[WorldServer] Mob##{mob_id} crashed: #{inspect(reason)}")
          Map.delete(state.mobs, mob_id)

        nil ->
          state.mobs
      end

    {:noreply, %{state | mobs: mobs}}
  end

	##### PRIVATE FUNCTS

  defp broadcast(event, payload) do
    Phoenix.PubSub.broadcast(
      Mmorpg.PubSub,
      @world_channel,
      {event, payload}
    )
  end

  defp get_world_snapshot(state) do
    players =
      Enum.map(state.players, fn {_id, pid} ->
        :sys.get_state(pid)
      end)

    mobs =
      state.mobs
      |> Enum.filter(fn {_id, pid} -> Process.alive?(pid) end)
      |> Enum.map(fn {_id, pid} ->
        :sys.get_state(pid)
      end)

    %{players: players, mobs: mobs}
  end

	# generates some mobs and monitor process
  defp generate_mobs(count) do
    1..count
    |> Enum.map(fn i ->
      {:ok, pid} = DynamicSupervisor.start_child(Mmorpg.MobSupervisor, {Mmorpg.MobServer, i})

			# to be notified if Mob is down
			Process.monitor(pid)

			{i, pid}
    end)
    |> Map.new()
  end

  defp schedule_tick do
    Process.send_after(self(), :tick, @tick_rate)
  end
end
