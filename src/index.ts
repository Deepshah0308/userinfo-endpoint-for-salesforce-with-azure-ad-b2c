import {config as dotenv_config} from "dotenv";
import express from "express";
//@ts-ignore
import { JWK, JWKSet } from "node-jwk";
import  nJwt from "njwt";
import fetch  from "node-fetch";
dotenv_config();

const app = express();

// get wellknown endpoint and extract JWKS endpoint
let jwks_keys : JWKSet;
const wellknown_uri = `https://${process.env.AZURE_TENANT_NAME}.b2clogin.com/${process.env.AZURE_TENANT_NAME}.onmicrosoft.com/v2.0/.well-known/openid-configuration?p=${process.env.AZURE_B2C_POLICY}`;
console.log(`Loading wellknown URI ${wellknown_uri}`);
fetch(wellknown_uri)
	.then(res => res.json())
	.then(wellknownCfg => {
		const jwks_uri = wellknownCfg.jwks_uri;
		console.log(`Loading JWKS URI to ${jwks_uri}`);
		return fetch(jwks_uri);
	}).then(res => res.json())
	.then(jwks => {
		console.log(`Loaded keys`);
		jwks_keys = JWKSet.fromObject(jwks);
	}
)

app.use(async (req, res, next) => {
	const auth_header = req.headers.authorization;
    if (!auth_header) return res.status(401).send("Unauthenticated").end();
	const authz = auth_header.substring(7);
	const header = JSON.parse(Buffer.from(authz.split(".")[0], "base64").toString());
	const claims = JSON.parse(Buffer.from(authz.split(".")[1], "base64").toString());
	const kid = header.kid;
	console.log(`Looking for KeyID: ${kid}`)
	const jwkKey = jwks_keys.findKeyById(kid);
	const pem = jwkKey.key.toPublicKeyPEM();
	console.log(`Found public key: ${pem}`);

	try {
		// verify
		const verifyResult = nJwt.verify(authz, pem, "RS256");
		const sub = claims.sub;

		// create response body with subject only
		const response_body = {
			sub
		};
		console.log(`Sending response: ${response_body}`);
		
		// send response
		res.type("application/json");
		res.status(200)
			.send(
				JSON.stringify(response_body)
			)
			.end();

	} catch (err) {
		return res.status(401).send("Unable to verify Authorization header");
	}
});
app.listen(process.env.PORT || 3000);
