'use strict';

module.exports = class ExistingS3Plugin {
   constructor(serverless) {
      this.hooks = {
         'deploy:compileEvents': () => {
           Object.keys(serverless.service.functions).forEach(functionName => {
             const lambdaFunction = serverless.service.functions[functionName];
             lambdaFunction.events.forEach(event => {
               if (event.existingS3) {
                 const s3BucketName = event.existingS3;
                 const permission = this._makeEventPermission(functionName, s3BucketName);
                 serverless.service.provider.compiledCloudFormationTemplate.Resources[permission.name] = permission.definition;
                 serverless.cli.log(`Added permission for existing s3 bucket "${s3BucketName}" to invoke "${functionName}"`);
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

   _makeEventPermission(functionName, s3BucketName) {
      const normalizedFunctionName = this._normalizeName(functionName);

      return {
        name: `${normalizedFunctionName}LambdaPermission${this._normalizeName(s3BucketName)}`,
        definition: {
           Type: 'AWS::Lambda::Permission',
           Properties: {
              FunctionName: { 'Fn::GetAtt': [ `${normalizedFunctionName}LambdaFunction`, 'Arn' ] },
              Action: 'lambda:InvokeFunction',
              Principal: 's3.amazonaws.com',
              SourceAccount: {
                'Ref': 'AWS::AccountId'
              },
              SourceArn: `arn:aws:s3:::${s3BucketName}`
           },
        }
      }
   }
};
