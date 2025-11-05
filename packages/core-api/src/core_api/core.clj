(ns core-api.core
  (:gen-class)
  (:require [ring.adapter.jetty :as jetty]
            [next.jdbc :as jdbc]
            [reitit.ring :as ring]
            [ring.middleware.params :as params]
            [cheshire.core :as json]))

(def db-config
  {:dbtype "cockroach"
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
        ["/webhook/whatsapp" {:post whatsapp-webhook-handler}]])
      (ring/ring-handler)
      (params/wrap-params)))

(defn -main
  "Starts the web server."
  [& args]
  (jetty/run-jetty app {:port 3000}))
