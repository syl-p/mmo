defmodule MmorpgWeb.RoomChannel do
  use MmorpgWeb, :channel
  alias Mmorpg.WorldServer

  @impl true
  def join("room:" <> _room_id, payload, socket) do
    if authorized?(payload) do
      uuid = socket.assigns.uuid

      case GenServer.call(WorldServer, {:join_player, uuid}) do
        {:ok, initial_state, grid} ->
          send(self(), :after_join)

          grid_payload = %{
            width: grid.width,
            height: grid.height,
            obstacles:
              grid.cells
              |> Enum.filter(fn {_pos, cell} -> not cell.walkable end)
              # serialize
              |> Enum.map(fn {{x, y}, _cell} -> %{x: x, y: y} end)
          }

          {:ok,
           %{
             player_uuid: uuid,
             initial_state: initial_state,
             grid: grid_payload
           }, socket}

        {:error, _message} ->
          {:error, %{reason: "World doesn't want you !"}}
      end
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_info(:after_join, socket) do
    world_snapshot = GenServer.call(WorldServer, {:get_world_snapshot})

    push(socket, "presence_state", world_snapshot)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:player_joined, initial_state}, socket) do
    push(socket, "player_joined", initial_state)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:player_left, %{uuid: uuid}}, socket) do
    push(socket, "player_left", %{uuid: uuid})
    {:noreply, socket}
  end

  @impl true
  def handle_info({:world_update, world_snapshot}, socket) do
    push(socket, "world_updated", %{
      players: world_snapshot.players,
      mobs: world_snapshot.mobs
    })

    {:noreply, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    uuid = socket.assigns.uuid

    GenServer.cast(WorldServer, {:player_left, uuid})
    :ok
  end

  @impl true
  def handle_in(
        "select_cell",
        # serialize
        %{"x" => to_x, "y" => to_y},
        socket
      ) do
    player_server = Mmorpg.PlayerServer.via_tuple(socket.assigns.uuid)

    case GenServer.call(player_server, {:move_player, %{x: to_x, y: to_y}}) do
      {:ok, path} ->
        push(socket, "path_found", %{path: path})
        {:noreply, socket}

      {:error, reason} ->
        push(socket, "path_error", %{reason: reason})
        {:noreply, socket}
    end
  end

  # Add authorization logic here as required.
  defp authorized?(_payload) do
    true
  end
end
