from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from typing import Protocol

class DataManager(Protocol):
    def get_items(self, search_term): pass
    def update_comment(source, comments): pass
    def update_done(self, source, is_done): pass
    def close_connection(self): pass
    def get_topics(self, type, topic_id): pass
    def insert_items(self, items): pass

class MongoDBLayer(DataManager):
    def __init__(self, uri, db_name):
        try:
            self.client = MongoClient(uri)
            self.db = self.client[db_name]
            print("Connected to MongoDB successfully.")
        except ConnectionFailure as e:
            print(f"Connection failed: {e}")


    def close_connection(self):
        """
        Closes the MongoDB client connection.
        """
        self.client.close()
        print("MongoDB connection closed.")


    def insertDocuments(self, collection_name, documents):
        """
        Inserts one or multiple documents into the collection.
        :param collection_name: Name of the collection.
        :param documents: dict or list of dicts representing the documents to insert.
        :return: Inserted IDs.
        """
        collection = self.db[collection_name]
        if isinstance(documents, list):
            result = collection.insert_many(documents)
            return result.inserted_ids
        else:
            result = collection.insert_one(documents)
            return result.inserted_id

    def searchDocument(self, collection_name, query):
        """
        Searches for documents that match the query.
        :param collection_name: Name of the collection.
        :param query: dict representing the query.
        :return: List of matching documents.
        """
        collection = self.db[collection_name]
        return list(collection.find(query))
    
    def searchText(self, collection_name, filter_query, text_field, search_text):
        """
        Searches for documents where the text field contains the specified text.
        :param collection_name: Name of the collection.
        :param text_field: Name of the field to search in.
        :param search_text: Text to search for.
        :return: List of matching documents.
        """
        final_query = {}
        if len(filter_query) > 0:
            final_query = filter_query
        if search_text is not None:
            final_query[text_field] = {"$regex": search_text, "$options": "i"}
        collection = self.db[collection_name]
        return list(collection.find(final_query))

    def updateDocument(self, collection_name, query, update, many=False):
        """
        Updates one or multiple documents that match the query.
        :param collection_name: Name of the collection.
        :param query: dict representing the query.
        :param update: dict representing the update operation.
        :param many: Boolean indicating whether to update multiple documents.
        :return: Matched and modified document count.
        """
        collection = self.db[collection_name]
        update_set = {"$set": update}
        if many:
            result = collection.update_many(query, update_set)
        else:
            result = collection.update_one(query, update_set)
        return {
            "matched_count": result.matched_count,
            "modified_count": result.modified_count
        }

    def deleteDocument(self, collection_name, query, many=False):
        """
        Deletes one or multiple documents that match the query.
        :param collection_name: Name of the collection.
        :param query: dict representing the query.
        :param many: Boolean indicating whether to delete multiple documents.
        :return: Count of deleted documents.
        """
        collection = self.db[collection_name]
        if many:
            result = collection.delete_many(query)
        else:
            result = collection.delete_one(query)
        return result.deleted_count

    def fetchTopicWithPipeline(self, pipeline, collection_name):
        collection = self.db[collection_name]
        topics = list(collection.aggregate(pipeline))
        
        return topics