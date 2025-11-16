(ns core-api.handlers.channels
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [ring.util.response :as response]
            [clj-http.client :as client]
            [next.jdbc :as jdbc]))

(def gateway-url (get (System/getenv) "GATEWAY_URL" "http://localhost:5001"))

(defn init-whatsapp-channel-handler
  "Handler to initialize a new WhatsApp channel for an assistant."
  [request]
  (let [db-spec (:db-spec request)
        assistant-id (-> request :params :id)
        channel-data {:assistant_id (java.util.UUID/fromString assistant-id)
                      :channel_type "whatsapp"
                      :status "pending"}]
    (let [new-channel (db/create-channel db-spec channel-data)
          channel-id (:id new-channel)]
      (try
        (let [gateway-response (client/post (str gateway-url "/init-session")
                                            {:body (json/generate-string {:channel_id (str channel-id)})
                                             :content-type :json
                                             :accept :json})
              qr-code-body (-> gateway-response :body (json/parse-string true))]
          {:status 200
           :headers {"Content-Type" "application/json"}
           :body (json/generate-string qr-code-body)})
        (catch Exception e
          (println "Error calling Gateway service to init session:" (.getMessage e))
          {:status 500
           :headers {"Content-Type" "application/json"}
           :body "{\"error\": \"Failed to initialize WhatsApp session.\"}"})))))

(defn whatsapp-status-webhook-handler
  "Handler for receiving status updates from the WhatsApp gateway."
  [request]
  (let [db-spec (:db-spec request)
        status-update (-> request :body slurp (json/parse-string true))
        channel-id (-> status-update :channel_id java.util.UUID/fromString)
        status (:status status-update)
        phone-number (:phone_number status-update)]
    
    ;; Update channel status
    (db/update-channel-status db-spec {:id channel-id :status status})
    
    ;; If status is ready and we have a phone number, create the association
    (when (and (= status "ready") phone-number)
      (let [channel (db/find-channel-by-id db-spec channel-id)
            assistant-id (:assistant_id channel)]
        (when assistant-id
          (try
            (db/create-assistant-phone-number db-spec {:assistant_id assistant-id
                                                        :phone_number phone-number})
            (println (str "Created phone number association: " phone-number " -> " assistant-id))
            (catch Exception e
              (println (str "Error creating phone number association: " (.getMessage e))))))))
    
    {:status 200 :body "{\"status\": \"ok\"}"}))
