(ns core-api.handlers.assistants
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [cheshire.generate :as cheshire-gen]
            [ring.util.response :as response]
            [next.jdbc :as jdbc])
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
  (println "Request headers:" (:headers request))
  (println "Request params:" (:params request))
  (println "Request body type:" (type (:body request)))
  (try
    (let [_ (println "Request keys:" (keys request))
          ;; Try multiple ways to get the datasource
          router-datasource (-> request :reitit.core/router :data :datasource)
          request-datasource (:datasource request)
          _ (println "Router datasource obtained:" (not (nil? router-datasource)))
          _ (println "Request datasource obtained:" (not (nil? request-datasource)))
          _ (println "Router datasource type:" (type router-datasource))
          _ (println "Request datasource type:" (type request-datasource))
          ;; Use whichever datasource is available, or create one as fallback
          datasource (or router-datasource 
                        request-datasource
                        (do 
                          (println "Creating datasource directly as fallback...")
                          (let [db-url (or (System/getenv "DATABASE_URL") 
                                          "jdbc:postgresql://zapflow:zapflow123@localhost:5432/zapflow")]
                            (jdbc/get-datasource db-url))))
          _ (println "Final datasource obtained:" (not (nil? datasource)))
          _ (println "Final datasource type:" (type datasource))
          body-str (if (:body request) (slurp (:body request)) "{}")
          _ (println "Raw body string:" body-str)
          body (json/parse-string body-str true)
          _ (println "Parsed body:" body)
          new-assistant (db/create-assistant datasource body)
          _ (println "Created assistant:" new-assistant)]
      (let [response {:status 201
                      :headers {"Content-Type" "application/json"}
                      :body (json/generate-string new-assistant)}]
        (println "Returning response:" response)
        response))
    (catch Exception e
      (println "Error creating assistant:" (.getMessage e))
      (println "Stack trace:" (str e))
      (let [error-response {:status 500
                           :headers {"Content-Type" "application/json"}
                           :body (json/generate-string {:error "Failed to create assistant" :message (.getMessage e)})}]
        (println "Returning error response:" error-response)
        error-response))))

(defn list-assistants-handler
  "Handler to list all assistants."
  [request]
  (println "=== LIST ASSISTANTS REQUEST ===")
  (println "Request method:" (:request-method request))
  (println "Request URI:" (:uri request))
  (try
    (let [router-datasource (-> request :reitit.core/router :data :datasource)
          request-datasource (:datasource request)
          datasource (or router-datasource 
                        request-datasource
                        (do 
                          (println "Creating datasource directly as fallback...")
                          (let [db-url (or (System/getenv "DATABASE_URL") 
                                          "jdbc:postgresql://zapflow:zapflow123@localhost:5432/zapflow")]
                            (jdbc/get-datasource db-url))))
          assistants (db/list-assistants datasource)
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
  (let [router-datasource (-> request :reitit.core/router :data :datasource)
        request-datasource (:datasource request)
        datasource (or router-datasource 
                      request-datasource
                      (do 
                        (println "Creating datasource directly as fallback...")
                        (let [db-url (or (System/getenv "DATABASE_URL") 
                                        "jdbc:postgresql://zapflow:zapflow123@localhost:5432/zapflow")]
                          (jdbc/get-datasource db-url))))
        assistant-id (-> request :params :id)
        body (-> request :body slurp (json/parse-string true))
        settings-data (assoc body :assistant-id (java.util.UUID/fromString assistant-id))
        updated-settings (db/update-assistant-settings datasource settings-data)]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string updated-settings)}))
