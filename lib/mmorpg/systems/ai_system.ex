defmodule Mmorpg.Systems.AiSystem do
  alias Mmorpg.PlayerState
  alias Mmorpg.Systems.Utils
  alias Mmorpg.MobState

  def update(%MobState{} = state, players) when is_list(players) do
    state |> update_ai(players)
  end

  defp update_ai(%MobState{fsm_state: fsm_state} = state, players) do
    case fsm_state do
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
      patrol_points = Enum.map(1..5, fn _ -> Utils.generate_position(100) end)

      %MobState{
        state
        | fsm_state: :patrol,
          patrol_points: patrol_points,
          ai: %{state.ai | cooldown_until: 0}
      }
    end
  end

  defp handle_patrol(%MobState{ai: ai} = state, players) do
    case check_nearest_player(players, state) do
      [] ->
        state

      [player | _tail] ->
				if player.hp > 0 do
					%MobState{
						state
						| fsm_state: :chase,
							patrol_points: [],
							ai: %{ai | target_id: player.uuid}
					}
				else
					state
				end
    end
  end

  defp handle_chase(%MobState{ai: ai, position: position, rotation: _rotation} = state, players) do
    player = Enum.find(players, fn player -> player.uuid == ai.target_id end)

    if player do
      dx = player.position.x - position.x
      dy = player.position.y - position.y
      dz = player.position.z - position.z
      dist = :math.sqrt(dx * dx + dy * dy + dz * dz)

			# TAKE DECISION
			cond do
				dist < ai.attack_range ->
					ai = %{ai | state: :attack}
        	%MobState{state | fsm_state: :attack, ai: ai}
				dist > ai.aggro_range ->
					ai = %{ai | state: :idle}
        	%MobState{state | fsm_state: :idle, ai: ai}
				true ->
					rotation = :math.atan2(dz, dx)
					step = 0.05

					position = %{
						x: position.x + step * dx / dist,
						y: position.y + step * dy / dist,
						z: position.z + step * dz / dist
					}

					%MobState{state | position: position, rotation: rotation, ai: ai}
			end
    else
      %MobState{state | fsm_state: :idle, ai: %{ai | state: :idle}}
    end
  end

  def handle_attack(%MobState{} = state, players) do
		ai = state.ai
		player = Enum.find(players, fn p -> p.uuid == ai.target_id end)

		# TAKE DECISION
    cond do
			player == nil ->
				%MobState{state | fsm_state: :idle, ai: %{ai | target_id: nil}}
      ai.target_id == nil ->
				%MobState{state | fsm_state: :idle}
			player.hp == 0 ->
				%MobState{state | fsm_state: :idle, ai: %{ai | target_id: nil}}
			Utils.distance(player.position, state.position) > 4 ->
				%MobState{state | fsm_state: :chase}
      !on_cooldown?(state) ->
				state |> perform_attack() |> set_cooldown(2000)
      on_cooldown?(state) ->
				state
    end
  end

  @spec check_nearest_player(list(%PlayerState{}), %MobState{}) :: list()
  defp check_nearest_player(players, %MobState{position: mob_position} = _state) do
    Enum.filter(players, fn player ->
      dist = Utils.distance(player.position, mob_position)
      # IO.inspect(dist, label: "Distance from mob #{mob_uuid} to player #{player.uuid}")
      dist < 20
    end)
  end

  defp perform_attack(%MobState{} = state) do
		case Registry.lookup(Mmorpg.PlayerRegistry, state.ai.target_id) do
			[{player_pid, _value}] ->
				GenServer.cast(player_pid, {:take_damage, state.combat.damage})
				state
			[] ->
				IO.puts("player not found !")
				%MobState{state | fsm_state: :idle }
		end

    state
  end

  @spec on_cooldown?(%MobState{}) :: boolean()
  defp on_cooldown?(state) do
    state.ai.cooldown_until != 0 and System.monotonic_time(:millisecond) < state.ai.cooldown_until
  end

  defp set_cooldown(%MobState{} = state, ms) do
    cooldown_until = System.monotonic_time(:millisecond) + ms
    %MobState{state | ai: %{state.ai | cooldown_until: cooldown_until}}
  end
end
