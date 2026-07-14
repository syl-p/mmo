defmodule Mmorpg.ChatServer do
  use GenServer
	@max_messages 10

  @spec start_link(any()) :: :ignore | {:error, any()} | {:ok, pid()}
  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def init(_opts) do
    {:ok, %{
			messages: []
		}}
  end

	def send_message(player, message) do
		GenServer.cast(__MODULE__, {:message, player, message})
	end

	def handle_cast({:message, player, message}, state) do
		msg = %{player: player, message: message, inserted_at: DateTime.utc_now()}
		messages  = [msg | state.messages] |> Enum.take(@max_messages)

		Phoenix.PubSub.broadcast(Mmorpg.PubSub, "chat", {:new_message, msg})

		{:noreply, %{state | messages: messages}}
	end
end
