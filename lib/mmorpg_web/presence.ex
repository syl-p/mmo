defmodule MmorpgWeb.Presence do
  use Phoenix.Presence,
    otp_app: :mmorpg,
    pubsub_server: Mmorpg.PubSub
end
