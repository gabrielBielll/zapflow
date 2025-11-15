(ns core-api.handlers.conversations
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [ring.util.response :as response]
            [next.jdbc :as jdbc]))

(defn list-conversation-history-handler
  "Handler to list conversation history for an assistant."
  [request]
  (try
    (let [db-spec (:db-spec request)
          _ (println "=== CONVERSATION HISTORY REQUEST ===")
          _ (println "Full request params:" (:params request))
          _ (println "Path params:" (:path-params request))
          assistant-id-str (or (-> request :params :id) (-> request :path-params :id))
          _ (println "Assistant ID string:" assistant-id-str)
          assistant-id (when assistant-id-str (java.util.UUID/fromString assistant-id-str))
          _ (println "Assistant ID UUID:" assistant-id)
          history (if assistant-id
                    (db/list-conversation-history db-spec {:assistant-id assistant-id})
                    [])]
      (println "Found conversations count:" (count history))
      {:status 200
       :headers {"Content-Type" "application/json"}
       :body (json/generate-string history)})
    (catch Exception e
      (println "ERROR in conversation history handler:" (.getMessage e))
      (.printStackTrace e)
      {:status 500
       :headers {"Content-Type" "application/json"}
       :body (json/generate-string {:error "Internal server error"})})))
