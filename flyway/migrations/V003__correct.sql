ALTER TABLE performers CHANGE performer_id user_id INT;

ALTER TABLE units ADD COLUMN status BOOLEAN NOT NULL;
ALTER TABLE checklists ADD COLUMN text TEXT;