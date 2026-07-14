defmodule Mmorpg.MatchVsMobServer do
	use GenServer
	@turn_time 30000

	def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def init(_opts) do
		IO.puts("combat started")
    {:ok, %{}}
  end
end
