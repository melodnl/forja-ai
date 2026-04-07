-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário só vê/edita o próprio
CREATE POLICY "users_select_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Boards: CRUD completo só nos próprios + leitura de templates públicos
CREATE POLICY "users_crud_own_boards" ON public.boards
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "anyone_read_public_boards" ON public.boards
  FOR SELECT USING (is_public = TRUE OR is_template = TRUE);

-- Generations: só as próprias
CREATE POLICY "users_crud_own_generations" ON public.generations
  FOR ALL USING (auth.uid() = user_id);

-- Assets: só os próprios
CREATE POLICY "users_crud_own_assets" ON public.assets
  FOR ALL USING (auth.uid() = user_id);

-- Credit transactions: só leitura das próprias
CREATE POLICY "users_read_own_credits" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- API keys: só as próprias
CREATE POLICY "users_crud_own_keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Templates: leitura pública
CREATE POLICY "anyone_read_templates" ON public.templates
  FOR SELECT USING (TRUE);
