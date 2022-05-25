import {config as dotenv_config} from "dotenv";
import express from "express";
//@ts-ignore
import { JWK, JWKSet } from "node-jwk";
import  nJwt from "njwt";
import fetch  from "node-fetch";
dotenv_config();

const app = express();

// get wellknown endpoint and extract JWKS endpoint
const wellknown_uri = `https://${process.env.AZURE_TENANT_NAME}.b2clogin.com/${process.env.AZURE_TENANT_NAME}.onmicrosoft.com/v2.0/.well-known/openid-configuration?p=${process.env.AZURE_B2C_POLICY}`;
console.log(`Loading wellknown URI ${wellknown_uri}`);
const jwks_keys : Promise<JWKSet> = fetch(wellknown_uri)
	.then(res => res.json())
	.then(wellknownCfg => {
		const jwks_uri = wellknownCfg.jwks_uri;
		console.log(`Loading JWKS URI to ${jwks_uri}`);
		return fetch(jwks_uri);
	}).then(res => res.json())
	.then(jwks => {
		console.log(`Loaded keys`);
		return Promise.resolve(JWKSet.fromObject(jwks));
	})

app.get("/", async (req, res) => {
	// ensure authn header
	const auth_header = req.headers.authorization;
    if (!auth_header) return res.status(401).send("Unauthenticated").end();

	// extract authn header
	const authz = auth_header.substring(7);
	if (!authz.match(/([-A-Za-z0-9=_]+)\.([-A-Za-z0-9=_]+)\.([-A-Za-z0-9=_]+)/)) {
		return res.status(401).send("Invalid JWT in Authorization header");
	}
	const header = JSON.parse(Buffer.from(authz.split(".")[0], "base64").toString());
	const claims = JSON.parse(Buffer.from(authz.split(".")[1], "base64").toString());

	// get keyid and get corresponding key
	const kid = header.kid;
	console.log(`Looking for KeyID: ${kid}`)
	const jwkKey = (await jwks_keys).findKeyById(kid);
	if (!jwkKey) return res.status(401).send("Unable to find valid key to verify JWT");
	const pem = jwkKey.key.toPublicKeyPEM();
	console.log(`Found public key: ${pem}`);

	try {
		// verify
		const verifyResult = nJwt.verify(authz, pem, "RS256");
		const sub = claims.sub;
		console.log("Verified Authorization header JWT");

		// create response body with subject only
		const response_body = {
			sub
		};
		console.log(`Sending response: ${JSON.stringify(response_body)}`);
		
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
