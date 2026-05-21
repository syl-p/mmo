defmodule MmorpgWeb.PageController do
  use MmorpgWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
