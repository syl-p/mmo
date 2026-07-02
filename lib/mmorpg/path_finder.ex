defmodule Mmorpg.PathFinder do
  alias Mmorpg.Systems.Utils

  @spec random() :: list(%{x: number(), y: number()})
  def random do
    Enum.map(1..5, fn _ -> Utils.generate_position(200) end)
  end

  def find_path(grid, from, to) do
    cond do
      from == to ->
        {:ok, [from]}

      true ->
        case walkable?(grid, to) do
          true -> astar(grid, from, to)
          false -> {:error, :unreachable}
        end
    end
  end

  defp astar(grid, from, to) do
    heuristic = heuristic(from, to)

    open = %{from => heuristic}
    gscore = %{from => 0}
    came_from = %{}

    loop(grid, to, open, gscore, came_from)
  end

  defp loop(_grid, _to, open, _gscore, _came_from) when map_size(open) == 0 do
    {:error, :no_path}
  end

  defp loop(grid, to, open, gscore, came_from) do
    # get the position with the lowest heuristic
    current = Enum.min_by(open, fn {_pos, h} -> h end) |> elem(0)

    if current == to do
      {:ok, reconstruct(came_from, current)}
    else
      open = Map.delete(open, current)
      g_current = Map.get(gscore, current, :infinity)

      {open, gscore, came_from} =
        neighbors(current, grid)
        |> Enum.reduce({open, gscore, came_from}, fn neighbor, {o, g, cf} ->
          tentative_g = g_current + cost(grid, neighbor)

          if tentative_g < Map.get(g, neighbor, :infinity) do
            f = tentative_g + heuristic(neighbor, to)

            {
              Map.put(o, neighbor, f),
              Map.put(g, neighbor, tentative_g),
              Map.put(cf, neighbor, current)
            }
          else
            {o, g, cf}
          end
        end)

      loop(grid, to, open, gscore, came_from)
    end
  end

  defp heuristic({x1, y1}, {x2, y2}) do
    abs(x1 - x2) + abs(y1 - y2)
  end

  defp walkable?(grid, position) do
    case Map.get(grid.cells, position) do
      nil -> false
      cell -> cell.walkable
    end
  end

  # check adjacent positions for walkability
  def neighbors({x, y}, grid) do
    [{x - 1, y}, {x + 1, y}, {x, y - 1}, {x, y + 1}]
    |> Enum.filter(fn pos -> walkable?(grid, pos) end)
  end

  # get cost from a cell
  def cost(grid, pos) do
    Map.get(grid.cells, pos, %{cost: 1}) |> Map.get(:cost)
  end

  defp reconstruct(came_from, current, path \\ []) do
    case Map.get(came_from, current) do
      nil -> [current | path]
      prev -> reconstruct(came_from, prev, [current | path])
    end
  end
end
