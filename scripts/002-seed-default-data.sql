-- Insert default users if they don't exist
INSERT INTO users (username, password_hash, role)
VALUES 
    ('admin', encode(digest('adminpass', 'sha256'), 'base64'), 'admin'),
    ('user', encode(digest('userpass', 'sha256'), 'base64'), 'user')
ON CONFLICT (username) DO NOTHING;
