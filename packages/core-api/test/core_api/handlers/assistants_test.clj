(ns core-api.handlers.assistants-test
  (:require [clojure.test :refer :all]
            [core-api.handlers.assistants :as assistants]
            [core-api.db.core :as db]
            [ring.mock.request :as mock]
            [cheshire.core :as json]
            [next.jdbc :as jdbc]))

(def test-db-config
  {:dbtype "h2"
   :dbname "mem:test"})

(def test-datasource
  (jdbc/get-datasource test-db-config))

(defn setup-test-db [f]
  (jdbc/execute! test-datasource ["DROP TABLE IF EXISTS assistants"])
  (db/migrate test-datasource)
  (f))

(use-fixtures :each setup-test-db)

(deftest create-assistant-handler-test
  (testing "should create an assistant and return 201"
    (let [json-body (json/generate-string {:name "Test Bot" :purpose "To be tested."})
          request (-> (mock/request :post "/api/assistants")
                      (assoc :body (java.io.ByteArrayInputStream. (.getBytes json-body "UTF-8")))
                      (mock/content-type "application/json"))
          handler (fn [req] (assistants/create-assistant-handler
                             (assoc-in req [:reitit.core/router :data :datasource] test-datasource)))]
      (let [response (handler request)
            body (json/parse-string (:body response) true)]
        (is (= 201 (:status response)))
        (is (= "Test Bot" (:name body)))
        (is (some? (:id body)))))))

(deftest list-assistants-handler-test
  (testing "should return a list of assistants"
    (db/create-assistant test-datasource {:name "Bot 1" :purpose "Purpose 1"})
    (db/create-assistant test-datasource {:name "Bot 2" :purpose "Purpose 2"})

    (let [request (mock/request :get "/api/assistants")
          handler (fn [req] (assistants/list-assistants-handler
                             (assoc-in req [:reitit.core/router :data :datasource] test-datasource)))
          response (handler request)
          body (json/parse-string (:body response) true)]
      (is (= 200 (:status response)))
      (is (= 2 (count body)))
      (is (= "Bot 2" (:name (first body)))))))
