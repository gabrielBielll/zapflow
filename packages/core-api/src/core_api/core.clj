(ns core-api.core
  (:gen-class)
  (:require [ring.adapter.jetty :as jetty]
            [next.jdbc :as jdbc]
            [reitit.ring :as ring]
            [ring.middleware.params :as params]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [core-api.db.core]
            [core-api.handlers.assistants]
            [core-api.handlers.users]
            [core-api.handlers.rag]
            [core-api.handlers.conversations]
            [core-api.handlers.channels]
            [core-api.handlers.webhooks]
            [reitit.ring.middleware.multipart :as multipart]
            [ring.util.response])
  (:import [org.postgresql Driver]))

;; Explicitly load the PostgreSQL driver
(Class/forName "org.postgresql.Driver")

(defn env [k default-value]
  (get (System/getenv) k default-value))

(def db-url (env "DATABASE_URL" "jdbc:postgresql://zapflow:zapflow123@localhost:5432/zapflow"))
(def datasource (jdbc/get-datasource db-url))

(def ai-service-url (env "AI_SERVICE_URL" "http://localhost:4000"))
(def gateway-url (env "GATEWAY_URL" "http://localhost:5001"))

(defn health-check-handler [request]
  (let [now (jdbc/execute! datasource ["SELECT NOW()"])]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (str now)}))

(def app
  (-> (ring/ring-handler
       (ring/router
        ["/api/v1"
         ["/frontend"
          {:middleware [multipart/multipart-middleware]}
          ["/users" {:get core-api.handlers.users/list-users-handler
                     :post core-api.handlers.users/create-user-handler}]
          ["/assistants"
           ["/" {:get core-api.handlers.assistants/list-assistants-handler
                 :post core-api.handlers.assistants/create-assistant-handler}]
           ["/:id/settings" {:put core-api.handlers.assistants/update-assistant-settings-handler}]
           ["/:id/conversations" {:get core-api.handlers.conversations/list-conversation-history-handler}]
           ["/:id/knowledge/upload" {:post core-api.handlers.rag/upload-document-handler}]
           ["/:id/channels/whatsapp" {:post core-api.handlers.channels/init-whatsapp-channel-handler}]]]
         ["/webhook"
          ["/whatsapp/message" {:post core-api.handlers.webhooks/whatsapp-message-webhook-handler}]
          ["/whatsapp/status" {:post core-api.handlers.channels/whatsapp-status-webhook-handler}]]]
        {:data {:datasource datasource}}))
      params/wrap-params))

(defn -main
  "Starts the web server and runs migrations."
  [& args]
  (try
    (println "Connecting to database...")
    (jdbc/execute! datasource ["SELECT 1"])
    (println "Database connection successful!")
    
    (println "Running database migrations...")
    (core-api.db.core/migrate datasource)
    (println "Database migrations completed!")
    
    (let [port (Integer/parseInt (env "PORT" "8080"))]
      (println (str "Starting server on port " port "..."))
      (jetty/run-jetty app {:port port}))
    
    (catch Exception e
      (println "Error starting application:")
      (println (.getMessage e))
      (System/exit 1))))
