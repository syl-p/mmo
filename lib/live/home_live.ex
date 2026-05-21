defmodule MmorpgWeb.HomeLive do
  require Logger
  use MmorpgWeb, :live_view

  def mount(_params, _session, socket) do
    _uuid = Ecto.UUID.generate()

    if connected?(socket) do
      Phoenix.PubSub.subscribe(Mmorpg.PubSub, "room:42")
    end

    {:ok, assign(socket, players: %{})}
  end

	def handle_info({:player_joined, player_state}, socket) do
		players = Map.put(socket.assigns.players, player_state.uuid, player_state)
		{:noreply, assign(socket, players: players)}
	end

	def handle_info({:player_left, %{uuid: uuid}}, socket) do
		players = Map.delete(socket.assigns.players, uuid)
		{:noreply, assign(socket, players: players)}
	end

	def handle_info({:world_update, _world_state}, socket) do
		{:noreply, socket}
	end
end
