defmodule MmorpgWeb.HomeLive do
	require Logger
  use MmorpgWeb, :live_view

  def mount(_params, _session, socket) do
    if connected?(socket) do
      Phoenix.PubSub.subscribe(Mmorpg.PubSub, "room:42")
    end
		socket = assign(socket, :my_uuid, "")

    {:ok, assign(socket, :players, %{})}
  end

	def handle_event("set_player_uuid", %{"uuid" => uuid}, socket) do
		{:noreply, assign(socket, my_uuid: uuid)}
	end

	def handle_info({:player_joined, player_state}, socket) do
		players = Map.put(socket.assigns.players, player_state.uuid, player_state)
		{:noreply, assign(socket, players: players)}
	end

	def handle_info({:player_left, %{uuid: uuid}}, socket) do
		players = Map.delete(socket.assigns.players, uuid)
		{:noreply, assign(socket, players: players)}
	end

	def handle_info({:world_update, %{players: players}}, socket) do
		players_map = Map.new(players, fn p -> {p.uuid, p} end)
		# Logger.info("=== world_update: my_uuid=#{inspect(socket.assigns.my_uuid)} players_keys=#{inspect(Map.keys(players_map))}")
  	{:noreply, assign(socket, :players, players_map)}
	end
end
