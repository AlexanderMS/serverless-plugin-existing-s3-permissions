'use strict';

module.exports = class ExistingS3Plugin {
   constructor(serverless) {
      this.hooks = {
         'deploy:compileEvents': () => {
           Object.keys(serverless.service.functions).forEach(functionName => {
             const lambdaFunction = serverless.service.functions[functionName];
             lambdaFunction.events.forEach(event => {
               if (event.existingS3 || event.existingS3Arn) {
                 const s3Bucket = event.existingS3 || event.existingS3Arn;
                 const permission = this._makeEventPermission(functionName, s3Bucket);
                 serverless.service.provider.compiledCloudFormationTemplate.Resources[permission.name] = permission.definition;
                 serverless.cli.log(`Added permission for existing s3 bucket "${s3Bucket}" to invoke "${functionName}"`);
               }
             });
           });
         }
      };
   }

   _normalizeName(s) {
     return (s[0].toUpperCase() + s.substr(1)).replace(/[-]/g, 'Dash').replace(/[_]/g, 'Underscore').replace(/[\/]/g, '');
     // as per https://serverless.com/framework/docs/providers/aws/guide/resources/
   }

   _buildPermissionSourceArn(s3Bucket) {
     if (s3Bucket.startsWith('arn')) { return s3Bucket; }
     const source = s3Bucket === 'ANY' ? '*' : s3Bucket;
     return { 'Fn::Join': [ ':', [ 'arn:aws:s3', { 'Ref': 'AWS::Region' }, { 'Ref': 'AWS::AccountId' }, source ] ] };
   }

   _makeEventPermission(functionName, s3BucketIdentifier) {
      const normalizedFunctionName = this._normalizeName(functionName);
      const s3Name = (() => {
        const parts = s3BucketIdentifier.split(':');
        return parts[parts.length-1];
      })();
      const sourceArn = this._buildPermissionSourceArn(s3BucketIdentifier);

      return {
        name: `${normalizedFunctionName}LambdaPermission${this._normalizeName(s3Name)}`,
        definition: {
           Type: 'AWS::Lambda::Permission',
           Properties: {
              FunctionName: { 'Fn::GetAtt': [ `${normalizedFunctionName}LambdaFunction`, 'Arn' ] },
              Action: 'lambda:InvokeFunction',
              Principal: 's3.amazonaws.com',
              SourceArn: sourceArn
           },
        }
      }
   }
};
