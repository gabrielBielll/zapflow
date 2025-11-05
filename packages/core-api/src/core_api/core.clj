(ns core-api.core
  (:gen-class)
  (:require [ring.adapter.jetty :as jetty]
            [next.jdbc :as jdbc]
            [reitit.ring :as ring]
            [ring.middleware.params :as params]
            [cheshire.core :as json]
            [core-api.db.core]
            [core-api.handlers.assistants]
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

(defn health-check-handler [request]
  (let [now (jdbc/execute! datasource ["SELECT NOW()"])]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (str now)}))

(defn whatsapp-webhook-handler [request]
  (let [body (-> request :body slurp (json/parse-string true))]
    (println "Received message:" body)
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body "{\"status\": \"ok\"}"}))

(def app
  (-> (ring/router
       [["/health" {:get health-check-handler}]
        ["/webhook/whatsapp" {:post whatsapp-webhook-handler}]
        ["/api"
         ["/assistants" {:get core-api.handlers.assistants/list-assistants-handler
                         :post core-api.handlers.assistants/create-assistant-handler}]]])
      (ring/ring-handler {:router-data {:datasource datasource}})
      (params/wrap-params)))

(defn -main
  "Starts the web server and runs migrations."
  [& args]
  (core-api.db.core/migrate datasource)
  (jetty/run-jetty app {:port 3000}))
