defmodule Mmorpg.ChatServer do
  use GenServer

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, [])
  end

  def init(_opts) do
    {:ok, []}
  end
end
