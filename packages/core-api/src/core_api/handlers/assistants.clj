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
  (let [datasource (-> request :reitit.core/router :data :datasource)
        body (-> request :body slurp (json/parse-string true))
        new-assistant (db/create-assistant datasource body)]
    {:status 201
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string new-assistant)}))

(defn list-assistants-handler
  "Handler to list all assistants."
  [request]
  (let [datasource (-> request :reitit.core/router :data :datasource)
        assistants (db/list-assistants datasource)]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string assistants)}))
