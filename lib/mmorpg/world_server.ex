defmodule Mmorpg.WorldServer do
  alias Mmorpg.PathFinder
  alias Mmorpg.Grid
  use GenServer
  @world_channel "room:42"
  @tick_rate 50

  @spec start_link(any()) :: :ignore | {:error, any()} | {:ok, pid()}
  def start_link(_) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @impl true
  def init(_) do
    schedule_tick()
    mobs = generate_mobs(20)

    grid =
      Grid.generate(
        width: 50,
        height: 50,
        manual_obstacles: MapSet.new([{10, 10}, {30, 40}, {30, 30}])
      )

    IO.puts("world initialized: grid=#{inspect(grid)}")

    state = %{
      players: %{},
      mobs: mobs,
      grid: grid
    }

    {:ok, state}
  end

  # CALLS

  @impl true
  def handle_call({:join_player, uuid}, _from, state) do
    spawn_position = Grid.random_walkable(state.grid)

    case DynamicSupervisor.start_child(
           Mmorpg.PlayerSupervisor,
           {Mmorpg.PlayerServer, [uuid, spawn_position]}
         ) do
      {:ok, pid} ->
        players = Map.put(state.players, uuid, pid)
        initial_state = :sys.get_state(pid)
        grid = state.grid

        broadcast(:player_joined, initial_state)
        {:reply, {:ok, initial_state, grid}, %{state | players: players}}

      {:error, message} ->
        {:reply, {:error, message}, state}
    end
  end

  def handle_call({:get_world_snapshot}, _from, state) do
    world_snapshot = get_world_snapshot(state)

    {:reply, world_snapshot, state}
  end

  def handle_call({:query_path, from, to}, _from, state) do
    from = {round(from.x), round(from.y)}
    to = {round(to.x), round(to.y)}

    IO.puts("query_path: from=#{inspect(from)} to=#{inspect(to)}")

    case PathFinder.find_path(state.grid, from, to) do
      {:error, reason} ->
        IO.puts("query_path: error=#{inspect(reason)}")
        {:reply, {:error, reason}, state}

      path ->
        {:reply, path, state}
    end
  end

  # CASTS

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

  # INFOS

  @impl true
  def handle_info(:tick, state) do
    state_map = get_world_snapshot(state)

    Enum.each(state.mobs, fn {_id, pid} ->
      if Process.alive?(pid) do
        GenServer.cast(pid, {:update, state_map.players})
      end
    end)

    Enum.each(state.players, fn {_uuid, pid} ->
      if Process.alive?(pid) do
        GenServer.cast(pid, {:update})
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
      state.players
      |> Enum.filter(fn {_uuid, pid} -> Process.alive?(pid) end)
      |> Enum.map(fn {_uuid, pid} ->
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
