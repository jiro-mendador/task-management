BEGIN;
SET TIME ZONE '+00:00';

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  last_name VARCHAR(150) NOT NULL,
  first_name VARCHAR(150) NOT NULL,
  username VARCHAR(150) NOT NULL,
  password VARCHAR(150) NOT NULL,
  email_number VARCHAR(150) NOT NULL,
  isOnline SMALLINT NOT NULL
);

-- Create projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(150) NOT NULL,
  deadline TIMESTAMP NOT NULL,
  priority_level VARCHAR(150) NOT NULL,
  progress INTEGER NOT NULL,
  date_added TIMESTAMP,
  date_completed TIMESTAMP
);

-- Create tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  name VARCHAR(150) NOT NULL,
  date_added TIMESTAMP,
  date_completed TIMESTAMP
);

-- Insert sample users
INSERT INTO users (last_name, first_name, username, password, email_number, isOnline)
VALUES ('Mendador', 'Jiro', 'jiro', '123', 'parokyanimayonnaise@gmail.com', 1);

-- Insert sample projects
INSERT INTO projects (user_id, title, description, deadline, priority_level, progress, date_added, date_completed)
VALUES (1, 'Temporary Portfolio', 'setup a temporary portfolio', '2025-06-24 12:00:00', 'High', 0, '2025-06-17 00:11:26', NULL);

-- Insert sample tasks
INSERT INTO tasks (project_id, name, date_added, date_completed)
VALUES (1, 'Add this project on a web hosting', '2025-06-17 00:11:51', NULL);

COMMIT;