{
  "indexes": [
    {
      "collectionGroup": "notes",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "is_deleted",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "user_id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "deleted_at",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "__name__",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    }
  ],
  "fieldOverrides": []
}