defmodule MmorpgWeb.MobTemplateController do
	use MmorpgWeb, :controller
  alias Mmorpg.MobTemplate
  alias Mmorpg.Repo

	def index(conn, _params) do
		mob_templates = Repo.all(MobTemplate)
		render(conn, :index, mob_templates: mob_templates)
	end
end
