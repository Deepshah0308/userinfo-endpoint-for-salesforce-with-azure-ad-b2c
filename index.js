require("dotenv").config();
const express = require("express");
const { JWTConfig, JWTVerifier } = require("jwt-verifier");
const fetch = require("node-fetch");

const app = express();

// get wellknown endpoint and extract JWKS endpoint
const wellknown_uri = `https://${process.env.AZURE_TENANT_NAME}.b2clogin.com/${process.env.AZURE_TENANT_NAME}.onmicrosoft.com/v2.0/.well-known/openid-configuration?p=${process.env.AZURE_B2C_POLICY}`;
console.log(`Loading wellknown URI ${wellknown_uri}`);
fetch(wellknown_uri)
	.then(res => res.json())
	.then(wellknownCfg => {
		const jwks_uri = wellknownCfg.jwks_uri;
		console.log(`Setting JWKS URI to ${jwks_uri}`);
		JWTConfig.instance.CERT_URL = jwks_uri;
})
app.use((req, res, next) => {
	const auth_header = req.headers.authorization;
    if (!auth_header) return res.status(401).send("Unauthenticated").end();
	const authz = auth_header.substring(7);
	JWTVerifier.verify(authz).subscribe((verified) => {
        if (verified) {
			console.log("Verified JWT in authorization header");
			next();
		} else {
			return res.status(401).send("Unable to verify JWT in Authorization header");
		}
	});
})
app.use(async (req, res, next) => {
    const auth_header = req.headers.authorization;
	const authz = auth_header.substring(7);
    const claims = JSON.parse(Buffer.from(authz.split(".")[1], "base64").toString());
    const sub = claims.sub;
    const aud = claims.aud;
    if (aud !== (process.env.OIDC_AUDIENCE || "44fd6d29-faad-475f-ad06-855b554d9353")) {
		return res.status(401).send("Invalid audience");
	}

	// create response body with subject only
	const response_body = {
        sub
    };
	console.log(response_body);
    
	// send response
	res.type("application/json");
    res.status(200)
        .send(
            JSON.stringify(response_body)
        )
        .end();
});
app.listen(process.env.PORT || 3000);
