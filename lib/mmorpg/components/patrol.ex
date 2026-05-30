defmodule Mmorpg.Components.Patrol do
	@derive Jason.Encoder
	defstruct [
		patrol_points: [],
		current_patrol_index: 0
	]
end
