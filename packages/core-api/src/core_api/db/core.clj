(ns core-api.db.core
  (:require [clojure.java.jdbc :as jdbc]
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

(defn migrate-with-jdbc
  "Applies database migrations using clojure.java.jdbc like SMS Notifier."
  [db-spec]
  (jdbc/execute! db-spec [create-users-table-sql])
  (jdbc/execute! db-spec [create-documents-table-sql])
  (jdbc/execute! db-spec [create-assistants-table-sql])
  (jdbc/execute! db-spec [create-assistant-settings-table-sql])
  (jdbc/execute! db-spec [create-conversation-history-table-sql])
  (jdbc/execute! db-spec [create-assistant-phone-numbers-table-sql])
  (jdbc/execute! db-spec [create-channels-table-sql]))

(defn migrate
  "Applies database migrations (legacy function for compatibility)."
  [datasource]
  (migrate-with-jdbc datasource))

(defn create-assistant
  "Creates a new assistant and returns it."
  [db-spec {:keys [name purpose]}]
  (let [id (java.util.UUID/randomUUID)]
    (jdbc/insert! db-spec :assistants {:id id :name name :purpose purpose})
    (first (jdbc/query db-spec ["SELECT * FROM assistants WHERE id = ?" id]))))

(defn list-assistants
  "Lists all assistants from the database."
  [db-spec]
  (jdbc/query db-spec ["SELECT * FROM assistants ORDER BY created_at DESC"]))

(defn create-user
  "Creates a new user and returns it."
  [db-spec {:keys [name email password]}]
  (let [id (java.util.UUID/randomUUID)
        password-hash (hashers/encrypt password)]
    (jdbc/insert! db-spec :users {:id id :name name :email email :password_hash password-hash})
    (first (jdbc/query db-spec ["SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?" id]))))

(defn list-users
  "Lists all users from the database."
  [db-spec]
  (jdbc/query db-spec ["SELECT id, name, email, created_at, updated_at FROM users ORDER BY created_at DESC"]))

(defn create-document
  "Creates a new document and returns it."
  [db-spec {:keys [assistant-id filename filepath]}]
  (let [id (java.util.UUID/randomUUID)]
    (jdbc/insert! db-spec :documents {:id id
                                     :assistant_id assistant-id
                                     :filename filename
                                     :filepath filepath})
    (first (jdbc/query db-spec ["SELECT * FROM documents WHERE id = ?" id]))))

(defn update-assistant-settings
  "Updates an assistant's settings and returns them."
  [db-spec {:keys [assistant-id personality rag-enabled]}]
  (let [existing-settings (first (jdbc/query db-spec ["SELECT * FROM assistant_settings WHERE assistant_id = ?" assistant-id]))]
    (if existing-settings
      (jdbc/update! db-spec :assistant_settings {:personality personality :rag_enabled rag-enabled} ["id = ?" (:id existing-settings)])
      (let [id (java.util.UUID/randomUUID)]
        (jdbc/insert! db-spec :assistant_settings {:id id
                                                   :assistant_id assistant-id
                                                   :personality personality
                                                   :rag_enabled rag-enabled})))
    (first (jdbc/query db-spec ["SELECT * FROM assistant_settings WHERE assistant_id = ?" assistant-id]))))

(defn list-conversation-history
  "Lists conversation history for an assistant."
  [db-spec {:keys [assistant-id]}]
  (jdbc/query db-spec ["SELECT * FROM conversation_history WHERE assistant_id = ? ORDER BY created_at DESC" assistant-id]))

(defn create-conversation-history
  "Creates a new conversation history record and returns it."
  [db-spec {:keys [assistant-id sender message response]}]
  (let [id (java.util.UUID/randomUUID)]
    (jdbc/insert! db-spec :conversation_history {:id id
                                                :assistant_id assistant-id
                                                :sender sender
                                                :message message
                                                :response response})
    (first (jdbc/query db-spec ["SELECT * FROM conversation_history WHERE id = ?" id]))))

(defn find-assistant-by-phone-number
  "Finds an assistant by phone number."
  [db-spec phone-number]
  (first (jdbc/query db-spec ["SELECT assistant_id FROM assistant_phone_numbers WHERE phone_number = ?" phone-number])))

(defn create-channel
  "Creates a new channel for an assistant."
  [db-spec {:keys [assistant_id channel_type status]}]
  (let [id (java.util.UUID/randomUUID)]
    (jdbc/insert! db-spec :channels {:id id
                                    :assistant_id assistant_id
                                    :channel_type channel_type
                                    :status status})
    (first (jdbc/query db-spec ["SELECT * FROM channels WHERE id = ?" id]))))

(defn update-channel-status
  "Updates the status of a channel."
  [db-spec {:keys [id status]}]
  (jdbc/update! db-spec :channels {:status status} ["id = ?" id])
  (first (jdbc/query db-spec ["SELECT * FROM channels WHERE id = ?" id])))

(defn update-latest-conversation-history
  "Updates the latest conversation history record with the assistant's response."
  [db-spec {:keys [assistant-id sender response]}]
  (let [latest-id (:id (first (jdbc/query db-spec ["SELECT id FROM conversation_history WHERE assistant_id = ? AND sender = ? ORDER BY created_at DESC LIMIT 1" assistant-id sender])))]
    (when latest-id
      (jdbc/update! db-spec :conversation_history {:response response} ["id = ?" latest-id]))))

(defn create-assistant-phone-number
  "Creates a new assistant phone number association."
  [db-spec {:keys [assistant_id phone_number]}]
  (let [id (java.util.UUID/randomUUID)]
    (jdbc/insert! db-spec :assistant_phone_numbers {:id id
                                                    :assistant_id assistant_id
                                                    :phone_number phone_number})
    (first (jdbc/query db-spec ["SELECT * FROM assistant_phone_numbers WHERE id = ?" id]))))

(defn find-channel-by-id
  "Finds a channel by its ID."
  [db-spec channel-id]
  (first (jdbc/query db-spec ["SELECT * FROM channels WHERE id = ?" channel-id])))
