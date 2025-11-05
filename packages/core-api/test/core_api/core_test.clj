(ns core-api.core-test
  (:require [clojure.test :refer :all]
            [core-api.core :refer :all]
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
          gateway-service-called? (atom false)]
      (with-redefs [clj-http.client/post (fn [url options]
                                           (if (= url ai-service-url)
                                             (do (reset! ai-service-called? true)
                                                 {:status 200 :body "{\"response\": \"Hi there!\"}"})
                                             (do (reset! gateway-service-called? true)
                                                 {:status 200 :body "{\"status\": \"Message sent\"}"})))]
        (let [response (whatsapp-webhook-handler (-> (mock/request :post "/webhook/whatsapp")
                                                     (mock/body (json/generate-string request-body))
                                                     (mock/content-type "application/json")))]
          (is (= 200 (:status response)))
          (is (= "{\"status\": \"ok\"}" (:body response)))
          (is (true? @ai-service-called?))
          (is (true? @gateway-service-called?)))))))
