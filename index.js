var http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({
	  "sub": "00uid4BxXw6I6TV4m0g3",
	  "name" :"John Doe",
	  "nickname":"Jimmy",
	  "given_name":"John",
	  "middle_name":"James",
	  "family_name":"Doe",
	  "profile":"https://example.com/john.doe",
	  "zoneinfo":"America/Los_Angeles",
	  "locale":"en-US",
	  "updated_at":1311280970,
	  "email":"mheisterberg+johndoe@salesforce.com",
	  "email_verified":true,
	  "address" : { "street_address":"123 Hollywood Blvd.", "locality":"Los Angeles", "region":"CA", "postal_code":"90210", "country":"US" },
	  "phone_number":"+1 (425) 555-1212"
	}));
}).listen(process.env.PORT || 3000);
