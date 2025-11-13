(ns core-api.handlers.rag
  (:require [core-api.db.core :as db]
            [cheshire.core :as json]
            [ring.util.response :as response]
            [clojure.java.io :as io]
            [clj-http.client :as client])
  (:import [java.io File]))

(def ai-service-url "http://localhost:4000/index-document")

(defn- save-uploaded-file
  "Saves the uploaded file to a local directory and returns the filepath."
  [file]
  (let [upload-dir (io/file "uploads")
        filename (get-in file [:tempfile] "tempfile")
        dest-file (io/file upload-dir (.getName filename))]
    (.mkdirs upload-dir)
    (io/copy filename dest-file)
    (.getAbsolutePath dest-file)))

(defn upload-document-handler
  "Handler for uploading a document for RAG."
  [request]
  (let [datasource (-> request :reitit.core/router :data :datasource)
        {:keys [assistant-id]} (:params request)
        file (-> request :params :file)
        filepath (save-uploaded-file file)
        filename (:filename file)
        document-data {:assistant-id (java.util.UUID/fromString assistant-id)
                       :filename filename
                       :filepath filepath}
        new-document (db/create-document datasource document-data)]
    (try
      (client/post ai-service-url
                   {:body (json/generate-string {:document_id (:id new-document)
                                                 :filepath filepath})
                    :content-type :json})
      (catch Exception e
        (println "Error calling AI service for indexing:" (.getMessage e))))
    {:status 201
     :headers {"Content-Type" "application/json"}
     :body (json/generate-string new-document)}))
