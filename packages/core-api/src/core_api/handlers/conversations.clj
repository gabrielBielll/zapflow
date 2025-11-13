(ns core-api.handlers.conversations
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [ring.util.response :as response]))

(defn list-conversation-history-handler
  "Handler to list conversation history for an assistant."
  [request]
  (let [datasource (-> request :reitit.core/router :data :datasource)
        assistant-id (-> request :params :id)
        history (db/list-conversation-history datasource {:assistant-id (java.util.UUID/fromString assistant-id)})]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string history)}))
