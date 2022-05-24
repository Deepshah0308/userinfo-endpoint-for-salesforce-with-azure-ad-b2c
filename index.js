const express = require("express");
const { json } = require("body-parser");

const app = express();
app.use(json());

app.use(async (req, res, next) => {
    const auth_header = req.headers.authorization;
    if (!auth_header) return res.status(401).send("Unauthenticated").end();
    const claims = JSON.parse(Buffer.from(auth_header.split(".")[1], "base64").toString());
    const sub = claims.sub;
    const aud = claims.aud;
    if (aud !== (process.env.OIDC_AUDIENCE || "44fd6d29-faad-475f-ad06-855b554d9353")) {
		return res.status(401).send("Invalid audience");
	}

	// create response body
	const response_body = {
        sub /*,
                name: "John Doe",
                nickname: "Jimmy",
                given_name: "John",
                middle_name: "James",
                family_name: "Doe",
                profile: "https://example.com/john.doe",
                zoneinfo: "America/Los_Angeles",
                locale: "en-US",
                updated_at: 1311280970,
                email: "mheisterberg+johndoe@salesforce.com",
                email_verified: true,
                address: {
                    street_address: "123 Hollywood Blvd.",
                    locality: "Los Angeles",
                    region: "CA",
                    postal_code: "90210",
                    country: "US",
                },
                phone_number: "+1 (425) 555-1212",*/,
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
