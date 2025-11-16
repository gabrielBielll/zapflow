(ns core-api.handlers.webhooks
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [clj-http.client :as client]
            [next.jdbc :as jdbc]))

(def ai-service-url (get (System/getenv) "AI_SERVICE_URL" "http://localhost:4000"))
(def gateway-url (get (System/getenv) "GATEWAY_URL" "http://localhost:8081"))
(def ai-timeout 10000) ; 10 seconds timeout for AI service
(def gateway-timeout 5000) ; 5 seconds timeout for gateway calls

(defn whatsapp-message-webhook-handler
  "Orchestrates the response to an incoming WhatsApp message."
  [request]
  (println "=== STEP 1: WEBHOOK RECEIVED ===")
  (let [raw-body (-> request :body slurp)
        _ (println "Raw request body:" raw-body)
        incoming-message (json/parse-string raw-body true)
        _ (println "Parsed message:" incoming-message)
        message-text (:body incoming-message)
        sender-number (:from incoming-message)
        channel-id (:channel_id incoming-message)
        _ (println "=== STEP 2: MESSAGE PARSED ===")
        _ (println "Received message from:" sender-number)
        _ (println "Message text:" message-text)
        _ (println "Channel ID:" channel-id)]
    ;; Versão simplificada: responder diretamente sem banco de dados por enquanto
    (try
      (println "=== STEP 3: CALLING AI SERVICE ===")
      (let [ai-payload {:assistant_id "default"
                        :query message-text
                        :history []}
            _ (println "AI Service URL:" ai-service-url)
            _ (println "AI payload:" (json/generate-string ai-payload))
            _ (println "Making HTTP request to AI Service...")
            ai-response (-> (client/post (str ai-service-url "/generate")
                                         {:body (json/generate-string ai-payload)
                                          :content-type :json
                                          :accept :json
                                          :socket-timeout ai-timeout
                                          :connection-timeout ai-timeout})
                            :body
                            (json/parse-string true))
            _ (println "=== STEP 4: AI SERVICE RESPONDED ===")
            _ (println "Raw AI response:" ai-response)
            ai-message (:response ai-response)
            _ (println "Extracted AI message:" ai-message)]
        ;; Send message back directly via WAHA (temporary fix)
        (println "=== STEP 5: SENDING RESPONSE VIA WAHA ===")
        (let [waha-payload {:session "default"
                           :chatId sender-number
                           :text ai-message}
              _ (println "WAHA URL: http://waha:3000/api/sendText")
              _ (println "WAHA payload:" (json/generate-string waha-payload))
              _ (println "Making HTTP request to WAHA...")
              waha-response (client/post "http://waha:3000/api/sendText"
                                        {:body (json/generate-string waha-payload)
                                         :content-type :json
                                         :socket-timeout gateway-timeout
                                         :connection-timeout gateway-timeout})
              _ (println "=== STEP 6: WAHA RESPONDED ===")
              _ (println "WAHA response status:" (:status waha-response))
              _ (println "WAHA response body:" (:body waha-response))]
          (println "=== STEP 7: SUCCESS - MESSAGE SENT ===")
          {:status 200 :body "{\"status\": \"ok\"}"}))
      (catch Exception e
        (println "=== ERROR IN WEBHOOK ORCHESTRATION ===")
        (println "Error message:" (.getMessage e))
        (println "Stack trace:" (str e))
        ;; Send error message back to user
        (try
          (let [error-payload {:to sender-number 
                              :body "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente."
                              :channel_id (or channel-id "default")
                              :provider "waha"}]
            (println "Sending error message to user")
            (client/post (str gateway-url "/send-message")
                        {:body (json/generate-string error-payload)
                         :content-type :json
                         :socket-timeout gateway-timeout
                         :connection-timeout gateway-timeout}))
          (catch Exception send-error
            (println "Error sending error message:" (.getMessage send-error))))
        {:status 500 :body "{\"error\": \"Internal server error\"}"}))))
