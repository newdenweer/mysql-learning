CREATE TABLE users
(
    id       INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    userName VARCHAR(255)       NOT NULL,
    email    VARCHAR(255)       NOT NULL UNIQUE,
    password VARCHAR(255)       NOT NULL
);

CREATE TABLE tasks
(
    id      INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    name    VARCHAR(255)       NOT NULL,
    text    TEXT               NOT NULL,
    status  BOOLEAN            not null,
    creator INT                NOT NULL,
    deleted DATETIME,
    FOREIGN KEY (creator) REFERENCES users (id)
);

CREATE TABLE performers
(
    id           INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    performer_id INT                NOT NULL,
    task_id      INT                NOT NULL,
    FOREIGN KEY (performer_id) REFERENCES users (id),
    FOREIGN KEY (task_id) REFERENCES tasks (id)
);

CREATE TABLE rating
(
    id           INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    rating       TINYINT UNSIGNED   NOT NULL,
    performer_id INT                NOT NULL,
    FOREIGN KEY (performer_id) REFERENCES performers (id)
);

CREATE TABLE comments
(
    id        INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    text      TEXT               NOT NULL,
    task_id   INT,
    user_id   INT                NOT NULL,
    rating_id INT,
    FOREIGN KEY (task_id) REFERENCES tasks (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (rating_id) REFERENCES rating (id)
);

CREATE TABLE tags
(
    id   INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    text TEXT               NOT NULL
);

CREATE TABLE tag_in_task
(
    id      INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    tag_id  INT                NOT NULL,
    task_id INT                NOT NULL,
    FOREIGN KEY (tag_id) REFERENCES tags (id),
    FOREIGN KEY (task_id) REFERENCES tasks (id)
);

CREATE TABLE checklists
(
    id       INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    name     VARCHAR(255)       NOT NULL,
    status   BOOLEAN            NOT NULL,
    position INT UNSIGNED       NOT NULL,
    task_id  INT                NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks (id)
);

CREATE TABLE units
(
    id           INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    text         TEXT               NOT NULL,
    checklist_id INT                NOT NULL,
    position     INT UNSIGNED       NOT NULL,
    FOREIGN KEY (checklist_id) REFERENCES checklists (id)
);