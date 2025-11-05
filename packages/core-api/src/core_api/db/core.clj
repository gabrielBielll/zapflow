(ns core-api.db.core
  (:require [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [next.jdbc.result-set :as rs]
            [camel-snake-kebab.core :as csk]))

(def create-assistants-table-sql
  "SQL string to create the assistants table."
  "CREATE TABLE IF NOT EXISTS assistants (
     id UUID NOT NULL,
     name VARCHAR(30) NOT NULL,
     purpose VARCHAR(999) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     PRIMARY KEY (id)
   )")

(defn migrate
  "Applies database migrations."
  [datasource]
  (jdbc/execute! datasource [create-assistants-table-sql]))

(def unqualified-kebab-opts
  {:builder-fn rs/as-unqualified-kebab-maps})

(defn create-assistant
  "Creates a new assistant and returns it."
  [datasource {:keys [name purpose]}]
  (let [id (java.util.UUID/randomUUID)]
    (sql/insert! datasource :assistants {:id id :name name :purpose purpose} unqualified-kebab-opts)
    (first (sql/query datasource ["SELECT * FROM assistants WHERE id = ?" id] unqualified-kebab-opts))))

(defn list-assistants
  "Lists all assistants from the database."
  [datasource]
  (sql/query datasource ["SELECT * FROM assistants ORDER BY created_at DESC"] unqualified-kebab-opts))
