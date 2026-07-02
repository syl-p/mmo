defmodule Mmorpg.Grid do
  def generate(opts) do
    width = Keyword.fetch!(opts, :width)
    height = Keyword.fetch!(opts, :height)
    manual_obstacles = Keyword.get(opts, :manual_obstacles, MapSet.new())

    cells =
      for x <- 0..(width - 1), y <- 0..(height - 1), into: %{} do
        walkable =
          cond do
            MapSet.member?(manual_obstacles, {x, y}) -> false
            true -> true
          end

        {{x, y}, %{walkable: walkable, cost: 1}}
      end

    %{width: width, height: height, cells: cells}
  end

  def random_walkable(grid) do
    walkable = grid.cells |> Enum.filter(fn {_pos, cell} -> cell.walkable end)
    random_cell = Enum.random(walkable)

    {pos, _cell} = random_cell

    %{x: pos |> elem(0), y: pos |> elem(1)}
  end
end
