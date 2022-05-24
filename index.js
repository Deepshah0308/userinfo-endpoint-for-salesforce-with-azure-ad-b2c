const express = require("express");
const {json} = require("body-parser");

const app = express();
app.use(json());

app.use(async (req, res, next) => {
	console.log(req.originalUrl);
	console.log(req.body);

	res.type("application/json");
	res.status(200).send(JSON.stringify({
      sub: "00uid4BxXw6I6TV4m0g3",
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
      phone_number: "+1 (425) 555-1212",
    })
  ).end();
})
app.listen(process.env.PORT || 3000);
