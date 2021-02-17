# Database
## Room schema

```json
{
    "_id": ObjectId(...),
    "game_id": "AEbXd1x",
    "phase": 0-3,
    "text_size": 10,
    "users": [
        {
            "username": "name",
            "socket-id": "$socket-sid",
            "leader": false,
            "finished": false,
            "speed": 69.33,
        }
    ]
}
```
- The user documents are embedded into the room object.
- The collection carries one document for each room

## Prejoin schema
```json
{
    "_id": ObjectId(...),
    "ref": "1ae97fa4",
    "username": "name",
    "game_id": "ae43a",
    "leader": false,
    "expires": 19291,
}
```