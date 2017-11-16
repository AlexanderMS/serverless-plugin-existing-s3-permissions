# serverless-plugin-existing-s3-permissions
Serverless plugin to allow an AWS Lambda function to be triggered by an S3 event

Example:

```yaml
service: s3-reader

provider:
  name: aws
  region: ${opt:region}
  stage: ${opt:stage}
plugins:
  - serverless-plugin-existing-s3-permissions
functions:
  event-listener:
    handler: src/api/event-listener.handler
    timeout: 120
    memorySize: 1024
    events:
      - existingS3: 'com-s3-reader-example-bucket'

```

The plugin is only for granting permissions: it assumes the event handler in s3 is already setup.
