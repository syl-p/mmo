defmodule MmorpgWeb.ChatComponent do
  use MmorpgWeb, :live_component
  alias Mmorpg.ChatServer

  def render(assigns) do
    ~H"""
    <div id="chat">
      <div class="chat-messages">
        <%= for msg <- @messages do %>
          <div class="chat-message">
            <strong>{msg.player}:</strong> {msg.message}
          </div>
        <% end %>
      </div>
      <form phx-submit="send_message" phx-target={@myself}>
        <input
          type="text"
          name="message"
          value={@message}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
    """
  end

  def update(assigns, socket) do
    {:ok, socket |> assign(assigns) |> assign_new(:message, fn -> "" end)}
  end

  def handle_event("send_message", %{"message" => message}, socket) do
    message = String.trim(message)

    if message == "" do
      {:noreply, assign(socket, :message, "")}
    else
      player = socket.assigns.my_uuid
      ChatServer.send_message(player, message)
      {:noreply, assign(socket, :message, "")}
    end
  end
end
