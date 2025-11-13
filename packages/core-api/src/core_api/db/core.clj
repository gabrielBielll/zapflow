(ns core-api.db.core
  (:require [next.jdbc :as jdbc]
            [next.jdbc.sql :as sql]
            [next.jdbc.result-set :as rs]
            [camel-snake-kebab.core :as csk]
            [buddy.hashers :as hashers]))

(def create-users-table-sql
  "SQL string to create the users table."
  "CREATE TABLE IF NOT EXISTS users (
     id UUID NOT NULL,
     name VARCHAR(30) NOT NULL,
     email VARCHAR(99) NOT NULL,
     password_hash VARCHAR(999) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     PRIMARY KEY (id)
   )")

(def create-documents-table-sql
  "SQL string to create the documents table."
  "CREATE TABLE IF NOT EXISTS documents (
     id UUID NOT NULL,
     assistant_id UUID NOT NULL,
     filename VARCHAR(999) NOT NULL,
     filepath VARCHAR(999) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     PRIMARY KEY (id)
   )")

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

(def create-assistant-settings-table-sql
  "SQL string to create the assistant_settings table."
  "CREATE TABLE IF NOT EXISTS assistant_settings (
     id UUID NOT NULL,
     assistant_id UUID NOT NULL,
     personality VARCHAR(999) NOT NULL,
     rag_enabled BOOLEAN NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     PRIMARY KEY (id)
   )")

(def create-conversation-history-table-sql
  "SQL string to create the conversation_history table."
  "CREATE TABLE IF NOT EXISTS conversation_history (
     id UUID NOT NULL,
     assistant_id UUID NOT NULL,
     sender VARCHAR(99) NOT NULL,
     message VARCHAR(9999) NOT NULL,
     response VARCHAR(9999),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     PRIMARY KEY (id)
   )")

(def create-assistant-phone-numbers-table-sql
  "SQL string to create the assistant_phone_numbers table."
  "CREATE TABLE IF NOT EXISTS assistant_phone_numbers (
     id UUID NOT NULL,
     assistant_id UUID NOT NULL,
     phone_number VARCHAR(99) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,
     PRIMARY KEY (id)
   )")

(defn migrate
  "Applies database migrations."
  [datasource]
  (jdbc/execute! datasource [create-users-table-sql])
  (jdbc/execute! datasource [create-documents-table-sql])
  (jdbc/execute! datasource [create-assistants-table-sql])
  (jdbc/execute! datasource [create-assistant-settings-table-sql])
  (jdbc/execute! datasource [create-conversation-history-table-sql])
  (jdbc/execute! datasource [create-assistant-phone-numbers-table-sql]))

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

(defn create-user
  "Creates a new user and returns it."
  [datasource {:keys [name email password]}]
  (let [id (java.util.UUID/randomUUID)
        password-hash (hashers/encrypt password)]
    (sql/insert! datasource :users {:id id :name name :email email :password_hash password-hash} unqualified-kebab-opts)
    (first (sql/query datasource ["SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?" id] unqualified-kebab-opts))))

(defn list-users
  "Lists all users from the database."
  [datasource]
  (sql/query datasource ["SELECT id, name, email, created_at, updated_at FROM users ORDER BY created_at DESC"] unqualified-kebab-opts))

(defn create-document
  "Creates a new document and returns it."
  [datasource {:keys [assistant-id filename filepath]}]
  (let [id (java.util.UUID/randomUUID)]
    (sql/insert! datasource :documents {:id id
                                     :assistant_id assistant-id
                                     :filename filename
                                     :filepath filepath} unqualified-kebab-opts)
    (first (sql/query datasource ["SELECT * FROM documents WHERE id = ?" id] unqualified-kebab-opts))))

(defn update-assistant-settings
  "Updates an assistant's settings and returns them."
  [datasource {:keys [assistant-id personality rag-enabled]}]
  (let [existing-settings (first (sql/query datasource ["SELECT * FROM assistant_settings WHERE assistant_id = ?" assistant-id] unqualified-kebab-opts))]
    (if existing-settings
      (sql/update! datasource :assistant_settings {:personality personality :rag_enabled rag-enabled} {:id (:id existing-settings)} unqualified-kebab-opts)
      (let [id (java.util.UUID/randomUUID)]
        (sql/insert! datasource :assistant_settings {:id id
                                                   :assistant_id assistant-id
                                                   :personality personality
                                                   :rag_enabled rag-enabled} unqualified-kebab-opts)))
    (first (sql/query datasource ["SELECT * FROM assistant_settings WHERE assistant_id = ?" assistant-id] unqualified-kebab-opts))))

(defn list-conversation-history
  "Lists conversation history for an assistant."
  [datasource {:keys [assistant-id]}]
  (sql/query datasource ["SELECT * FROM conversation_history WHERE assistant_id = ? ORDER BY created_at DESC" assistant-id] unqualified-kebab-opts))

(defn create-conversation-history
  "Creates a new conversation history record and returns it."
  [datasource {:keys [assistant-id sender message response]}]
  (let [id (java.util.UUID/randomUUID)]
    (sql/insert! datasource :conversation_history {:id id
                                                  :assistant_id assistant-id
                                                  :sender sender
                                                  :message message
                                                  :response response} unqualified-kebab-opts)
    (first (sql/query datasource ["SELECT * FROM conversation_history WHERE id = ?" id] unqualified-kebab-opts))))

(defn find-assistant-by-phone-number
  "Finds an assistant by phone number."
  [datasource phone-number]
  (first (sql/query datasource ["SELECT assistant_id FROM assistant_phone_numbers WHERE phone_number = ?" phone-number] unqualified-kebab-opts)))
