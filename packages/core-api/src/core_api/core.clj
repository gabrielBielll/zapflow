(ns core-api.core
  (:gen-class)
  (:require [ring.adapter.jetty :as jetty]
            [clojure.java.jdbc :as jdbc]
            [next.jdbc :as next-jdbc]
            [reitit.ring :as ring]
            [ring.middleware.params :as params]
            [ring.middleware.cors :as cors]
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
            [ring.util.response]
            [environ.core :refer [env]])
  (:import [org.postgresql Driver]))

;; HARDCODED PRODUCTION VARIABLES FOR LOCAL DEVELOPMENT
;; Switch between local and production by commenting/uncommenting lines

;; PRODUCTION DATABASE (CockroachDB) - commented for local development
;; (def db-spec "postgresql://zapflow:i7cI3Qj40rJ2uO_wA12nuA@zapflow-db-10386.jxf.gcp-southamerica-east1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory")

;; LOCAL DATABASE (Docker)
(def db-spec {:dbtype "postgresql"
              :dbname "zapflow"
              :host "db"
              :port 5432
              :user "zapflow"
              :password "zapflow123"})

;; PRODUCTION AI SERVICE (Render)
(def ai-service-url "https://zapflow-ai-service.onrender.com")

;; LOCAL AI SERVICE (uncomment to use local)
;; (def ai-service-url "http://localhost:4000")

;; PRODUCTION GATEWAY (Render)
(def gateway-url "https://zapflow-gateway.onrender.com")

;; LOCAL GATEWAY (uncomment to use local)
;; (def gateway-url "http://localhost:5001")

;; Test database connection like SMS Notifier
(defn test-db-connection []
  (if-not db-spec
    (println "ALERTA: DATABASE_URL não configurada.")
    (try
      (println "Testando conexão com o banco de dados...")
      (let [result (jdbc/query db-spec ["SELECT 1 as test"])]
        (println "Conexão com banco de dados bem-sucedida!")
        result)
      (catch Exception e
        (println (str "ERRO ao conectar com o banco: " (.getMessage e)))
        (throw e)))))

(defn health-check-handler [request]
  (try
    (let [result (jdbc/query db-spec ["SELECT NOW() as current_time"])]
      {:status 200
       :headers {"Content-Type" "application/json"}
       :body (json/generate-string {:status "healthy" :timestamp (first result)})})
    (catch Exception e
      {:status 500
       :headers {"Content-Type" "application/json"}
       :body (json/generate-string {:status "error" :message (.getMessage e)})})))

(defn request-logger [handler]
  (fn [request]
    (println "=== INCOMING REQUEST ===")
    (println "Method:" (:request-method request))
    (println "URI:" (:uri request))
    (println "Query string:" (:query-string request))
    (println "Headers:" (select-keys (:headers request) ["content-type" "user-agent" "origin" "referer"]))
    (println "Origin header:" (get (:headers request) "origin"))
    (println "Request body available:" (not (nil? (:body request))))
    (println "Request params:" (:params request))
    (println "Reitit match:" (:reitit.core/match request))
    (println "About to call handler...")
    (try
      (let [response (handler request)]
        (println "Handler returned response type:" (type response))
        (if response
          (do
            (println "Response status:" (:status response))
            (println "Response headers:" (select-keys (:headers response) ["access-control-allow-origin"]))
            response)
          (do
            (println "WARNING: Handler returned nil response!")
            {:status 500
             :headers {"Content-Type" "application/json"}
             :body (json/generate-string {:error "Internal server error" :message "Handler returned nil response"})})))
      (catch Exception e
        (println "ERROR in request processing:" (.getMessage e))
        (println "Stack trace:" (str e))
        {:status 500
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string {:error "Internal server error" :message (.getMessage e)})}))))

(defn db-middleware [handler]
  (fn [request]
    (handler (assoc request :db-spec db-spec))))

(defn create-routes []
  ["/api/v1"
   ["/frontend"
    ["/users" {:get core-api.handlers.users/list-users-handler
               :post core-api.handlers.users/create-user-handler}]
    ["/assistants" {:get core-api.handlers.assistants/list-assistants-handler
                    :post core-api.handlers.assistants/create-assistant-handler}]
    ["/assistants/:id/settings" {:put core-api.handlers.assistants/update-assistant-settings-handler}]
    ["/assistants/:id/conversations" {:get core-api.handlers.conversations/list-conversation-history-handler}]
    ["/assistants/:id/knowledge/upload" {:middleware [multipart/multipart-middleware]
                                         :post core-api.handlers.rag/upload-document-handler}]
    ["/assistants/:id/channels/whatsapp" {:post core-api.handlers.channels/init-whatsapp-channel-handler}]]
   ["/webhook"
    ["/whatsapp/message" {:post core-api.handlers.webhooks/whatsapp-message-webhook-handler}]
    ["/whatsapp/status" {:post core-api.handlers.channels/whatsapp-status-webhook-handler}]]])

(defn create-app []
  (let [routes (create-routes)]
    (-> (ring/ring-handler
         (ring/router routes {:data {:db-spec db-spec}})
         (ring/routes
          (ring/create-default-handler
           {:not-found (constantly {:status 404 :body "Not found"})})))
        params/wrap-params
        (cors/wrap-cors :access-control-allow-origin [#"http://localhost:3000" 
                                                       #"http://localhost:9002"
                                                       #"https://.*\.onrender\.com"
                                                       #"https://.*\.render\.com"]
                        :access-control-allow-methods [:get :put :post :delete :options]
                        :access-control-allow-headers ["Content-Type" "Authorization"]
                        :access-control-allow-credentials true)
        db-middleware
        request-logger)))

(defn -main
  "Starts the web server and runs migrations."
  [& args]
  (try
    (println "====================================")
    (println "  Core API v0.1.0")
    (println "====================================")
    
    (println "Testando conexão com o banco de dados...")
    (test-db-connection)
    (println "Conexão com banco de dados bem-sucedida!")
    
    (println "Executando migrações do banco de dados...")
    (core-api.db.core/migrate-with-jdbc db-spec)
    (println "Migrações do banco de dados concluídas!")
    
    (let [port 8080  ;; HARDCODED PORT FOR LOCAL DEVELOPMENT
          app (create-app)]
      (println (str "Iniciando servidor na porta " port "..."))
      (jetty/run-jetty app {:port port}))
    
    (catch Exception e
      (println "Erro ao iniciar aplicação:")
      (println (.getMessage e))
      (.printStackTrace e)
      (System/exit 1))))