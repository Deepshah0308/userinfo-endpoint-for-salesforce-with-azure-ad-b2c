# Custom UserInfo endpoint for Salesforce OIDC with Azure Active Directory B2C #
This repo contains a simple webapp to be used as a stand-in for the "missing" `userinfo` endpoint when using Azure Active Directory B2C out-of-the-box where no `userinfo` endpoint is provided. A `userinfo` endpoint is required when using the standard OpenID Connect Auth. Provider in Salesforce. A `userinfo` endpoint is possible in Azure Active Directory B2C when using a custom policy.

The `userinfo` endpoint of the web app (the root route) is called from Salesforce after the user has been authenticated through Azure Active Directory B2C but before the user is let into Salesforce. Salesforce will provide a Bearer token in the `Authorization` header. The Bearer token is the signed JWT from Azure Active Directory B2C. The endpoint will verify the signature of the JWT by getting the key ID (kid) from the JWT header, then attempt to find the key among the keys loaded from the wellknown endpoint when the app started, extract the public key if found and verify the JWT signature. Once the signature has been verified it returns a JSON response with a single claim being the subject identifier (`sub`). The Registration Handler on the Salesforce side can then use this subject identifier to lookup the User record in Salesforce and return it to complete the authentication.

## Requirements ##
The app requires Redis. Redis is used to store the last X number of claims having been verified. The Redis URL is read from the `REDIS_URL` environment variable.

## Usage ##
```
npm install
npm run start
```

Server is started locally on port 3000 if a port is not provided in the `PORT` environment variable. The `userinfo` endpoint is on the root-route. There is also a `/claims` route showing the last X number of claims being validated.

## Configuration ##
Configuration is read from the environment which may be locally overwritable using a `.env` file. The following environment variables are read:
* `AZURE_TENANT_NAME` The Azure tenant name - used to compose the URL to the wellknown endpoint on Azure
* `AZURE_B2C_POLICY` Policy name of the Azure Active Directory B2C policy on Azure
* `CLAIMS_BEARER_TOKEN` Bearer token validated verbatim when an admin access the `/claims` endpoint
* `CLAIMS_TO_KEEP` Allows you to overwrite the number of claims kept in Redis. Defaults to 20.

## Example Salesforce Registration Handler ##
```java
global class AutocreatedRegHandler1653393112541 implements Auth.RegistrationHandler{
    global boolean canCreateUser(Auth.UserData data) {
        return false;
    }
    
    global User createUser(Id portalId, Auth.UserData data){
        List<User> users = [SELECT Id FROM User WHERE FederationIdentifier=:data.identifier];
        if (users.size() == 1) return users[0];
        return null;
    }
    
    global void updateUser(Id userId, Id portalId, Auth.UserData data){
    
    }
}
```

## Example Salesforce OpenID Connect Auth. Provider metadata ##
```xml
<?xml version="1.0" encoding="UTF-8"?>
<AuthProvider xmlns="http://soap.sforce.com/2006/04/metadata">
    <authorizeUrl>https://lekkimsfazureb2cpoc.b2clogin.com/lekkimsfazureb2cpoc.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_b2c</authorizeUrl>
    <consumerKey>44fd....9353</consumerKey>
    <consumerSecret>/Ery....C2rX</consumerSecret>
    <defaultScopes>44fd6d29-faad-475f-ad06-855b554d9353</defaultScopes>
    <executionUser>test-ipz15rumxnlx@example.com</executionUser>
    <friendlyName>Azure B2C</friendlyName>
    <includeOrgIdInIdentifier>false</includeOrgIdInIdentifier>
    <providerType>OpenIdConnect</providerType>
    <registrationHandler>AutocreatedRegHandler1653393112541</registrationHandler>
    <sendAccessTokenInHeader>true</sendAccessTokenInHeader>
    <sendClientCredentialsInHeader>false</sendClientCredentialsInHeader>
    <sendSecretInApis>true</sendSecretInApis>
    <tokenUrl>https://azure-tenant-name.b2clogin.com/azure-tenant-name.onmicrosoft.com/oauth2/v2.0/token?p=b2c_1_b2c</tokenUrl>
    <userInfoUrl>https://bouncy-castle-99999.herokuapp.com</userInfoUrl>
</AuthProvider>
```
