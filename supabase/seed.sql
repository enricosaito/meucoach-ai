-- Local development seed data. Runs after migrations on `pnpm db:reset` (and in CI).
--
-- Demo user for local testing: demo@example.test / demo-password-123 (LOCAL ONLY: seed.sql never
-- runs against production). It has an energy test, a goal and a ready training plan, so every
-- screen has data right after a reset. Its profile is created by the signup trigger.

do $$
declare
  demo_id constant uuid := 'd0d0d0d0-0000-4000-8000-000000000001';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    -- GoTrue reads these as strings; NULL breaks sign-in.
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', demo_id, 'authenticated', 'authenticated',
    'demo@example.test', extensions.crypt('demo-password-123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Demo"}', now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    demo_id::text, demo_id,
    jsonb_build_object('sub', demo_id::text, 'email', 'demo@example.test', 'email_verified', true),
    'email', now(), now(), now()
  );

  update public.profiles
  set goals = '{"primary":"build_muscle"}', timezone = 'America/Sao_Paulo'
  where id = demo_id;

  -- Mifflin-St Jeor for male, 32 y, 178 cm, 82 kg, moderate: BMR 1778, TDEE 2755.
  insert into public.metabolic_assessments
    (user_id, formula_version, sex, age_years, height_cm, weight_kg, activity_level, bmr_kcal, tdee_kcal)
  values (demo_id, 1, 'male', 32, 178, 82, 'moderate', 1778, 2755);

  insert into public.training_profiles (user_id, experience, days_per_week, session_minutes, equipment)
  values (demo_id, 'intermediate', 3, 45, 'full_gym');

  insert into public.workout_plans (user_id, status, inputs, plan, model, prompt_version, completed_at)
  values (demo_id, 'ready', '{}', $json${
    "name": "Força Base 3x",
    "summary": "Plano de corpo inteiro, três vezes por semana.",
    "durationWeeks": 8,
    "progression": "Aumente a carga quando completar todas as repetições.",
    "days": [
      {"title": "Dia 1 · Superiores", "focus": "Peito, costas e ombros", "estimatedMinutes": 45,
       "warmup": "5 min de mobilidade", "cooldown": "Alongamento leve",
       "exercises": [
         {"name": "Supino reto", "muscleGroup": "chest", "sets": 3, "reps": "8–12", "restSeconds": 90, "notes": ""},
         {"name": "Remada curvada", "muscleGroup": "back", "sets": 3, "reps": "8–12", "restSeconds": 90, "notes": ""}]},
      {"title": "Dia 2 · Inferiores", "focus": "Pernas e glúteos", "estimatedMinutes": 45,
       "warmup": "5 min de bicicleta", "cooldown": "Alongamento leve",
       "exercises": [
         {"name": "Agachamento", "muscleGroup": "quads", "sets": 3, "reps": "8–12", "restSeconds": 120, "notes": ""},
         {"name": "Stiff", "muscleGroup": "hamstrings", "sets": 3, "reps": "10–12", "restSeconds": 90, "notes": ""}]},
      {"title": "Dia 3 · Corpo inteiro", "focus": "Força geral", "estimatedMinutes": 45,
       "warmup": "5 min de mobilidade", "cooldown": "Respiração",
       "exercises": [
         {"name": "Levantamento terra", "muscleGroup": "hamstrings", "sets": 3, "reps": "5", "restSeconds": 150, "notes": ""},
         {"name": "Desenvolvimento", "muscleGroup": "shoulders", "sets": 3, "reps": "8–10", "restSeconds": 90, "notes": ""}]}
    ],
    "tips": ["Durma bem", "Beba água", "Registre seus treinos"]
  }$json$, 'mock', 'workout-plan@1', now());
end;
$$;
