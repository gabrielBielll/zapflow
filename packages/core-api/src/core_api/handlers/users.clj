(ns core-api.handlers.users
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [ring.util.response :as response]
            [next.jdbc :as jdbc]))

(defn create-user-handler
  "Handler to create a new user."
  [request]
  (let [router-datasource (-> request :reitit.core/router :data :datasource)
        request-datasource (:datasource request)
        datasource (or router-datasource 
                      request-datasource
                      (let [db-url (or (System/getenv "DATABASE_URL") 
                                      "jdbc:postgresql://zapflow:zapflow123@localhost:5432/zapflow")]
                        (jdbc/get-datasource db-url)))
        body (-> request :body slurp (json/parse-string true))
        new-user (db/create-user datasource body)]
    {:status 201
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string new-user)}))

(defn list-users-handler
  "Handler to list all users."
  [request]
  (let [router-datasource (-> request :reitit.core/router :data :datasource)
        request-datasource (:datasource request)
        datasource (or router-datasource 
                      request-datasource
                      (let [db-url (or (System/getenv "DATABASE_URL") 
                                      "jdbc:postgresql://zapflow:zapflow123@localhost:5432/zapflow")]
                        (jdbc/get-datasource db-url)))
        users (db/list-users datasource)]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string users)}))
