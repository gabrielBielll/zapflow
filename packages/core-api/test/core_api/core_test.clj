(ns core-api.core-test
  (:require [clojure.test :refer :all]
            [core-api.core :refer :all]
            [core-api.handlers.webhooks]
            [cheshire.core :as json]
            [next.jdbc :as jdbc]
            [ring.mock.request :as mock]))

(deftest health-check-handler-test
  (testing "Health check handler returns 200"
    (with-redefs [jdbc/execute! (fn [_ _] {:now "2024-01-01T12:00:00Z"})]
      (let [response (health-check-handler (mock/request :get "/health"))]
        (is (= 200 (:status response)))
        (is (= "application/json" (get-in response [:headers "Content-Type"])))))))

(deftest whatsapp-webhook-handler-test
  (testing "Whatsapp webhook handler returns 200 and calls AI and Gateway services"
    (let [request-body {:body "hello" :from "12345"}
          ai-service-called? (atom false)
          gateway-service-called? (atom false)
          ai-service-url "http://localhost:4000/generate"]
      (with-redefs [clj-http.client/post (fn [url options]
                                           (if (= url ai-service-url)
                                             (do (reset! ai-service-called? true)
                                                 {:status 200 :body "{\"response\": \"Hi there!\"}"})
                                             (do (reset! gateway-service-called? true)
                                                 {:status 200 :body "{\"status\": \"Message sent\"}"})))
                    core-api.db.core/find-assistant-by-phone-number (fn [ds phone-number] {:assistant-id (java.util.UUID/randomUUID)})
                    core-api.db.core/create-conversation-history (fn [ds-spec m] nil)
                    core-api.db.core/list-conversation-history (fn [ds-spec] [])
                    core-api.db.core/update-latest-conversation-history (fn [ds-spec m] nil)]
        (let [response (core-api.handlers.webhooks/whatsapp-message-webhook-handler (-> (mock/request :post "/webhook/whatsapp")
                                                                                        (assoc-in [:reitit.core/router :data :datasource] {})
                                                                                        (mock/body (json/generate-string request-body))
                                                                                        (mock/content-type "application/json")))]
          (is (= 200 (:status response)))
          (is (= "{\"status\": \"ok\"}" (:body response)))
          (is (true? @ai-service-called?))
          (is (true? @gateway-service-called?))))))
