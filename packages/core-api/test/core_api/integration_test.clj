(ns core-api.integration-test
  (:require [clojure.test :refer :all]
            [core-api.core :refer :all]
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
      (with-redefs [jdbc/execute! (fn [_ data]
                                    (reset! db-write-atom data)
                                    {:result "ok"})]
        (let [response (whatsapp-webhook-handler (-> (mock/request :post "/webhook/whatsapp")
                                                   (mock/body (json/generate-string request-body))
                                                   (mock/content-type "application/json")))]
          (is (= 200 (:status response)))
          (is (= "{\"status\": \"ok\"}" (:body response))))))))
