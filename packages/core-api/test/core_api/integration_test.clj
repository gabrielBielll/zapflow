(ns core-api.integration-test
  (:require [clojure.test :refer :all]
            [core-api.core :refer :all]
            [core-api.handlers.webhooks]
            [cheshire.core :as json]
            [next.jdbc :as jdbc]
            [ring.mock.request :as mock]))

(deftest health-check-integration-test
  (testing "Health check handler with mocked database call"
    (with-redefs [jdbc/execute! (fn [_ _] {:now "2024-01-01T12:00:00Z"})]
      (let [response (health-check-handler (mock/request :get "/health"))]
        (is (= 200 (:status response)))
        (is (= "application/json" (get-in response [:headers "Content-Type"])))
        (is (some? (:body response)))))))

(deftest whatsapp-webhook-flow-test
  (testing "Whatsapp webhook handler simulates database write"
    (let [request-body {:message "hello"}
          db-write-atom (atom nil)]
      (with-redefs [core-api.db.core/find-assistant-by-phone-number (fn [ds phone-number] {:assistant-id (java.util.UUID/randomUUID)})
                    core-api.db.core/create-conversation-history (fn [ds-spec m] (reset! db-write-atom m))
                    core-api.db.core/list-conversation-history (fn [ds-spec] [])
                    core-api.db.core/update-latest-conversation-history (fn [ds-spec m] nil)]
        (let [response (core-api.handlers.webhooks/whatsapp-message-webhook-handler (-> (mock/request :post "/webhook/whatsapp")
                                                                                        (assoc-in [:reitit.core/router :data :datasource] {})
                                                                                        (mock/body (json/generate-string request-body))
                                                                                        (mock/content-type "application/json")))]
          (is (= 200 (:status response)))
          (is (= "{\"status\": \"ok\"}" (:body response)))
          (is (some? @db-write-atom)))))))
