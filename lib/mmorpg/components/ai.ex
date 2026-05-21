defmodule Mmorpg.Components.Ai do
  @derive Jason.Encoder
  defstruct [
    :state,
    target_id: nil,
    cooldown_until: 0,
    aggro_range: 10,
    attack_range: 5
  ]
end
