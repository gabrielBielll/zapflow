(ns core-api.handlers.webhooks
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [clj-http.client :as client]))

(def ai-service-url (get (System/getenv) "AI_SERVICE_URL" "http://localhost:4000"))
(def gateway-url (get (System/getenv) "GATEWAY_URL" "http://localhost:5001"))

(defn whatsapp-message-webhook-handler
  "Orchestrates the response to an incoming WhatsApp message."
  [request]
  (let [datasource (-> request :reitit.core/router :data :datasource)
        incoming-message (-> request :body slurp (json/parse-string true))
        message-text (:body incoming-message)
        sender-number (:from incoming-message)
        channel-id (:channel_id incoming-message)
        assistant (db/find-assistant-by-phone-number datasource sender-number)]
    (if assistant
      (let [assistant-id (:assistant-id assistant)]
        (db/create-conversation-history datasource {:assistant-id assistant-id
                                                     :sender sender-number
                                                     :message message-text
                                                     :response nil})
        (let [history (db/list-conversation-history datasource {:assistant-id assistant-id})
              ;; Convert history to the format expected by AI service
              formatted-history (map (fn [h] 
                                       {:role "user" :content (:message h)}) 
                                   (reverse (take 10 history)))
              ai-payload {:assistant_id (str assistant-id)
                          :query message-text
                          :history formatted-history}]
          (try
            (let [ai-response (-> (client/post (str ai-service-url "/generate")
                                               {:body (json/generate-string ai-payload)
                                                :content-type :json
                                                :accept :json})
                                  :body
                                  (json/parse-string true))
                  ai-message (:response ai-response)]
              (db/update-latest-conversation-history datasource {:assistant-id assistant-id
                                                                  :sender sender-number
                                                                  :response ai-message})
              ;; Send message back through gateway with channel_id
              (client/post (str gateway-url "/send-message")
                           {:body (json/generate-string {:to sender-number 
                                                       :body ai-message
                                                       :channel_id channel-id})
                            :content-type :json}))
            (catch Exception e
              (println "Error in webhook orchestration:" (.getMessage e))
              ;; Send error message back to user
              (try
                (client/post (str gateway-url "/send-message")
                             {:body (json/generate-string {:to sender-number 
                                                         :body "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente."
                                                         :channel_id channel-id})
                              :content-type :json})
                (catch Exception send-error
                  (println "Error sending error message:" (.getMessage send-error)))))))
        {:status 200 :body "{\"status\": \"ok\"}"})
      (do
        (println (str "No assistant found for phone number: " sender-number))
        {:status 404 :body "{\"error\": \"Assistant not found.\"}"}))))
