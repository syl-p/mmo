defmodule Mmorpg.Systems.AiSystem do
  alias Mmorpg.Components.Ai
  alias Mmorpg.PlayerState
  alias Mmorpg.Systems.Utils
  alias Mmorpg.MobState

  def update(%MobState{} = state, players) when is_list(players) do
    state |> update_ai(players)
  end

  defp update_ai(%MobState{ai: %{state: ai_state}} = state, players) do
		# WHAT TO DO ?
    case ai_state do
      :idle -> handle_idle(state, players)
      :patrol -> handle_patrol(state, players)
      :chase -> handle_chase(state, players)
      :attack -> handle_attack(state, players)
      _ -> IO.puts("not implemented")
    end
  end

  defp handle_idle(%MobState{} = state, _players) do
    state = if state.ai.cooldown_until == 0, do: set_cooldown(state, 2000), else: state

    if on_cooldown?(state) do
      state
    else
			# Generate random patrol points around the mob
      patrol_points = Enum.map(1..5, fn _ -> Utils.generate_position(100) end)

      %MobState{ state |
				patrol_points: patrol_points,
				ai: %{state.ai | state: :patrol, cooldown_until: 0}
			}
    end
  end

  defp handle_patrol(%MobState{ai: %Ai{} = ai} = state, players) do
    case check_nearest_player(players, state) do
      [] -> # No player nearby, continue patrol
        state

      [player | _tail] -> # Player detected, switch to chase
				if player.hp > 0 do
					%MobState{ state |
						patrol_points: [],
						ai: %{ai | state: :chase, target_id: player.uuid}
					}
				else
					state
				end
    end
  end

	defp handle_chase(%MobState{ai: %Ai{} = ai, transform: transform} = state, players) do
    case Enum.find(players, fn player -> player.uuid == ai.target_id end) do
			%PlayerState{} = player ->
				dx = player.transform.position.x - transform.position.x
				dy = player.transform.position.y - transform.position.y
				dz = player.transform.position.z - transform.position.z
				dist = :math.sqrt(dx * dx + dy * dy + dz * dz)

				# TAKE DECISION
				cond do
					dist < ai.attack_range ->
						ai = %{ai | state: :attack}
						%MobState{state | ai: ai}
					dist > ai.aggro_range ->
						ai = %{ai | state: :idle}
						%MobState{state | ai: ai}
					true ->
						# CHASING !
						rotation = :math.atan2(dz, dx)
						step = 0.05

						position = %{
							x: transform.position.x + step * dx / dist,
							y: transform.position.y + step * dy / dist,
							z: transform.position.z + step * dz / dist
						}

						%MobState{state |
						transform: %{transform | position: position, rotation: rotation}}
				end
			nil -> %MobState{state | ai: %{ai | state: :idle}}
		end
  end

  @spec handle_attack(%Mmorpg.MobState{}, list(%Mmorpg.PlayerState{})) :: %Mmorpg.MobState{}
  def handle_attack(%MobState{} = state, players) do
		ai = state.ai
		player = Enum.find(players, fn p -> p.uuid == ai.target_id end)

		# TAKE DECISION
    cond do
			player == nil || player.hp == 0  ->
				%MobState{state | ai: %{ai | state: :idle, target_id: nil}}
      ai.target_id == nil ->
				%MobState{state | ai: %{ai | state: :idle}}
			Utils.distance(player.transform.position, state.transform.position) > state.ai.attack_range ->
				%MobState{state | ai: %{ai | state: :chase}}
      !on_cooldown?(state) ->
				state |> perform_attack() |> set_cooldown(2000)
      on_cooldown?(state) ->
				state
    end
  end

  @spec check_nearest_player(list(%PlayerState{}), %MobState{}) :: list()
  defp check_nearest_player(players, %MobState{transform: %{position: mob_position}, ai: %Ai{aggro_range: aggro_range}} = _state) do
    Enum.filter(players, fn player ->
      dist = Utils.distance(player.transform.position, mob_position)
      dist < aggro_range
    end)
  end

  defp perform_attack(%MobState{} = state) do
		case Registry.lookup(Mmorpg.PlayerRegistry, state.ai.target_id) do
			[{player_pid, _value}] ->
				GenServer.cast(player_pid, {:take_damage, state.combat.damage})
				state
			[] ->
				IO.puts("player not found !")
				%MobState{state | ai: %{state.ai | target_id: nil, state: :idle}}
		end

    state
  end

  @spec on_cooldown?(%MobState{}) :: boolean()
  defp on_cooldown?(state) do
    state.ai.cooldown_until != 0 and System.monotonic_time(:millisecond) < state.ai.cooldown_until
  end

  defp set_cooldown(%MobState{ai: %Ai{} = ai} = state, ms) do
    cooldown_until = System.monotonic_time(:millisecond) + ms
    %MobState{state | ai: %{ai | cooldown_until: cooldown_until}}
  end
end
