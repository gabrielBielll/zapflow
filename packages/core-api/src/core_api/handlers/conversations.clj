(ns core-api.handlers.conversations
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [ring.util.response :as response]
            [next.jdbc :as jdbc]))

(defn list-conversation-history-handler
  "Handler to list conversation history for an assistant."
  [request]
  (let [router-datasource (-> request :reitit.core/router :data :datasource)
        request-datasource (:datasource request)
        datasource (or router-datasource 
                      request-datasource
                      (let [db-url (or (System/getenv "DATABASE_URL") 
                                      "jdbc:postgresql://zapflow:zapflow123@localhost:5432/zapflow")]
                        (jdbc/get-datasource db-url)))
        assistant-id (-> request :params :id)
        history (db/list-conversation-history datasource {:assistant-id (java.util.UUID/fromString assistant-id)})]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string history)}))
