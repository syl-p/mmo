defmodule MmorpgWeb.MobHTML do
  @moduledoc """
  This module contains pages rendered by MobController.

  See the `page_html` directory for all templates available.
  """
  use MmorpgWeb, :html

  embed_templates "mob_template_html/*"
end
