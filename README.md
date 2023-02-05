# Ring Save Motion to Google Drive/NAS

Connects to Ring API and subscribes to motion notifications and token refreshes using the ring-client-api,
on motion detection the app saves a 10 second clip then creates a connection to Google APIs using
Service Account Credentials and uploads the video to the designated folder on Google Drive

## Environment Variables to be Defined

- RING_REFRESH_TOKEN=Easily obtainable from [Homebridge](https://www.npmjs.com/package/homebridge-ring)-Ring [Plugin](https://www.npmjs.com/package/homebridge-ring)
- FOLDER_ID=Google Drive Folder ID, appears in the url when the folder is open
- Needs a serviceAccount.json generated from a google service account

## TODO

- Delete videos on drive older than a month
