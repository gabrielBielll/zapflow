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
            [reitit.ring.middleware.multipart :as multipart]
            [ring.util.response]))

(def db-config
  {:dbtype "postgresql"
   :classname "org.postgresql.Driver"
   :dbname "defaultdb"
   :host "localhost"
   :user "root"
   :password ""
   :port 26257})

(def datasource (jdbc/get-datasource db-config))

(def ai-service-url "http://localhost:4000/chat")
(def gateway-url "http://localhost:5001/send-message")

(defn health-check-handler [request]
  (let [now (jdbc/execute! datasource ["SELECT NOW()"])]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (str now)}))

(defn whatsapp-webhook-handler [request]
  (let [datasource (-> request :reitit.core/router :data :datasource)
        incoming-message (-> request :body slurp (json/parse-string true))
        message-text (:body incoming-message)
        sender-number (:from incoming-message)
        assistant (core-api.db.core/find-assistant-by-phone-number datasource sender-number)]
    (if assistant
      (let [assistant-id (:assistant-id assistant)]
        (println "Received message text:" message-text "from:" sender-number "for assistant:" assistant-id)
        (try
          (let [ai-response-raw (:body (client/post ai-service-url
                                                    {:body (json/generate-string {:message message-text})
                                                     :content-type :json
                                                     :accept :json}))
                ai-response-body (json/parse-string ai-response-raw true)
                ai-message (:response ai-response-body)]
            (println "AI Service response text:" ai-message)
            (try
              (client/post gateway-url
                           {:body (json/generate-string {:to sender-number :message ai-message})
                            :content-type :json})
              (println "Sent reply to gateway:" ai-message)
              (catch Exception e
                (println "Error calling Gateway service:" (.getMessage e))))
            (core-api.db.core/create-conversation-history
             datasource
             {:assistant-id assistant-id
              :sender sender-number
              :message message-text
              :response ai-message}))
          (catch Exception e
            (println "Error calling AI service:" (.getMessage e))))
        {:status 200
         :headers {"Content-Type" "application/json"}
         :body "{\"status\": \"ok\"}"})
      {:status 404
       :headers {"Content-Type" "application/json"}
       :body "{\"error\": \"Assistant not found for this phone number.\"}"})))

(def app
  (-> (ring/router
       [["/health" {:get health-check-handler}]
        ["/webhook/whatsapp" {:post whatsapp-webhook-handler}]
        ["/api"
         {:middleware [multipart/multipart-middleware]}
         ["/users" {:get core-api.handlers.users/list-users-handler
                    :post core-api.handlers.users/create-user-handler}]
         ["/assistants"
          ["/" {:get core-api.handlers.assistants/list-assistants-handler
                :post core-api.handlers.assistants/create-assistant-handler}]
          ["/:id/settings" {:put core-api.handlers.assistants/update-assistant-settings-handler}]
          ["/:id/conversations" {:get core-api.handlers.conversations/list-conversation-history-handler}]]
         ["/rag"
          ["/upload" {:post core-api.handlers.rag/upload-document-handler}]]]])
      (ring/ring-handler {:router-data {:datasource datasource}})
      (params/wrap-params)))

(defn -main
  "Starts the web server and runs migrations."
  [& args]
  (core-api.db.core/migrate datasource)
  (jetty/run-jetty app {:port 3000}))
