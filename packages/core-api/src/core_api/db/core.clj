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

(def create-channels-table-sql
  "SQL string to create the channels table."
  "CREATE TABLE IF NOT EXISTS channels (
     id UUID NOT NULL,
     assistant_id UUID NOT NULL,
     channel_type VARCHAR(50) NOT NULL,
     status VARCHAR(50) NOT NULL,
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
  (jdbc/execute! datasource [create-assistant-phone-numbers-table-sql])
  (jdbc/execute! datasource [create-channels-table-sql]))

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

(defn create-channel
  "Creates a new channel for an assistant."
  [datasource {:keys [assistant_id channel_type status]}]
  (let [id (java.util.UUID/randomUUID)]
    (sql/insert! datasource :channels {:id id
                                    :assistant_id assistant_id
                                    :channel_type channel_type
                                    :status status} unqualified-kebab-opts)
    (first (sql/query datasource ["SELECT * FROM channels WHERE id = ?" id] unqualified-kebab-opts))))

(defn update-channel-status
  "Updates the status of a channel."
  [datasource {:keys [id status]}]
  (sql/update! datasource :channels {:status status} {:id id} unqualified-kebab-opts)
  (first (sql/query datasource ["SELECT * FROM channels WHERE id = ?" id] unqualified-kebab-opts)))

(defn update-latest-conversation-history
  "Updates the latest conversation history record with the assistant's response."
  [datasource {:keys [assistant-id sender response]}]
  (let [latest-id (:id (first (sql/query datasource ["SELECT id FROM conversation_history WHERE assistant_id = ? AND sender = ? ORDER BY created_at DESC LIMIT 1" assistant-id sender] unqualified-kebab-opts)))]
    (when latest-id
      (sql/update! datasource :conversation_history {:response response} {:id latest-id} unqualified-kebab-opts))))
