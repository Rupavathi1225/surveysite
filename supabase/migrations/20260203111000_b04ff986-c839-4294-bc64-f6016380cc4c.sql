-- Insert admin role for user rupa (voosakrthik@gmail.com)
INSERT INTO public.user_roles (user_id, role)
VALUES ('bd41586d-5d1d-48e8-8388-502186dd22fe', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;