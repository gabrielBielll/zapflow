(ns core-api.handlers.assistants
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [cheshire.generate :as cheshire-gen]
            [ring.util.response :as response])
  (:import [java.time OffsetDateTime]))

(cheshire-gen/add-encoder OffsetDateTime
  (fn [odt jg]
    (.writeString jg (.toString odt))))

(defn create-assistant-handler
  "Handler to create a new assistant."
  [request]
  (println "=== CREATE ASSISTANT REQUEST ===")
  (println "Request method:" (:request-method request))
  (println "Request URI:" (:uri request))
  (try
    (let [db-spec (:db-spec request)
          _ (println "DB spec obtained:" (not (nil? db-spec)))
          _ (println "DB spec type:" (type db-spec))
          body-str (if (:body request) (slurp (:body request)) "{}")
          _ (println "Raw body string:" body-str)
          body (json/parse-string body-str true)
          _ (println "Parsed body:" body)
          new-assistant (db/create-assistant db-spec body)
          _ (println "Created assistant:" new-assistant)]
      {:status 201
       :headers {"Content-Type" "application/json"}
       :body (json/generate-string new-assistant)})
    (catch Exception e
      (println "Error creating assistant:" (.getMessage e))
      (println "Stack trace:" (str e))
      {:status 500
       :headers {"Content-Type" "application/json"}
       :body (json/generate-string {:error "Failed to create assistant" :message (.getMessage e)})})))

(defn list-assistants-handler
  "Handler to list all assistants."
  [request]
  (println "=== LIST ASSISTANTS REQUEST ===")
  (println "Request method:" (:request-method request))
  (println "Request URI:" (:uri request))
  (try
    (let [db-spec (:db-spec request)
          _ (println "DB spec obtained:" (not (nil? db-spec)))
          assistants (db/list-assistants db-spec)
          _ (println "Found assistants count:" (count assistants))]
      {:status 200
       :headers {"Content-Type" "application/json"}
       :body (json/generate-string assistants)})
    (catch Exception e
      (println "Error listing assistants:" (.getMessage e))
      (println "Stack trace:" (str e))
      {:status 500
       :headers {"Content-Type" "application/json"}
       :body (json/generate-string {:error "Failed to list assistants" :message (.getMessage e)})})))

(defn update-assistant-settings-handler
  "Handler for updating assistant settings."
  [request]
  (try
    (let [db-spec (:db-spec request)
          assistant-id (-> request :params :id)
          body (-> request :body slurp (json/parse-string true))
          settings-data (assoc body :assistant-id (java.util.UUID/fromString assistant-id))
          updated-settings (db/update-assistant-settings db-spec settings-data)]
      {:status 200
       :headers {"Content-Type" "application/json"}
       :body (json/generate-string updated-settings)})
    (catch Exception e
      (println "Error updating assistant settings:" (.getMessage e))
      {:status 500
       :headers {"Content-Type" "application/json"}
       :body (json/generate-string {:error "Failed to update assistant settings" :message (.getMessage e)})})))
