(ns core-api.handlers.users
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [ring.util.response :as response]))

(defn create-user-handler
  "Handler to create a new user."
  [request]
  (let [datasource (-> request :reitit.core/router :data :datasource)
        body (-> request :body slurp (json/parse-string true))
        new-user (db/create-user datasource body)]
    {:status 201
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string new-user)}))

(defn list-users-handler
  "Handler to list all users."
  [request]
  (let [datasource (-> request :reitit.core/router :data :datasource)
        users (db/list-users datasource)]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string users)}))
